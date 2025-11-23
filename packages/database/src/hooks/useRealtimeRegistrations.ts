/**
 * Realtime Registrations Hook
 *
 * React hook for real-time updates to registration approval requests.
 * Subscribes to changes on the pending_registrations table and invalidates
 * React Query cache when updates occur.
 *
 * @module hooks/useRealtimeRegistrations
 */

'use client';

import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useRealtimeBase } from './useRealtimeBase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { PendingRegistration } from '../types';

/**
 * Options for useRealtimeRegistrations hook
 */
export interface UseRealtimeRegistrationsOptions {
  /**
   * Query client instance for cache invalidation
   * Must be provided to enable cache updates
   */
  queryClient: QueryClient;

  /**
   * Query key patterns to invalidate on changes
   * Default: [['registrations']]
   */
  queryKeys?: string[][];

  /**
   * Whether to show toast notifications for updates
   * Default: true
   */
  showNotifications?: boolean;

  /**
   * Custom notification handler
   * Receives the change type and payload
   */
  onNotification?: (
    eventType: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: RealtimePostgresChangesPayload<PendingRegistration>
  ) => void;

  /**
   * Whether the hook is enabled
   * Default: true
   */
  enabled?: boolean;
}

/**
 * Hook for real-time registration updates
 *
 * Subscribes to changes on the pending_registrations table and
 * automatically invalidates React Query cache when changes occur.
 *
 * Features:
 * - Listens to INSERT, UPDATE, DELETE events
 * - Invalidates React Query cache automatically
 * - Optional toast notifications
 * - Automatic cleanup on unmount
 *
 * @param options - Configuration options
 * @returns Connection status and utilities
 *
 * @example
 * ```typescript
 * function RegistrationsPage() {
 *   const queryClient = useQueryClient();
 *
 *   useRealtimeRegistrations({
 *     queryClient,
 *     showNotifications: true,
 *     onNotification: (type, payload) => {
 *       console.log('Registration changed:', type, payload);
 *     }
 *   });
 *
 *   return <RegistrationsList />;
 * }
 * ```
 */
export function useRealtimeRegistrations(
  options: UseRealtimeRegistrationsOptions
) {
  const {
    queryClient,
    queryKeys = [['registrations']],
    showNotifications = true,
    onNotification,
    enabled = true,
  } = options;

  const channelName = 'registrations:all';
  const { supabase, subscribe, status, error } = useRealtimeBase(channelName);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to pending_registrations table changes
    subscribe(() =>
      supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'pending_registrations',
          },
          (payload: RealtimePostgresChangesPayload<PendingRegistration>) => {
            console.log('[Realtime] Registration change detected:', payload.eventType);

            // Invalidate all specified query keys
            queryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });

            // Call custom notification handler
            if (onNotification && payload.eventType) {
              onNotification(
                payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                payload
              );
            }

            // Show toast notification (if enabled and in browser environment)
            if (showNotifications) {
              // Dynamically import toast to avoid SSR issues
              import('sonner').then(({ toast }) => {
                if (payload.eventType === 'INSERT') {
                  toast.info('New registration received', {
                    description: 'A new registration request has been submitted',
                  });
                } else if (payload.eventType === 'UPDATE') {
                  // Only show for status changes by other users
                  const record = payload.new as PendingRegistration;
                  if (record.status === 'approved') {
                    toast.success('Registration approved', {
                      description: 'A registration was approved by another admin',
                    });
                  } else if (record.status === 'rejected') {
                    toast.warning('Registration rejected', {
                      description: 'A registration was rejected by another admin',
                    });
                  }
                } else if (payload.eventType === 'DELETE') {
                  toast.info('Registration removed', {
                    description: 'A registration request was removed',
                  });
                }
              });
            }
          }
        )
    );
  }, [
    enabled,
    supabase,
    subscribe,
    channelName,
    queryClient,
    queryKeys,
    showNotifications,
    onNotification,
  ]);

  return {
    /**
     * Current connection status
     */
    status,

    /**
     * Connection error (if any)
     */
    error,

    /**
     * Whether the channel is connected
     */
    isConnected: status === 'connected',

    /**
     * Whether the channel is connecting
     */
    isConnecting: status === 'connecting',

    /**
     * Whether there's an error
     */
    hasError: status === 'error',
  };
}

/**
 * Query key factory for registrations
 * Provides consistent query key patterns for cache management
 */
export const registrationRealtimeKeys = {
  all: () => ['registrations'] as const,
  lists: () => ['registrations', 'list'] as const,
  details: () => ['registrations', 'detail'] as const,
  stats: () => ['registrations', 'stats'] as const,
};
