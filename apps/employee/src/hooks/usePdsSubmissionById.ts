'use client';

import { useQuery } from '@tanstack/react-query';
import type { CompletePDSSubmission } from '@tupsafe/database/server';

/**
 * Query key factory for PDS detail fetching
 */
export const pdsDetailKeys = {
  detail: (submissionId: string) => ['pds', 'detail', submissionId] as const,
};

/**
 * React Query hook for fetching complete PDS submission by ID
 *
 * @param submissionId - The PDS submission ID
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with complete PDS data including all sections
 *
 * @example
 * ```tsx
 * const { pdsData, loading, error } = usePdsSubmissionById('submission-id-123');
 * ```
 */
export function usePdsSubmissionById(submissionId: string, enabled = true) {
  const query = useQuery({
    queryKey: pdsDetailKeys.detail(submissionId),
    queryFn: async () => {
      const response = await fetch(`/api/pds/${submissionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Failed to fetch PDS details',
        }));
        throw new Error(errorData.error || 'Failed to fetch PDS details');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch PDS details');
      }

      return data.data as CompletePDSSubmission;
    },
    enabled: enabled && !!submissionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    pdsData: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    isError: query.isError,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
