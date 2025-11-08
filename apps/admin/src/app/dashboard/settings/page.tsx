'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Save,
  Settings as SettingsIcon,
  User,
  Shield,
  Sliders,
  Monitor,
  Moon,
  Sun,
  Bell,
  Clock,
  Key,
  Smartphone,
  LogOut,
  LayoutGrid,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/PageTransition';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

/**
 * Form Schemas
 */

const systemSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  notificationsEnabled: z.boolean(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  dataRefreshInterval: z.enum(['5', '10', '15', '30']),
  defaultView: z.enum(['compact', 'comfortable', 'spacious']),
});

const accountSettingsSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const securitySettingsSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const preferencesSchema = z.object({
  dashboardLayout: z.enum(['compact', 'comfortable', 'spacious']),
  itemsPerPage: z.enum(['10', '25', '50', '100']),
  exportFormat: z.enum(['csv', 'pdf']),
  showPendingOnly: z.boolean(),
  showRecentActivity: z.boolean(),
  sessionTimeout: z.enum(['15', '30', '60', '120']),
});

type SystemSettings = z.infer<typeof systemSettingsSchema>;
type AccountSettings = z.infer<typeof accountSettingsSchema>;
type SecuritySettings = z.infer<typeof securitySettingsSchema>;
type Preferences = z.infer<typeof preferencesSchema>;

/**
 * Mock user data
 */
const mockUser = {
  displayName: 'Admin User',
  email: 'admin@tupsafe.tup.edu.ph',
  role: 'System Administrator',
  department: 'Information Technology',
};

/**
 * Active Sessions Component
 */
const ActiveSessions = () => {
  const sessions = [
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'Manila, Philippines',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'Manila, Philippines',
      lastActive: '2 hours ago',
      current: false,
    },
  ];

  const handleRevokeSession = (sessionId: string) => {
    toast.success('Session revoked successfully');
    console.log('Revoking session:', sessionId);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Active Sessions</h3>
        <p className="text-sm text-muted-foreground">
          Manage devices that are currently logged in
        </p>
      </div>
      <div className="space-y-3">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Monitor className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{session.device}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.location} • {session.lastActive}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.current && (
                    <Badge variant="outline" className="text-xs">
                      Current
                    </Badge>
                  )}
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

/**
 * Change Password Dialog Component
 */
const ChangePasswordDialog = () => {
  const [open, setOpen] = useState(false);

  const form = useForm<SecuritySettings>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: SecuritySettings) => {
    console.log('Changing password:', data);
    toast.success('Password changed successfully');
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Key className="mr-2 h-4 w-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one
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
                    <Input type="password" {...field} />
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
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Change Password</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
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

  // System Settings Form
  const systemForm = useForm<SystemSettings>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      theme: 'system',
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: false,
      dataRefreshInterval: '15',
      defaultView: 'comfortable',
    },
  });

  // Account Settings Form
  const accountForm = useForm<AccountSettings>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      displayName: mockUser.displayName,
      email: mockUser.email,
    },
  });

  // Preferences Form
  const preferencesForm = useForm<Preferences>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      dashboardLayout: 'comfortable',
      itemsPerPage: '25',
      exportFormat: 'pdf',
      showPendingOnly: false,
      showRecentActivity: true,
      sessionTimeout: '30',
    },
  });

  const onSystemSettingsSave = (data: SystemSettings) => {
    console.log('Saving system settings:', data);
    toast.success('System settings saved successfully');
  };

  const onAccountSettingsSave = (data: AccountSettings) => {
    console.log('Saving account settings:', data);
    toast.success('Account settings saved successfully');
  };

  const onPreferencesSave = (data: Preferences) => {
    console.log('Saving preferences:', data);
    toast.success('Preferences saved successfully');
  };

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
            Manage your system preferences and account settings
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="system" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Sliders className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-4">
            <TabWrapper>
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure system appearance and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...systemForm}>
                    <form
                      onSubmit={systemForm.handleSubmit(onSystemSettingsSave)}
                      className="space-y-6"
                    >
                      {/* Theme Setting */}
                      <FormField
                        control={systemForm.control}
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
                                defaultValue={field.value}
                                className="grid grid-cols-3 gap-4"
                              >
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="light" id="light" />
                                      <Label htmlFor="light" className="flex items-center gap-2">
                                        <Sun className="h-4 w-4" />
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
                                        <Moon className="h-4 w-4" />
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
                                        <Monitor className="h-4 w-4" />
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

                      <Separator />

                      {/* Notification Preferences */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Notifications</h3>
                          <p className="text-sm text-muted-foreground">
                            Configure notification preferences
                          </p>
                        </div>

                        <FormField
                          control={systemForm.control}
                          name="notificationsEnabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="flex items-center gap-2">
                                  <Bell className="h-4 w-4" />
                                  Enable Notifications
                                </FormLabel>
                                <FormDescription>
                                  Receive system notifications
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

                        <FormField
                          control={systemForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive notifications via email
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

                        <FormField
                          control={systemForm.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Push Notifications</FormLabel>
                                <FormDescription>
                                  Receive browser push notifications
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
                      </div>

                      <Separator />

                      {/* Data Refresh Interval */}
                      <FormField
                        control={systemForm.control}
                        name="dataRefreshInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Data Refresh Interval
                            </FormLabel>
                            <FormDescription>
                              How often to refresh dashboard data
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select interval" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="5">Every 5 minutes</SelectItem>
                                <SelectItem value="10">Every 10 minutes</SelectItem>
                                <SelectItem value="15">Every 15 minutes</SelectItem>
                                <SelectItem value="30">Every 30 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        Save System Settings
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabWrapper>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-4">
            <TabWrapper delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Manage your account details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...accountForm}>
                    <form
                      onSubmit={accountForm.handleSubmit(onAccountSettingsSave)}
                      className="space-y-6"
                    >
                      <FormField
                        control={accountForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              This is how your name appears in the system
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={accountForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} disabled />
                            </FormControl>
                            <FormDescription>
                              Your institutional email address (read-only)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Role & Department</h3>
                          <p className="text-sm text-muted-foreground">
                            Your organizational assignment
                          </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <div>
                              <Badge variant="default">{mockUser.role}</Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Department</Label>
                            <div>
                              <Badge variant="outline">{mockUser.department}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        Save Account Settings
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabWrapper>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-4">
            <TabWrapper delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Change your account password
                      </p>
                    </div>
                    <ChangePasswordDialog />
                  </div>

                  <Separator />

                  {/* Session Timeout */}
                  <Form {...preferencesForm}>
                    <FormField
                      control={preferencesForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Session Timeout
                          </FormLabel>
                          <FormDescription>
                            Auto-logout after period of inactivity
                          </FormDescription>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeout" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>

                  <Separator />

                  {/* Two-Factor Authentication */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Badge variant="outline" className="text-yellow-600">
                        Not Enabled
                      </Badge>
                    </div>
                    <Button variant="outline">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Setup 2FA
                    </Button>
                  </div>

                  <Separator />

                  {/* Active Sessions */}
                  <ActiveSessions />
                </CardContent>
              </Card>
            </TabWrapper>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <TabWrapper delay={0.3}>
              <Card>
                <CardHeader>
                  <CardTitle>User Preferences</CardTitle>
                  <CardDescription>
                    Customize your experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...preferencesForm}>
                    <form
                      onSubmit={preferencesForm.handleSubmit(onPreferencesSave)}
                      className="space-y-6"
                    >
                      {/* Dashboard Layout */}
                      <FormField
                        control={preferencesForm.control}
                        name="dashboardLayout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <LayoutGrid className="h-4 w-4" />
                              Dashboard Layout
                            </FormLabel>
                            <FormDescription>
                              Choose your preferred dashboard density
                            </FormDescription>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-3 gap-4"
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
                                      <RadioGroupItem value="comfortable" id="comfortable" />
                                      <Label htmlFor="comfortable">Comfortable</Label>
                                    </div>
                                  </FormControl>
                                </FormItem>
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="spacious" id="spacious" />
                                      <Label htmlFor="spacious">Spacious</Label>
                                    </div>
                                  </FormControl>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      {/* Items Per Page */}
                      <FormField
                        control={preferencesForm.control}
                        name="itemsPerPage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Items Per Page</FormLabel>
                            <FormDescription>
                              Number of items to display in tables
                            </FormDescription>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select items per page" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="10">10 items</SelectItem>
                                <SelectItem value="25">25 items</SelectItem>
                                <SelectItem value="50">50 items</SelectItem>
                                <SelectItem value="100">100 items</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      {/* Export Format Preference */}
                      <FormField
                        control={preferencesForm.control}
                        name="exportFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <FileDown className="h-4 w-4" />
                              Default Export Format
                            </FormLabel>
                            <FormDescription>
                              Preferred format for exporting reports
                            </FormDescription>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="csv" id="csv" />
                                      <Label htmlFor="csv">CSV</Label>
                                    </div>
                                  </FormControl>
                                </FormItem>
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="pdf" id="pdf" />
                                      <Label htmlFor="pdf">PDF</Label>
                                    </div>
                                  </FormControl>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      {/* Filter Preferences */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Default Filters</h3>
                          <p className="text-sm text-muted-foreground">
                            Set default filters for dashboard views
                          </p>
                        </div>

                        <FormField
                          control={preferencesForm.control}
                          name="showPendingOnly"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Show Pending Only</FormLabel>
                                <FormDescription>
                                  Show only pending submissions by default
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

                        <FormField
                          control={preferencesForm.control}
                          name="showRecentActivity"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Show Recent Activity</FormLabel>
                                <FormDescription>
                                  Display recent activity feed on dashboard
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
                      </div>

                      <Button type="submit" className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabWrapper>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
