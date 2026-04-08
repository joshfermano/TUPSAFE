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
  RotateCcw,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { useUsersQuery } from '@/hooks/useUsersQuery';
import { usePdsSubmissionsQuery } from '@/hooks/usePdsSubmissionsQuery';
import { useSalnSubmissionsQuery } from '@/hooks/useSalnSubmissionsQuery';
import {
  useUserCertifications,
  useVerifyCertification,
} from '@/hooks/useCertificationsQuery';
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
  PdsAttachmentsViewer,
  CertificationCard,
  CertificationVerifyDialog,
} from '@/components/admin';
import type { ProfileCertificationData } from '@tupsafe/types';

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

// Activity log item from API
interface ActivityLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  createdAt: Date;
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Hook to fetch user activities from API
function useUserActivities(userId: string | null) {
  return useQuery<ActivityLogItem[], Error>({
    queryKey: ['user-activities', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      const res = await fetch(`/api/users/${userId}/activities`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}

// Transform activity log item to timeline event
function activityToTimelineEvent(activity: ActivityLogItem): TimelineEvent {
  // Map action types to timeline event types
  const mapActionToType = (action: string, entityType: string): TimelineEvent['type'] => {
    if (action.includes('LOGIN')) return 'login';
    if (action.includes('LOGOUT')) return 'logout';
    if (action === 'CREATE' && (entityType.includes('pds') || entityType.includes('saln'))) {
      return 'submission';
    }
    if (action === 'UPDATE') return 'update';
    if (action.includes('STATUS') || action.includes('APPROVE') || action.includes('REJECT')) {
      return 'status_change';
    }
    return 'admin_action';
  };

  // Map action types to icons and descriptions
  const getIconAndDescription = (action: string, entityType: string) => {
    if (action.includes('LOGIN')) {
      return { icon: LogIn, description: 'User logged in to the system' };
    }
    if (action.includes('LOGOUT')) {
      return { icon: LogOut, description: 'User logged out of the system' };
    }
    if (action === 'CREATE' && entityType.includes('pds')) {
      return { icon: FileText, description: 'PDS submission created' };
    }
    if (action === 'UPDATE' && entityType.includes('pds')) {
      return { icon: Edit, description: 'PDS submission updated' };
    }
    if (action === 'CREATE' && entityType.includes('saln')) {
      return { icon: FileText, description: 'SALN submission created' };
    }
    if (action === 'UPDATE' && entityType.includes('saln')) {
      return { icon: Edit, description: 'SALN submission updated' };
    }
    if (action === 'UPDATE' && entityType === 'profile') {
      return { icon: Edit, description: 'Profile information updated' };
    }
    if (action === 'DELETE') {
      return { icon: Trash2, description: `${entityType} deleted` };
    }
    return { icon: FileText, description: `${action} on ${entityType}` };
  };

  const { icon, description } = getIconAndDescription(activity.action, activity.entityType);

  return {
    id: activity.id,
    type: mapActionToType(activity.action, activity.entityType),
    title: activity.action.replace(/_/g, ' '),
    description,
    timestamp: new Date(activity.createdAt),
    icon,
    metadata: {
      entityType: activity.entityType,
      ...(activity.entityId && { entityId: activity.entityId }),
      performedBy: `${activity.performedBy.firstName} ${activity.performedBy.lastName}`,
    },
  };
}

export default function UserViewPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const { 
    useUserDetail, 
    deleteUserAsync, 
    toggleUserStatusAsync,
    revertToApplicantAsync,
    isRevertingToApplicant,
  } = useUsersQuery();
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

  // Certifications data and mutations
  const {
    data: certifications = [],
    isLoading: isCertificationsLoading,
  } = useUserCertifications(userId);
  const verifyCertificationMutation = useVerifyCertification();

  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showRevertToApplicantDialog, setShowRevertToApplicantDialog] = useState(false);

  // Certification verification dialog state
  const [showCertVerifyDialog, setShowCertVerifyDialog] = useState(false);
  const [certVerifyAction, setCertVerifyAction] = useState<'verify' | 'reject'>('verify');
  const [selectedCertification, setSelectedCertification] =
    useState<ProfileCertificationData | null>(null);

  // Fetch real activity log from API
  const { data: activities = [], isLoading: isActivitiesLoading } = useUserActivities(userId);

  // Transform activities to timeline events
  const activityLog = useMemo(
    () => activities.map(activityToTimelineEvent),
    [activities]
  );

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

  const handleToggleStatus = useCallback(async () => {
    if (!user) return;

    try {
      await toggleUserStatusAsync(userId);
      toast.success(
        `User ${user.isActive ? 'deactivated' : 'activated'} successfully`
      );
      setShowDeactivateDialog(false);
    } catch {
      toast.error('Failed to update user status');
    }
  }, [user, userId, toggleUserStatusAsync]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteUserAsync(userId, false);
      toast.success('User deleted successfully');
      router.push('/dashboard/users');
    } catch {
      toast.error('Failed to delete user');
    }
  }, [userId, deleteUserAsync, router]);

  const handleResetPassword = useCallback(() => {
    // Mock password reset
    toast.success('Password reset email sent', {
      description:
        'The user will receive instructions to reset their password.',
    });
    setShowResetPasswordDialog(false);
  }, []);

  const handleRevertToApplicant = useCallback(async () => {
    try {
      await revertToApplicantAsync(userId);
      toast.success('Account reverted to applicant', {
        description: 'The user can now be properly hired through the correct workflow.',
      });
      setShowRevertToApplicantDialog(false);
    } catch (err) {
      toast.error('Failed to revert account', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      });
    }
  }, [userId, revertToApplicantAsync]);

  // Check if user can be reverted to applicant
  // Conditions: userType='employee' AND applicantId is present
  const canRevertToApplicant = useMemo(() => {
    if (!user) return false;
    return user.userType === 'employee' && !!user.applicantId;
  }, [user]);

  const handleDownloadPdf = useCallback((type: 'pds' | 'saln', id: string) => {
    toast.info(`Downloading ${type.toUpperCase()} PDF...`);
    console.log(`Download ${type} PDF for ID: ${id}`);
  }, []);

  // Certification verification handlers
  const handleCertVerify = useCallback(
    (certId: string) => {
      const cert = certifications.find((c) => c.id === certId) ?? null;
      setSelectedCertification(cert);
      setCertVerifyAction('verify');
      setShowCertVerifyDialog(true);
    },
    [certifications]
  );

  const handleCertReject = useCallback(
    (certId: string) => {
      const cert = certifications.find((c) => c.id === certId) ?? null;
      setSelectedCertification(cert);
      setCertVerifyAction('reject');
      setShowCertVerifyDialog(true);
    },
    [certifications]
  );

  const handleCertVerifyConfirm = useCallback(
    async (notes: string) => {
      if (!selectedCertification) return;
      try {
        const apiStatus = certVerifyAction === 'verify' ? 'verified' : 'rejected' as const;
        await verifyCertificationMutation.mutateAsync({
          id: selectedCertification.id,
          body: { status: apiStatus, notes: notes || undefined },
        });
        toast.success(
          certVerifyAction === 'verify'
            ? 'Certification verified successfully'
            : 'Certification rejected',
          {
            description: `"${selectedCertification.title}" has been ${certVerifyAction === 'verify' ? 'verified' : 'rejected'}.`,
          }
        );
        setShowCertVerifyDialog(false);
        setSelectedCertification(null);
      } catch (err) {
        toast.error(
          `Failed to ${certVerifyAction} certification`,
          {
            description:
              err instanceof Error ? err.message : 'Unknown error occurred',
          }
        );
      }
    },
    [selectedCertification, certVerifyAction, verifyCertificationMutation]
  );

  // Count pending certifications
  const pendingCertificationsCount = useMemo(
    () => certifications.filter((c) => c.verificationStatus === 'pending').length,
    [certifications]
  );

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

  const fullName = `${user.firstName} ${
    user.middleName || ''
  } ${user.lastName}`.trim();

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
                status={user.isActive ? 'active' : 'inactive'}
              />
            </div>
            <p className="text-muted-foreground">
              {user.employeeId} &bull;{' '}
              {user.role.replace('_', ' ')}
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
                {user.isActive ? (
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
              {canRevertToApplicant && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowRevertToApplicantDialog(true)}
                    className="text-amber-600 focus:text-amber-600">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Revert to Applicant
                  </DropdownMenuItem>
                </>
              )}
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

      {/* Alert: Account may need reversion */}
      {canRevertToApplicant && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Possible Incorrect Account Conversion
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  This account is marked as an &quot;employee&quot; but still has an applicant ID ({user.applicantId}).
                  This may indicate the account was mistakenly upgraded from applicant to employee.
                  If this is incorrect, you can revert it back to applicant status.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
                    onClick={() => setShowRevertToApplicantDialog(true)}
                    disabled={isRevertingToApplicant}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {isRevertingToApplicant ? 'Reverting...' : 'Revert to Applicant'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Overview Card */}
      <Card className="overflow-hidden">
        <div className="h-24 gradient-user-banner" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            {/* Avatar */}
            <div className="-mt-12">
              <UserAvatar
                user={{
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatarUrl: user.avatarUrl,
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
                    {user.email || `${user.employeeId}@tup.edu.ph`}
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
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(user.createdAt, 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(user.updatedAt, 'MMM d, yyyy')}
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pds">PDS</TabsTrigger>
          <TabsTrigger value="saln">SALN</TabsTrigger>
          <TabsTrigger value="certifications" className="relative">
            Certifications
            {pendingCertificationsCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-semibold text-white">
                {pendingCertificationsCount}
              </span>
            )}
          </TabsTrigger>
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
                  <p className="font-medium">{user.firstName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Name</p>
                  <p className="font-medium">{user.lastName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Middle Name</p>
                  <p className="font-medium">
                    {user.middleName || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{user.employeeId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {user.email || `${user.employeeId}@tup.edu.ph`}
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
                    {user.role.replace('_', ' ')}
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
                    status={user.isActive ? 'active' : 'inactive'}
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
                    {format(user.createdAt, 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {format(user.updatedAt, 'MMMM d, yyyy h:mm a')}
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

          {/* PDS Attachments Viewer */}
          {pdsSubmissions && pdsSubmissions.length > 0 && (
            <PdsAttachmentsViewer
              userId={userId}
              submissions={pdsSubmissions.map((s) => ({
                id: s.id,
                status: s.status,
                year: s.year,
                submittedAt: s.submittedAt,
              }))}
            />
          )}
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

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                    {certifications.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {certifications.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Learning and development certifications
                    {pendingCertificationsCount > 0 && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">
                        ({pendingCertificationsCount} pending verification)
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isCertificationsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : certifications.length > 0 ? (
                <ScrollArea className="h-[600px] pr-1">
                  <div className="space-y-4">
                    {certifications.map((cert) => (
                      <CertificationCard
                        key={cert.id}
                        certification={cert}
                        onVerify={handleCertVerify}
                        onReject={handleCertReject}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <EmptyState
                  icon={Award}
                  title="No certifications"
                  description="This user hasn't uploaded any certifications yet"
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
                {isActivitiesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : activityLog.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No activities found</p>
                    <p className="text-sm mt-2">
                      Activity logs will appear here once the user interacts with the system
                    </p>
                  </div>
                ) : (
                  <Timeline events={activityLog} />
                )}
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
        title={user.isActive ? 'Deactivate User' : 'Activate User'}
        description={
          user.isActive
            ? `Are you sure you want to deactivate ${fullName}? They will no longer be able to access the system.`
            : `Are you sure you want to activate ${fullName}? They will be able to access the system.`
        }
        confirmText={user.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
        onConfirm={handleToggleStatus}
        destructive={user.isActive}
      />

      <ConfirmationDialog
        open={showResetPasswordDialog}
        onOpenChange={setShowResetPasswordDialog}
        title="Reset Password"
        description={`Send a password reset email to ${fullName}? They will receive instructions to create a new password.`}
        confirmText="SEND EMAIL"
        onConfirm={handleResetPassword}
      />

      <ConfirmationDialog
        open={showRevertToApplicantDialog}
        onOpenChange={setShowRevertToApplicantDialog}
        title="Revert to Applicant"
        description={
          `Are you sure you want to revert ${fullName} back to applicant status? This will:\n\n` +
          `• Set user type back to "applicant"\n` +
          `• Clear employee ID, department, and position\n` +
          `• Keep their applicant ID (${user?.applicantId || 'N/A'})\n` +
          `• Preserve all PDS submissions and job applications\n\n` +
          `After reverting, you can properly create their employee account using "Users → Create User" with a TUP email.`
        }
        confirmText="REVERT TO APPLICANT"
        onConfirm={handleRevertToApplicant}
      />

      {/* Certification Verify/Reject Dialog */}
      <CertificationVerifyDialog
        open={showCertVerifyDialog}
        onOpenChange={setShowCertVerifyDialog}
        certification={selectedCertification}
        action={certVerifyAction}
        onConfirm={handleCertVerifyConfirm}
        isPending={verifyCertificationMutation.isPending}
      />
    </PageTransition>
  );
}
