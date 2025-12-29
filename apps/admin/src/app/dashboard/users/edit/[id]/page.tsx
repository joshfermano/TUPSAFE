'use client';

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  User,
  Briefcase,
  AlertCircle,
  Loader2,
  Save,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { useUsersQuery } from '@/hooks/useUsersQuery';
import { useOrganizations } from '@/hooks/useOrganization';
import { usePositionsQuery } from '@/hooks/usePositionsQuery';
import { PageTransition } from '@/components/PageTransition';
import { SectionCard } from '@/components/admin/SectionCard';
import { PasswordResetDialog } from '@/components/users/PasswordResetDialog';
import { useQuery } from '@tanstack/react-query';
import { getSalaryGradeOptions } from '@tupsafe/types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ErrorAlert, LoadingCard } from '@/components/admin';

// Form validation schema - refine for role-based requirements
const editUserSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50, 'Too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Too long'),
    middleName: z.string().max(50, 'Too long').optional(),
    suffix: z.string().optional(),
    employeeId: z
      .string()
      .min(1, 'Employee ID is required')
      .regex(/^[A-Z0-9-]+$/, 'Invalid format (use A-Z, 0-9, and hyphen only)'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['employee', 'hr', 'admin', 'supervisor', 'auditor'], {
      required_error: 'Role is required',
    }),
    departmentId: z.string().optional(),
    collegeId: z.string().optional(), // For UI filtering only, not sent to API
    positionId: z.string().optional(),
    salaryGrade: z.coerce.number().int().min(1).max(33).optional().nullable(),
    positionTitle: z.string().max(200).optional().nullable(),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      // Require department for employee/supervisor roles
      if (['employee', 'supervisor'].includes(data.role)) {
        return data.departmentId !== undefined && data.departmentId !== 'none';
      }
      return true;
    },
    {
      message: 'Department is required for employees and supervisors',
      path: ['departmentId'],
    }
  )
  .refine(
    (data) => {
      // Require position for employee/supervisor roles
      if (['employee', 'supervisor'].includes(data.role)) {
        return data.positionId !== undefined && data.positionId !== 'none';
      }
      return true;
    },
    {
      message: 'Position is required for employees and supervisors',
      path: ['positionId'],
    }
  );

type EditUserFormValues = z.infer<typeof editUserSchema>;

// Available roles
const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr', label: 'HR Personnel' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'auditor', label: 'Auditor' },
];

// Hook to fetch user email from Supabase Auth
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Suffix options
const SUFFIXES = [
  { value: 'none', label: 'None' },
  { value: 'Jr.', label: 'Jr.' },
  { value: 'Sr.', label: 'Sr.' },
  { value: 'II', label: 'II' },
  { value: 'III', label: 'III' },
  { value: 'IV', label: 'IV' },
];

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { useUserDetail, updateUserAsync, isUpdating } = useUsersQuery();
  const { data: user, isLoading, isError, error } = useUserDetail(userId);

  // Fetch organizations (colleges and departments), positions, and user email
  const { data: organizationsData, isLoading: isOrganizationsLoading } = useOrganizations({
    type: 'all',
    includeInactive: false,
  });
  const { data: positions = [], isLoading: isPositionsLoading } = usePositionsQuery();
  const { data: emailData } = useUserEmail(userId);

  // State for dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      suffix: 'none',
      employeeId: '',
      email: '',
      role: undefined,
      collegeId: 'none',
      departmentId: 'none',
      positionId: 'none',
      salaryGrade: undefined,
      positionTitle: '',
      isActive: true,
    },
  });

  const { watch, formState, reset } = form;
  const { dirtyFields, isDirty } = formState;
  const watchRole = watch('role');
  const watchCollegeId = watch('collegeId');

  // Get salary grade options
  const salaryGradeOptions = useMemo(() => getSalaryGradeOptions(), []);

  // Transform organizations into college and department options
  const collegeOptions = useMemo(() => {
    if (!organizationsData) return [{ value: 'none', label: 'None' }];

    // Colleges are organizations without parentCollegeId
    const colleges = [
      ...organizationsData.colleges,
      ...organizationsData.offices,
    ];

    return [
      { value: 'none', label: 'None' },
      ...colleges.map((college) => ({
        value: college.id,
        label: `${college.name} (${college.code})`,
      })),
    ];
  }, [organizationsData]);

  // Filter departments based on selected college
  const departmentOptions = useMemo(() => {
    if (!organizationsData) return [{ value: 'none', label: 'None' }];

    const allDepartments = organizationsData.departments;

    // If a college is selected, filter departments by that college
    const filteredDepartments = watchCollegeId && watchCollegeId !== 'none'
      ? allDepartments.filter((dept) => dept.parentCollegeId === watchCollegeId)
      : allDepartments;

    return [
      { value: 'none', label: 'None' },
      ...filteredDepartments.map((dept) => ({
        value: dept.id,
        label: `${dept.name} (${dept.code})`,
      })),
    ];
  }, [organizationsData, watchCollegeId]);

  const positionOptions = useMemo(() => [
    { value: 'none', label: 'None' },
    ...positions.map((pos) => ({
      value: pos.id,
      label: pos.title,
    })),
  ], [positions]);

  // Pre-populate form when user data and email are loaded
  useEffect(() => {
    if (user && emailData && organizationsData) {
      // Determine college ID from department
      let collegeId = 'none';
      if (user.departmentId) {
        // Find the department in the organizations data
        const department = organizationsData.departments.find(
          (dept) => dept.id === user.departmentId
        );
        if (department && department.parentCollegeId) {
          collegeId = department.parentCollegeId;
        }
      }

      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName || '',
        suffix: 'none', // Not stored in database, default to none
        employeeId: user.employeeId ?? '',
        email: emailData.email || '',
        role: user.role,
        collegeId: collegeId,
        departmentId: user.departmentId || 'none',
        positionId: user.positionId || 'none',
        salaryGrade: user.salaryGrade || undefined,
        positionTitle: user.positionTitle || '',
        isActive: user.isActive,
      });
    }
  }, [user, emailData, organizationsData, reset]);

  const roleRequiresDepartment = useMemo(() => {
    return ['employee', 'supervisor'].includes(watchRole || '');
  }, [watchRole]);

  // Reset department when college changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'collegeId') {
        // Reset department selection when college changes
        form.setValue('departmentId', 'none');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      router.push(`/dashboard/users/view/${userId}`);
    }
  }, [isDirty, router, userId]);

  const onSubmit = useCallback(
    async (values: EditUserFormValues) => {
      try {
        // Filter out non-updatable fields (email, employeeId, suffix, collegeId)
        // and convert 'none' values to undefined (API expects string | undefined, not null)
        const dataToSubmit = {
          firstName: values.firstName,
          lastName: values.lastName,
          middleName: values.middleName || null,
          role: values.role,
          departmentId: values.departmentId === 'none' ? undefined : values.departmentId,
          positionId: values.positionId === 'none' ? undefined : values.positionId,
          salaryGrade: values.salaryGrade || null,
          positionTitle: values.positionTitle || null,
          isActive: values.isActive,
        };

        await updateUserAsync({
          userId,
          data: dataToSubmit,
        });

        toast.success('User updated successfully', {
          description: `${values.firstName} ${values.lastName}'s information has been updated.`,
        });

        router.push(`/dashboard/users/view/${userId}`);
      } catch (error) {
        toast.error('Failed to update user', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      }
    },
    [userId, updateUserAsync, router]
  );

  if (isLoading) {
    return (
      <PageTransition className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </PageTransition>
    );
  }

  if (isError || !user) {
    return (
      <PageTransition className="space-y-6">
        <ErrorAlert error={error || 'User not found'} title="Failed to load user details" />
        <Button onClick={() => router.push('/dashboard/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </PageTransition>
    );
  }

  const fullName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.trim();

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

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground">Update user information and permissions</p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <SectionCard title="Personal Information" icon={<User className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Dela Cruz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Santos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="suffix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suffix</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select suffix" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUFFIXES.map((suffix) => (
                            <SelectItem key={suffix.value} value={suffix.value}>
                              {suffix.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="EMP-2024-001"
                        {...field}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <FormDescription>
                      Employee ID cannot be changed after creation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan.delacruz@tup.edu.ph" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          {/* Role & Assignment Section */}
          <SectionCard title="Role & Assignment" icon={<Briefcase className="h-5 w-5" />}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>This determines the user&apos;s permissions</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {roleRequiresDepartment && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Department and position are required for employees and supervisors
                    </p>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="collegeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>College / Office</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isOrganizationsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isOrganizationsLoading
                                ? 'Loading colleges...'
                                : 'Select college or office'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {collegeOptions.map((college) => (
                          <SelectItem key={college.value} value={college.value}>
                            {college.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a college or office to filter departments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department {roleRequiresDepartment && '*'}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isOrganizationsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isOrganizationsLoading
                                ? 'Loading departments...'
                                : 'Select department'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {watchCollegeId && watchCollegeId !== 'none' && (
                      <FormDescription>
                        Showing departments for selected college
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position {roleRequiresDepartment && '*'}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPositionsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isPositionsLoading
                                ? 'Loading positions...'
                                : 'Select position'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positionOptions.map((position) => (
                          <SelectItem key={position.value} value={position.value}>
                            {position.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isPositionsLoading && (
                      <FormDescription>Loading positions...</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />

              <FormField
                control={form.control}
                name="salaryGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Grade</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        // Convert to number, or undefined if 'none'
                        field.onChange(value === 'none' ? undefined : parseInt(value, 10));
                      }}
                      value={field.value ? field.value.toString() : 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select salary grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {salaryGradeOptions.map((grade: { value: number; label: string }) => (
                          <SelectItem key={grade.value} value={grade.value.toString()}>
                            {grade.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Philippine Salary Standardization Law V (SSL V)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="positionTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Associate Professor III"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom position title for manual entry
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          {/* Account Status Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Manage user account access</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive users cannot log in to the system
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage user authentication and credentials</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Password Reset</div>
                    <p className="text-sm text-muted-foreground">
                      Generate a new temporary password for {user?.firstName} {user?.lastName}
                    </p>
                    {emailData?.email && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Email: {emailData.email}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    Reset Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <Separator className="mb-6" />
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>

                <Button type="submit" disabled={isUpdating || !isDirty}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

              {isDirty && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  You have unsaved changes
                </p>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page? All changes will
              be lost.
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
      {user && emailData && (
        <PasswordResetDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          userId={userId}
          userName={`${user.firstName} ${user.lastName}`}
          userEmail={emailData.email}
        />
      )}
    </PageTransition>
  );
}
