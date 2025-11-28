'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ActiveSessionsResponse,
  RevokeSessionRequest,
  RevokeAllSessionsRequest,
  RevokeSessionResponse,
  RevokeAllSessionsResponse,
} from '@tupsafe/types';

/**
 * Active sessions query key factory
 */
export const activeSessionsKeys = {
  all: ['settings', 'sessions'] as const,
  list: () => [...activeSessionsKeys.all, 'list'] as const,
};

/**
 * React Query hook for managing active sessions in the admin portal settings
 *
 * Provides access to all active login sessions across devices with ability
 * to revoke individual sessions or all sessions at once.
 *
 * Features:
 * - Fetches all active sessions with device and location info
 * - Identifies current session
 * - Revoke individual sessions
 * - Revoke all sessions (except current, optionally)
 * - Optimistic updates for immediate feedback
 * - Short stale time (1 minute) since sessions are dynamic
 *
 * Security Features:
 * - Cannot revoke current session accidentally
 * - Audit logging for all session operations
 * - IP address masking in display
 *
 * @returns Query result with sessions data and mutation methods
 *
 * @example
 * ```tsx
 * const {
 *   sessions,
 *   currentSessionId,
 *   isLoading,
 *   revokeSession,
 *   revokeAllSessions,
 * } = useActiveSessionsQuery();
 *
 * // Revoke a single session
 * await revokeSession({ sessionId: 'session-123' });
 *
 * // Revoke all sessions except current
 * await revokeAllSessions({ keepCurrent: true });
 * ```
 */
export function useActiveSessionsQuery() {
  const queryClient = useQueryClient();

  // Main query for active sessions
  const query = useQuery<ActiveSessionsResponse, Error>({
    queryKey: activeSessionsKeys.list(),
    queryFn: async () => {
      const response = await fetch('/api/settings/sessions', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle auth errors gracefully
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to fetch sessions: ${response.statusText}`
        );
      }

      const data: ActiveSessionsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }

      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute (sessions are dynamic)
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Session expired') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Mutation to revoke a single session
   */
  const revokeSessionMutation = useMutation({
    mutationFn: async (data: RevokeSessionRequest) => {
      const response = await fetch('/api/settings/sessions', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Provide specific error for current session
        if (response.status === 400) {
          throw new Error('Cannot revoke your current session');
        }

        throw new Error(
          errorData?.error ||
            `Failed to revoke session: ${response.statusText}`
        );
      }

      const result: RevokeSessionResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to revoke session');
      }

      return result;
    },
    onMutate: async ({ sessionId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: activeSessionsKeys.all });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ActiveSessionsResponse>(
        activeSessionsKeys.list()
      );

      // Optimistically remove session
      if (previousData) {
        queryClient.setQueryData<ActiveSessionsResponse>(
          activeSessionsKeys.list(),
          {
            ...previousData,
            sessions: previousData.sessions.filter(
              (session) => session.id !== sessionId
            ),
          }
        );
      }

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          activeSessionsKeys.list(),
          context.previousData
        );
      }

      // Show error toast
      toast.error('Failed to revoke session', {
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
    onSuccess: () => {
      // Show success toast
      toast.success('Session revoked', {
        description: 'The device has been logged out successfully',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: activeSessionsKeys.all });
    },
  });

  /**
   * Mutation to revoke all sessions
   */
  const revokeAllSessionsMutation = useMutation({
    mutationFn: async (data: RevokeAllSessionsRequest = { keepCurrent: true }) => {
      const response = await fetch('/api/settings/sessions', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, revokeAll: true }),
      });

      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to revoke sessions: ${response.statusText}`
        );
      }

      const result: RevokeAllSessionsResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to revoke sessions');
      }

      return result;
    },
    onMutate: async ({ keepCurrent }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: activeSessionsKeys.all });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ActiveSessionsResponse>(
        activeSessionsKeys.list()
      );

      // Optimistically update sessions
      if (previousData) {
        queryClient.setQueryData<ActiveSessionsResponse>(
          activeSessionsKeys.list(),
          {
            ...previousData,
            sessions: keepCurrent
              ? previousData.sessions.filter((session) => session.isCurrent)
              : [],
          }
        );
      }

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          activeSessionsKeys.list(),
          context.previousData
        );
      }

      // Show error toast
      toast.error('Failed to revoke sessions', {
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
    onSuccess: (result) => {
      // Show success toast with count
      toast.success('All sessions revoked', {
        description: `${result.sessionsRevoked} session${
          result.sessionsRevoked !== 1 ? 's' : ''
        } logged out successfully`,
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: activeSessionsKeys.all });
    },
  });

  /**
   * Helper to get non-current sessions
   */
  const getOtherSessions = () => {
    if (!query.data) return [];
    return query.data.sessions.filter((session) => !session.isCurrent);
  };

  /**
   * Helper to get current session
   */
  const getCurrentSession = () => {
    if (!query.data) return null;
    return (
      query.data.sessions.find((session) => session.isCurrent) || null
    );
  };

  return {
    ...query,
    sessions: query.data?.sessions ?? [],
    currentSessionId: query.data?.currentSessionId ?? '',
    totalSessions: query.data?.sessions.length ?? 0,
    otherSessions: getOtherSessions(),
    currentSession: getCurrentSession(),
    revokeSession: revokeSessionMutation.mutate,
    revokeSessionAsync: revokeSessionMutation.mutateAsync,
    isRevokingSession: revokeSessionMutation.isPending,
    revokeSessionError: revokeSessionMutation.error,
    revokeAllSessions: revokeAllSessionsMutation.mutate,
    revokeAllSessionsAsync: revokeAllSessionsMutation.mutateAsync,
    isRevokingAllSessions: revokeAllSessionsMutation.isPending,
    revokeAllSessionsError: revokeAllSessionsMutation.error,
  };
}

/**
 * Hook to invalidate active sessions cache
 * Use this after login/logout operations
 */
export function useInvalidateActiveSessions() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: activeSessionsKeys.all });
  };
}

/**
 * Hook to prefetch active sessions
 * Useful for improving perceived performance
 */
export function usePrefetchActiveSessions() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: activeSessionsKeys.list(),
      queryFn: async () => {
        const response = await fetch('/api/settings/sessions', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          throw new Error('Session expired');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to fetch sessions: ${response.statusText}`
          );
        }

        const data: ActiveSessionsResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch sessions');
        }

        return data;
      },
      staleTime: 1 * 60 * 1000,
    });
  };
}
