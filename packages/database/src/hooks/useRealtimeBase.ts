'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimeChannelStatus } from '../types/realtime';

/**
 * Type for Supabase client
 * We use `any` here to avoid circular dependencies with @tupsafe/auth
 * The actual type will be enforced at the app level
 */
export type SupabaseClient = any;

/**
 * Get Supabase client
 * This function must be provided by the consuming application
 */
let getSupabaseClient: (() => SupabaseClient) | null = null;

/**
 * Initialize the Supabase client getter
 * Must be called before using realtime hooks
 */
export function initializeRealtimeClient(clientGetter: () => SupabaseClient) {
  getSupabaseClient = clientGetter;
}

function createClient(): SupabaseClient {
  if (!getSupabaseClient) {
    throw new Error(
      'Realtime client not initialized. Call initializeRealtimeClient() before using realtime hooks.'
    );
  }
  return getSupabaseClient();
}

/**
 * Base hook for Supabase Realtime subscriptions
 *
 * Provides shared utilities for managing real-time channels including:
 * - Channel creation with consistent naming
 * - Connection state management
 * - Automatic cleanup on unmount
 * - Error handling
 *
 * @param channelName - Unique name for the channel (e.g., 'notifications:userId')
 *
 * @example
 * ```typescript
 * function useMyRealtimeFeature(userId: string) {
 *   const { supabase, subscribe, cleanup, status } = useRealtimeBase(`my-feature:${userId}`);
 *
 *   useEffect(() => {
 *     subscribe(() =>
 *       supabase
 *         .channel(`my-feature:${userId}`)
 *         .on('postgres_changes', {...}, handler)
 *     );
 *   }, [userId]);
 *
 *   return { status };
 * }
 * ```
 */
export function useRealtimeBase(channelName: string) {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<RealtimeChannelStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  /**
   * Subscribe to a real-time channel
   * Automatically cleans up previous subscription if exists
   */
  const subscribe = useCallback((callback: () => RealtimeChannel) => {
    try {
      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Create new channel
      const channel = callback();
      channelRef.current = channel;

      // Track subscription status
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('error');
          setError(new Error('Channel subscription failed'));
        } else if (status === 'TIMED_OUT') {
          setStatus('error');
          setError(new Error('Channel subscription timed out'));
        } else {
          setStatus('connecting');
        }
      });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error(`[Realtime] Subscription error for ${channelName}:`, err);
    }
  }, [channelName, supabase]);

  /**
   * Manually cleanup the channel subscription
   */
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setStatus('disconnected');
      } catch (err) {
        console.error(`[Realtime] Cleanup error for ${channelName}:`, err);
      }
    }
  }, [channelName, supabase]);

  /**
   * Automatic cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    /** Supabase client instance */
    supabase,
    /** Subscribe to a channel with callback */
    subscribe,
    /** Manually cleanup the subscription */
    cleanup,
    /** Current connection status */
    status,
    /** Error if subscription failed */
    error,
    /** Whether the channel is connected */
    isConnected: status === 'connected',
    /** Whether the channel is connecting */
    isConnecting: status === 'connecting',
    /** Whether there's an error */
    hasError: status === 'error',
  };
}

/**
 * Utility to create a user-scoped channel name
 *
 * @param feature - Feature name (e.g., 'notifications', 'profile')
 * @param userId - User ID
 * @returns Formatted channel name (e.g., 'user:123:notifications')
 *
 * @example
 * ```typescript
 * const channelName = getUserChannelName('notifications', user.id);
 * // Returns: 'user:abc123:notifications'
 * ```
 */
export function getUserChannelName(feature: string, userId: string): string {
  return `user:${userId}:${feature}`;
}

/**
 * Debounce function for rapid real-time updates
 * Prevents excessive re-renders when multiple events arrive quickly
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds (default: 100ms)
 * @returns Debounced function
 */
export function debounceRealtimeUpdate<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 100
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
