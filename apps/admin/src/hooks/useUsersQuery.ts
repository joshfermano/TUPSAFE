'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UserListResponse,
  UpdateUserData,
  CreateUserRequest,
  CreateUserResponse,
} from '@tupsafe/types';

/**
 * Users query key factory
 */
export const usersKeys = {
  all: ['users'] as const,
  list: (filters: UsersFilters) => [...usersKeys.all, 'list', filters] as const,
  detail: (userId: string) => [...usersKeys.all, 'detail', userId] as const,
  stats: () => [...usersKeys.all, 'stats'] as const,
};

/**
 * Filters for user queries (aligned with API query params)
 */
export interface UsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  userType?: 'employee' | 'applicant';
  accountStatus?: 'pending' | 'active' | 'suspended' | 'rejected';
  isActive?: boolean;
  departmentId?: string;
  employmentCategory?: 'faculty' | 'administrative' | 'contractual' | 'not_applicable';
  sortBy?: 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'role';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create user data for POST /api/auth/create-user
 * Re-exported from @tupsafe/types for convenience
 */
export type { CreateUserRequest as CreateUserData } from '@tupsafe/types';

/**
 * Password reset data for POST /api/users/[id]/reset-password
 */
export interface PasswordResetData {
  sendEmail?: boolean;
  temporaryPassword?: string;
}

/**
 * React Query hook for managing users in the admin portal
 *
 * Supports filtering by role, department, search query, and active status.
 * Includes mutations for creating, updating, and deleting users with optimistic updates.
 *
 * @param filters - Optional filters for the user query
 * @returns Query result with users and mutation methods
 *
 * @example
 * ```tsx
 * const {
 *   users,
 *   isLoading,
 *   pagination,
 *   createUser,
 *   updateUser,
 *   deleteUser,
 * } = useUsersQuery({ role: 'employee', isActive: true });
 *
 * // Create a new user
 * await createUser({
 *   email: 'new.user@tup.edu.ph',
 *   firstName: 'Juan',
 *   lastName: 'Dela Cruz',
 *   role: 'employee',
 * });
 * ```
 */
export function useUsersQuery(filters: UsersFilters = {}) {
  const queryClient = useQueryClient();

  // Main query for users list
  const query = useQuery<UserListResponse, Error>({
    queryKey: usersKeys.list(filters),
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.userType) params.append('userType', filters.userType);
      if (filters.accountStatus) params.append('accountStatus', filters.accountStatus);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.employmentCategory) params.append('employmentCategory', filters.employmentCategory);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/users?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch users: ${response.statusText}`
        );
      }

      const data: UserListResponse = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Query for a single user's detailed information
   */
  const useUserDetail = (userId: string | null) => {
    return useQuery({
      queryKey: usersKeys.detail(userId || ''),
      queryFn: async () => {
        if (!userId) return null;

        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Failed to fetch user: ${response.statusText}`
          );
        }

        const result = await response.json();
        return result.data;
      },
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
      retry: 2,
    });
  };

  /**
   * Mutation to create a new user via POST /api/auth/create-user
   */
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserRequest): Promise<CreateUserResponse['data']> => {
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to create user: ${response.statusText}`
        );
      }

      const result: CreateUserResponse = await response.json();
      return result.data;
    },
    onSuccess: () => {
      // Invalidate all user queries to refetch with new user
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Create user error:', error);
    },
  });

  /**
   * Mutation to update an existing user via PATCH /api/users/[id]
   */
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserData }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to update user: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result.data;
    },
    onMutate: async ({ userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: usersKeys.all });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<UserListResponse>(
        usersKeys.list(filters)
      );

      // Optimistically update
      queryClient.setQueryData<UserListResponse>(
        usersKeys.list(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((user) =>
              user.id === userId
                ? { ...user, updatedAt: new Date() }
                : user
            ),
          };
        }
      );

      return { previousUsers };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(usersKeys.list(filters), context.previousUsers);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  /**
   * Mutation to soft delete a user via DELETE /api/users/[id]
   * Sets isActive=false and accountStatus='rejected'
   */
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to delete user: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result.data;
    },
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: usersKeys.all });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<UserListResponse>(
        usersKeys.list(filters)
      );

      // Optimistically remove from cache (or mark as inactive)
      queryClient.setQueryData<UserListResponse>(
        usersKeys.list(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((user) =>
              user.id === userId
                ? { ...user, isActive: false, accountStatus: 'rejected' as const }
                : user
            ),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        }
      );

      return { previousUsers };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(usersKeys.list(filters), context.previousUsers);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  /**
   * Mutation to toggle user active status
   * Uses the update mutation but specifically for isActive field
   */
  const toggleUserStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First fetch current user to get their isActive status
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user status');
      }
      const result = await response.json();
      const currentStatus = result.data.isActive;

      // Update with opposite status
      const updateResponse = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to toggle user status: ${updateResponse.statusText}`
        );
      }

      const updateResult = await updateResponse.json();
      return updateResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  /**
   * Mutation to reset user password via POST /api/users/[id]/reset-password
   */
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: PasswordResetData }) => {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to reset password: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      // Invalidate user detail query to reflect temporary password flag
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  return {
    ...query,
    users: query.data?.users ?? [],
    pagination: query.data?.pagination,
    filterOptions: query.data?.filters,
    useUserDetail,
    createUser: createUserMutation.mutate,
    createUserAsync: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    createError: createUserMutation.error,
    updateUser: updateUserMutation.mutate,
    updateUserAsync: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
    updateError: updateUserMutation.error,
    deleteUser: deleteUserMutation.mutate,
    deleteUserAsync: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,
    deleteError: deleteUserMutation.error,
    toggleUserStatus: toggleUserStatusMutation.mutate,
    toggleUserStatusAsync: toggleUserStatusMutation.mutateAsync,
    isTogglingStatus: toggleUserStatusMutation.isPending,
    toggleStatusError: toggleUserStatusMutation.error,
    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,
  };
}

/**
 * Hook to invalidate users cache
 */
export function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: usersKeys.all });
  };
}
