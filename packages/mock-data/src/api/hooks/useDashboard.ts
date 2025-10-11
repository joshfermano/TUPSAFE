'use client';

import { useState, useEffect, useCallback } from 'react';
import { MockDatabase } from '../../data';

export interface DashboardData {
  user: ReturnType<typeof MockDatabase.getUserWithDetails>;
  pds: NonNullable<ReturnType<typeof MockDatabase.getUserDashboard>>['pds'];
  saln: NonNullable<ReturnType<typeof MockDatabase.getUserDashboard>>['saln'];
  notifications: ReturnType<typeof MockDatabase.getNotifications>;
}

export interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Mock dashboard hook
 * Fetches comprehensive dashboard data for user overview
 */
export function useDashboard(userId: string): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      setTimeout(() => {
        const dashboardData = MockDatabase.getUserDashboard(userId);

        if (dashboardData) {
          setData({
            user: dashboardData.user,
            pds: dashboardData.pds,
            saln: dashboardData.saln,
            notifications: MockDatabase.getNotifications(userId),
          });
        } else {
          setError('Dashboard data not found');
        }

        setLoading(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchDashboard();
    }
  }, [userId, fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
}
