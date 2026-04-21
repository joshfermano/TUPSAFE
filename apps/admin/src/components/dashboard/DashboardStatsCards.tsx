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

/** Safely render a possibly-null number with locale grouping. */
const fmt = (v: number | null | undefined) =>
  v != null && Number.isFinite(v) ? v.toLocaleString() : '—';
/** Safely fix a possibly-null number to N decimal places. */
const fixed = (v: number | null | undefined, digits = 1) =>
  v != null && Number.isFinite(v) ? v.toFixed(digits) : '0';

export function DashboardStatsCards({ data }: DashboardStatsCardsProps) {
  // Defensive defaults — handlers now return a zeroed skeleton on failure, but
  // widgets must also tolerate missing fields in case the API payload shape
  // drifts during a deploy.
  const users = data?.users ?? {
    total: 0,
    employees: 0,
    applicants: 0,
    activeLastMonth: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    growth: { value: 0, trend: 'stable' as const },
  };
  const registrations = data?.registrations ?? {
    pending: 0,
    approvedThisWeek: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    averageApprovalTime: '0.0 hours',
  };
  const submissions = data?.submissions ?? {
    pending: { pds: 0, saln: 0, total: 0 },
    approvedThisWeek: 0,
    approvedThisMonth: 0,
    complianceRate: 0,
  };
  const compliance = data?.compliance ?? {
    pds: { submitted: 0, expected: 0, rate: 0, overdue: 0 },
    saln: { submitted: 0, expected: 0, rate: 0, overdue: 0 },
  };

  const pdsRate = compliance.pds?.rate ?? 0;
  const salnRate = compliance.saln?.rate ?? 0;
  const overallCompliance = (pdsRate + salnRate) / 2;

  // Determine compliance color
  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-stretch">
      {/* Total Users Card */}
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex-1">
          <div className="text-2xl font-bold">{fmt(users.total)}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{fmt(users.employees)} employees</span>
            <span>•</span>
            <span>{fmt(users.applicants)} applicants</span>
          </div>
          {users.growth?.trend !== 'stable' && (
            <div className="mt-2 flex items-center gap-1">
              <Badge
                variant={users.growth?.trend === 'up' ? 'default' : 'destructive'}
                className="text-xs">
                {users.growth?.trend === 'up' ? '↑' : '↓'} {fixed(users.growth?.value)}%
              </Badge>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New This Week Card */}
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New This Week</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex-1">
          <div className="text-2xl font-bold">{fmt(users.newThisWeek)}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {fmt(users.newThisMonth)} this month
          </p>
          <div className="mt-2">
            <Progress
              value={
                users.newThisMonth && users.newThisMonth > 0
                  ? (users.newThisWeek / users.newThisMonth) * 100
                  : 0
              }
              className="h-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pending Reviews Card */}
      <Link href="/dashboard/registrations" className="block h-full">
        <Card
          className={cn(
            'h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer',
            (registrations.pending ?? 0) + (submissions.pending?.total ?? 0) > 20 &&
              'border-yellow-500/50'
          )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-2xl font-bold">
              {fmt((registrations.pending ?? 0) + (submissions.pending?.total ?? 0))}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{fmt(registrations.pending)} registrations</span>
              <span>•</span>
              <span>{fmt(submissions.pending?.total)} submissions</span>
            </div>
            {(registrations.pending ?? 0) + (submissions.pending?.total ?? 0) > 20 && (
              <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-600">
                Needs Attention
              </Badge>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Compliance Rate Card */}
      <Link href="/dashboard/submissions" className="block h-full">
        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className={cn('text-2xl font-bold', getComplianceColor(overallCompliance))}>
              {fixed(overallCompliance)}%
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>PDS: {fixed(pdsRate)}%</span>
              <span>•</span>
              <span>SALN: {fixed(salnRate)}%</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">PDS</span>
                <span className="font-medium">{fixed(pdsRate, 0)}%</span>
              </div>
              <Progress value={pdsRate} className="h-1" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">SALN</span>
                <span className="font-medium">{fixed(salnRate, 0)}%</span>
              </div>
              <Progress value={salnRate} className="h-1" />
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-stretch">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent className="flex-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-2 h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
