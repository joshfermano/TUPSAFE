'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuditLogsListResponse } from '@tupsafe/types';

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
  page?: number;
  limit?: number;
  user?: string | null;
  action?: string | null;
  resource?: string | null;
  search?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  sortBy?: 'createdAt' | 'action' | 'user';
  sortOrder?: 'asc' | 'desc';
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
 *   pagination,
 * } = useAuditLogsQuery({
 *   resource: 'pds',
 *   startDate: new Date('2025-01-01'),
 *   page: 1,
 *   limit: 25,
 * });
 *
 * // Display logs
 * logs.forEach(log => console.log(log.action, log.createdAt));
 * ```
 */
export function useAuditLogsQuery(filters: AuditLogsFilters = {}) {
  // Main query for audit logs list
  const query = useQuery<AuditLogsListResponse, Error>({
    queryKey: auditLogsKeys.list(filters),
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.user) params.append('user', filters.user);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) {
        params.append('startDate', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate.toISOString());
      }
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(
        `/api/audit-logs?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to fetch audit logs: ${response.statusText}`
        );
      }

      const data: AuditLogsListResponse = await response.json();
      return data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - audit logs should be relatively fresh
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Export audit logs to CSV format
   * Fetches all logs matching current filters (no pagination) and downloads as CSV
   */
  const exportAuditLogsToCSV = async () => {
    try {
      // Build query parameters for export (without pagination)
      const params = new URLSearchParams();

      // Include all filters except page/limit to get ALL matching records
      if (filters.user) params.append('user', filters.user);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) {
        params.append('startDate', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate.toISOString());
      }
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      // Set a high limit to get all records (API max is 100, so we need multiple requests for large datasets)
      params.append('limit', '100');

      // Fetch all pages
      let allLogs: AuditLogsListResponse['logs'] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        params.set('page', currentPage.toString());
        const response = await fetch(`/api/audit-logs?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch audit logs for export');
        }

        const data: AuditLogsListResponse = await response.json();
        allLogs = [...allLogs, ...data.logs];
        totalPages = data.pagination.totalPages;
        currentPage++;
      } while (currentPage <= totalPages);

      // Convert to CSV
      const headers = [
        'Timestamp',
        'User ID',
        'User Name',
        'Employee ID',
        'Action',
        'Resource Type',
        'Resource ID',
        'IP Address',
        'User Agent',
        'Changes Summary',
      ];

      const rows = allLogs.map((log) => {
        const userName = `${log.user.firstName} ${log.user.lastName}`;
        const changesSummary = log.changes
          ? JSON.stringify(log.changes).substring(0, 200) // Limit to 200 chars
          : '';

        return [
          new Date(log.createdAt).toISOString(),
          log.user.id,
          userName,
          log.user.employeeId || 'N/A',
          log.action,
          log.entityType,
          log.entityId || 'N/A',
          log.ipAddress || 'N/A',
          log.userAgent || 'N/A',
          changesSummary,
        ];
      });

      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, recordCount: allLogs.length };
    } catch (error) {
      console.error('[Audit Logs Export] Error:', error);
      throw error;
    }
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

    return query.data.logs.filter((log) =>
      criticalActionTypes.includes(log.action)
    );
  };

  /**
   * Get activity timeline (grouped by date)
   */
  const getActivityTimeline = () => {
    if (!query.data) return [];

    const timeline: Record<string, typeof query.data.logs> = {};

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

    const suspiciousPatterns: Array<{
      type: string;
      userId?: string;
      count: number;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    // Check for multiple failed login attempts from same user
    const loginAttempts: Record<string, number> = {};
    query.data.logs.forEach((log) => {
      if (log.action === 'user.login') {
        loginAttempts[log.user.id] = (loginAttempts[log.user.id] || 0) + 1;
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

  return {
    ...query,
    logs: query.data?.logs ?? [],
    pagination: query.data?.pagination,
    stats: query.data?.stats,
    total: query.data?.pagination?.total ?? 0,
    hasMore:
      query.data?.pagination
        ? query.data.pagination.page < query.data.pagination.totalPages
        : false,
    exportAuditLogsToCSV,
    getCriticalActions,
    getActivityTimeline,
    getSuspiciousActivity,
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
        // Build query parameters
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.user) params.append('user', filters.user);
        if (filters.action) params.append('action', filters.action);
        if (filters.resource) params.append('resource', filters.resource);
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) {
          params.append('startDate', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          params.append('endDate', filters.endDate.toISOString());
        }
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

        const response = await fetch(`/api/audit-logs?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to fetch audit logs: ${response.statusText}`
          );
        }

        const data: AuditLogsListResponse = await response.json();
        return data;
      },
      staleTime: 3 * 60 * 1000,
    });
  };
}
