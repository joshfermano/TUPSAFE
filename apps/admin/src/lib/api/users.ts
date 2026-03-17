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

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
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

  // API returns { success: true, data: UserDetail }
  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
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

  const result = await response.json();
  // Stats endpoint returns data directly (not wrapped in apiSuccess)
  return result.data ?? result;
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

  // API returns { success: true, message: '...', data: updatedUser }
  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Delete error type with dependency information
 */
export interface DeleteUserError extends Error {
  dependencies?: {
    pdsSubmissions: number;
    salnSubmissions: number;
    positionsPosted: number;
    jobApplications: number;
  };
  canForceDelete?: boolean;
  details?: string;
}

/**
 * Delete user response
 */
export interface DeleteUserResponse {
  success: boolean;
  message: string;
  deletedApplications?: number;
}

/**
 * Hard delete a user
 * @param userId - User ID to delete
 * @param forceDelete - If true, cascade delete job applications
 */
export async function deleteUser(
  userId: string, 
  forceDelete: boolean = false
): Promise<DeleteUserResponse> {
  const params = new URLSearchParams();
  if (forceDelete) params.append('forceDelete', 'true');
  
  const url = `${API_BASE}/${userId}${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    // Create an error with additional properties
    const error = new Error(result.error || 'Failed to delete user') as DeleteUserError;
    error.dependencies = result.dependencies;
    error.canForceDelete = result.canForceDelete;
    error.details = result.details;
    throw error;
  }

  return result;
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

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}
