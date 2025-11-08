'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuditLog } from '@tupsafe/types';
import {
  generateMockAuditLogs,
  filterLogsByUser,
  filterLogsByAction,
  filterLogsByResource,
  filterLogsByDateRange,
  getAuditLogStats,
  getUniqueActions,
  getUniqueResources,
} from '@/lib/mock-audit-logs';

/**
 * Audit logs query key factory
 */
export const auditLogsKeys = {
  all: ['audit-logs'] as const,
  list: (filters: AuditLogsFilters) => [...auditLogsKeys.all, 'list', filters] as const,
  stats: () => [...auditLogsKeys.all, 'stats'] as const,
};

/**
 * Filters for audit logs queries
 */
export interface AuditLogsFilters {
  userId?: string | null;
  action?: string | null;
  resource?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  limit?: number;
  offset?: number;
}

/**
 * Extended audit log with computed fields for display
 */
export interface ExtendedAuditLog extends AuditLog {
  user: string;
  user_email: string;
  details: string | null;
}

/**
 * Audit logs query result with pagination
 */
export interface AuditLogsResult {
  logs: ExtendedAuditLog[];
  total: number;
  hasMore: boolean;
  unique_users: number;
  total_actions: number;
  resources_affected: number;
  uniqueActions: string[];
  uniqueResources: string[];
}

/**
 * React Query hook for audit logs in the admin portal
 *
 * Fetches and filters audit logs with support for user, action, resource, and date filtering.
 * Includes pagination and statistics.
 *
 * @param filters - Optional filters for the audit logs query
 * @returns Query result with audit logs and helper methods
 *
 * @example
 * ```tsx
 * const {
 *   logs,
 *   isLoading,
 *   stats,
 *   uniqueActions,
 *   uniqueResources,
 * } = useAuditLogsQuery({
 *   resource: 'pds',
 *   startDate: new Date('2025-01-01'),
 * });
 *
 * // Display logs
 * logs.forEach(log => console.log(log.action, log.createdAt));
 * ```
 */
export function useAuditLogsQuery(filters: AuditLogsFilters = {}) {
  const query = useQuery<AuditLogsResult, Error>({
    queryKey: auditLogsKeys.list(filters),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Generate mock audit logs (in production, this would be fetched from API)
      let allLogs = generateMockAuditLogs(200);

      // Apply filters
      if (filters.userId) {
        allLogs = filterLogsByUser(allLogs, filters.userId);
      }

      if (filters.action) {
        allLogs = filterLogsByAction(allLogs, filters.action);
      }

      if (filters.resource) {
        allLogs = filterLogsByResource(allLogs, filters.resource);
      }

      if (filters.startDate || filters.endDate) {
        allLogs = filterLogsByDateRange(allLogs, filters.startDate || null, filters.endDate || null);
      }

      // Get unique values for filter dropdowns
      const uniqueActions = getUniqueActions(allLogs);
      const uniqueResources = getUniqueResources(allLogs);

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      const paginatedLogs = allLogs.slice(offset, offset + limit);

      // Extend logs with computed fields for display
      const extendedLogs: ExtendedAuditLog[] = paginatedLogs.map((log) => ({
        ...log,
        user: log.metadata?.userName as string || 'Unknown User',
        user_email: log.metadata?.email as string || 'N/A',
        details: log.metadata ? JSON.stringify(log.metadata, null, 2) : null,
      }));

      // Get unique users count
      const uniqueUsers = new Set(allLogs.map((log) => log.userId)).size;
      const resourcesAffected = new Set(
        allLogs.filter((log) => log.resourceId).map((log) => log.resourceId)
      ).size;

      return {
        logs: extendedLogs,
        total: allLogs.length,
        hasMore: offset + limit < allLogs.length,
        unique_users: uniqueUsers,
        total_actions: allLogs.length,
        resources_affected: resourcesAffected,
        uniqueActions,
        uniqueResources,
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute - audit logs should be relatively fresh
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Query for audit log statistics
   */
  const useAuditLogStats = () => {
    return useQuery({
      queryKey: auditLogsKeys.stats(),
      queryFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));

        const allLogs = generateMockAuditLogs(200);
        return getAuditLogStats(allLogs);
      },
      staleTime: 3 * 60 * 1000,
    });
  };

  /**
   * Get logs for a specific user with full details
   */
  const getLogsForUser = (userId: string) => {
    const allLogs = generateMockAuditLogs(200);
    return filterLogsByUser(allLogs, userId);
  };

  /**
   * Get recent critical actions (security-relevant)
   */
  const getCriticalActions = () => {
    if (!query.data) return [];

    const criticalActionTypes = [
      'user.role_changed',
      'user.deleted',
      'system.settings_updated',
      'system.data_export',
    ];

    return query.data.logs.filter((log) => criticalActionTypes.includes(log.action));
  };

  /**
   * Get activity summary by action type
   */
  const getActivitySummary = () => {
    if (!query.data) return null;

    const stats = getAuditLogStats(query.data.logs);

    return {
      totalActions: stats.total,
      actionBreakdown: stats.byAction,
      resourceBreakdown: stats.byResource,
      dateRange: stats.dateRange,
    };
  };

  /**
   * Get timeline of activities (grouped by date)
   */
  const getActivityTimeline = () => {
    if (!query.data) return [];

    const timeline: Record<string, AuditLog[]> = {};

    query.data.logs.forEach((log) => {
      const dateKey = new Date(log.createdAt).toLocaleDateString();
      if (!timeline[dateKey]) {
        timeline[dateKey] = [];
      }
      timeline[dateKey].push(log);
    });

    return Object.entries(timeline)
      .map(([date, logs]) => ({
        date,
        logs,
        count: logs.length,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  /**
   * Check for suspicious activity patterns
   */
  const getSuspiciousActivity = () => {
    if (!query.data) return [];

    const suspiciousPatterns = [];

    // Check for multiple failed login attempts from same user
    const loginAttempts: Record<string, number> = {};
    query.data.logs.forEach((log) => {
      if (log.action === 'user.login') {
        loginAttempts[log.userId] = (loginAttempts[log.userId] || 0) + 1;
      }
    });

    Object.entries(loginAttempts).forEach(([userId, count]) => {
      if (count > 5) {
        suspiciousPatterns.push({
          type: 'multiple_logins',
          userId,
          count,
          severity: 'medium',
        });
      }
    });

    // Check for bulk deletions
    const deletionActions = query.data.logs.filter((log) =>
      log.action.includes('deleted')
    );
    if (deletionActions.length > 10) {
      suspiciousPatterns.push({
        type: 'bulk_deletions',
        count: deletionActions.length,
        severity: 'high',
      });
    }

    return suspiciousPatterns;
  };

  /**
   * Export audit logs to CSV format (returns CSV string)
   */
  const exportToCSV = () => {
    if (!query.data) return '';

    const headers = ['Timestamp', 'User ID', 'Action', 'Resource', 'Resource ID', 'IP Address'];
    const rows = query.data.logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.userId,
      log.action,
      log.resource,
      log.resourceId || '',
      log.ipAddress || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  };

  return {
    ...query,
    logs: query.data?.logs ?? [],
    total: query.data?.total ?? 0,
    hasMore: query.data?.hasMore ?? false,
    uniqueActions: query.data?.uniqueActions ?? [],
    uniqueResources: query.data?.uniqueResources ?? [],
    useAuditLogStats,
    getLogsForUser,
    getCriticalActions,
    getActivitySummary,
    getActivityTimeline,
    getSuspiciousActivity,
    exportToCSV,
  };
}

/**
 * Hook to invalidate audit logs cache
 * Use this after actions that should be logged
 */
export function useInvalidateAuditLogs() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: auditLogsKeys.all });
  };
}

/**
 * Hook to prefetch audit logs for a specific filter
 * Useful for improving perceived performance
 */
export function usePrefetchAuditLogs() {
  const queryClient = useQueryClient();

  return (filters: AuditLogsFilters) => {
    queryClient.prefetchQuery({
      queryKey: auditLogsKeys.list(filters),
      queryFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));

        let allLogs = generateMockAuditLogs(200);

        if (filters.userId) {
          allLogs = filterLogsByUser(allLogs, filters.userId);
        }

        if (filters.action) {
          allLogs = filterLogsByAction(allLogs, filters.action);
        }

        if (filters.resource) {
          allLogs = filterLogsByResource(allLogs, filters.resource);
        }

        if (filters.startDate || filters.endDate) {
          allLogs = filterLogsByDateRange(allLogs, filters.startDate || null, filters.endDate || null);
        }

        const limit = filters.limit || 50;
        const offset = filters.offset || 0;
        const paginatedLogs = allLogs.slice(offset, offset + limit);

        return {
          logs: paginatedLogs,
          total: allLogs.length,
          hasMore: offset + limit < allLogs.length,
          uniqueActions: getUniqueActions(allLogs),
          uniqueResources: getUniqueResources(allLogs),
        };
      },
      staleTime: 1 * 60 * 1000,
    });
  };
}
