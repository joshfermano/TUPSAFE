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
  ShieldCheck,
  ShieldOff,
  Lock,
  LockOpen,
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
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Check if a code indicates an HR office (works for both departments and colleges/offices)
function isHRCode(code: string | undefined | null): boolean {
  if (!code) return false;
  const upperCode = code.toUpperCase();
  // Check various HR patterns: HR, HRO, HRMO, HRMD, etc.
  return (
    upperCode.startsWith('HR') ||
    upperCode.includes('HUMAN RESOURCE') ||
    upperCode.includes('HUMAN-RESOURCE')
  );
}

// Check if a name indicates an HR office
function isHRName(name: string | undefined | null): boolean {
  if (!name) return false;
  const upperName = name.toUpperCase();
  return (
    upperName.includes('HUMAN RESOURCE') ||
    upperName.includes('HR OFFICE') ||
    upperName.includes('HR DEPARTMENT') ||
    upperName.includes('PERSONNEL')
  );
}

// Form validation schema - more permissive for editing (only co-admin requires HR department)
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
    baseRole: z.enum(['employee', 'hr', 'supervisor', 'auditor'], {
      required_error: 'Role is required',
    }),
    isCoAdmin: z.boolean().default(false),
    departmentId: z.string().optional(),
    collegeId: z.string().optional(), // For UI filtering only, not sent to API
    positionId: z.string().optional(),
    salaryGrade: z.coerce.number().int().min(1).max(33).optional().nullable(),
    positionTitle: z.string().max(200).optional().nullable(),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      // Co-admin HR validation happens in onSubmit with full organizationsData context
      // Schema-level validation cannot access organizationsData to check if college is HR
      return true;
    },
    {
      message: 'Department is required for Co-Admin users (must be HR office)',
      path: ['departmentId'],
    }
  );

type EditUserFormValues = z.infer<typeof editUserSchema>;

// Available base roles (admin/co_admin is controlled separately via toggle)
const BASE_ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr', label: 'HR Personnel' },
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
  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizations({
      type: 'all',
      includeInactive: true,
    });
  const { data: positions = [], isLoading: isPositionsLoading } =
    usePositionsQuery();
  const { data: emailData } = useUserEmail(userId);

  // State for dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  // State to track form initialization
  const [formInitialized, setFormInitialized] = useState(false);
  // State for email field lock
  const [isEmailLocked, setIsEmailLocked] = useState(true);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      suffix: 'none',
      employeeId: '',
      email: '',
      baseRole: undefined,
      isCoAdmin: false,
      collegeId: 'none',
      departmentId: 'none',
      positionId: 'none',
      salaryGrade: undefined,
      positionTitle: '',
      isActive: true,
    },
  });

  const { watch, formState } = form;
  const { dirtyFields, isDirty } = formState;
  const watchBaseRole = watch('baseRole');
  const watchIsCoAdmin = watch('isCoAdmin');
  const watchCollegeId = watch('collegeId');
  const watchDepartmentId = watch('departmentId');

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

    // Check if user has a current college that might not be in the active list
    let userCollege = null;
    if (user?.departmentId && user.department?.parentCollegeId) {
      const currentCollegeId = user.department.parentCollegeId;
      userCollege = colleges.find((c) => c.id === currentCollegeId);
    }

    const collegeList = colleges.map((college) => ({
      value: college.id,
      label: `${college.name} (${college.code})${!college.isActive ? ' [Inactive]' : ''}`,
    }));

    // CRITICAL: Include user's current college if not already in list
    // This ensures the current value can always be found in the options
    if (userCollege && !collegeList.some((c) => c.value === userCollege!.id)) {
      console.log('[collegeOptions] Adding user current college:', {
        id: userCollege.id,
        name: userCollege.name,
        code: userCollege.code,
      });
      collegeList.unshift({
        value: userCollege.id,
        label: `${userCollege.name} (${userCollege.code}) [Current]`,
      });
    }

    return [
      { value: 'none', label: 'None' },
      ...collegeList,
    ];
  }, [organizationsData, user]);

  const positionOptions = useMemo(() => {
    const positionList = positions.map((pos) => ({
      value: pos.id,
      label: pos.title,
    }));

    // CRITICAL: Include user's current position if not already in list
    // This ensures the current value can always be found in the options
    if (user?.positionId && user.position) {
      const posExists = positionList.some(p => p.value === user.positionId);
      if (!posExists) {
        console.log('[positionOptions] Adding user current position:', {
          id: user.position.id,
          title: user.position.title,
        });
        positionList.unshift({
          value: user.position.id,
          label: `${user.position.title} [Current]`,
        });
      }
    }

    return [
      { value: 'none', label: 'None' },
      ...positionList,
    ];
  }, [positions, user]);

  // Pre-populate form when user data is loaded (Effect 1: Main form data)
  // CRITICAL: This effect includes computed options (collegeOptions, positionOptions) in dependencies
  // to ensure form values can be matched to select options after they're computed.
  // filteredDepartmentOptions is NOT included because it depends on form state (watchCollegeId, watchIsCoAdmin)
  // which would create a circular dependency.
  useEffect(() => {
    // Only proceed if we have all required data and options are computed
    if (user && organizationsData && collegeOptions.length > 1 && positionOptions.length > 1) {
      console.log('[Form Population] Starting form population with user data:', {
        userId: user.id,
        departmentId: user.departmentId,
        department: user.department,
        positionId: user.positionId,
        position: user.position,
        role: user.role,
        salaryGrade: user.salaryGrade,
        positionTitle: user.positionTitle,
      });

      // Determine college ID from department
      let collegeId = 'none';
      let userDepartment: { id: string; name: string; code: string; parentCollegeId?: string | null } | null = null;
      let userCollege: { id: string; name: string; code: string } | null = null;

      if (user.departmentId) {
        // Find the department in the organizations data
        const foundDept = organizationsData.departments.find(
          (dept) => dept.id === user.departmentId
        );

        // Use found department or fall back to embedded department from user API response
        if (foundDept) {
          userDepartment = foundDept;
          console.log('[Form Population] Found department in organizations data:', foundDept);
        } else if (user.department) {
          // Use embedded department data from API as fallback
          userDepartment = {
            id: user.department.id,
            name: user.department.name,
            code: user.department.code,
            parentCollegeId: user.department.parentCollegeId,
          };
          console.log('[Form Population] Using embedded department from API:', userDepartment);
        }

        if (userDepartment && userDepartment.parentCollegeId) {
          collegeId = userDepartment.parentCollegeId;
          // Find the college/office
          userCollege =
            organizationsData.colleges.find((c) => c.id === collegeId) ||
            organizationsData.offices.find((o) => o.id === collegeId) ||
            null;
          console.log('[Form Population] Found college:', userCollege);
        }
      }

      // Determine base role and co-admin status from stored role
      // If role is 'admin' or 'co_admin', they have co-admin access
      const isCoAdminUser = user.role === 'admin' || user.role === 'co_admin';

      // Map role to base role - for admin/co_admin, check if they're in HR to set 'hr' as base
      let baseRole: 'employee' | 'hr' | 'supervisor' | 'auditor';
      if (['admin', 'co_admin'].includes(user.role)) {
        // Check if user is in HR office/department - if so, their base role is 'hr'
        const isInHR =
          (userDepartment &&
            (isHRCode(userDepartment.code) || isHRName(userDepartment.name))) ||
          (userCollege &&
            (isHRCode(userCollege.code) || isHRName(userCollege.name)));
        baseRole = isInHR ? 'hr' : 'employee';
      } else {
        baseRole = user.role as 'employee' | 'hr' | 'supervisor' | 'auditor';
      }

      const formData = {
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName || '',
        suffix: 'none', // Not stored in database, default to none
        employeeId: user.employeeId ?? '',
        email: '', // Will be updated by separate effect
        baseRole: baseRole,
        isCoAdmin: isCoAdminUser,
        collegeId: collegeId,
        departmentId: user.departmentId || 'none',
        positionId: user.positionId || 'none',
        salaryGrade: user.salaryGrade || undefined,
        positionTitle: user.positionTitle || '',
        isActive: user.isActive,
      };

      console.log('[Form Population] Resetting form with data:', formData);
      console.log('[Form Population] Available college options:', collegeOptions.map(c => ({ value: c.value, label: c.label })));
      console.log('[Form Population] Available position options:', positionOptions.map(p => ({ value: p.value, label: p.label })));

      // Check if form values exist in options (only check collegeOptions and positionOptions here)
      const collegeExists = collegeOptions.some(opt => opt.value === formData.collegeId);
      const posExists = positionOptions.some(opt => opt.value === formData.positionId);

      console.log('[Form Population] Value existence check:', {
        collegeId: formData.collegeId,
        collegeExists,
        positionId: formData.positionId,
        posExists,
      });

      // Defer the form reset to the next render cycle to ensure all computed options are available
      // This solves the race condition where Select components try to match values before options are ready
      requestAnimationFrame(() => {
        form.reset(formData, {
          keepDefaultValues: false,
        });

        // Mark form as initialized after first successful reset
        if (!formInitialized) {
          setFormInitialized(true);
        }

        // Reset email lock state when user data loads
        setIsEmailLocked(true);

        console.log('[Form Population] Form reset complete. Current values:', form.getValues());
      });
    }
  }, [user, organizationsData, collegeOptions, positionOptions, form, formInitialized]);

  // Update email field separately when email data loads (Effect 2: Email update)
  useEffect(() => {
    if (emailData?.email) {
      form.setValue('email', emailData.email, { shouldDirty: false });
    }
  }, [emailData, form]);

  const roleRequiresDepartment = useMemo(() => {
    return (
      ['employee', 'supervisor'].includes(watchBaseRole || '') || watchIsCoAdmin
    );
  }, [watchBaseRole, watchIsCoAdmin]);

  // Check if co-admin requires HR department
  const coAdminRequiresHRDepartment = useMemo(() => {
    return watchIsCoAdmin;
  }, [watchIsCoAdmin]);

  // Check if selected college/office is an HR office
  const selectedCollegeIsHR = useMemo(() => {
    if (!watchCollegeId || watchCollegeId === 'none' || !organizationsData)
      return false;
    const college =
      organizationsData.colleges.find((c) => c.id === watchCollegeId) ||
      organizationsData.offices.find((o) => o.id === watchCollegeId);
    return college ? isHRCode(college.code) || isHRName(college.name) : false;
  }, [watchCollegeId, organizationsData]);

  // Check if selected department is an HR department
  const selectedDepartmentIsHR = useMemo(() => {
    if (
      !watchDepartmentId ||
      watchDepartmentId === 'none' ||
      !organizationsData
    )
      return false;
    const department = organizationsData.departments.find(
      (d) => d.id === watchDepartmentId
    );
    return department
      ? isHRCode(department.code) || isHRName(department.name)
      : false;
  }, [watchDepartmentId, organizationsData]);

  // For co-admin: either college OR department can be HR
  const isInHROffice = useMemo(() => {
    return selectedCollegeIsHR || selectedDepartmentIsHR;
  }, [selectedCollegeIsHR, selectedDepartmentIsHR]);

  // Check if user can be a Co-Admin (must be in HR department)
  const canBeCoAdmin = useMemo(() => {
    return isInHROffice;
  }, [isInHROffice]);

  // Filter departments based on college and co-admin status
  const filteredDepartmentOptions = useMemo(() => {
    if (!organizationsData) return [{ value: 'none', label: 'None' }];

    const allDepartments = organizationsData.departments;

    // If a college is selected, filter departments by that college
    let filteredDepartments =
      watchCollegeId && watchCollegeId !== 'none'
        ? allDepartments.filter(
            (dept) => dept.parentCollegeId === watchCollegeId
          )
        : allDepartments;

    // If co-admin is enabled AND the selected college is NOT an HR office,
    // then filter to only HR departments
    if (watchIsCoAdmin && !selectedCollegeIsHR) {
      filteredDepartments = filteredDepartments.filter(
        (dept) => isHRCode(dept.code) || isHRName(dept.name)
      );
    }
    // If co-admin is enabled AND the college IS an HR office,
    // show all departments under that HR office (no filtering needed)

    const departmentList = filteredDepartments.map((dept) => ({
      value: dept.id,
      label: `${dept.name} (${dept.code})${!dept.isActive ? ' [Inactive]' : ''}`,
    }));

    // CRITICAL: Include user's current department if not already in list
    // This ensures the current value can always be found in the options
    if (user?.departmentId) {
      const userDept = allDepartments.find((d) => d.id === user.departmentId);

      // If user's department exists but isn't in the filtered list, add it
      if (userDept && !departmentList.some((d) => d.value === userDept.id)) {
        console.log('[filteredDepartmentOptions] Adding user current department:', {
          id: userDept.id,
          name: userDept.name,
          code: userDept.code,
          isActive: userDept.isActive,
        });
        departmentList.unshift({
          value: userDept.id,
          label: `${userDept.name} (${userDept.code})${!userDept.isActive ? ' [Inactive - Current]' : ' [Current]'}`,
        });
      }

      // Also check if user's department is in the original API response
      if (user.department && !allDepartments.some(d => d.id === user.departmentId)) {
        console.log('[filteredDepartmentOptions] User department NOT in organizations data, using embedded department:', {
          id: user.department.id,
          name: user.department.name,
          code: user.department.code,
        });
        departmentList.unshift({
          value: user.department.id,
          label: `${user.department.name} (${user.department.code}) [Current]`,
        });
      }
    }

    return [
      { value: 'none', label: 'None' },
      ...departmentList,
    ];
  }, [organizationsData, watchCollegeId, watchIsCoAdmin, selectedCollegeIsHR, user]);

  // Reset department when college changes or when co-admin is toggled
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'collegeId') {
        // Reset department selection when college changes
        form.setValue('departmentId', 'none');
      }
      if (name === 'isCoAdmin' && value.isCoAdmin) {
        // When co-admin is enabled, check if current office/department is HR
        const currentCollegeId = value.collegeId;
        const currentDeptId = value.departmentId;

        // Check if college is HR
        let collegeIsHR = false;
        if (
          currentCollegeId &&
          currentCollegeId !== 'none' &&
          organizationsData
        ) {
          const college =
            organizationsData.colleges.find((c) => c.id === currentCollegeId) ||
            organizationsData.offices.find((o) => o.id === currentCollegeId);
          collegeIsHR = college
            ? isHRCode(college.code) || isHRName(college.name)
            : false;
        }

        // If college is HR, department can be anything - no reset needed
        // If college is NOT HR, check if department is HR
        if (
          !collegeIsHR &&
          currentDeptId &&
          currentDeptId !== 'none' &&
          organizationsData
        ) {
          const department = organizationsData.departments.find(
            (d) => d.id === currentDeptId
          );
          if (
            department &&
            !isHRCode(department.code) &&
            !isHRName(department.name)
          ) {
            // Reset department if it's not an HR department
            form.setValue('departmentId', 'none');
          }
        }
      }

      // Auto-disable Co-Admin when department changes away from HR
      if ((name === 'departmentId' || name === 'collegeId') && value.isCoAdmin) {
        const currentCollegeId = value.collegeId;
        const currentDeptId = value.departmentId;

        // Check if college is HR
        let collegeIsHR = false;
        if (
          currentCollegeId &&
          currentCollegeId !== 'none' &&
          organizationsData
        ) {
          const college =
            organizationsData.colleges.find((c) => c.id === currentCollegeId) ||
            organizationsData.offices.find((o) => o.id === currentCollegeId);
          collegeIsHR = college
            ? isHRCode(college.code) || isHRName(college.name)
            : false;
        }

        // Check if department is HR
        let deptIsHR = false;
        if (
          currentDeptId &&
          currentDeptId !== 'none' &&
          organizationsData
        ) {
          const department = organizationsData.departments.find(
            (d) => d.id === currentDeptId
          );
          deptIsHR = department
            ? isHRCode(department.code) || isHRName(department.name)
            : false;
        }

        // If neither college nor department is HR, disable Co-Admin
        if (!collegeIsHR && !deptIsHR) {
          form.setValue('isCoAdmin', false);
          toast.info('Co-Admin access disabled', {
            description: 'Co-Admin requires assignment to an HR department.',
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, organizationsData]);

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
        // Determine actual role: if co-admin is enabled, use 'co_admin', otherwise use baseRole
        const actualRole:
          | 'employee'
          | 'hr'
          | 'admin'
          | 'co_admin'
          | 'supervisor'
          | 'auditor' = values.isCoAdmin ? 'co_admin' : values.baseRole;

        // Validate HR office/department requirement for co-admin
        if (values.isCoAdmin) {
          // Check if college/office is HR
          let collegeIsHR = false;
          if (
            values.collegeId &&
            values.collegeId !== 'none' &&
            organizationsData
          ) {
            const college =
              organizationsData.colleges.find(
                (c) => c.id === values.collegeId
              ) ||
              organizationsData.offices.find((o) => o.id === values.collegeId);
            collegeIsHR = college
              ? isHRCode(college.code) || isHRName(college.name)
              : false;
          }

          // Check if department is HR
          let deptIsHR = false;
          if (
            values.departmentId &&
            values.departmentId !== 'none' &&
            organizationsData
          ) {
            const department = organizationsData.departments.find(
              (d) => d.id === values.departmentId
            );
            deptIsHR = department
              ? isHRCode(department.code) || isHRName(department.name)
              : false;
          }

          // Co-admin must be in HR office OR HR department
          if (!collegeIsHR && !deptIsHR) {
            toast.error('Invalid assignment for Co-Admin', {
              description:
                'Co-Admin users must be assigned to an HR office or HR department.',
            });
            return;
          }
        }

        // Filter out non-updatable fields (email, employeeId, suffix, collegeId)
        // and convert 'none' values to undefined (API expects string | undefined, not null)

        // For HR offices without sub-departments, use the office ID as departmentId
        let effectiveDepartmentId = values.departmentId === 'none' ? undefined : values.departmentId;
        if (selectedCollegeIsHR && values.departmentId === 'none' && values.collegeId && values.collegeId !== 'none') {
          effectiveDepartmentId = values.collegeId;
        }

        const dataToSubmit = {
          firstName: values.firstName,
          lastName: values.lastName,
          middleName: values.middleName || null,
          role: actualRole,
          departmentId: effectiveDepartmentId,
          positionId:
            values.positionId === 'none' ? undefined : values.positionId,
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
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred.',
        });
      }
    },
    [userId, updateUserAsync, router, organizationsData, selectedCollegeIsHR]
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
        <ErrorAlert
          error={error || 'User not found'}
          title="Failed to load user details"
        />
        <Button onClick={() => router.push('/dashboard/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </PageTransition>
    );
  }

  const fullName = `${user.firstName} ${user.middleName || ''} ${
    user.lastName
  }`.trim();

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
          <p className="text-muted-foreground">
            Update user information and permissions
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <SectionCard
            title="Personal Information"
            icon={<User className="h-5 w-5" />}>
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}>
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Email Address *</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEmailLocked(!isEmailLocked)}
                        className="h-6 px-2 text-xs"
                      >
                        {isEmailLocked ? (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Unlock
                          </>
                        ) : (
                          <>
                            <LockOpen className="h-3 w-3 mr-1" />
                            Lock
                          </>
                        )}
                      </Button>
                    </div>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="juan.delacruz@tup.edu.ph"
                        disabled={isEmailLocked}
                        className={isEmailLocked ? 'bg-muted cursor-not-allowed' : ''}
                        {...field}
                      />
                    </FormControl>
                    {isEmailLocked && (
                      <FormDescription className="text-xs text-muted-foreground">
                        Email is locked to prevent accidental changes. Click Unlock to edit.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          {/* Role & Assignment Section */}
          <SectionCard
            title="Role & Assignment"
            icon={<Briefcase className="h-5 w-5" />}>
            <div className="space-y-4">
              {/* Role and Co-Admin Toggle Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Role *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BASE_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This determines the user&apos;s base permissions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isCoAdmin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Admin Portal Access
                      </FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                rounded-lg border transition-all duration-200
                                ${
                                  field.value
                                    ? 'border-primary/50 bg-primary/5 dark:bg-primary/10'
                                    : canBeCoAdmin
                                    ? 'border-border bg-muted/20 hover:bg-muted/40'
                                    : 'border-border bg-muted/20 opacity-60'
                                }
                              `}>
                              <div className="flex items-center gap-3 p-4">
                                {/* Icon */}
                                <div
                                  className={`
                                    flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors
                                    ${
                                      field.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    }
                                  `}>
                                  {field.value ? (
                                    <ShieldCheck className="h-5 w-5" />
                                  ) : (
                                    <ShieldOff className="h-5 w-5" />
                                  )}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">
                                      Co-Admin
                                    </span>
                                    <Badge
                                      variant={field.value ? 'default' : 'secondary'}
                                      className={`text-[10px] px-1.5 py-0 ${
                                        field.value
                                          ? 'bg-primary'
                                          : 'bg-muted-foreground/20 text-muted-foreground'
                                      }`}>
                                      {field.value ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Full admin portal access
                                  </p>
                                </div>

                                {/* Switch - wrapped for visibility */}
                                <div className="flex items-center">
                                  <FormControl>
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={field.value}
                                      disabled={!canBeCoAdmin && !field.value}
                                      onClick={() => {
                                        if (canBeCoAdmin || field.value) {
                                          field.onChange(!field.value);
                                        }
                                      }}
                                      className={`
                                        relative inline-flex h-7 w-14 shrink-0 items-center
                                        rounded-full border-2 transition-colors duration-200
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                                        ${
                                          !canBeCoAdmin && !field.value
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'cursor-pointer'
                                        }
                                        ${
                                          field.value
                                            ? 'bg-primary border-primary'
                                            : 'bg-zinc-200 border-zinc-300 dark:bg-zinc-700 dark:border-zinc-600'
                                        }
                                      `}>
                                      <span
                                        className={`
                                          pointer-events-none inline-block h-5 w-5 transform rounded-full
                                          bg-white shadow-lg ring-0 transition-transform duration-200
                                          ${
                                            field.value
                                              ? 'translate-x-7'
                                              : 'translate-x-1'
                                          }
                                        `}
                                      />
                                    </button>
                                  </FormControl>
                                </div>
                              </div>

                              {field.value && (
                                <div className="border-t border-primary/20 bg-primary/5 px-4 py-2">
                                  <p className="text-xs text-primary dark:text-primary/90">
                                    <span className="font-medium">Note:</span>{' '}
                                    Requires HR department assignment
                                  </p>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          {!canBeCoAdmin && !field.value && (
                            <TooltipContent>
                              <p>Co-Admin requires assignment to an HR department</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Department/Position Recommended Info */}
              {roleRequiresDepartment && !watchIsCoAdmin && (
                <div className="rounded-lg border border-muted bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    💡 <span className="font-medium">Tip:</span> Assigning a
                    department and position helps organize employees and enables
                    department-level reporting.
                  </p>
                </div>
              )}

              {/* HR Warning when Co-Admin is enabled but not in HR office/department */}
              {watchIsCoAdmin && !isInHROffice && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Co-Admin users must be assigned to an HR office or HR
                      department. Please select an HR-related college/office or
                      department.
                    </p>
                  </div>
                </div>
              )}

              {/* Success indicator when Co-Admin is in HR */}
              {watchIsCoAdmin && isInHROffice && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Valid HR assignment for Co-Admin
                  </p>
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
                      disabled={isOrganizationsLoading}>
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
                    <FormLabel>
                      Department{' '}
                      {(roleRequiresDepartment ||
                        coAdminRequiresHRDepartment) &&
                        !selectedCollegeIsHR && '*'}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isOrganizationsLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isOrganizationsLoading
                                ? 'Loading departments...'
                                : watchIsCoAdmin
                                ? 'Select HR department'
                                : 'Select department'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredDepartmentOptions.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {watchIsCoAdmin && !selectedCollegeIsHR ? (
                      <FormDescription className="text-blue-600 dark:text-blue-400">
                        Only HR departments shown (or select an HR office above)
                      </FormDescription>
                    ) : watchIsCoAdmin && selectedCollegeIsHR ? (
                      <FormDescription className="text-green-600 dark:text-green-400">
                        All departments shown (HR office selected)
                      </FormDescription>
                    ) : watchCollegeId && watchCollegeId !== 'none' ? (
                      <FormDescription>
                        Showing departments for selected college
                      </FormDescription>
                    ) : null}
                    {selectedCollegeIsHR && filteredDepartmentOptions.length <= 1 && (
                      <p className="text-sm text-green-600 mt-1">
                        HR office selected - no additional department required
                      </p>
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
                    <FormLabel>
                      Position {roleRequiresDepartment && '*'}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPositionsLoading}>
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
                          <SelectItem
                            key={position.value}
                            value={position.value}>
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
                        field.onChange(
                          value === 'none' ? undefined : parseInt(value, 10)
                        );
                      }}
                      value={field.value ? field.value.toString() : 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select salary grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {salaryGradeOptions.map(
                          (grade: { value: number; label: string }) => (
                            <SelectItem
                              key={grade.value}
                              value={grade.value.toString()}>
                              {grade.label}
                            </SelectItem>
                          )
                        )}
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
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
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
                  <CardDescription>
                    Manage user authentication and credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Password Reset</div>
                    <p className="text-sm text-muted-foreground">
                      Generate a new temporary password for {user?.firstName}{' '}
                      {user?.lastName}
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
                    onClick={() => setShowPasswordDialog(true)}>
                    Reset Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="border-border hover:bg-muted/50">
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isUpdating || !isDirty}
                  className={`
                    relative overflow-hidden border transition-all duration-200
                    ${
                      isDirty && !isUpdating
                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/80 shadow-sm hover:shadow-md'
                        : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                    }
                  `}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
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
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    You have unsaved changes
                  </p>
                </div>
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
              You have unsaved changes. Are you sure you want to leave this
              page? All changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push(`/dashboard/users/view/${userId}`)}
              className="bg-red-600 hover:bg-red-700">
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
