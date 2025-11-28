'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  UserPreferences,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
} from '@tupsafe/types';

/**
 * User preferences query key factory
 */
export const userPreferencesKeys = {
  all: ['settings', 'preferences'] as const,
  detail: () => [...userPreferencesKeys.all, 'detail'] as const,
};

/**
 * React Query hook for managing user preferences in the admin portal settings
 *
 * Provides access to the current user's UI and notification preferences
 * with optimistic updates and proper error handling.
 *
 * Features:
 * - Fetches current user's preferences (theme, notifications, language, etc.)
 * - Optimistic updates for immediate UI feedback
 * - Automatic cache invalidation on successful updates
 * - Toast notifications for user feedback
 * - Longer stale time since preferences change less frequently
 *
 * @returns Query result with preferences data and mutation methods
 *
 * @example
 * ```tsx
 * const {
 *   preferences,
 *   isLoading,
 *   updatePreferences,
 *   isUpdating,
 * } = useUserPreferencesQuery();
 *
 * // Update preferences
 * await updatePreferences({
 *   theme: 'dark',
 *   emailNotificationsEnabled: true,
 *   dashboardLayout: 'compact',
 * });
 * ```
 */
export function useUserPreferencesQuery() {
  const queryClient = useQueryClient();

  // Main query for user preferences
  const query = useQuery<UserPreferences, Error>({
    queryKey: userPreferencesKeys.detail(),
    queryFn: async () => {
      const response = await fetch('/api/settings/preferences', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle auth errors gracefully - return null to show loading state
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to fetch preferences: ${response.statusText}`
        );
      }

      const data: UpdatePreferencesResponse = await response.json();

      if (!data.success || !data.preferences) {
        throw new Error(data.error || 'Failed to fetch preferences');
      }

      return data.preferences;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (preferences change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (
        error.message.includes('Session expired') ||
        error.message.includes('401')
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Mutation to update user preferences
   */
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: UpdatePreferencesRequest) => {
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to update preferences: ${response.statusText}`
        );
      }

      const result: UpdatePreferencesResponse = await response.json();

      if (!result.success || !result.preferences) {
        throw new Error(result.error || 'Failed to update preferences');
      }

      return result.preferences;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.all });

      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData<UserPreferences>(
        userPreferencesKeys.detail()
      );

      // Optimistically update preferences
      if (previousPreferences) {
        queryClient.setQueryData<UserPreferences>(
          userPreferencesKeys.detail(),
          {
            ...previousPreferences,
            ...newData,
            updatedAt: new Date(),
          }
        );
      }

      return { previousPreferences };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          userPreferencesKeys.detail(),
          context.previousPreferences
        );
      }

      // Show error toast
      toast.error('Failed to save preferences', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
    onSuccess: (updatedPreferences) => {
      // Update cache with server response
      queryClient.setQueryData(
        userPreferencesKeys.detail(),
        updatedPreferences
      );

      // Show success toast
      toast.success('Preferences saved', {
        description: 'Your preferences have been updated',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: userPreferencesKeys.all });
    },
  });

  return {
    ...query,
    preferences: query.data,
    updatePreferences: updatePreferencesMutation.mutate,
    updatePreferencesAsync: updatePreferencesMutation.mutateAsync,
    isUpdating: updatePreferencesMutation.isPending,
    updateError: updatePreferencesMutation.error,
  };
}

/**
 * Hook to invalidate user preferences cache
 * Use this after actions that might affect preferences
 */
export function useInvalidateUserPreferences() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: userPreferencesKeys.all });
  };
}
