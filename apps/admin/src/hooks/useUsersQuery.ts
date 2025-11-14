'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MockDatabase, type Profile } from '@tupsafe/mock-data';
import {
  searchUsers,
  filterUsersByRole,
  filterUsersByDepartment,
  filterUsersByActiveStatus,
} from '@/lib/mock-helpers';

/**
 * Users query key factory
 */
export const usersKeys = {
  all: ['users'] as const,
  list: (filters: UsersFilters) => [...usersKeys.all, 'list', filters] as const,
  detail: (userId: string) => [...usersKeys.all, 'detail', userId] as const,
};

/**
 * Filters for user queries
 */
export interface UsersFilters {
  role?: string | null;
  department?: string | null;
  query?: string;
  activeOnly?: boolean;
}

/**
 * User with related data
 */
export interface UserWithDetails {
  profile: Profile;
  department: ReturnType<typeof MockDatabase.getDepartment> | null;
  position: ReturnType<typeof MockDatabase.getPosition> | null;
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
 *   createUser,
 *   updateUser,
 *   deleteUser,
 * } = useUsersQuery({ role: 'employee', activeOnly: true });
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
  const query = useQuery<UserWithDetails[], Error>({
    queryKey: usersKeys.list(filters),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      let users = MockDatabase.profiles;

      // Apply search filter
      if (filters.query) {
        const searchResults = searchUsers(filters.query);
        return searchResults;
      }

      // Apply role filter
      if (filters.role) {
        users = filterUsersByRole(users, filters.role);
      }

      // Apply department filter
      if (filters.department) {
        users = filterUsersByDepartment(users, filters.department);
      }

      // Apply active status filter
      if (filters.activeOnly) {
        users = filterUsersByActiveStatus(users, filters.activeOnly);
      }

      // Map to include related data
      return users.map((profile) => ({
        profile,
        department: profile.departmentId ? MockDatabase.getDepartment(profile.departmentId) : null,
        position: profile.positionId ? MockDatabase.getPosition(profile.positionId) : null,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Query for a single user's details
   */
  const useUserDetail = (userId: string | null) => {
    return useQuery({
      queryKey: usersKeys.detail(userId || ''),
      queryFn: async () => {
        if (!userId) return null;

        await new Promise((resolve) => setTimeout(resolve, 100));

        const profile = MockDatabase.getProfile(userId);
        if (!profile) return null;

        return {
          profile,
          department: profile.departmentId ? MockDatabase.getDepartment(profile.departmentId) : null,
          position: profile.positionId ? MockDatabase.getPosition(profile.positionId) : null,
        };
      },
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Mutation to create a new user
   */
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<Profile>) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newUser: Profile = {
        id: crypto.randomUUID(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        middleName: userData.middleName || null,
        employeeId: userData.employeeId || `EMP-${Date.now()}`,
        userType: 'employee',
        role: userData.role || 'employee',
        departmentId: userData.departmentId || null,
        positionId: userData.positionId || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to mock database
      MockDatabase.profiles.push(newUser);

      return {
        profile: newUser,
        department: newUser.departmentId ? MockDatabase.getDepartment(newUser.departmentId) : null,
        position: newUser.positionId ? MockDatabase.getPosition(newUser.positionId) : null,
      };
    },
    onSuccess: (newUser) => {
      // Add to cache optimistically
      queryClient.setQueryData<UserWithDetails[]>(
        usersKeys.list(filters),
        (old = []) => [newUser, ...old]
      );
    },
    onSettled: () => {
      // Invalidate all user queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  /**
   * Mutation to update an existing user
   */
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<Profile> }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const userIndex = MockDatabase.profiles.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const updatedUser: Profile = {
        ...MockDatabase.profiles[userIndex],
        ...data,
        updatedAt: new Date(),
      };

      MockDatabase.profiles[userIndex] = updatedUser;

      return {
        profile: updatedUser,
        department: updatedUser.departmentId ? MockDatabase.getDepartment(updatedUser.departmentId) : null,
        position: updatedUser.positionId ? MockDatabase.getPosition(updatedUser.positionId) : null,
      };
    },
    onMutate: async ({ userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: usersKeys.all });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<UserWithDetails[]>(usersKeys.list(filters));

      // Optimistically update
      queryClient.setQueryData<UserWithDetails[]>(
        usersKeys.list(filters),
        (old = []) => old.map((user) =>
          user.profile.id === userId
            ? { ...user, profile: { ...user.profile, updatedAt: new Date() } }
            : user
        )
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
   * Mutation to delete a user
   */
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const userIndex = MockDatabase.profiles.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // In production, this might be a soft delete
      MockDatabase.profiles.splice(userIndex, 1);

      return userId;
    },
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: usersKeys.all });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<UserWithDetails[]>(usersKeys.list(filters));

      // Optimistically remove from cache
      queryClient.setQueryData<UserWithDetails[]>(
        usersKeys.list(filters),
        (old = []) => old.filter((user) => user.profile.id !== userId)
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
   * Mutation to toggle user active status
   */
  const toggleUserStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      const userIndex = MockDatabase.profiles.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const updatedUser: Profile = {
        ...MockDatabase.profiles[userIndex],
        isActive: !MockDatabase.profiles[userIndex].isActive,
        updatedAt: new Date(),
      };

      MockDatabase.profiles[userIndex] = updatedUser;

      return {
        profile: updatedUser,
        department: updatedUser.departmentId ? MockDatabase.getDepartment(updatedUser.departmentId) : null,
        position: updatedUser.positionId ? MockDatabase.getPosition(updatedUser.positionId) : null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  return {
    ...query,
    users: query.data ?? [],
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
