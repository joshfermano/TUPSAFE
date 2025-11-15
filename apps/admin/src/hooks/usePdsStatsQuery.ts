'use client';

import { useQuery } from '@tanstack/react-query';
import type { PdsTimelineStats } from '@tupsafe/types';

/**
 * React Query hook for fetching PDS timeline statistics
 *
 * Fetches monthly submission trends and department compliance data
 * for use in analytics charts and dashboards.
 *
 * @returns Query result with timeline statistics
 *
 * @example
 * ```tsx
 * const { data: pdsStats, isLoading } = usePdsStatsQuery();
 *
 * const chartData = pdsStats?.monthlyData.map(item => ({
 *   month: item.month,
 *   submitted: item.submitted,
 *   approved: item.approved,
 *   rejected: item.rejected,
 * }));
 * ```
 */
export function usePdsStatsQuery() {
  return useQuery<PdsTimelineStats, Error>({
    queryKey: ['pds', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/submissions/pds/stats');

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch PDS stats: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - stats update less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
