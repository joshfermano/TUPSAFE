'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { UserRole } from '@tupsafe/types';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { PageTransition } from '@/components/PageTransition';
import { PasswordResetDialog } from '@/components/users/PasswordResetDialog';

import {
  PersonalInfoSection,
  RoleAssignmentSection,
  OrganizationSection,
  AccountStatusSection,
  SecuritySection,
  EditUserFormActions,
  RoleChangeConfirmationDialog,
} from '@/components/users/edit';

import { useEditUserForm, computeIsElevation } from '@/hooks/useEditUserForm';
import { useOrganizationOptions } from '@/hooks/useOrganizationOptions';
import { usePositionsQuery } from '@/hooks/usePositionsQuery';
import { useAuth } from '@/hooks/useAuth';
import type { EditUserFormValues } from '@/lib/schemas/edit-user';
import { isHRCode } from '@/lib/user-utils';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // Actor (signed-in admin) context
  const { profile } = useAuth();
  const actorRole = profile?.role as UserRole | undefined;
  const isSelfEdit = !!profile?.id && profile.id === userId;

  // UI state
  const [isEmailLocked, setIsEmailLocked] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  // Role-change confirmation: holds the pending submit payload until confirmed
  const [pendingRoleChangeSubmit, setPendingRoleChangeSubmit] =
    useState<EditUserFormValues | null>(null);

  // Form hook
  const {
    form,
    user,
    userEmail,
    isLoading,
    error,
    isUpdating,
    formInitialized,
    originalRole,
    handleSubmit: submitForm,
  } = useEditUserForm({ userId });

  // Get form state for save button
  const { isDirty } = form.formState;

  // Watch form values
  const watchCollegeId = form.watch('collegeId');
  const watchDepartmentId = form.watch('departmentId');
  const watchRole = form.watch('role');
  const watchIsActive = form.watch('isActive');

  // HR/Admin roles require an HR-prefixed department
  const roleRequiresHRDept = watchRole === 'hr' || watchRole === 'admin';

  // Organization options
  const {
    isLoading: isOrganizationsLoading,
    collegeOptions,
    departmentOptions,
    selectedCollegeIsHR,
    selectedCollegeHasNoDepartments,
  } = useOrganizationOptions({
    selectedCollegeId: watchCollegeId,
    selectedDepartmentId: watchDepartmentId,
    requiresHRDepartment: roleRequiresHRDept,
    currentUserDepartmentId: user?.departmentId,
    currentUserDepartment: user?.department,
  });

  // Positions
  const { data: positions = [] } = usePositionsQuery();

  // Can the currently-selected org unit carry an HR/Admin role?
  // Accept either an HR-prefixed college/office OR an HR-prefixed department.
  const canAssignHRDept = useMemo(() => {
    if (selectedCollegeIsHR) return true;
    if (watchDepartmentId && watchDepartmentId !== 'none') {
      const dept = departmentOptions.find((d) => d.value === watchDepartmentId);
      if (dept?.isHR) return true;
      // Fall back to pure code check (e.g. if label-based isHR was not set)
      const labelMatch = dept?.label?.match(/\(([^)]+)\)/);
      if (labelMatch && isHRCode(labelMatch[1])) return true;
    }
    return false;
  }, [selectedCollegeIsHR, watchDepartmentId, departmentOptions]);

  // Reset departmentId when collegeId changes (to avoid stale department from previous college)
  const prevCollegeIdRef = useRef(watchCollegeId);
  useEffect(() => {
    if (formInitialized && prevCollegeIdRef.current !== watchCollegeId) {
      form.setValue('departmentId', 'none', { shouldDirty: true });
      prevCollegeIdRef.current = watchCollegeId;
    }
  }, [watchCollegeId, form, formInitialized]);

  // ------------------------------------------------------------------
  // Submission flow
  // ------------------------------------------------------------------
  // If the role changed, intercept the submit and surface the confirmation
  // dialog. On confirm, merge the reason into the values and call submitForm.
  // ------------------------------------------------------------------
  const onSubmit = useCallback(
    async (values: EditUserFormValues) => {
      const roleChanged = values.role !== originalRole;
      if (roleChanged) {
        setPendingRoleChangeSubmit(values);
        return;
      }
      await submitForm(values);
    },
    [submitForm, originalRole]
  );

  const handleRoleChangeConfirm = useCallback(
    async (reason: string) => {
      if (!pendingRoleChangeSubmit) return;
      await submitForm({
        ...pendingRoleChangeSubmit,
        roleChangeReason: reason,
      });
      setPendingRoleChangeSubmit(null);
    },
    [pendingRoleChangeSubmit, submitForm]
  );

  // Cancel
  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      router.push(`/dashboard/users/view/${userId}`);
    }
  }, [isDirty, router, userId]);

  // Loading state
  if (isLoading) {
    return (
      <PageTransition className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </PageTransition>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <PageTransition className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
          <p className="text-red-800 dark:text-red-200">
            {error?.message || 'User not found'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/dashboard/users')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </PageTransition>
    );
  }

  const fullName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(' ');

  // Compute elevation flag for the confirmation dialog (only when pending)
  const pendingIsElevation = pendingRoleChangeSubmit
    ? computeIsElevation(originalRole, pendingRoleChangeSubmit.role)
    : false;

  return (
    <PageTransition className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/users">Users</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/users/view/${userId}`}>{fullName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
        <p className="text-muted-foreground">Update information for {fullName}</p>
      </div>

      {/* Form - key forces re-render when form is initialized with user data */}
      <Form {...form} key={formInitialized ? 'initialized' : 'loading'}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <PersonalInfoSection
            control={form.control}
            employeeId={user.employeeId}
            isEmailLocked={isEmailLocked}
            onToggleEmailLock={() => setIsEmailLocked(!isEmailLocked)}
          />

          <RoleAssignmentSection
            control={form.control}
            currentStoredRole={originalRole}
            actorRole={actorRole}
            isSelfEdit={isSelfEdit}
            canAssignHRDept={canAssignHRDept}
          />

          <OrganizationSection
            control={form.control}
            collegeOptions={collegeOptions}
            departmentOptions={departmentOptions}
            positionOptions={positions}
            isLoading={isOrganizationsLoading}
            selectedCollegeIsHR={selectedCollegeIsHR}
            selectedCollegeHasNoDepartments={selectedCollegeHasNoDepartments}
          />

          <AccountStatusSection control={form.control} isActive={watchIsActive} />

          <SecuritySection
            userName={fullName}
            userEmail={userEmail}
            onResetPassword={() => setShowPasswordDialog(true)}
          />

          <EditUserFormActions
            isDirty={isDirty || formInitialized}
            isUpdating={isUpdating}
            onCancel={handleCancel}
          />
        </form>
      </Form>

      {/* Role-change Confirmation Dialog */}
      {pendingRoleChangeSubmit && (
        <RoleChangeConfirmationDialog
          open={!!pendingRoleChangeSubmit}
          onOpenChange={(open) => {
            if (!open) setPendingRoleChangeSubmit(null);
          }}
          userFullName={fullName}
          fromRole={originalRole}
          toRole={pendingRoleChangeSubmit.role}
          isElevation={pendingIsElevation}
          isLoading={isUpdating}
          onConfirm={handleRoleChangeConfirm}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? All changes
              will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push(`/dashboard/users/view/${userId}`)}
              className="bg-red-600 hover:bg-red-700"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Dialog */}
      {user && userEmail && (
        <PasswordResetDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          userId={userId}
          userName={fullName}
          userEmail={userEmail}
        />
      )}
    </PageTransition>
  );
}
