'use client';
import { useState, useEffect, useCallback } from 'react';
import { MockDatabase } from '../../data';
/**
 * Mock dashboard hook
 * Fetches comprehensive dashboard data for user overview
 */
export function useDashboard(userId) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                }
                else {
                    setError('Dashboard data not found');
                }
                setLoading(false);
            }, 500);
        }
        catch (err) {
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
