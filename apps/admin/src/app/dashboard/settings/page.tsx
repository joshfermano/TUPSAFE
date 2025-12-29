'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  PersonIcon,
  LockClosedIcon,
  MixerVerticalIcon,
  MoonIcon,
  SunIcon,
  DesktopIcon,
  BellIcon,
  ClockIcon,
  ReloadIcon,
  ExclamationTriangleIcon,
  EyeOpenIcon,
  EyeNoneIcon,
  Cross2Icon,
} from '@radix-ui/react-icons';

import { PageTransition } from '@/components/PageTransition';
import { AvatarUpload } from '@/components/settings/AvatarUpload';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

import {
  useUserProfileQuery,
  useUserPreferencesQuery,
  usePasswordChangeQuery,
  useActiveSessionsQuery,
} from '@/hooks';
import {
  updateProfileRequestSchema,
  updatePreferencesRequestSchema,
  changePasswordRequestSchema,
  type UpdateProfileRequest,
  type UpdatePreferencesRequest,
  type ChangePasswordRequest,
} from '@tupsafe/types';

/**
 * Common Timezones for Philippines
 */
const COMMON_TIMEZONES = [
  { value: 'Asia/Manila', label: 'Manila (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (GMT+8)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
];

/**
 * Password Strength Indicator Component
 */
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength += 20;
    if (pwd.length >= 12) strength += 20;
    if (/[a-z]/.test(pwd)) strength += 15;
    if (/[A-Z]/.test(pwd)) strength += 15;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength += 15;
    return Math.min(strength, 100);
  };

  const strength = getStrength(password);
  const getColor = () => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getLabel = () => {
    if (strength === 0) return '';
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password Strength</span>
        <span className="font-medium">{getLabel()}</span>
      </div>
      <Progress value={strength} className={`h-1.5 ${getColor()}`} />
    </div>
  );
};

/**
 * Change Password Dialog Component
 */
const ChangePasswordDialog = () => {
  const [open, setOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { changePassword, isChanging, isSuccess, reset } =
    usePasswordChangeQuery();

  const form = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordRequestSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = form.watch('newPassword');

  // Clear form on success
  useEffect(() => {
    if (isSuccess && open) {
      form.reset();
      setOpen(false);
      reset();
    }
  }, [isSuccess, open, form, reset]);

  const onSubmit = async (data: ChangePasswordRequest) => {
    changePassword(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LockClosedIcon className="mr-2 h-4 w-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new strong password
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...field}
                        disabled={isChanging}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeNoneIcon className="h-4 w-4" />
                        ) : (
                          <EyeOpenIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        {...field}
                        disabled={isChanging}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeNoneIcon className="h-4 w-4" />
                        ) : (
                          <EyeOpenIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <PasswordStrengthIndicator password={newPassword} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...field}
                        disabled={isChanging}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeNoneIcon className="h-4 w-4" />
                        ) : (
                          <EyeOpenIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isChanging}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isChanging}>
                {isChanging && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Active Sessions Component
 */
const ActiveSessions = () => {
  const {
    sessions,
    otherSessions,
    isLoading,
    revokeSession,
    isRevokingSession,
    revokeAllSessions,
    isRevokingAllSessions,
  } = useActiveSessionsQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const handleRevokeSession = (sessionId: string) => {
    revokeSession({ sessionId });
  };

  const handleRevokeAllSessions = () => {
    revokeAllSessions({ keepCurrent: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Active Sessions</h3>
          <p className="text-sm text-muted-foreground">
            Manage devices that are currently logged in ({sessions.length} active)
          </p>
        </div>
        {otherSessions.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isRevokingAllSessions}
              >
                {isRevokingAllSessions && (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Revoke All Others
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke all other sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will log out all other devices ({otherSessions.length}{' '}
                  session{otherSessions.length !== 1 ? 's' : ''}). Your current
                  session will remain active.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevokeAllSessions}>
                  Revoke All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No active sessions found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <DesktopIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{session.deviceName}</p>
                        {session.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {session.browser} on {session.os}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.location} • {session.ipAddress}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active:{' '}
                        {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isRevokingSession}
                        >
                          <Cross2Icon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will log out the device: {session.deviceName}. This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            Revoke Session
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Profile Section Component
 */
const ProfileSection = () => {
  const { 
    profile, 
    isLoading, 
    updateProfile, 
    isUpdating,
    uploadAvatar,
    deleteAvatar,
    isUploadingAvatar,
    isDeletingAvatar,
  } = useUserProfileQuery();

  const isAvatarLoading = isUploadingAvatar || isDeletingAvatar;

  const handleAvatarUpload = async (file: File) => {
    uploadAvatar(file);
  };

  const handleAvatarRemove = async () => {
    deleteAvatar();
  };

  const form = useForm<UpdateProfileRequest>({
    resolver: zodResolver(updateProfileRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      phoneNumber: '',
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        middleName: profile.middleName || '',
        phoneNumber: profile.phoneNumber || '',
      });
    }
  }, [profile, form]);

  const onSubmit = (data: UpdateProfileRequest) => {
    updateProfile(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-lg border border-destructive/50 p-4 text-sm">
        <div className="flex items-center gap-2 text-destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span className="font-medium">Unable to load profile</span>
        </div>
        <p className="text-muted-foreground mt-1">
          Please refresh the page or contact support
        </p>
      </div>
    );
  }

  const fullName = profile ? `${profile.firstName} ${profile.middleName ? profile.middleName + ' ' : ''}${profile.lastName}` : 'User';

  return (
    <Accordion type="multiple" className="w-full" defaultValue={['profile-picture', 'profile-info']}>
      <AccordionItem value="profile-picture">
        <AccordionTrigger className="text-base font-medium">
          Profile Picture
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex justify-center py-4">
            <AvatarUpload
              currentAvatar={profile?.avatarUrl}
              userName={fullName}
              onUpload={handleAvatarUpload}
              onRemove={handleAvatarRemove}
              isLoading={isAvatarLoading}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="profile-info">
        <AccordionTrigger className="text-base font-medium">
          Profile Information
        </AccordionTrigger>
        <AccordionContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isUpdating} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isUpdating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} disabled={isUpdating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="09171234567"
                        disabled={isUpdating}
                      />
                    </FormControl>
                    <FormDescription>
                      Philippine mobile number format (e.g., 09171234567)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input value={profile.email} disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed directly
                  </p>
                </div>

                {profile.employeeId && (
                  <div>
                    <Label>Employee ID</Label>
                    <Input value={profile.employeeId} disabled />
                    <p className="text-xs text-muted-foreground mt-1">Read-only</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Organizational Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div>
                      <Badge variant="default" className="capitalize">
                        {profile.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div>
                      <Badge
                        variant={
                          profile.accountStatus === 'active'
                            ? 'default'
                            : profile.accountStatus === 'suspended'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="capitalize"
                      >
                        {profile.accountStatus}
                      </Badge>
                    </div>
                  </div>

                  {profile.department && (
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <div>
                        <Badge variant="outline">{profile.department.name}</Badge>
                      </div>
                    </div>
                  )}

                  {profile.position && (
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <div>
                        <Badge variant="outline">{profile.position.title}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                {isUpdating && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

/**
 * Preferences Section Component
 */
const PreferencesSection = () => {
  const { preferences, isLoading, updatePreferences, isUpdating } =
    useUserPreferencesQuery();

  const form = useForm<UpdatePreferencesRequest>({
    resolver: zodResolver(updatePreferencesRequestSchema),
    defaultValues: {
      emailNotificationsEnabled: true,
      emailDigestFrequency: 'daily',
      theme: 'system',
      dashboardLayout: 'default',
      language: 'en',
      timezone: 'Asia/Manila',
    },
  });

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      form.reset({
        emailNotificationsEnabled: preferences.emailNotificationsEnabled,
        emailDigestFrequency: preferences.emailDigestFrequency,
        theme: preferences.theme,
        dashboardLayout: preferences.dashboardLayout,
        language: preferences.language,
        timezone: preferences.timezone,
      });
    }
  }, [preferences, form]);

  const onSubmit = (data: UpdatePreferencesRequest) => {
    updatePreferences(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="rounded-lg border border-destructive/50 p-4 text-sm">
        <div className="flex items-center gap-2 text-destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span className="font-medium">Unable to load preferences</span>
        </div>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full" defaultValue={['notifications']}>
      <AccordionItem value="notifications">
        <AccordionTrigger className="text-base font-medium">
          Notifications
        </AccordionTrigger>
        <AccordionContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="emailNotificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <BellIcon className="h-4 w-4" />
                        Email Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive notifications via email
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isUpdating}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailDigestFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Digest Frequency</FormLabel>
                    <FormDescription>
                      How often to receive email summaries
                    </FormDescription>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isUpdating}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                {isUpdating && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                Save Notification Settings
              </Button>
            </form>
          </Form>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="appearance">
        <AccordionTrigger className="text-base font-medium">
          Appearance & Display
        </AccordionTrigger>
        <AccordionContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <FormDescription>
                      Choose how the admin portal appears
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-4"
                        disabled={isUpdating}
                      >
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="light" id="light" />
                              <Label htmlFor="light" className="flex items-center gap-2">
                                <SunIcon className="h-4 w-4" />
                                Light
                              </Label>
                            </div>
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="dark" id="dark" />
                              <Label htmlFor="dark" className="flex items-center gap-2">
                                <MoonIcon className="h-4 w-4" />
                                Dark
                              </Label>
                            </div>
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="system" id="system" />
                              <Label htmlFor="system" className="flex items-center gap-2">
                                <DesktopIcon className="h-4 w-4" />
                                System
                              </Label>
                            </div>
                          </FormControl>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dashboardLayout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dashboard Layout</FormLabel>
                    <FormDescription>
                      Choose your preferred dashboard density
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-4"
                        disabled={isUpdating}
                      >
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="compact" id="compact" />
                              <Label htmlFor="compact">Compact</Label>
                            </div>
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="default" id="default" />
                              <Label htmlFor="default">Default</Label>
                            </div>
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="detailed" id="detailed" />
                              <Label htmlFor="detailed">Detailed</Label>
                            </div>
                          </FormControl>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                {isUpdating && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                Save Appearance Settings
              </Button>
            </form>
          </Form>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="regional">
        <AccordionTrigger className="text-base font-medium">
          Regional Settings
        </AccordionTrigger>
        <AccordionContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormDescription>Select your preferred language</FormDescription>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isUpdating}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fil">Filipino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      Timezone
                    </FormLabel>
                    <FormDescription>
                      Select your timezone for accurate time display
                    </FormDescription>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isUpdating}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                {isUpdating && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                Save Regional Settings
              </Button>
            </form>
          </Form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

/**
 * Main Settings Page Component
 */
export default function SettingsPage() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const TabWrapper = ({
    children,
    delay = 0,
  }: {
    children: React.ReactNode;
    delay?: number;
  }) => {
    if (prefersReducedMotion) return <>{children}</>;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    );
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile, preferences, and security settings
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <PersonIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <MixerVerticalIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <LockClosedIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <DesktopIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <TabWrapper>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PersonIcon className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account information and organizational details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileSection />
                </CardContent>
              </Card>
            </TabWrapper>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <TabWrapper delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MixerVerticalIcon className="h-5 w-5" />
                    User Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize your experience and notification settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PreferencesSection />
                </CardContent>
              </Card>
            </TabWrapper>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <TabWrapper delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LockClosedIcon className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Change your account password
                      </p>
                    </div>
                    <ChangePasswordDialog />
                  </div>
                </CardContent>
              </Card>
            </TabWrapper>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <TabWrapper delay={0.3}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DesktopIcon className="h-5 w-5" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>
                    Manage devices and locations where you&apos;re logged in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ActiveSessions />
                </CardContent>
              </Card>
            </TabWrapper>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
