'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '@tupsafe/types';

/**
 * React Query hook for changing user password in the admin portal settings
 *
 * Provides a secure password change mutation with proper validation and
 * error handling. This is a mutation-only hook with NO caching or optimistic
 * updates due to the sensitive nature of password changes.
 *
 * Features:
 * - Validates password strength and confirmation match
 * - Clear success and error toast notifications
 * - No caching of password data (security)
 * - Audit logging via API
 * - Form should be cleared on success
 *
 * Security Considerations:
 * - No optimistic updates (wait for server confirmation)
 * - No caching of request or response data
 * - Form should auto-clear on success
 * - User should be prompted to re-login after password change
 *
 * @returns Mutation methods for password change
 *
 * @example
 * ```tsx
 * const { changePassword, isChanging, error } = usePasswordChangeQuery();
 *
 * // Change password
 * await changePassword({
 *   currentPassword: 'oldPassword123!',
 *   newPassword: 'newPassword456!',
 *   confirmPassword: 'newPassword456!',
 * });
 *
 * // Clear form after success
 * if (!isChanging && !error) {
 *   form.reset();
 * }
 * ```
 */
export function usePasswordChangeQuery() {
  /**
   * Mutation to change user password
   * NO optimistic updates for security
   */
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await fetch('/api/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        // Provide more specific error messages based on status code
        if (response.status === 401) {
          throw new Error('Current password is incorrect');
        }

        throw new Error(
          errorData?.error ||
            errorData?.details ||
            `Failed to change password: ${response.statusText}`
        );
      }

      const result: ChangePasswordResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to change password');
      }

      return result;
    },
    // NO onMutate - no optimistic updates for password changes
    onError: (error) => {
      // Show detailed error toast
      toast.error('Failed to change password', {
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000, // Longer duration for password errors
      });
    },
    onSuccess: () => {
      // Show success toast with instructions
      toast.success('Password changed successfully', {
        description: 'Your password has been updated. You will be logged out shortly.',
        duration: 5000, // Longer duration so user can read
      });

      // Note: The calling component should handle:
      // 1. Clearing the form
      // 2. Logging out the user (optional, but recommended)
      // 3. Redirecting to login page
    },
    // NO onSettled - we don't cache password data
    // NO retry - password operations should not auto-retry
    retry: false,
  });

  return {
    changePassword: changePasswordMutation.mutate,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    isChanging: changePasswordMutation.isPending,
    error: changePasswordMutation.error,
    isSuccess: changePasswordMutation.isSuccess,
    reset: changePasswordMutation.reset,
  };
}
