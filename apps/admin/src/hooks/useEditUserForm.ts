/**
 * useEditUserForm Hook - Simple CRUD
 *
 * Post-co_admin consolidation: a single `role` field drives role selection.
 * Role changes require a justification (enforced here and in the confirmation
 * dialog). The payload continues to hit PATCH /api/users/[id]; a follow-up PR
 * will introduce POST /api/users/[id]/role for role-only edits.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, UseFormReturn, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UserDetail, UserRole } from '@tupsafe/types';
import { ROLE_HIERARCHY } from '@tupsafe/types';

import {
  editUserFormSchema,
  EditUserFormValues,
  defaultEditUserFormValues,
} from '@/lib/schemas/edit-user';
import { useUsersQuery } from './useUsersQuery';

// =============================================================================
// Types
// =============================================================================

interface UseEditUserFormOptions {
  userId: string;
}

interface UseEditUserFormResult {
  form: UseFormReturn<EditUserFormValues>;
  user: UserDetail | null | undefined;
  userEmail: string | undefined;
  isLoading: boolean;
  isEmailLoading: boolean;
  error: Error | null;
  isUpdating: boolean;
  formInitialized: boolean;
  /** The role stored in the DB before any edits — used for role-change diff. */
  originalRole: UserRole;
  handleSubmit: (values: EditUserFormValues) => Promise<void>;
  resetForm: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Returns true when `to` is strictly higher in the role hierarchy than `from`.
 * Used to drive the confirmation dialog's "elevation" UX (type-to-confirm).
 */
export function computeIsElevation(from: UserRole, to: UserRole): boolean {
  return ROLE_HIERARCHY[to] > ROLE_HIERARCHY[from];
}

const MIN_ROLE_CHANGE_REASON = 20;

function coerceStoredRole(role: string | null | undefined): UserRole {
  switch (role) {
    case 'superadmin':
    case 'admin':
    case 'hr':
    case 'employee':
      return role;
    default:
      return 'employee';
  }
}

// =============================================================================
// Email Query Hook
// =============================================================================

function useUserEmail(userId: string | null) {
  return useQuery({
    queryKey: ['user-email', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      const res = await fetch(`/api/users/${userId}/email`);
      if (!res.ok) throw new Error('Failed to fetch email');
      return res.json() as Promise<{ email: string; emailVerified: boolean }>;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// =============================================================================
// Main Hook
// =============================================================================

export function useEditUserForm({
  userId,
}: UseEditUserFormOptions): UseEditUserFormResult {
  const router = useRouter();
  const [formInitialized, setFormInitialized] = useState(false);
  const [originalRole, setOriginalRole] = useState<UserRole>('employee');

  // Data fetching
  const { useUserDetail, updateUserAsync, isUpdating } = useUsersQuery();
  const { data: user, isLoading, error } = useUserDetail(userId);
  const { data: emailData, isLoading: isEmailLoading } = useUserEmail(userId);

  // Form setup
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema) as Resolver<EditUserFormValues>,
    defaultValues: defaultEditUserFormValues,
    mode: 'onChange',
  });

  // ==========================================================================
  // Form Initialization - Initialize IMMEDIATELY when user data is available
  // ==========================================================================

  useEffect(() => {
    if (!user || formInitialized) return;

    const storedRole = coerceStoredRole(user.role);
    setOriginalRole(storedRole);

    // Resolve parent college for the department — prefer explicit collegeId,
    // then department.parentCollegeId, then fall back to the departmentId itself
    // (top-level offices have no parent college).
    let collegeId = 'none';
    if (user.collegeId) {
      collegeId = user.collegeId;
    } else if (user.department?.parentCollegeId) {
      collegeId = user.department.parentCollegeId;
    } else if (user.departmentId) {
      collegeId = user.departmentId;
    }

    form.setValue('firstName', user.firstName || '', { shouldValidate: false });
    form.setValue('lastName', user.lastName || '', { shouldValidate: false });
    form.setValue('middleName', user.middleName || '', { shouldValidate: false });
    form.setValue('suffix', 'none', { shouldValidate: false });
    form.setValue('email', '', { shouldValidate: false });
    form.setValue('role', storedRole, { shouldValidate: false });
    form.setValue('roleChangeReason', undefined, { shouldValidate: false });
    form.setValue('collegeId', collegeId, { shouldValidate: false });
    form.setValue('departmentId', user.departmentId || 'none', { shouldValidate: false });
    form.setValue('positionId', user.positionId || 'none', { shouldValidate: false });
    form.setValue('salaryGrade', user.salaryGrade ?? null, { shouldValidate: false });
    form.setValue('positionTitle', user.positionTitle || '', { shouldValidate: false });
    form.setValue('isActive', user.isActive ?? true, { shouldValidate: false });

    setFormInitialized(true);
  }, [user, form, formInitialized]);

  // Update email when loaded separately (if form already initialized)
  useEffect(() => {
    if (emailData?.email && formInitialized) {
      const currentEmail = form.getValues('email');
      if (!currentEmail) {
        form.setValue('email', emailData.email, { shouldDirty: false });
      }
    }
  }, [emailData, form, formInitialized]);

  // ==========================================================================
  // Submit Handler - PATCH with all fields
  // ==========================================================================

  const handleSubmit = useCallback(
    async (values: EditUserFormValues) => {
      const nextRole = values.role;
      const roleChanged = nextRole !== originalRole;

      // Defence-in-depth: the confirmation dialog also enforces this, but if
      // someone bypasses the dialog (keyboard submit, etc.) we still refuse.
      if (roleChanged) {
        const trimmed = (values.roleChangeReason ?? '').trim();
        if (trimmed.length < MIN_ROLE_CHANGE_REASON) {
          toast.error('Role change reason required', {
            description: `Please provide a justification of at least ${MIN_ROLE_CHANGE_REASON} characters.`,
          });
          return;
        }
      }

      const payload: Record<string, unknown> = {
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || null,
        isActive: values.isActive,
        role: nextRole,
      };

      if (roleChanged && values.roleChangeReason) {
        // Backend currently ignores this field — PR 2 will wire it up to audit logs.
        payload.roleChangeReason = values.roleChangeReason.trim();
      }

      // Department — fall back to collegeId for top-level offices
      if (values.departmentId && values.departmentId !== 'none') {
        payload.departmentId = values.departmentId;
      } else if (values.collegeId && values.collegeId !== 'none') {
        payload.departmentId = values.collegeId;
      } else {
        payload.departmentId = null;
      }

      payload.positionId =
        values.positionId && values.positionId !== 'none' ? values.positionId : null;
      payload.salaryGrade = values.salaryGrade ?? null;
      payload.positionTitle = values.positionTitle || null;

      try {
        await updateUserAsync({ userId, data: payload });

        if (roleChanged) {
          setOriginalRole(nextRole);
        }

        toast.success('User updated successfully', {
          description: `${values.firstName} ${values.lastName}'s information has been updated.`,
        });

        router.push(`/dashboard/users/view/${userId}`);
      } catch (err) {
        console.error('[useEditUserForm] Error:', err);
        toast.error('Failed to update user', {
          description:
            err instanceof Error ? err.message : 'An unexpected error occurred.',
        });
      }
    },
    [updateUserAsync, userId, router, originalRole]
  );

  // ==========================================================================
  // Reset Handler
  // ==========================================================================

  const resetForm = useCallback(() => {
    setFormInitialized(false);
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================

  return useMemo(
    () => ({
      form,
      user,
      userEmail: emailData?.email,
      isLoading,
      isEmailLoading,
      error: error as Error | null,
      isUpdating,
      formInitialized,
      originalRole,
      handleSubmit,
      resetForm,
    }),
    [
      form,
      user,
      emailData?.email,
      isLoading,
      isEmailLoading,
      error,
      isUpdating,
      formInitialized,
      originalRole,
      handleSubmit,
      resetForm,
    ]
  );
}

export { useUserEmail };
