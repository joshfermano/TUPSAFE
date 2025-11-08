'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MockDatabase } from '@tupsafe/mock-data';
import { calculateDashboardStats } from '@/lib/mock-helpers';

/**
 * Dashboard query key factory
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

/**
 * Dashboard statistics type
 */
export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };
  pds: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
    complianceRate: number;
  };
  saln: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
    currentYear: number;
    complianceRate: number;
  };
  departments: {
    total: number;
    active: number;
  };
  positions: {
    total: number;
    active: number;
  };
  pendingApprovals: {
    total: number;
    pds: number;
    saln: number;
  };
  recentActivity: Array<{
    id: string;
    timestamp: string;
    user: string;
    action: string;
    resource: string;
    details: string | null;
  }>;
  pendingSubmissions: Array<{
    id: string;
    type: 'PDS' | 'SALN';
    employee: string;
    department: string;
    submittedAt: string;
    status: string;
  }>;
  totalUsers: number;
  totalPendingApprovals: number;
  pdsSubmissions: number;
  salnSubmissions: number;
  complianceRate: number;
  systemHealth: string;
  trends: {
    users: number;
    pds: number;
    saln: number;
  };
}

/**
 * React Query hook for admin dashboard statistics
 *
 * Fetches comprehensive statistics for the admin dashboard including:
 * - User counts by role and status
 * - PDS/SALN submission counts and compliance rates
 * - Pending approvals
 * - Department and position counts
 *
 * @returns Query result with dashboard statistics
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useDashboardQuery();
 *
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <div>
 *     <h2>Total Users: {data.users.total}</h2>
 *     <p>PDS Compliance: {data.pds.complianceRate}%</p>
 *     <button onClick={() => refetch()}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useDashboardQuery() {
  const queryClient = useQueryClient();

  const query = useQuery<DashboardStats, Error>({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      // Simulate API delay for realism
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = calculateDashboardStats();
      return stats;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
  });

  /**
   * Prefetch pending approvals data
   * Useful for improving perceived performance when navigating to approvals page
   */
  const prefetchPendingApprovals = async () => {
    await queryClient.prefetchQuery({
      queryKey: ['approvals', 'pending'],
      queryFn: () => MockDatabase.getPendingApprovals(),
      staleTime: 3 * 60 * 1000,
    });
  };

  /**
   * Get system health status based on stats
   */
  const getSystemHealth = () => {
    if (!query.data) return null;

    const { pds, saln, pendingApprovals } = query.data;
    const avgCompliance = (pds.complianceRate + saln.complianceRate) / 2;

    return {
      compliance: {
        status: avgCompliance >= 80 ? 'healthy' : avgCompliance >= 60 ? 'warning' : 'critical',
        score: Math.round(avgCompliance),
      },
      pendingLoad: {
        status: pendingApprovals.total <= 10 ? 'healthy' : pendingApprovals.total <= 30 ? 'warning' : 'critical',
        count: pendingApprovals.total,
      },
      overall: avgCompliance >= 80 && pendingApprovals.total <= 10 ? 'healthy' : avgCompliance >= 60 && pendingApprovals.total <= 30 ? 'warning' : 'critical',
    };
  };

  /**
   * Get trend comparison (mock - in production would compare with previous period)
   */
  const getTrendIndicators = () => {
    if (!query.data) return null;

    // Mock trend data - in production, this would compare with previous month/quarter
    return {
      users: {
        change: Math.floor(Math.random() * 20) - 5, // -5 to +15
        trend: Math.random() > 0.3 ? 'up' : 'down',
      },
      pdsCompliance: {
        change: Math.floor(Math.random() * 10) - 2, // -2 to +8
        trend: Math.random() > 0.4 ? 'up' : 'down',
      },
      salnCompliance: {
        change: Math.floor(Math.random() * 10) - 2, // -2 to +8
        trend: Math.random() > 0.4 ? 'up' : 'down',
      },
      pendingApprovals: {
        change: Math.floor(Math.random() * 20) - 10, // -10 to +10
        trend: Math.random() > 0.5 ? 'up' : 'down',
      },
    };
  };

  return {
    ...query,
    stats: query.data ?? null,
    prefetchPendingApprovals,
    getSystemHealth,
    getTrendIndicators,
  };
}

/**
 * Hook to invalidate dashboard cache
 * Use this after actions that affect dashboard statistics
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };
}

/**
 * Hook to manually refresh dashboard data
 * Useful for refresh buttons or pull-to-refresh
 */
export function useRefreshDashboard() {
  const invalidateDashboard = useInvalidateDashboard();

  return async () => {
    invalidateDashboard();
  };
}
