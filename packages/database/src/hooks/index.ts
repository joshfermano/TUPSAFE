/**
 * Realtime Hooks
 *
 * React hooks for Supabase Realtime subscriptions with React Query integration.
 *
 * These hooks provide:
 * - Automatic subscription management with cleanup
 * - React Query cache integration
 * - Smart toast notifications
 * - Type-safe event handling
 * - Connection state tracking
 *
 * @module hooks
 */

// Base realtime hook with utilities
export {
  useRealtimeBase,
  getUserChannelName,
  debounceRealtimeUpdate,
  initializeRealtimeClient,
} from './useRealtimeBase';

// Notifications hook
export {
  useRealtimeNotifications,
  notificationKeys,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type UseRealtimeNotificationsOptions,
} from './useRealtimeNotifications';

// Submission status hook
export {
  useRealtimeSubmissionStatus,
  pdsKeys,
  salnKeys,
  getSubmissionById,
  getUserSubmissions,
  type UseRealtimeSubmissionStatusOptions,
} from './useRealtimeSubmissionStatus';

// Profile hook
export {
  useRealtimeProfile,
  profileKeys,
  getProfileByUserId,
  updateProfile,
  type UseRealtimeProfileOptions,
} from './useRealtimeProfile';
