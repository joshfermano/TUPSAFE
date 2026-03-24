/**
 * Dashboard Statistics Cards
 *
 * Displays 4 primary metric cards with trends and breakdowns
 */

'use client';

import { Users, UserPlus, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardOverviewResponse } from '@tupsafe/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardStatsCardsProps {
  data: DashboardOverviewResponse;
}

export function DashboardStatsCards({ data }: DashboardStatsCardsProps) {
  const { users, registrations, submissions, compliance } = data;

  // Calculate overall compliance rate
  const overallCompliance = (compliance.pds.rate + compliance.saln.rate) / 2;

  // Determine compliance color
  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Users Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{users.total.toLocaleString()}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{users.employees} employees</span>
            <span>•</span>
            <span>{users.applicants} applicants</span>
          </div>
          {users.growth.trend !== 'stable' && (
            <div className="mt-2 flex items-center gap-1">
              <Badge
                variant={users.growth.trend === 'up' ? 'default' : 'destructive'}
                className="text-xs">
                {users.growth.trend === 'up' ? '↑' : '↓'} {users.growth.value.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New This Week Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New This Week</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{users.newThisWeek.toLocaleString()}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {users.newThisMonth.toLocaleString()} this month
          </p>
          <div className="mt-2">
            <Progress value={(users.newThisWeek / users.newThisMonth) * 100} className="h-1" />
          </div>
        </CardContent>
      </Card>

      {/* Pending Reviews Card */}
      <Link href="/dashboard/registrations" className="block">
        <Card
          className={cn(
            'hover:shadow-lg transition-shadow cursor-pointer',
            registrations.pending + submissions.pending.total > 20 && 'border-yellow-500/50'
          )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(registrations.pending + submissions.pending.total).toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{registrations.pending} registrations</span>
              <span>•</span>
              <span>{submissions.pending.total} submissions</span>
            </div>
            {registrations.pending + submissions.pending.total > 20 && (
              <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-600">
                Needs Attention
              </Badge>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Compliance Rate Card */}
      <Link href="/dashboard/submissions" className="block">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', getComplianceColor(overallCompliance))}>
              {overallCompliance.toFixed(1)}%
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>PDS: {compliance.pds.rate.toFixed(1)}%</span>
              <span>•</span>
              <span>SALN: {compliance.saln.rate.toFixed(1)}%</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">PDS</span>
                <span className="font-medium">{compliance.pds.rate.toFixed(0)}%</span>
              </div>
              <Progress value={compliance.pds.rate} className="h-1" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">SALN</span>
                <span className="font-medium">{compliance.saln.rate.toFixed(0)}%</span>
              </div>
              <Progress value={compliance.saln.rate} className="h-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

/**
 * Loading skeleton for stats cards
 */
export function DashboardStatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-2 h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
