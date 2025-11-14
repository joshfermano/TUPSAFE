/**
 * User Management API Client
 *
 * Provides type-safe API client functions for user management operations.
 * All functions use fetch with proper error handling and type safety.
 */

import type {
  UserListQuery,
  UserListResponse,
  UserDetail,
  UserStatsResponse,
  UpdateUserData,
  PasswordResetData,
  ApiError,
} from '@tupsafe/types';

const API_BASE = '/api/users';

/**
 * Fetch paginated list of users with filters
 */
export async function fetchUsers(
  params: Partial<UserListQuery> = {}
): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const url = `${API_BASE}?${searchParams.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to fetch users');
  }

  return response.json();
}

/**
 * Fetch detailed information about a specific user
 */
export async function fetchUserDetails(userId: string): Promise<UserDetail> {
  const response = await fetch(`${API_BASE}/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to fetch user details');
  }

  return response.json();
}

/**
 * Fetch user statistics
 */
export async function fetchUserStats(): Promise<UserStatsResponse> {
  const response = await fetch(`${API_BASE}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to fetch user statistics');
  }

  return response.json();
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  data: UpdateUserData
): Promise<UserDetail> {
  const response = await fetch(`${API_BASE}/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }

  return response.json();
}

/**
 * Soft delete a user
 */
export async function deleteUser(userId: string): Promise<{ success: true }> {
  const response = await fetch(`${API_BASE}/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to delete user');
  }

  return response.json();
}

/**
 * Reset user password
 */
export async function resetUserPassword(
  userId: string,
  data: PasswordResetData
): Promise<{ temporaryPassword: string }> {
  const response = await fetch(`${API_BASE}/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to reset password');
  }

  return response.json();
}
