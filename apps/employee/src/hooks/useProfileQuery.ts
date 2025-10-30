'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile as useProfileMock, type UseProfileReturn } from '@tupsafe/mock-data/api';
import type { Profile } from '@tupsafe/mock-data';

/**
 * Profile query key factory
 */
export const profileKeys = {
  all: ['profile'] as const,
  user: (userId: string) => [...profileKeys.all, userId] as const,
};

/**
 * React Query wrapper for useProfile hook
 *
 * @param userId - User ID to fetch profile for
 * @returns Query result with profile data and mutation methods
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useProfileQuery('user-123');
 * if (data) {
 *   console.log(data.profile, data.department, data.position);
 * }
 * ```
 */
export function useProfileQuery(userId: string) {
  const queryClient = useQueryClient();

  // Use the mock hook to get data fetching logic
  const mockHook = useProfileMock(userId);

  // Wrap in React Query with automatic caching and refetching
  const query = useQuery({
    queryKey: profileKeys.user(userId),
    queryFn: async () => {
      // Wait for mock data to load
      if (mockHook.loading) {
        return new Promise<UseProfileReturn>((resolve) => {
          const checkInterval = setInterval(() => {
            if (!mockHook.loading) {
              clearInterval(checkInterval);
              resolve({
                profile: mockHook.profile,
                department: mockHook.department,
                position: mockHook.position,
                loading: false,
                error: mockHook.error,
                refetch: mockHook.refetch,
              });
            }
          }, 50);
        });
      }

      if (mockHook.error) {
        throw new Error(mockHook.error);
      }

      return {
        profile: mockHook.profile,
        department: mockHook.department,
        position: mockHook.position,
        loading: false,
        error: null,
        refetch: mockHook.refetch,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile data doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Mutation to update profile
   */
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { ...mockHook.profile, ...data } as Profile;
    },
    onMutate: async (newData: Partial<Profile>) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.user(userId) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(profileKeys.user(userId));

      // Optimistically update
      queryClient.setQueryData(profileKeys.user(userId), (old: UseProfileReturn | undefined) => ({
        ...old,
        profile: { ...old?.profile, ...newData },
      }));

      return { previousData };
    },
    onError: (_err: Error, _newData: Partial<Profile>, context?: { previousData?: unknown }) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(profileKeys.user(userId), context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
    },
  });

  /**
   * Prefetch related data
   */
  const prefetchProfile = (prefetchUserId: string) => {
    return queryClient.prefetchQuery({
      queryKey: profileKeys.user(prefetchUserId),
      queryFn: async () => mockHook,
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    ...query,
    profile: query.data?.profile ?? null,
    department: query.data?.department ?? null,
    position: query.data?.position ?? null,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
    prefetchProfile,
  };
}

/**
 * Hook to invalidate profile cache
 */
export function useInvalidateProfile() {
  const queryClient = useQueryClient();

  return (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    }
  };
}
