/**
 * Client-Safe Database Exports
 *
 * This module provides client-safe exports for use in React components
 * and client-side code. It excludes server-only dependencies like
 * Drizzle ORM, postgres, and Node.js-specific modules.
 *
 * Safe to import in:
 * - Client Components (with 'use client')
 * - Browser environments
 * - React hooks
 * - Client-side utilities
 *
 * Usage:
 * ```typescript
 * import { useRealtimeNotifications, initializeRealtimeClient } from '@tupsafe/database/client';
 * ```
 *
 * @module client
 */

// ============================================================================
// REALTIME HOOKS (Client-Safe, marked with 'use client')
// ============================================================================

export {
  // Base realtime utilities
  useRealtimeBase,
  getUserChannelName,
  debounceRealtimeUpdate,
  initializeRealtimeClient,
  // Notifications hook
  useRealtimeNotifications,
  notificationKeys,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  // Submission status hook
  useRealtimeSubmissionStatus,
  pdsKeys,
  salnKeys,
  getSubmissionById,
  getUserSubmissions,
  // Profile hook
  useRealtimeProfile,
  profileKeys,
  getProfileByUserId,
  updateProfile,
} from './hooks';

// Re-export hook types
export type {
  UseRealtimeNotificationsOptions,
  UseRealtimeSubmissionStatusOptions,
  UseRealtimeProfileOptions,
} from './hooks';

// ============================================================================
// REALTIME UTILITIES (Client-Safe)
// ============================================================================

export {
  // Connection management
  ConnectionStatus,
  getConnectionStatus,
  reconnectWithBackoff,
  logRealtimeEvent,
  handleRealtimeError,
  registerRealtimeChannel,
  unregisterRealtimeChannel,
  isRealtimeAvailable,
  formatConnectionUptime,
  connectionManager,
} from './utils/realtime-connection';

// Re-export connection types
export type {
  ConnectionHealth,
  ReconnectionOptions,
} from './utils/realtime-connection';

// ============================================================================
// TYPES (Client-Safe, no server dependencies)
// ============================================================================

// Export all database types (these are pure TypeScript types, no runtime code)
export type * from './types';

// Export all realtime types
export type * from './types/realtime';

// ============================================================================
// NOTES
// ============================================================================

/**
 * What's NOT included in this export:
 * - Drizzle ORM (db, client)
 * - Database schemas
 * - Server-only utilities (storage, audit-log)
 * - Node.js-specific modules (fs, net, tls, crypto, etc.)
 *
 * For server-side database operations, use:
 * - '@tupsafe/database' - Main export with client-safe code (current index.ts)
 * - '@tupsafe/database/server' - Explicit server-only export
 */
