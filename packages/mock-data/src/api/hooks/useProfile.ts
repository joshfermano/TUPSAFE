'use client';

import { useState, useEffect, useCallback } from 'react';
import { MockDatabase, type Profile, type Department, type Position } from '../../data';

export interface ProfileWithDetails {
  profile: Profile;
  department: Department | null;
  position: Position | null;
}

export interface UseProfileReturn {
  profile: Profile | null;
  department: Department | null;
  position: Position | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Mock profile hook
 * Fetches user profile with department and position details
 */
export function useProfile(userId: string): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        } else {
          setError('Profile not found');
        }

        setLoading(false);
      }, 300);
    } catch (err) {
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
