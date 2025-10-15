'use client';
import { useState, useEffect, useCallback } from 'react';
import { MockDatabase } from '../../data';
/**
 * Mock profile hook
 * Fetches user profile with department and position details
 */
export function useProfile(userId) {
    const [profile, setProfile] = useState(null);
    const [department, setDepartment] = useState(null);
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchProfile = useCallback(() => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API delay
            setTimeout(() => {
                const userDetails = MockDatabase.getUserWithDetails(userId);
                if (userDetails) {
                    setProfile(userDetails.profile);
                    setDepartment(userDetails.department || null);
                    setPosition(userDetails.position || null);
                }
                else {
                    setError('Profile not found');
                }
                setLoading(false);
            }, 300);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch profile');
            setLoading(false);
        }
    }, [userId]);
    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId, fetchProfile]);
    return {
        profile,
        department,
        position,
        loading,
        error,
        refetch: fetchProfile,
    };
}
