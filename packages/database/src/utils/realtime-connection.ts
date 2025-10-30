/**
 * Realtime Connection Utilities
 *
 * Utilities for managing Supabase Realtime connections including:
 * - Connection health monitoring
 * - Exponential backoff reconnection
 * - Development logging helpers
 * - Standardized error handling
 *
 * @module realtime-connection
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimeError } from '../types/realtime';

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting',
}

/**
 * Connection health information
 */
export interface ConnectionHealth {
  /** Current connection status */
  status: ConnectionStatus;
  /** Number of active channels */
  activeChannels: number;
  /** Last successful connection timestamp */
  lastConnected: Date | null;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  /** Any errors encountered */
  errors: RealtimeError[];
}

/**
 * Reconnection configuration options
 */
export interface ReconnectionOptions {
  /** Maximum number of reconnection attempts (default: 5) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Callback when reconnection succeeds */
  onSuccess?: () => void;
  /** Callback when reconnection fails */
  onFailure?: (error: Error) => void;
}

/**
 * Global connection state tracker
 */
class ConnectionStateManager {
  private activeChannels = new Set<string>();
  private lastConnected: Date | null = null;
  private reconnectAttempts = 0;
  private errors: RealtimeError[] = [];
  private currentStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;

  /**
   * Register a new channel
   */
  registerChannel(channelName: string): void {
    this.activeChannels.add(channelName);
    this.logEvent('channel_registered', { channelName });
  }

  /**
   * Unregister a channel
   */
  unregisterChannel(channelName: string): void {
    this.activeChannels.delete(channelName);
    this.logEvent('channel_unregistered', { channelName });
  }

  /**
   * Update connection status
   */
  setStatus(status: ConnectionStatus): void {
    const oldStatus = this.currentStatus;
    this.currentStatus = status;

    if (status === ConnectionStatus.CONNECTED) {
      this.lastConnected = new Date();
      this.reconnectAttempts = 0;
    }

    if (oldStatus !== status) {
      this.logEvent('status_changed', { from: oldStatus, to: status });
    }
  }

  /**
   * Increment reconnection attempts
   */
  incrementReconnectAttempts(): void {
    this.reconnectAttempts++;
  }

  /**
   * Reset reconnection attempts
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * Add an error to the error log
   */
  addError(error: RealtimeError): void {
    this.errors.push(error);

    // Keep only last 10 errors to prevent memory leak
    if (this.errors.length > 10) {
      this.errors = this.errors.slice(-10);
    }

    this.logEvent('error_logged', { error });
  }

  /**
   * Get current connection health
   */
  getHealth(): ConnectionHealth {
    return {
      status: this.currentStatus,
      activeChannels: this.activeChannels.size,
      lastConnected: this.lastConnected,
      reconnectAttempts: this.reconnectAttempts,
      errors: [...this.errors],
    };
  }

  /**
   * Log realtime events (dev only)
   */
  private logEvent(event: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Realtime Connection] ${event}`, data || '');
    }
  }
}

// Singleton instance
const connectionManager = new ConnectionStateManager();

/**
 * Get current connection status
 *
 * Returns the health information for all active Realtime connections.
 * Useful for debugging and displaying connection status in the UI.
 *
 * @example
 * ```typescript
 * const health = getConnectionStatus();
 * console.log(`Active channels: ${health.activeChannels}`);
 * console.log(`Status: ${health.status}`);
 * ```
 */
export function getConnectionStatus(): ConnectionHealth {
  return connectionManager.getHealth();
}

/**
 * Reconnect to a Realtime channel with exponential backoff
 *
 * Implements exponential backoff strategy for reconnection attempts:
 * - Attempt 1: 1s delay
 * - Attempt 2: 2s delay
 * - Attempt 3: 4s delay
 * - Attempt 4: 8s delay
 * - Attempt 5: 16s delay (capped at maxDelay)
 *
 * @param reconnectFn - Function that performs the reconnection
 * @param options - Reconnection configuration options
 *
 * @example
 * ```typescript
 * reconnectWithBackoff(
 *   () => supabase.channel('my-channel').subscribe(),
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 1000,
 *     maxDelay: 30000,
 *     onSuccess: () => console.log('Reconnected!'),
 *     onFailure: (error) => console.error('Failed to reconnect:', error),
 *   }
 * );
 * ```
 */
export async function reconnectWithBackoff(
  reconnectFn: () => Promise<RealtimeChannel | void>,
  options: ReconnectionOptions = {}
): Promise<void> {
  const {
    maxAttempts = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    onSuccess,
    onFailure,
  } = options;

  connectionManager.setStatus(ConnectionStatus.RECONNECTING);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logRealtimeEvent('reconnect_attempt', {
        attempt,
        maxAttempts,
      });

      connectionManager.incrementReconnectAttempts();

      // Attempt reconnection
      await reconnectFn();

      // Success!
      connectionManager.setStatus(ConnectionStatus.CONNECTED);
      connectionManager.resetReconnectAttempts();

      logRealtimeEvent('reconnect_success', { attempt });
      onSuccess?.();
      return;
    } catch (error) {
      const realtimeError: RealtimeError = {
        message: error instanceof Error ? error.message : 'Unknown reconnection error',
        code: 'RECONNECT_FAILED',
        details: { attempt, maxAttempts },
        timestamp: new Date().toISOString(),
      };

      connectionManager.addError(realtimeError);

      logRealtimeEvent('reconnect_failed', {
        attempt,
        error: realtimeError.message,
      });

      // If this was the last attempt, give up
      if (attempt === maxAttempts) {
        connectionManager.setStatus(ConnectionStatus.ERROR);
        onFailure?.(
          new Error(`Failed to reconnect after ${maxAttempts} attempts`)
        );
        return;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );

      logRealtimeEvent('reconnect_backoff', {
        nextAttemptIn: delay,
        nextAttempt: attempt + 1,
      });

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Log Realtime events (development only)
 *
 * Logs Realtime events to the console in development mode.
 * Helps with debugging Realtime subscriptions and connection issues.
 *
 * @param event - Event name
 * @param data - Event data
 *
 * @example
 * ```typescript
 * logRealtimeEvent('subscription_created', {
 *   channel: 'user:123:notifications',
 *   table: 'notifications',
 * });
 * ```
 */
export function logRealtimeEvent(
  event: string,
  data?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = '[Realtime Event]';

  if (data) {
    console.log(`${prefix} ${event} @ ${timestamp}`, data);
  } else {
    console.log(`${prefix} ${event} @ ${timestamp}`);
  }
}

/**
 * Handle Realtime errors in a standardized way
 *
 * Provides consistent error handling for Realtime operations:
 * - Logs error details in development
 * - Tracks errors in connection manager
 * - Returns formatted RealtimeError object
 *
 * @param error - The error to handle
 * @param context - Additional context about where the error occurred
 * @returns Formatted RealtimeError object
 *
 * @example
 * ```typescript
 * try {
 *   await supabase.channel('my-channel').subscribe();
 * } catch (error) {
 *   const realtimeError = handleRealtimeError(error, {
 *     channel: 'my-channel',
 *     operation: 'subscribe',
 *   });
 *   console.error(realtimeError);
 * }
 * ```
 */
export function handleRealtimeError(
  error: unknown,
  context?: Record<string, unknown>
): RealtimeError {
  const realtimeError: RealtimeError = {
    message: error instanceof Error ? error.message : 'Unknown Realtime error',
    code: 'REALTIME_ERROR',
    details: context || {},
    timestamp: new Date().toISOString(),
  };

  // Extract error code if available
  if (error && typeof error === 'object' && 'code' in error) {
    realtimeError.code = String(error.code);
  }

  // Log in development
  logRealtimeEvent('error', {
    message: realtimeError.message,
    code: realtimeError.code,
    context,
  });

  // Track in connection manager
  connectionManager.addError(realtimeError);

  return realtimeError;
}

/**
 * Register a channel with the connection manager
 *
 * Should be called when a new Realtime channel is created.
 * Helps track active connections for debugging.
 *
 * @param channelName - Name of the channel
 *
 * @example
 * ```typescript
 * const channel = supabase.channel('my-channel');
 * registerRealtimeChannel('my-channel');
 * ```
 */
export function registerRealtimeChannel(channelName: string): void {
  connectionManager.registerChannel(channelName);
}

/**
 * Unregister a channel from the connection manager
 *
 * Should be called when a Realtime channel is cleaned up.
 *
 * @param channelName - Name of the channel
 *
 * @example
 * ```typescript
 * supabase.removeChannel(channel);
 * unregisterRealtimeChannel('my-channel');
 * ```
 */
export function unregisterRealtimeChannel(channelName: string): void {
  connectionManager.unregisterChannel(channelName);
}

/**
 * Check if Realtime is available
 *
 * Performs a simple health check to verify Realtime connectivity.
 *
 * @param supabase - Supabase client instance
 * @returns Promise that resolves to true if Realtime is available
 *
 * @example
 * ```typescript
 * const available = await isRealtimeAvailable(createClient());
 * if (!available) {
 *   console.error('Realtime is not available');
 * }
 * ```
 */
export async function isRealtimeAvailable(
  supabase: any
): Promise<boolean> {
  try {
    // Create a test channel
    const channel = supabase.channel('health-check');

    // Subscribe and wait for connection
    const status = await new Promise<string>((resolve) => {
      channel.subscribe((status: string) => {
        resolve(status);
      });
    });

    // Clean up
    supabase.removeChannel(channel);

    // Return true if subscribed successfully
    return status === 'SUBSCRIBED';
  } catch (error) {
    logRealtimeEvent('health_check_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Format connection uptime
 *
 * Returns a human-readable string of connection uptime.
 *
 * @param lastConnected - Last connection timestamp
 * @returns Formatted uptime string
 *
 * @example
 * ```typescript
 * const health = getConnectionStatus();
 * const uptime = formatConnectionUptime(health.lastConnected);
 * console.log(`Connected for: ${uptime}`);
 * ```
 */
export function formatConnectionUptime(lastConnected: Date | null): string {
  if (!lastConnected) {
    return 'Never connected';
  }

  const now = new Date();
  const diffMs = now.getTime() - lastConnected.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  } else {
    return `${diffSeconds}s`;
  }
}

/**
 * Export connection manager for advanced use cases
 */
export { connectionManager };
