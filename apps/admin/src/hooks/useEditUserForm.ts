/**
 * useEditUserForm Hook - Simple CRUD
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UserDetail } from '@tupsafe/types';

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
  handleSubmit: (values: EditUserFormValues) => Promise<void>;
  resetForm: () => void;
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
// Helper: Map stored role to base role for form
// =============================================================================

function mapRoleToBaseRole(role: string | null | undefined): 'employee' | 'hr' | 'supervisor' | 'auditor' {
  if (!role) return 'employee';

  switch (role) {
    case 'hr':
    case 'admin':
    case 'co_admin':
      return 'hr';
    case 'supervisor':
      return 'supervisor';
    case 'auditor':
      return 'auditor';
    default:
      return 'employee';
  }
}

// =============================================================================
// Main Hook
// =============================================================================

export function useEditUserForm({
  userId,
}: UseEditUserFormOptions): UseEditUserFormResult {
  const router = useRouter();
  const [formInitialized, setFormInitialized] = useState(false);

  // Data fetching
  const { useUserDetail, updateUserAsync, isUpdating } = useUsersQuery();
  const { data: user, isLoading, error } = useUserDetail(userId);
  const { data: emailData, isLoading: isEmailLoading } = useUserEmail(userId);

  // Form setup
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: defaultEditUserFormValues,
    mode: 'onChange',
  });

  // ==========================================================================
  // Form Initialization - Initialize IMMEDIATELY when user data is available
  // ==========================================================================

  useEffect(() => {
    // Only initialize once when user data arrives
    if (!user) {
      console.log('[useEditUserForm] No user data yet');
      return;
    }

    if (formInitialized) {
      console.log('[useEditUserForm] Already initialized');
      return;
    }

    console.log('[useEditUserForm] Initializing form with user:', {
      id: user.id,
      role: user.role,
      departmentId: user.departmentId,
      collegeId: user.collegeId,
      salaryGrade: user.salaryGrade,
      positionId: user.positionId,
    });

    // Map role to form base role
    const baseRole = mapRoleToBaseRole(user.role);
    console.log('[useEditUserForm] Mapped role:', user.role, '→', baseRole);

    // Check if user is co-admin
    const isCoAdmin = user.role === 'admin' || user.role === 'co_admin';

    // Get college ID - prioritize collegeId from API, then department's parent, then departmentId for top-level offices
    let collegeId = 'none';
    if (user.collegeId) {
      collegeId = user.collegeId;
    } else if (user.department?.parentCollegeId) {
      collegeId = user.department.parentCollegeId;
    } else if (user.departmentId) {
      // User might be in a top-level office (no parent college)
      collegeId = user.departmentId;
    }
    console.log('[useEditUserForm] College ID:', collegeId);

    console.log('[useEditUserForm] Setting form values individually');

    // Set each field individually to ensure they update properly
    form.setValue('firstName', user.firstName || '', { shouldValidate: false });
    form.setValue('lastName', user.lastName || '', { shouldValidate: false });
    form.setValue('middleName', user.middleName || '', { shouldValidate: false });
    form.setValue('suffix', 'none', { shouldValidate: false });
    // Email will be set separately when emailData loads
    form.setValue('email', '', { shouldValidate: false });
    form.setValue('baseRole', baseRole, { shouldValidate: false });
    form.setValue('isCoAdmin', isCoAdmin, { shouldValidate: false });
    form.setValue('collegeId', collegeId, { shouldValidate: false });
    form.setValue('departmentId', user.departmentId || 'none', { shouldValidate: false });
    form.setValue('positionId', user.positionId || 'none', { shouldValidate: false });
    form.setValue('salaryGrade', user.salaryGrade ?? null, { shouldValidate: false });
    form.setValue('positionTitle', user.positionTitle || '', { shouldValidate: false });
    form.setValue('isActive', user.isActive ?? true, { shouldValidate: false });

    console.log('[useEditUserForm] Form values after setting:', form.getValues());

    setFormInitialized(true);
  }, [user, form, formInitialized]);

  // Update email when loaded separately (if form already initialized)
  useEffect(() => {
    if (emailData?.email && formInitialized) {
      const currentEmail = form.getValues('email');
      if (!currentEmail) {
        console.log('[useEditUserForm] Setting email:', emailData.email);
        form.setValue('email', emailData.email, { shouldDirty: false });
      }
    }
  }, [emailData, form, formInitialized]);

  // ==========================================================================
  // Submit Handler - Simple PATCH with all fields
  // ==========================================================================

  const handleSubmit = useCallback(
    async (values: EditUserFormValues) => {
      console.log('[useEditUserForm] Submitting:', values);

      // Build payload - send all relevant fields
      const payload: Record<string, unknown> = {
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || null,
        isActive: values.isActive,
      };

      // Handle role - convert baseRole + isCoAdmin to stored role
      if (values.isCoAdmin) {
        payload.role = 'co_admin';
      } else {
        payload.role = values.baseRole;
      }

      // Handle department - use collegeId if no department selected
      if (values.departmentId && values.departmentId !== 'none') {
        payload.departmentId = values.departmentId;
      } else if (values.collegeId && values.collegeId !== 'none') {
        // User selected college/office but no department - assign to the office directly
        payload.departmentId = values.collegeId;
      } else {
        payload.departmentId = null;
      }

      // Position
      payload.positionId = values.positionId && values.positionId !== 'none'
        ? values.positionId
        : null;

      // Salary grade
      payload.salaryGrade = values.salaryGrade ?? null;

      // Position title
      payload.positionTitle = values.positionTitle || null;

      console.log('[useEditUserForm] Payload:', payload);

      try {
        await updateUserAsync({ userId, data: payload });

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
    [updateUserAsync, userId, router]
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

  return {
    form,
    user,
    userEmail: emailData?.email,
    isLoading,
    isEmailLoading,
    error: error as Error | null,
    isUpdating,
    formInitialized,
    handleSubmit,
    resetForm,
  };
}

export { useUserEmail };
