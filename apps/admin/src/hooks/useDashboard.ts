/**
 * Dashboard React Query Hooks
 *
 * Centralized hooks for dashboard data fetching with caching and real-time updates
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DashboardOverviewResponse,
  DashboardTrendsResponse,
  DashboardDepartmentsResponse,
  DashboardComplianceResponse,
  DashboardActivityResponse,
  TrendsQueryParams,
  ActivityQueryParams,
} from '@tupsafe/types';
import {
  fetchDashboardOverview,
  fetchDashboardTrends,
  fetchDepartmentAnalytics,
  fetchComplianceReport,
  fetchRecentActivity,
} from '@/lib/api/dashboard';

/**
 * Query key factory for dashboard
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  trends: (params: TrendsQueryParams) => [...dashboardKeys.all, 'trends', params] as const,
  departments: () => [...dashboardKeys.all, 'departments'] as const,
  compliance: () => [...dashboardKeys.all, 'compliance'] as const,
  activity: (params: Partial<ActivityQueryParams>) =>
    [...dashboardKeys.all, 'activity', params] as const,
};

/**
 * Hook for dashboard overview metrics
 *
 * Auto-refreshes every 5 minutes
 * Stale time: 5 minutes
 * Cache time: 10 minutes
 */
export function useDashboardOverview() {
  return useQuery<DashboardOverviewResponse, Error>({
    queryKey: dashboardKeys.overview(),
    queryFn: fetchDashboardOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
  });
}

/**
 * Hook for dashboard trends data
 *
 * Stale time: 5 minutes
 */
export function useDashboardTrends(params: TrendsQueryParams) {
  return useQuery<DashboardTrendsResponse, Error>({
    queryKey: dashboardKeys.trends(params),
    queryFn: () => fetchDashboardTrends(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook for department analytics
 *
 * Stale time: 5 minutes
 */
export function useDepartmentAnalytics() {
  return useQuery<DashboardDepartmentsResponse, Error>({
    queryKey: dashboardKeys.departments(),
    queryFn: fetchDepartmentAnalytics,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook for compliance report
 *
 * Stale time: 5 minutes
 */
export function useComplianceReport() {
  return useQuery<DashboardComplianceResponse, Error>({
    queryKey: dashboardKeys.compliance(),
    queryFn: fetchComplianceReport,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook for recent activity with pagination
 *
 * Stale time: 2 minutes (more frequent for activity feed)
 */
export function useRecentActivity(params: Partial<ActivityQueryParams> = {}) {
  return useQuery<DashboardActivityResponse, Error>({
    queryKey: dashboardKeys.activity(params),
    queryFn: () => fetchRecentActivity(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

/**
 * Hook to invalidate all dashboard queries
 *
 * Use after actions that affect dashboard data
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };
}

/**
 * Hook to manually refresh dashboard data
 *
 * Useful for refresh buttons
 */
export function useRefreshDashboard() {
  const invalidate = useInvalidateDashboard();

  return async () => {
    invalidate();
  };
}

/**
 * Hook to get last updated timestamp
 */
export function useLastUpdated() {
  const queryClient = useQueryClient();
  const state = queryClient.getQueryState(dashboardKeys.overview());

  if (!state || !state.dataUpdatedAt) {
    return null;
  }

  return new Date(state.dataUpdatedAt);
}
