'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Audit logs analytics query key factory
 */
export const auditLogsAnalyticsKeys = {
  all: ['audit-logs-analytics'] as const,
  analytics: () => [...auditLogsAnalyticsKeys.all, 'analytics'] as const,
};

/**
 * Activity timeline data point
 */
export interface TimelineDataPoint {
  date: string; // MM/DD format for display
  fullDate: string; // YYYY-MM-DD format for reference
  count: number;
}

/**
 * Action distribution data point
 * Extends Record to be compatible with Recharts ChartDataInput type
 */
export interface DistributionDataPoint extends Record<string, unknown> {
  name: string; // Human-readable action name
  value: number; // Count of this action
  rawAction: string; // Original action from database
}

/**
 * Audit logs analytics response
 */
export interface AuditLogsAnalyticsResponse {
  timeline: TimelineDataPoint[];
  distribution: DistributionDataPoint[];
  metadata: {
    timelineStartDate: string;
    timelineEndDate: string;
    totalDistributionActions: number;
  };
}

/**
 * React Query hook for audit logs analytics
 *
 * Fetches aggregated analytics data for the audit logs dashboard including:
 * - Activity timeline (last 30 days)
 * - Action distribution (top actions)
 *
 * @returns Query result with analytics data and helper methods
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useAuditLogsAnalytics();
 *
 * if (data) {
 *   console.log('Timeline:', data.timeline);
 *   console.log('Distribution:', data.distribution);
 * }
 * ```
 */
export function useAuditLogsAnalytics() {
  return useQuery<AuditLogsAnalyticsResponse, Error>({
    queryKey: auditLogsAnalyticsKeys.analytics(),
    queryFn: async () => {
      const response = await fetch('/api/audit-logs/analytics');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch audit logs analytics');
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute - analytics should be relatively fresh
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
