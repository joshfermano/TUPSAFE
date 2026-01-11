'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Mail,
  X,
  User,
  UserPlus,
  Briefcase,
  Key,
  Eye,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { useUsersQuery } from '@/hooks/useUsersQuery';
import { useDepartmentsQuery } from '@/hooks/useDepartmentsQuery';
import { usePositionsQuery } from '@/hooks/usePositionsQuery';
import { PageTransition } from '@/components/PageTransition';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form validation schema - Employee ID is now auto-generated from DOB
const userFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'Too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Too long'),
  middleName: z.string().max(50, 'Too long').optional(),
  suffix: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth is required (YYYY-MM-DD)'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['employee', 'hr', 'co_admin', 'admin', 'supervisor', 'auditor'], {
    required_error: 'Role is required',
  }),
  employmentCategory: z.enum(['faculty', 'administrative', 'contractual'], {
    required_error: 'Employment category is required',
  }),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  isActive: z.boolean(),
  sendCredentials: z.boolean(),
  // Optional link to hired application
  hiredApplicationNumber: z.string().regex(/^APP-\d{8}-\d{4}$/, 'Application number must be in format APP-YYYYMMDD-XXXX').optional().or(z.literal('')),
  notifyApplicantPersonalEmail: z.boolean(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// Available roles - matching the Role type from @tupsafe/database
const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr', label: 'HR Personnel' },
  { value: 'co_admin', label: 'Co-Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'auditor', label: 'Auditor' },
];

// Roles that require HR department assignment
const ADMIN_PORTAL_ROLES = ['admin', 'co_admin', 'hr'];

// Check if a department code indicates an HR office
function isHRDepartmentCode(code: string | undefined | null): boolean {
  if (!code) return false;
  return code.toUpperCase().startsWith('HR');
}

// Employment categories
const EMPLOYMENT_CATEGORIES = [
  { value: 'faculty', label: 'Faculty' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'contractual', label: 'Contractual' },
];

// Suffix options
const SUFFIXES = [
  { value: 'none', label: 'None' },
  { value: 'Jr.', label: 'Jr.' },
  { value: 'Sr.', label: 'Sr.' },
  { value: 'II', label: 'II' },
  { value: 'III', label: 'III' },
  { value: 'IV', label: 'IV' },
];

// Response data from API after user creation
interface CreatedUserData {
  userId: string;
  employeeId: string;
  email: string;
  temporaryPassword?: string;
  emailSent: boolean;
  linkedApplication?: {
    applicationNumber: string;
    applicationId: string;
    applicantId: string;
    applicantPersonalEmail?: string;
    applicantEmailSent: boolean;
  };
}

export default function CreateUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createUserAsync, isCreating } = useUsersQuery();

  // Get application number from query param (if any)
  const applicationNumberParam = searchParams.get('applicationNumber');
  const applicantNameParam = searchParams.get('applicantName');

  // Fetch departments and positions from API
  const {
    data: departments = [],
    isLoading: isDepartmentsLoading,
    error: departmentsError
  } = useDepartmentsQuery();

  const {
    data: positions = [],
    isLoading: isPositionsLoading,
    error: positionsError
  } = usePositionsQuery();

  const [currentStep, setCurrentStep] = useState(1);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Store created user data from API response
  const [createdUser, setCreatedUser] = useState<CreatedUserData | null>(null);
  const [isUserCreated, setIsUserCreated] = useState(false);

  const totalSteps = 4;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      suffix: 'none',
      dateOfBirth: '',
      email: '',
      role: undefined,
      employmentCategory: undefined,
      departmentId: 'none',
      positionId: 'none',
      isActive: true,
      sendCredentials: true,
      hiredApplicationNumber: applicationNumberParam || '',
      notifyApplicantPersonalEmail: true,
    },
  });

  // Update application number when query param changes
  useEffect(() => {
    if (applicationNumberParam) {
      form.setValue('hiredApplicationNumber', applicationNumberParam);
    }
  }, [applicationNumberParam, form]);

  const { watch, formState, trigger } = form;
  const { dirtyFields } = formState;
  const hasUnsavedChanges = Object.keys(dirtyFields).length > 0 && !isUserCreated;

  const watchRole = watch('role');
  const watchDateOfBirth = watch('dateOfBirth');

  // Preview employee ID format based on DOB
  const previewEmployeeId = useMemo(() => {
    if (!watchDateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(watchDateOfBirth)) {
      return 'TUPM-MMDD-YY-###';
    }
    const date = new Date(watchDateOfBirth);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `TUPM-${month}${day}-${year}-###`;
  }, [watchDateOfBirth]);

  const handleCopyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }, []);

  const progressPercentage = (currentStep / totalSteps) * 100;

  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      let fieldsToValidate: (keyof UserFormValues)[] = [];

      switch (step) {
        case 1:
          fieldsToValidate = [
            'firstName',
            'lastName',
            'middleName',
            'suffix',
            'dateOfBirth',
            'email',
          ];
          break;
        case 2:
          fieldsToValidate = ['role', 'employmentCategory', 'departmentId', 'positionId'];
          break;
        case 3:
          // Credentials step - no validation needed
          return true;
        case 4:
          // Review step - validate all fields
          return await trigger();
      }

      return await trigger(fieldsToValidate);
    },
    [trigger]
  );

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      router.push('/dashboard/users');
    }
  }, [hasUnsavedChanges, router]);

  const onSubmit = useCallback(
    async (values: UserFormValues) => {
      try {
        // Prepare data for API - transform 'none' values to undefined
        const userData = {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          middleName: values.middleName || undefined,
          dateOfBirth: values.dateOfBirth,
          role: values.role,
          employmentCategory: values.employmentCategory,
          departmentId: values.departmentId === 'none' ? undefined : values.departmentId,
          positionId: values.positionId === 'none' ? undefined : values.positionId,
          sendCredentials: values.sendCredentials,
          // Link to hired application if provided
          hiredApplicationNumber: values.hiredApplicationNumber || undefined,
          notifyApplicantPersonalEmail: values.notifyApplicantPersonalEmail,
        };

        // Call API - it handles password generation and email sending
        const result = await createUserAsync(userData);

        // Store the result for display
        setCreatedUser(result);
        setIsUserCreated(true);

        toast.success('User created successfully', {
          description: `${values.firstName} ${values.lastName} has been added to the system.`,
        });

        // Show email status
        if (values.sendCredentials) {
          if (result.emailSent) {
            toast.success('Credentials email sent', {
              description: `Login credentials have been sent to ${values.email}`,
            });
          } else {
            toast.warning('Email not sent', {
              description: 'User was created but the credentials email could not be sent. Please share the credentials manually.',
            });
          }
        }

        // Show linked application status
        if (result.linkedApplication) {
          toast.success('Application linked', {
            description: `Linked to application ${result.linkedApplication.applicationNumber}${
              result.linkedApplication.applicantEmailSent
                ? '. Credentials also sent to applicant.'
                : '.'
            }`,
          });
        }
      } catch (error) {
        toast.error('Failed to create user', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      }
    },
    [createUserAsync]
  );

  // Check if selected role requires a department
  const roleRequiresDepartment = useMemo(() => {
    return ['employee', 'supervisor', ...ADMIN_PORTAL_ROLES].includes(watchRole || '');
  }, [watchRole]);

  // Check if selected role requires an HR department specifically
  const roleRequiresHRDepartment = useMemo(() => {
    return ADMIN_PORTAL_ROLES.includes(watchRole || '');
  }, [watchRole]);

  // Transform API data into dropdown format
  // Filter to HR* departments only for admin portal roles
  const departmentOptions = useMemo(() => {
    const filteredDepartments = roleRequiresHRDepartment
      ? departments.filter((dept) => isHRDepartmentCode(dept.code))
      : departments;

    return [
      ...(roleRequiresHRDepartment ? [] : [{ value: 'none', label: 'None' }]),
      ...filteredDepartments.map((dept) => ({
        value: dept.id,
        label: `${dept.name} (${dept.code})`,
        code: dept.code,
      })),
    ];
  }, [departments, roleRequiresHRDepartment]);

  const positionOptions = useMemo(() => {
    return [
      { value: 'none', label: 'None' },
      ...positions.map((pos) => ({
        value: pos.id,
        label: pos.title,
      })),
    ];
  }, [positions]);

  // Show error toasts for API failures
  React.useEffect(() => {
    if (departmentsError) {
      toast.error('Failed to load departments', {
        description: departmentsError.message,
      });
    }
  }, [departmentsError]);

  React.useEffect(() => {
    if (positionsError) {
      toast.error('Failed to load positions', {
        description: positionsError.message,
      });
    }
  }, [positionsError]);

  return (
    <PageTransition className="space-y-6">
      {/* Loading Screen Overlay */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-[400px] border-2 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-primary/50" />
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-semibold">Creating User</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we set up the new user account...
                  </p>
                </div>
                <div className="w-full space-y-2">
                  <Progress value={66} className="h-2" />
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Validating information</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
          <p className="text-muted-foreground">
            Add a new user to the system with role and permissions
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Step {currentStep} of {totalSteps}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}% Complete</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-2" />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { number: 1, label: 'Personal Info', icon: User },
              { number: 2, label: 'Role & Assignment', icon: Briefcase },
              { number: 3, label: 'Credentials', icon: Key },
              { number: 4, label: 'Review', icon: Eye },
            ].map(({ number, label, icon: Icon }) => (
              <div
                key={number}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                  currentStep === number
                    ? 'bg-primary/10 text-primary'
                    : currentStep > number
                      ? 'bg-muted text-muted-foreground'
                      : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success State - Show after user is created */}
      {isUserCreated && createdUser && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">User Created Successfully</CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Copy the credentials below or share them with the new user
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employee ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-900 dark:text-green-100">Employee ID</label>
              <div className="flex gap-2">
                <Input
                  value={createdUser.employeeId}
                  readOnly
                  className="bg-white dark:bg-green-950 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyToClipboard(createdUser.employeeId, 'Employee ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Temporary Password */}
            {createdUser.temporaryPassword && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-900 dark:text-green-100">Temporary Password</label>
                <div className="flex gap-2">
                  <Input
                    value={createdUser.temporaryPassword}
                    readOnly
                    className="bg-white dark:bg-green-950 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyToClipboard(createdUser.temporaryPassword!, 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Email Status */}
            <div className="flex items-center gap-2 text-sm">
              {createdUser.emailSent ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 dark:text-green-300">
                    Credentials email sent to {createdUser.email}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-300">
                    Email not sent - please share credentials manually
                  </span>
                </>
              )}
            </div>

            {/* Linked Application Status */}
            {createdUser.linkedApplication && (
              <div className="space-y-2 rounded-lg bg-white dark:bg-green-950 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    Linked to application: {createdUser.linkedApplication.applicationNumber}
                  </span>
                </div>
                {createdUser.linkedApplication.applicantPersonalEmail && (
                  <div className="flex items-center gap-2 text-sm pl-6">
                    {createdUser.linkedApplication.applicantEmailSent ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 dark:text-green-300">
                          Credentials also sent to: {createdUser.linkedApplication.applicantPersonalEmail}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-700 dark:text-amber-300">
                          Could not send to applicant email
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="flex gap-3">
              <Button onClick={() => router.push('/dashboard/users')}>
                Go to Users List
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsUserCreated(false);
                  setCreatedUser(null);
                  form.reset();
                  setCurrentStep(1);
                }}
              >
                Create Another User
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form - Hide after user is created */}
      {!isUserCreated && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Enter the user&apos;s basic personal and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                              type="date" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Employee ID will be auto-generated: <span className="font-mono text-primary">{previewEmployeeId}</span>
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
                </CardContent>
              </Card>
            )}

            {/* Step 2: Role & Assignment */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Role & Assignment</CardTitle>
                  <CardDescription>
                    Assign a role, employment category, department, and position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
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

                    <FormField
                      control={form.control}
                      name="employmentCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EMPLOYMENT_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
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
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Department {roleRequiresDepartment && '*'}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isDepartmentsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isDepartmentsLoading
                                    ? 'Loading departments...'
                                    : roleRequiresHRDepartment
                                      ? 'Select HR department'
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
                        {isDepartmentsLoading && (
                          <FormDescription>Loading departments...</FormDescription>
                        )}
                        {roleRequiresHRDepartment && !isDepartmentsLoading && (
                          <FormDescription className="text-amber-600 dark:text-amber-400">
                            Admin Portal users (Admin, Co-Admin, HR) must be assigned to an HR office.
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
                        <FormLabel>Position</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isPositionsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isPositionsLoading ? 'Loading positions...' : 'Select position'
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

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Account Status</FormLabel>
                          <FormDescription>
                            Active users can log in and access the system
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
            )}

            {/* Step 3: Account Credentials */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Credentials</CardTitle>
                  <CardDescription>
                    Credentials will be auto-generated when you create the user
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertTitle>Auto-Generated Credentials</AlertTitle>
                    <AlertDescription>
                      When you submit this form, the system will automatically generate:
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>
                          <strong>Employee ID:</strong> Based on date of birth ({previewEmployeeId})
                        </li>
                        <li>
                          <strong>Temporary Password:</strong> A secure 12-character password
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
                    <div className="flex gap-3">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Email Delivery
                        </p>
                        <FormField
                          control={form.control}
                          name="sendCredentials"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-2 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal text-blue-800 dark:text-blue-200">
                                Send credentials via email to {watch('email') || 'user'}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          If disabled, you&apos;ll need to share the credentials manually after creation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Link to Hired Application */}
                  <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-4">
                    <div className="flex gap-3">
                      <LinkIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-3">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Link to Hired Application (Optional)
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          If this employee was hired from a job application, enter the application number to link them and notify the applicant.
                        </p>
                        <FormField
                          control={form.control}
                          name="hiredApplicationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="APP-YYYYMMDD-XXXX"
                                  {...field}
                                  className="font-mono bg-white dark:bg-amber-950"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {watch('hiredApplicationNumber') && (
                          <FormField
                            control={form.control}
                            name="notifyApplicantPersonalEmail"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal text-amber-800 dark:text-amber-200">
                                  Also send credentials to applicant&apos;s personal email
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        )}
                        {applicantNameParam && watch('hiredApplicationNumber') && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Linking to: <strong>{applicantNameParam}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review & Confirm */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review & Confirm</CardTitle>
                  <CardDescription>
                    Review all information before creating the user
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Personal Information</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(1)}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="grid gap-2 rounded-lg border p-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Full Name:</span>
                        <span className="font-medium">
                          {watch('firstName')} {watch('middleName')} {watch('lastName')}{' '}
                          {watch('suffix') !== 'none' && watch('suffix')}
                        </span>
                        <span className="text-muted-foreground">Date of Birth:</span>
                        <span className="font-medium">{watch('dateOfBirth')}</span>
                        <span className="text-muted-foreground">Employee ID (Preview):</span>
                        <span className="font-medium font-mono">{previewEmployeeId}</span>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{watch('email')}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Role & Assignment */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Role & Assignment</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(2)}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="grid gap-2 rounded-lg border p-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Role:</span>
                        <Badge variant="outline" className="w-fit capitalize">
                          {watch('role')?.replace('_', ' ')}
                        </Badge>
                        <span className="text-muted-foreground">Employment Category:</span>
                        <Badge variant="secondary" className="w-fit capitalize">
                          {watch('employmentCategory')}
                        </Badge>
                        <span className="text-muted-foreground">Department:</span>
                        <span className="font-medium">
                          {departmentOptions.find((d) => d.value === watch('departmentId'))
                            ?.label || 'Not assigned'}
                        </span>
                        <span className="text-muted-foreground">Position:</span>
                        <span className="font-medium">
                          {positionOptions.find((p) => p.value === watch('positionId'))?.label ||
                            'Not assigned'}
                        </span>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={watch('isActive') ? 'default' : 'secondary'}>
                          {watch('isActive') ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Credentials */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Account Credentials</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(3)}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="grid gap-2 rounded-lg border p-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Employee ID:</span>
                        <span className="font-medium font-mono">{previewEmployeeId}</span>
                        <span className="text-muted-foreground">Password:</span>
                        <span className="font-medium font-mono text-muted-foreground">
                          (will be auto-generated)
                        </span>
                        <span className="text-muted-foreground">Send Email:</span>
                        <Badge variant={watch('sendCredentials') ? 'default' : 'secondary'}>
                          {watch('sendCredentials') ? 'Yes' : 'No'}
                        </Badge>
                        {watch('hiredApplicationNumber') && (
                          <>
                            <span className="text-muted-foreground">Linked Application:</span>
                            <span className="font-medium font-mono text-amber-600 dark:text-amber-400">
                              {watch('hiredApplicationNumber')}
                            </span>
                            <span className="text-muted-foreground">Notify Applicant:</span>
                            <Badge variant={watch('notifyApplicantPersonalEmail') ? 'default' : 'secondary'}>
                              {watch('notifyApplicantPersonalEmail') ? 'Yes' : 'No'}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between gap-4">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    {currentStep > 1 && (
                      <Button type="button" variant="outline" onClick={handleBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                    )}
                  </div>

                  {currentStep < totalSteps ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={isCreating}
                      className="border-2 border-primary/60 hover:border-primary/80 hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Create User
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page? All progress
              will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/dashboard/users')}
              className="bg-red-600 hover:bg-red-700"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
