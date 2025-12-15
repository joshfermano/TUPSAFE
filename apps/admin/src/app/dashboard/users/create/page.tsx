'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Mail,
  RefreshCw,
  X,
  User,
  Briefcase,
  Key,
  Eye,
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

// Form validation schema
const userFormSchema = z.object({
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
  positionId: z.string().optional(),
  isActive: z.boolean(),
  sendEmail: z.boolean(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// Available roles - matching the Role type from @tupsafe/database
const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr', label: 'HR Personnel' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'auditor', label: 'Auditor' },
];

// Note: DEPARTMENTS and POSITIONS are now fetched from the API via hooks

// Suffix options
const SUFFIXES = [
  { value: 'none', label: 'None' },
  { value: 'Jr.', label: 'Jr.' },
  { value: 'Sr.', label: 'Sr.' },
  { value: 'II', label: 'II' },
  { value: 'III', label: 'III' },
  { value: 'IV', label: 'IV' },
];

// Utility functions
function generateUsername(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '');
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendCredentialsEmail(
  email: string,
  employeeId: string,
  password: string,
  firstName: string
) {
  try {
    const res = await fetch('/api/auth/send-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        employeeId,
        temporaryPassword: password,
        firstName,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send email');
    }

    const data = await res.json();

    toast.success('Credentials sent successfully', {
      description: `Login credentials have been sent to ${email}`,
    });

    return data;
  } catch (error) {
    toast.error('Failed to send credentials', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error; // Re-throw to handle in calling code
  }
}

export default function CreateUserPage() {
  const router = useRouter();
  const { createUserAsync, isCreating } = useUsersQuery();

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
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [customUsername, setCustomUsername] = useState(false);

  const totalSteps = 4;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      suffix: 'none',
      employeeId: '',
      email: '',
      role: undefined,
      departmentId: 'none',
      positionId: 'none',
      isActive: true,
      sendEmail: true,
    },
  });

  const { watch, formState, trigger } = form;
  const { dirtyFields } = formState;
  const hasUnsavedChanges = Object.keys(dirtyFields).length > 0;

  const watchFirstName = watch('firstName');
  const watchLastName = watch('lastName');
  const watchRole = watch('role');

  // Auto-generate username when first/last name changes
  React.useEffect(() => {
    if (watchFirstName && watchLastName && !customUsername) {
      const username = generateUsername(watchFirstName, watchLastName);
      setGeneratedUsername(username);
    }
  }, [watchFirstName, watchLastName, customUsername]);

  // Generate initial password on mount
  React.useEffect(() => {
    setGeneratedPassword(generatePassword());
  }, []);

  const handleRegeneratePassword = useCallback(() => {
    setGeneratedPassword(generatePassword());
    toast.success('Password regenerated', {
      description: 'A new temporary password has been generated.',
    });
  }, []);

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
            'employeeId',
            'email',
          ];
          break;
        case 2:
          fieldsToValidate = ['role', 'departmentId', 'positionId'];
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
        // Extract sendEmail before sending to backend
        const { sendEmail, ...userData } = values;

        await createUserAsync(userData);

        toast.success('User created successfully', {
          description: `${values.firstName} ${values.lastName} has been added to the system.`,
        });

        // Send credentials email if requested (don't block user creation on email failure)
        if (sendEmail) {
          try {
            await sendCredentialsEmail(
              values.email,
              values.employeeId,
              generatedPassword,
              values.firstName
            );
          } catch (emailError) {
            // Email error already toasted in sendCredentialsEmail
            console.error('Email sending failed:', emailError);
            // User can still proceed to users list even if email fails
          }
        }

        router.push('/dashboard/users');
      } catch (error) {
        toast.error('Failed to create user', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      }
    },
    [createUserAsync, generatedPassword, router]
  );

  const roleRequiresDepartment = useMemo(() => {
    return ['employee', 'supervisor'].includes(watchRole || '');
  }, [watchRole]);

  // Transform API data into dropdown format
  const departmentOptions = useMemo(() => {
    return [
      { value: 'none', label: 'None' },
      ...departments.map((dept) => ({
        value: dept.id,
        label: dept.name,
      })),
    ];
  }, [departments]);

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
            <span className="text-sm text-muted-foreground">{progressPercentage}% Complete</span>
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

      {/* Form */}
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
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="EMP-2024-001" {...field} />
                      </FormControl>
                      <FormDescription>
                        Format: Letters, numbers, and hyphens only (e.g., EMP-2024-001)
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
                  Assign a role, department, and position to the user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  Auto-generated credentials for the user&apos;s account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Username */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Username</label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomUsername(!customUsername)}
                      >
                        {customUsername ? 'Use Auto-generated' : 'Customize'}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={generatedUsername}
                        onChange={(e) => setGeneratedUsername(e.target.value)}
                        disabled={!customUsername}
                        className={!customUsername ? 'bg-muted' : ''}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleCopyToClipboard(generatedUsername, 'Username')
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-generated from first and last name
                    </p>
                  </div>

                  <Separator />

                  {/* Temporary Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Temporary Password</label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRegeneratePassword}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={generatedPassword}
                        readOnly
                        className="bg-muted font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleCopyToClipboard(generatedPassword, 'Password')
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      12 characters with uppercase, lowercase, numbers, and symbols
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
                  <div className="flex gap-3">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Email Delivery
                      </p>
                      <FormField
                        control={form.control}
                        name="sendEmail"
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
                        {watch('suffix')}
                      </span>
                      <span className="text-muted-foreground">Employee ID:</span>
                      <span className="font-medium">{watch('employeeId')}</span>
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
                      <span className="text-muted-foreground">Username:</span>
                      <span className="font-medium font-mono">{generatedUsername}</span>
                      <span className="text-muted-foreground">Password:</span>
                      <span className="font-medium font-mono">
                        {generatedPassword.slice(0, 4)}****{generatedPassword.slice(-2)}
                      </span>
                      <span className="text-muted-foreground">Send Email:</span>
                      <Badge variant={watch('sendEmail') ? 'default' : 'secondary'}>
                        {watch('sendEmail') ? 'Yes' : 'No'}
                      </Badge>
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
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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
