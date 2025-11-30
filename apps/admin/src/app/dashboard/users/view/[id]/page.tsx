'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  Mail,
  UserCheck,
  UserX,
  Key,
  FileText,
  Clock,
  Download,
  Plus,
  Eye,
  LogIn,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { useUsersQuery } from '@/hooks/useUsersQuery';
import { usePdsSubmissionsQuery } from '@/hooks/usePdsSubmissionsQuery';
import { useSalnSubmissionsQuery } from '@/hooks/useSalnSubmissionsQuery';
import { PageTransition } from '@/components/PageTransition';
import {
  StatusBadge,
  UserAvatar,
  ConfirmationDialog,
  Timeline,
  type TimelineEvent,
  EmptyState,
  LoadingCard,
  ErrorAlert,
} from '@/components/admin';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock activity log data
function generateMockActivityLog(_userId: string): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: '1',
      type: 'login',
      title: 'User logged in',
      description: 'Successful login from Chrome on Windows',
      timestamp: new Date(2024, 10, 7, 9, 30),
      icon: LogIn,
      metadata: { ip_address: '192.168.1.100', browser: 'Chrome' },
    },
    {
      id: '2',
      type: 'submission',
      title: 'PDS form submitted',
      description: 'Personal Data Sheet submitted for review',
      timestamp: new Date(2024, 10, 6, 14, 15),
      icon: FileText,
      metadata: { form_type: 'PDS', status: 'Submitted' },
    },
    {
      id: '3',
      type: 'admin_action',
      title: 'Profile updated by admin',
      description: 'Department assignment changed',
      timestamp: new Date(2024, 10, 5, 11, 0),
      icon: Edit,
      metadata: { admin: 'HR Admin', field: 'Department' },
    },
    {
      id: '4',
      type: 'submission',
      title: 'SALN form submitted',
      description: 'Statement of Assets submitted for 2024',
      timestamp: new Date(2024, 10, 4, 16, 45),
      icon: FileText,
      metadata: { form_type: 'SALN', year: '2024' },
    },
    {
      id: '5',
      type: 'logout',
      title: 'User logged out',
      description: 'Session ended',
      timestamp: new Date(2024, 10, 3, 17, 30),
      icon: LogOut,
    },
  ];
  return events;
}

export default function UserViewPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const { useUserDetail, deleteUser, toggleUserStatus } = useUsersQuery();
  const { data: user, isLoading, isError, error } = useUserDetail(userId);

  // Mock submissions data (in production, filter by userId on the backend)
  const { submissions: allPdsSubmissions, isLoading: isPdsLoading } =
    usePdsSubmissionsQuery({});
  const { submissions: allSalnSubmissions, isLoading: isSalnLoading } =
    useSalnSubmissionsQuery({});

  // Filter submissions by userId client-side
  const pdsSubmissions = allPdsSubmissions.filter(
    (s) => s.employee.id === userId
  );
  const salnSubmissions = allSalnSubmissions.filter(
    (s) => s.employee.id === userId
  );

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);

  // Generate mock activity log
  const activityLog = useMemo(() => generateMockActivityLog(userId), [userId]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!pdsSubmissions || !salnSubmissions) {
      return {
        totalPds: 0,
        totalSaln: 0,
        pendingReviews: 0,
        lastActivity: null,
      };
    }

    const pendingPds = pdsSubmissions.filter(
      (s) => s.status === 'submitted'
    ).length;
    const pendingSaln = salnSubmissions.filter(
      (s) => s.status === 'submitted'
    ).length;

    return {
      totalPds: pdsSubmissions.length,
      totalSaln: salnSubmissions.length,
      pendingReviews: pendingPds + pendingSaln,
      lastActivity: activityLog[0]?.timestamp || null,
    };
  }, [pdsSubmissions, salnSubmissions, activityLog]);

  const handleToggleStatus = useCallback(() => {
    if (!user) return;

    toggleUserStatus(userId, {
      onSuccess: () => {
        toast.success(
          `User ${
            user.profile.isActive ? 'deactivated' : 'activated'
          } successfully`
        );
        setShowDeactivateDialog(false);
      },
      onError: () => {
        toast.error('Failed to update user status');
      },
    });
  }, [user, userId, toggleUserStatus]);

  const handleDelete = useCallback(() => {
    deleteUser(userId, {
      onSuccess: () => {
        toast.success('User deleted successfully');
        router.push('/dashboard/users');
      },
      onError: () => {
        toast.error('Failed to delete user');
      },
    });
  }, [userId, deleteUser, router]);

  const handleResetPassword = useCallback(() => {
    // Mock password reset
    toast.success('Password reset email sent', {
      description:
        'The user will receive instructions to reset their password.',
    });
    setShowResetPasswordDialog(false);
  }, []);

  const handleDownloadPdf = useCallback((type: 'pds' | 'saln', id: string) => {
    toast.info(`Downloading ${type.toUpperCase()} PDF...`);
    console.log(`Download ${type} PDF for ID: ${id}`);
  }, []);

  if (isLoading) {
    return (
      <PageTransition className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
        <Skeleton className="h-96" />
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

  const fullName = `${user.profile.firstName} ${
    user.profile.middleName || ''
  } ${user.profile.lastName}`.trim();

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
            <BreadcrumbPage>{fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
              <StatusBadge
                status={user.profile.isActive ? 'active' : 'inactive'}
              />
            </div>
            <p className="text-muted-foreground">
              {user.profile.employeeId} &bull;{' '}
              {user.profile.role.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/users/edit/${userId}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowResetPasswordDialog(true)}>
                <Key className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeactivateDialog(true)}>
                {user.profile.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate Account
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate Account
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="overflow-hidden">
        <div className="h-24 gradient-user-banner" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            {/* Avatar */}
            <div className="-mt-12">
              <UserAvatar
                user={{
                  firstName: user.profile.firstName,
                  lastName: user.profile.lastName,
                  avatarUrl: null,
                }}
                size="lg"
                className="h-24 w-24 border-4 border-background"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {user.profile.employeeId}@tup.edu.ph
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {user.department?.name || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">
                    {user.position?.title || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="outline" className="capitalize">
                    {user.profile.role.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(user.profile.createdAt, 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(user.profile.updatedAt, 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              PDS Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPds}</div>
            <p className="text-xs text-muted-foreground">
              {pdsSubmissions?.filter((s) => s.status === 'approved').length ||
                0}{' '}
              approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              SALN Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSaln}</div>
            <p className="text-xs text-muted-foreground">
              Latest: {salnSubmissions?.[0]?.year || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastActivity ? format(stats.lastActivity, 'd') : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastActivity
                ? format(stats.lastActivity, 'MMM yyyy')
                : 'No recent activity'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pds">PDS</TabsTrigger>
          <TabsTrigger value="saln">SALN</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>User profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">First Name</p>
                  <p className="font-medium">{user.profile.firstName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Name</p>
                  <p className="font-medium">{user.profile.lastName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Middle Name</p>
                  <p className="font-medium">
                    {user.profile.middleName || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{user.profile.employeeId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {user.profile.employeeId}@tup.edu.ph
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>Department and position</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="outline" className="capitalize">
                    {user.profile.role.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {user.department?.name || 'Not assigned'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">
                    {user.position?.title || 'Not assigned'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge
                    status={user.profile.isActive ? 'active' : 'inactive'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Account metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(user.profile.createdAt, 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(user.profile.updatedAt, 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDS Tab */}
        <TabsContent value="pds" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>PDS Submissions</CardTitle>
                  <CardDescription>
                    Personal Data Sheet submissions
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create PDS
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isPdsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : pdsSubmissions && pdsSubmissions.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pdsSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <StatusBadge status={submission.status} />
                          </TableCell>
                          <TableCell>
                            {submission.submittedAt
                              ? format(
                                  new Date(submission.submittedAt),
                                  'MMM d, yyyy'
                                )
                              : 'Not submitted'}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(submission.updatedAt),
                              'MMM d, yyyy'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  href={`/dashboard/submissions/pds/view/${submission.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDownloadPdf('pds', submission.id)
                                }>
                                <Download className="mr-2 h-4 w-4" />
                                PDF
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No PDS submissions"
                  description="This user hasn't submitted any PDS forms yet"
                  action={{
                    label: 'Create PDS',
                    onClick: () => console.log('Create PDS'),
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SALN Tab */}
        <TabsContent value="saln" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SALN Submissions</CardTitle>
                  <CardDescription>
                    Statement of Assets, Liabilities, and Net Worth
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create SALN
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isSalnLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : salnSubmissions && salnSubmissions.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Net Worth</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salnSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">
                            {submission.year}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('en-PH', {
                              style: 'currency',
                              currency: 'PHP',
                            }).format(parseFloat(submission.netWorth))}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={submission.status} />
                          </TableCell>
                          <TableCell>
                            {format(submission.createdAt, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  href={`/dashboard/submissions/saln/view/${submission.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDownloadPdf('saln', submission.id)
                                }>
                                <Download className="mr-2 h-4 w-4" />
                                PDF
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No SALN submissions"
                  description="This user hasn't submitted any SALN forms yet"
                  action={{
                    label: 'Create SALN',
                    onClick: () => console.log('Create SALN'),
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent user activity and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <Timeline events={activityLog} />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete User"
        description={`Are you sure you want to delete ${fullName}? This action cannot be undone and will permanently remove all associated data.`}
        confirmText="DELETE"
        onConfirm={handleDelete}
        destructive
      />

      <ConfirmationDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        title={user.profile.isActive ? 'Deactivate User' : 'Activate User'}
        description={
          user.profile.isActive
            ? `Are you sure you want to deactivate ${fullName}? They will no longer be able to access the system.`
            : `Are you sure you want to activate ${fullName}? They will be able to access the system.`
        }
        confirmText={user.profile.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
        onConfirm={handleToggleStatus}
        destructive={user.profile.isActive}
      />

      <ConfirmationDialog
        open={showResetPasswordDialog}
        onOpenChange={setShowResetPasswordDialog}
        title="Reset Password"
        description={`Send a password reset email to ${fullName}? They will receive instructions to create a new password.`}
        confirmText="SEND EMAIL"
        onConfirm={handleResetPassword}
      />
    </PageTransition>
  );
}
