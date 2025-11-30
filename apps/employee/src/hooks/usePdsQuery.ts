'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PdsSubmission } from '@tupsafe/mock-data';

/**
 * PDS query key factory
 */
export const pdsKeys = {
  all: ['pds'] as const,
  user: (userId: string) => [...pdsKeys.all, userId] as const,
  submission: (submissionId: string) => [...pdsKeys.all, 'submission', submissionId] as const,
};

/**
 * React Query hook for PDS submissions with real API
 *
 * @param userId - User ID to fetch PDS submissions for
 * @returns Query result with PDS submissions
 *
 * @example
 * ```tsx
 * const { submissions, loading, error } = usePdsQuery('user-123');
 * ```
 */
export function usePdsQuery(userId: string) {
  const queryClient = useQueryClient();

  // Fetch PDS submissions from real API
  const query = useQuery({
    queryKey: pdsKeys.user(userId),
    queryFn: async () => {
      const response = await fetch('/api/pds', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch PDS submissions' }));
        throw new Error(errorData.error || 'Failed to fetch PDS submissions');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch PDS submissions');
      }

      return data.data as PdsSubmission[];
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    submissions: query.data ?? [],
    latest: query.data?.[0] ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

/**
 * Hook to invalidate PDS cache
 */
export function useInvalidatePds() {
  const queryClient = useQueryClient();

  return (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: pdsKeys.user(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: pdsKeys.all });
    }
  };
}
