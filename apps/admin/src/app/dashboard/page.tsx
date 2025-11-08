'use client';

import React, { memo } from 'react';
import {
  Users,
  Clock,
  FileText,
  Landmark,
  CheckCircle2,
  Activity,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import {
  useDashboardQuery,
  type DashboardStats,
} from '@/hooks/useDashboardQuery';
import {
  StatCard,
  LoadingCardGrid,
  ErrorAlert,
  StatusBadge,
} from '@/components/admin';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Recent Activity Item Component (memoized)
const ActivityItem = memo(
  ({
    log,
  }: {
    log: {
      id: string;
      timestamp: string;
      user: string;
      action: string;
      resource: string;
      details: string | null;
    };
  }) => {
    // Parse action to get type for color coding
    const actionType = log.action.toLowerCase();
    let actionColor = 'text-muted-foreground';

    if (actionType.includes('create') || actionType.includes('submit')) {
      actionColor = 'text-blue-600 dark:text-blue-400';
    } else if (actionType.includes('approve')) {
      actionColor = 'text-green-600 dark:text-green-400';
    } else if (actionType.includes('reject') || actionType.includes('delete')) {
      actionColor = 'text-red-600 dark:text-red-400';
    } else if (actionType.includes('update') || actionType.includes('edit')) {
      actionColor = 'text-yellow-600 dark:text-yellow-400';
    }

    return (
      <div className="flex items-start gap-3 py-3">
        <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
        <div className="flex-1 space-y-1">
          <p className="text-sm">
            <span className="font-medium">{log.user}</span>{' '}
            <span className={actionColor}>{log.action}</span>{' '}
            <span className="font-medium">{log.resource}</span>
          </p>
          {log.details && (
            <p className="text-xs text-muted-foreground">{log.details}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  }
);

ActivityItem.displayName = 'ActivityItem';

// Pending Submission Row Component (memoized)
const PendingSubmissionRow = memo(
  ({
    submission,
  }: {
    submission: {
      id: string;
      type: 'PDS' | 'SALN';
      employee: string;
      department: string;
      submittedAt: string;
      status: string;
    };
  }) => {
    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            {submission.type === 'PDS' ? (
              <FileText className="h-4 w-4 text-blue-600" />
            ) : (
              <Landmark className="h-4 w-4 text-purple-600" />
            )}
            <span className="font-medium">{submission.type}</span>
          </div>
        </TableCell>
        <TableCell>{submission.employee}</TableCell>
        <TableCell className="hidden md:table-cell">
          {submission.department}
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {formatDistanceToNow(new Date(submission.submittedAt), {
            addSuffix: true,
          })}
        </TableCell>
        <TableCell>
          <StatusBadge
            status={submission.status as 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected'}
          />
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Quick Review
              </DropdownMenuItem>
              <DropdownMenuItem>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  }
);

PendingSubmissionRow.displayName = 'PendingSubmissionRow';

// Main Dashboard Page Component
export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardQuery();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the TUPSAFE Admin Portal
          </p>
        </div>
        <LoadingCardGrid count={6} />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the TUPSAFE Admin Portal
          </p>
        </div>
        <ErrorAlert
          error={error || 'Failed to load dashboard data'}
          title="Failed to load dashboard data"
        />
      </div>
    );
  }

  const stats = data as DashboardStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the TUPSAFE Admin Portal
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend={{
            direction: stats.trends.users >= 0 ? 'up' : 'down',
            percentage: Math.abs(stats.trends.users),
            isPositive: stats.trends.users >= 0,
          }}
          description="vs last month"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.totalPendingApprovals}
          icon={Clock}
        />
        <StatCard
          title="PDS Submissions"
          value={stats.pdsSubmissions}
          icon={FileText}
          trend={{
            direction: stats.trends.pds >= 0 ? 'up' : 'down',
            percentage: Math.abs(stats.trends.pds),
            isPositive: stats.trends.pds >= 0,
          }}
          description="vs last month"
        />
        <StatCard
          title="SALN Submissions"
          value={stats.salnSubmissions}
          icon={Landmark}
          trend={{
            direction: stats.trends.saln >= 0 ? 'up' : 'down',
            percentage: Math.abs(stats.trends.saln),
            isPositive: stats.trends.saln >= 0,
          }}
          description="vs last month"
        />
        <StatCard
          title="Compliance Rate"
          value={`${stats.complianceRate}%`}
          icon={CheckCircle2}
        />
        <StatCard
          title="System Health"
          value={stats.systemHealth}
          icon={Activity}
        />
      </div>

      {/* Recent Activity and Pending Submissions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {stats.recentActivity.map((log) => (
                  <ActivityItem key={log.id} log={log} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions</CardTitle>
            <CardDescription>
              Submissions awaiting review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pendingSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-4 h-12 w-12 text-green-600" />
                <p className="text-sm text-muted-foreground">
                  No pending submissions
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Department
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Submitted
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.pendingSubmissions.map((submission) => (
                      <PendingSubmissionRow
                        key={submission.id}
                        submission={submission}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
