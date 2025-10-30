'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRealtimeBase, getUserChannelName } from './useRealtimeBase';
import type { RealtimePayload } from '../types/realtime';
import type { Notification } from '../types';

/**
 * Query keys for notifications
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  user: (userId: string) => [...notificationKeys.all, userId] as const,
  unread: (userId: string) => [...notificationKeys.user(userId), 'unread'] as const,
};

/**
 * Configuration options for useRealtimeNotifications
 */
export interface UseRealtimeNotificationsOptions {
  /** Whether to show toast notifications for new items (default: true) */
  showToast?: boolean;
  /** Whether to automatically mark notifications as read when viewed (default: false) */
  autoMarkAsRead?: boolean;
  /** Custom callback when a new notification arrives */
  onNewNotification?: (notification: Notification) => void;
  /** Custom callback when a notification is updated */
  onNotificationUpdate?: (notification: Notification) => void;
}

/**
 * Real-time hook for notifications with React Query integration
 *
 * Subscribes to the notifications table and automatically updates the React Query cache
 * when notifications are created or updated. Shows toast notifications for new items.
 *
 * @param userId - User ID to subscribe to notifications for
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * function NotificationBell() {
 *   const { user } = useAuth();
 *   const { status, isConnected } = useRealtimeNotifications(user?.id || '', {
 *     showToast: true,
 *     onNewNotification: (notification) => {
 *       console.log('New notification:', notification.title);
 *     },
 *   });
 *
 *   return (
 *     <Badge>
 *       {isConnected ? 'Live' : 'Offline'}
 *     </Badge>
 *   );
 * }
 * ```
 */
export function useRealtimeNotifications(
  userId: string,
  options: UseRealtimeNotificationsOptions = {}
) {
  const {
    showToast = true,
    autoMarkAsRead = false,
    onNewNotification,
    onNotificationUpdate,
  } = options;

  const queryClient = useQueryClient();
  const channelName = getUserChannelName('notifications', userId);
  const { supabase, subscribe, status, isConnected, error } = useRealtimeBase(channelName);

  useEffect(() => {
    // Don't subscribe if no user ID
    if (!userId) {
      console.warn('[Realtime] No userId provided for notifications subscription');
      return;
    }

    subscribe(() =>
      supabase
        .channel(channelName)
        // Listen for new notifications (INSERT)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePayload<Notification>) => {
            const newNotification = payload.new;

            // Show toast notification
            if (showToast) {
              // Map notification type to toast type
              let toastType: 'info' | 'success' | 'warning' | 'error' = 'info';
              if (newNotification.type === 'deadline_reminder') {
                toastType = 'warning';
              } else if (newNotification.type === 'submission_status') {
                toastType = 'success';
              } else if (newNotification.type === 'approval_required') {
                toastType = 'info';
              } else if (newNotification.type === 'system_update') {
                toastType = 'info';
              }

              const toastFn = toast[toastType] || toast;

              toastFn(newNotification.title, {
                description: newNotification.message,
                duration: 5000,
              });
            }

            // Update React Query cache - prepend new notification
            queryClient.setQueryData<Notification[]>(
              notificationKeys.user(userId),
              (oldData = []) => [newNotification, ...oldData]
            );

            // Invalidate unread count
            queryClient.invalidateQueries({
              queryKey: notificationKeys.unread(userId),
            });

            // Call custom callback
            onNewNotification?.(newNotification);
          }
        )
        // Listen for notification updates (UPDATE) - e.g., marking as read
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePayload<Notification>) => {
            const updatedNotification = payload.new;

            // Update React Query cache - replace the updated notification
            queryClient.setQueryData<Notification[]>(
              notificationKeys.user(userId),
              (oldData = []) =>
                oldData.map((notif) =>
                  notif.id === updatedNotification.id ? updatedNotification : notif
                )
            );

            // Invalidate unread count if read status changed
            if (payload.old?.isRead !== updatedNotification.isRead) {
              queryClient.invalidateQueries({
                queryKey: notificationKeys.unread(userId),
              });
            }

            // Call custom callback
            onNotificationUpdate?.(updatedNotification);
          }
        )
        // Listen for notification deletions (DELETE)
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePayload<Notification>) => {
            const deletedNotification = payload.old;

            // Update React Query cache - remove deleted notification
            queryClient.setQueryData<Notification[]>(
              notificationKeys.user(userId),
              (oldData = []) => oldData.filter((notif) => notif.id !== deletedNotification.id)
            );

            // Invalidate unread count
            queryClient.invalidateQueries({
              queryKey: notificationKeys.unread(userId),
            });
          }
        )
    );
  }, [
    userId,
    channelName,
    showToast,
    autoMarkAsRead,
    onNewNotification,
    onNotificationUpdate,
    queryClient,
    subscribe,
    supabase,
  ]);

  return {
    /** Current subscription status */
    status,
    /** Whether the subscription is connected */
    isConnected,
    /** Error if subscription failed */
    error,
    /** Query keys for use with React Query */
    queryKeys: notificationKeys,
  };
}

/**
 * Mark a notification as read
 *
 * This is a utility function that can be used with React Query mutations.
 * The real-time subscription will automatically update the cache when the
 * database update occurs.
 *
 * @param supabase - Supabase client
 * @param notificationId - Notification ID to mark as read
 *
 * @example
 * ```typescript
 * const markAsReadMutation = useMutation({
 *   mutationFn: (notificationId: string) =>
 *     markNotificationAsRead(createClient(), notificationId),
 *   // No need to manually invalidate - real-time will handle it!
 * });
 * ```
 */
export async function markNotificationAsRead(
  supabase: any,
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 *
 * @example
 * ```typescript
 * const markAllAsReadMutation = useMutation({
 *   mutationFn: () => markAllNotificationsAsRead(createClient(), user.id),
 * });
 * ```
 */
export async function markAllNotificationsAsRead(
  supabase: any,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw error;
  }
}
