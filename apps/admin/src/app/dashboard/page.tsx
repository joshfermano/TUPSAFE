/**
 * Admin Dashboard Page
 *
 * Comprehensive real-time analytics dashboard with interactive charts and compliance tracking
 */

'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import {
  useDashboardOverview,
  useRefreshDashboard,
  useLastUpdated,
} from '@/hooks/useDashboard';
import {
  DashboardStatsCards,
  DashboardStatsCardsSkeleton,
  UserGrowthChart,
  UserGrowthChartSkeleton,
  RecentActivityFeed,
  RecentActivityFeedSkeleton,
  PendingTasksWidget,
  PendingTasksWidgetSkeleton,
  ComplianceByDeptChart,
  ComplianceByDeptChartSkeleton,
  UpcomingDeadlinesCard,
  UpcomingDeadlinesCardSkeleton,
  ComplianceOverview,
  ComplianceOverviewSkeleton,
  DepartmentRankingsTable,
  DepartmentRankingsTableSkeleton,
  QuickActionsMenu,
} from '@/components/dashboard';
import Link from 'next/link';

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardOverview();
  const refreshDashboard = useRefreshDashboard();
  const lastUpdated = useLastUpdated();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDashboard();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the TUPSAFE Admin Portal</p>
        </div>

        {/* Loading Skeletons */}
        <DashboardStatsCardsSkeleton />
        <UserGrowthChartSkeleton />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivityFeedSkeleton />
          <PendingTasksWidgetSkeleton />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ComplianceByDeptChartSkeleton />
          <div className="space-y-6">
            <UpcomingDeadlinesCardSkeleton />
            <ComplianceOverviewSkeleton />
          </div>
        </div>

        <DepartmentRankingsTableSkeleton />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the TUPSAFE Admin Portal</p>
        </div>

        <Alert variant="destructive">
          <AlertTitle>Failed to load dashboard data</AlertTitle>
          <AlertDescription>
            {error?.message || 'An unexpected error occurred. Please try again later.'}
            <Button variant="outline" size="sm" className="ml-4" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header with Last Updated and Refresh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the TUPSAFE Admin Portal
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert: any) => (
            <Alert
              key={alert.id}
              variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTitle className="flex items-center justify-between">
                {alert.title}
                {alert.count && (
                  <span className="text-sm font-normal">({alert.count})</span>
                )}
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                {alert.action && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={alert.action.url}>{alert.action.label}</Link>
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Statistics Cards */}
      <DashboardStatsCards data={data} />

      <Separator />

      {/* User Growth Chart - Full Width */}
      <UserGrowthChart />

      {/* Recent Activity and Pending Tasks - 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivityFeed activities={data.recentActivity} />
        <PendingTasksWidget data={data} />
      </div>

      <Separator />

      {/* Compliance Charts - 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ComplianceByDeptChart />
        <div className="space-y-6">
          <UpcomingDeadlinesCard />
          <ComplianceOverview />
        </div>
      </div>

      {/* Department Rankings - Full Width */}
      <DepartmentRankingsTable />

      {/* Quick Actions - Full Width */}
      <QuickActionsMenu />
    </div>
  );
}
