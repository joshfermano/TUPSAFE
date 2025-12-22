/**
 * Security Management Hooks
 *
 * React Query hooks for managing account security including
 * password changes and authentication settings.
 *
 * @module hooks/useSecurity
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Change user password
 * Validates current password and updates to new password
 */
async function changePassword(
  data: PasswordChangeData
): Promise<PasswordChangeResponse> {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change password');
  }

  return response.json();
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to change user password
 *
 * Validates current password and updates to new password.
 * Shows toast notifications on success or error.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const changePasswordMutation = useChangePassword();
 * changePasswordMutation.mutate({
 *   currentPassword: 'old123',
 *   newPassword: 'new456',
 *   confirmPassword: 'new456'
 * });
 * ```
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast.success('Password changed successfully', {
        description: data.message || 'Your password has been updated.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to change password', {
        description:
          error.message || 'An error occurred while changing your password.',
      });
    },
  });
}
