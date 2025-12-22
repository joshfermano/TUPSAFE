/**
 * Session Management Hooks
 *
 * React Query hooks for managing user sessions including
 * viewing current session details and terminating sessions.
 *
 * @module hooks/useSession
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface SessionInfo {
  id: string;
  userId: string;
  loginAt: string;
  ipAddress: string;
  userAgent: string;
  deviceDescription: string;
  isActive: boolean;
}

interface SessionResponse {
  success: boolean;
  data: SessionInfo;
}

interface TerminateSessionsResponse {
  success: boolean;
  message: string;
  terminatedCount: number;
}

// ============================================================================
// Query Key Factory
// ============================================================================

export const sessionKeys = {
  all: ['sessions'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
};

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch current session information
 */
async function fetchCurrentSession(): Promise<SessionInfo> {
  const response = await fetch('/api/auth/sessions', {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch session information');
  }

  const result: SessionResponse = await response.json();
  return result.data;
}

/**
 * Terminate all user sessions
 */
async function terminateAllSessions(): Promise<TerminateSessionsResponse> {
  const response = await fetch('/api/auth/sessions', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to terminate sessions');
  }

  return response.json();
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch current session information
 *
 * Fetches details about the current user session including
 * login time, IP address, and device information.
 * Data is cached for 1 minute.
 *
 * @returns Query result with session information
 *
 * @example
 * ```tsx
 * const { data: session, isLoading } = useCurrentSession();
 * console.log(session?.loginAt, session?.ipAddress);
 * ```
 */
export function useCurrentSession() {
  return useQuery({
    queryKey: sessionKeys.current(),
    queryFn: fetchCurrentSession,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to terminate all user sessions
 *
 * Terminates all active sessions for the current user.
 * Useful for security purposes when user suspects unauthorized access.
 * Shows toast notifications on success or error.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const terminateMutation = useTerminateAllSessions();
 * terminateMutation.mutate();
 * ```
 */
export function useTerminateAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: terminateAllSessions,
    onSuccess: (data) => {
      // Invalidate session queries
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });

      toast.success('Sessions terminated', {
        description:
          data.message ||
          `${data.terminatedCount} session(s) have been terminated.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to terminate sessions', {
        description:
          error.message || 'An error occurred while terminating sessions.',
      });
    },
  });
}
