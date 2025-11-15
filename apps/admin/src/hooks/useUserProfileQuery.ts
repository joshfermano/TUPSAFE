'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  UserProfile,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '@tupsafe/types';

/**
 * User profile query key factory
 */
export const userProfileKeys = {
  all: ['settings', 'profile'] as const,
  detail: () => [...userProfileKeys.all, 'detail'] as const,
};

/**
 * React Query hook for managing user profile in the admin portal settings
 *
 * Provides access to the current user's profile data and ability to update
 * profile information with optimistic updates and proper error handling.
 *
 * Features:
 * - Fetches current user's profile with department and position details
 * - Optimistic updates for immediate UI feedback
 * - Automatic cache invalidation on successful updates
 * - Toast notifications for user feedback
 * - Audit logging via API
 *
 * @returns Query result with profile data and mutation methods
 *
 * @example
 * ```tsx
 * const {
 *   profile,
 *   isLoading,
 *   updateProfile,
 *   isUpdating,
 * } = useUserProfileQuery();
 *
 * // Update profile
 * await updateProfile({
 *   firstName: 'Juan',
 *   lastName: 'Dela Cruz',
 *   phoneNumber: '09171234567',
 * });
 * ```
 */
export function useUserProfileQuery() {
  const queryClient = useQueryClient();

  // Main query for user profile
  const query = useQuery<UserProfile, Error>({
    queryKey: userProfileKeys.detail(),
    queryFn: async () => {
      const response = await fetch('/api/settings/profile');

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch profile: ${response.statusText}`
        );
      }

      const data: UpdateProfileResponse = await response.json();

      if (!data.success || !data.profile) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      return data.profile;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Mutation to update user profile
   */
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to update profile: ${response.statusText}`
        );
      }

      const result: UpdateProfileResponse = await response.json();

      if (!result.success || !result.profile) {
        throw new Error(result.error || 'Failed to update profile');
      }

      return result.profile;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userProfileKeys.all });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<UserProfile>(
        userProfileKeys.detail()
      );

      // Optimistically update profile
      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(userProfileKeys.detail(), {
          ...previousProfile,
          firstName: newData.firstName,
          lastName: newData.lastName,
          middleName: newData.middleName || null,
          phoneNumber: newData.phoneNumber || null,
          updatedAt: new Date(),
        });
      }

      return { previousProfile };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          userProfileKeys.detail(),
          context.previousProfile
        );
      }

      // Show error toast
      toast.error('Failed to update profile', {
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
    onSuccess: (updatedProfile) => {
      // Update cache with server response
      queryClient.setQueryData(userProfileKeys.detail(), updatedProfile);

      // Show success toast
      toast.success('Profile updated successfully', {
        description: 'Your profile information has been saved',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: userProfileKeys.all });
    },
  });

  return {
    ...query,
    profile: query.data,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
  };
}

/**
 * Hook to invalidate user profile cache
 * Use this after actions that might affect the profile
 */
export function useInvalidateUserProfile() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: userProfileKeys.all });
  };
}
