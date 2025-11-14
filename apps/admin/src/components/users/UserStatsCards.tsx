/**
 * User Statistics Cards
 *
 * Displays key user metrics in a grid of cards with icons and counts.
 * Fetches real-time statistics from the API.
 */

'use client';

import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStats } from '@/hooks/useUsers';

interface StatCard {
  title: string;
  description: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
}

export function UserStatsCards() {
  const { data: stats, isLoading, isError } = useUserStats();

  if (isError) {
    return null; // Silently fail - stats are not critical
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards: StatCard[] = [
    {
      title: 'Total Users',
      description: 'All registered users',
      value: stats.total,
      icon: Users,
      iconClassName: 'text-blue-600',
    },
    {
      title: 'Active Users',
      description: `${stats.byAccountStatus.active} active accounts`,
      value: stats.activeUsers,
      icon: UserCheck,
      iconClassName: 'text-green-600',
    },
    {
      title: 'Pending Approvals',
      description: 'Awaiting approval',
      value: stats.pendingApprovals,
      icon: Clock,
      iconClassName: 'text-yellow-600',
    },
    {
      title: 'Suspended',
      description: 'Suspended accounts',
      value: stats.suspendedUsers,
      icon: UserX,
      iconClassName: 'text-red-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.iconClassName}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Detailed User Statistics Section
 *
 * Shows breakdown by user type, role, and employment category
 */
export function DetailedUserStats() {
  const { data: stats, isLoading } = useUserStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Distribution</CardTitle>
        <CardDescription>Breakdown by category and role</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* By User Type */}
        <div>
          <h4 className="text-sm font-semibold mb-3">By User Type</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Employees</span>
              <span className="text-lg font-bold">{stats.byUserType.employees}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Applicants</span>
              <span className="text-lg font-bold">{stats.byUserType.applicants}</span>
            </div>
          </div>
        </div>

        {/* By Role */}
        <div>
          <h4 className="text-sm font-semibold mb-3">By Role</h4>
          <div className="space-y-2">
            {Object.entries(stats.byRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                <span className="text-sm font-medium">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Employment Category */}
        <div>
          <h4 className="text-sm font-semibold mb-3">By Employment Category</h4>
          <div className="space-y-2">
            {Object.entries(stats.byEmploymentCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                <span className="text-sm font-medium">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Registrations */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Recent Registrations</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats.recentRegistrations.last7Days}</div>
              <div className="text-xs text-muted-foreground">Last 7 days</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats.recentRegistrations.last30Days}</div>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
