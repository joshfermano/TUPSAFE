'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDashboard as useDashboardMock, type UseDashboardReturn } from '@tupsafe/mock-data/api';
import { profileKeys } from './useProfileQuery';
import { pdsKeys } from './usePdsQuery';
import { salnKeys } from './useSalnQuery';

/**
 * Dashboard query key factory
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  user: (userId: string) => [...dashboardKeys.all, userId] as const,
};

/**
 * React Query wrapper for useDashboard hook
 *
 * @param userId - User ID to fetch dashboard data for
 * @returns Query result with comprehensive dashboard data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, prefetchRelatedData } = useDashboardQuery('user-123');
 *
 * // Prefetch related data when hovering over navigation
 * <button onMouseEnter={() => prefetchRelatedData()}>
 *   Dashboard
 * </button>
 * ```
 */
export function useDashboardQuery(userId: string) {
  const queryClient = useQueryClient();

  // Use the mock hook to get data fetching logic
  const mockHook = useDashboardMock(userId);

  // Wrap in React Query with automatic caching and refetching
  const query = useQuery({
    queryKey: dashboardKeys.user(userId),
    queryFn: async () => {
      // Wait for mock data to load
      if (mockHook.loading) {
        return new Promise<UseDashboardReturn>((resolve) => {
          const checkInterval = setInterval(() => {
            if (!mockHook.loading) {
              clearInterval(checkInterval);
              resolve(mockHook);
            }
          }, 50);
        });
      }

      if (mockHook.error) {
        throw new Error(mockHook.error);
      }

      return mockHook;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute - dashboard data should be fresh
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection time
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // Refetch when user returns to the app
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
  });

  /**
   * Prefetch related data (profile, PDS, SALN)
   * Useful for improving perceived performance when navigating
   */
  const prefetchRelatedData = async () => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: profileKeys.user(userId),
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: pdsKeys.user(userId),
        staleTime: 3 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: salnKeys.user(userId),
        staleTime: 3 * 60 * 1000,
      }),
    ]);
  };

  /**
   * Get notifications with filtering
   */
  const getUnreadNotifications = () => {
    return query.data?.data?.notifications.filter((n: { isRead?: boolean }) => !n.isRead) ?? [];
  };

  /**
   * Get notification count by type
   */
  const getNotificationCountByType = (type: 'pds' | 'saln' | 'system') => {
    return query.data?.data?.notifications.filter((n: { type?: string }) => n.type === type).length ?? 0;
  };

  /**
   * Get recent activities summary
   */
  const getRecentActivitiesSummary = () => {
    const data = query.data?.data;
    if (!data) return null;

    return {
      pdsStatus: data.pds?.latest?.status ?? 'none',
      pdsUpdatedAt: data.pds?.latest?.updatedAt ?? null,
      salnStatus: data.saln?.latest?.status ?? 'none',
      salnUpdatedAt: data.saln?.latest?.updatedAt ?? null,
      salnYear: data.saln?.latest?.year ?? null,
      unreadNotifications: getUnreadNotifications().length,
    };
  };

  return {
    ...query,
    dashboardData: query.data?.data ?? null,
    user: query.data?.data?.user ?? null,
    pds: query.data?.data?.pds ?? null,
    saln: query.data?.data?.saln ?? null,
    notifications: query.data?.data?.notifications ?? [],
    prefetchRelatedData,
    getUnreadNotifications,
    getNotificationCountByType,
    getRecentActivitiesSummary,
  };
}

/**
 * Hook to invalidate dashboard cache
 * Also invalidates related caches (profile, PDS, SALN)
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return (userId?: string, options?: { includeRelated?: boolean }) => {
    const { includeRelated = false } = options ?? {};

    if (userId) {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.user(userId) });

      if (includeRelated) {
        // Invalidate related data
        queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
        queryClient.invalidateQueries({ queryKey: pdsKeys.user(userId) });
        queryClient.invalidateQueries({ queryKey: salnKeys.user(userId) });
      }
    } else {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });

      if (includeRelated) {
        queryClient.invalidateQueries({ queryKey: profileKeys.all });
        queryClient.invalidateQueries({ queryKey: pdsKeys.all });
        queryClient.invalidateQueries({ queryKey: salnKeys.all });
      }
    }
  };
}

/**
 * Hook to manually refresh all dashboard-related data
 * Useful for pull-to-refresh or manual refresh buttons
 */
export function useRefreshDashboard(userId: string) {
  const invalidateDashboard = useInvalidateDashboard();

  return async () => {
    invalidateDashboard(userId, { includeRelated: true });
  };
}
