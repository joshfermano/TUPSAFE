/**
 * User Management React Query Hooks
 *
 * Provides type-safe React Query hooks for all user management operations.
 * Includes automatic caching, optimistic updates, and error handling.
 */

'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  UserListQuery,
  UserListResponse,
  UserDetail,
  UserStatsResponse,
  UpdateUserData,
  PasswordResetData,
} from '@tupsafe/types';
import {
  fetchUsers,
  fetchUserDetails,
  fetchUserStats,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '@/lib/api/users';

/**
 * Query key factory for user-related queries
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: Partial<UserListQuery>) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (userId: string) => [...userKeys.details(), userId] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch paginated list of users
 */
export function useUsers(params: Partial<UserListQuery> = {}) {
  return useQuery<UserListResponse, Error>({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData, // Keep previous data while fetching new
  });
}

/**
 * Hook to fetch user details
 */
export function useUserDetails(userId: string | null) {
  return useQuery<UserDetail, Error>({
    queryKey: userKeys.detail(userId || ''),
    queryFn: () => fetchUserDetails(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch user statistics
 */
export function useUserStats() {
  return useQuery<UserStatsResponse, Error>({
    queryKey: userKeys.stats(),
    queryFn: async () => {
      console.log('[useUserStats] Fetching stats...');
      try {
        const stats = await fetchUserStats();
        console.log('[useUserStats] Stats loaded:', stats);
        return stats;
      } catch (error) {
        console.error('[useUserStats] Error fetching stats:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1, // Only retry once
  });
}

/**
 * Hook to update user information
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      updateUser(userId, data),
    onMutate: async ({ userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.details() });
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData<UserDetail>(userKeys.detail(userId));

      return { previousUser };
    },
    onSuccess: (updatedUser, { userId }) => {
      // Update detail cache
      queryClient.setQueryData(userKeys.detail(userId), updatedUser);

      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });

      toast.success('User updated successfully', {
        description: `${updatedUser.firstName} ${updatedUser.lastName} has been updated.`,
      });
    },
    onError: (error, { userId }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(userId), context.previousUser);
      }

      toast.error('Failed to update user', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to delete a user (soft delete)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, _userId) => {
      // Invalidate all user queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });

      toast.success('User deleted successfully', {
        description: 'The user account has been deactivated.',
      });
    },
    onError: (error) => {
      toast.error('Failed to delete user', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to reset user password
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: PasswordResetData }) =>
      resetUserPassword(userId, data),
    onSuccess: (response) => {
      if (response.temporaryPassword) {
        toast.success('Password reset successfully', {
          description: 'A new temporary password has been generated.',
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to reset password', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to toggle user active status
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateUser(userId, { isActive: !isActive }),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });

      const action = updatedUser.isActive ? 'activated' : 'deactivated';
      toast.success(`User ${action}`, {
        description: `${updatedUser.firstName} ${updatedUser.lastName} has been ${action}.`,
      });
    },
    onError: (error) => {
      toast.error('Failed to update user status', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to sync user metadata with database profile
 */
export function useSyncMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/sync-metadata`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync metadata');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all user queries to refresh data
      queryClient.invalidateQueries({ queryKey: userKeys.all });

      toast.success('Metadata synced successfully', {
        description: 'User authentication data has been synchronized with database.',
      });
    },
    onError: (error) => {
      toast.error('Failed to sync metadata', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
