/**
 * Department Rankings Table
 *
 * Top departments by compliance with medal indicators
 */

'use client';

import { TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepartmentAnalytics } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Get medal emoji based on rank
 */
function getMedal(rank: number): string | null {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return null;
  }
}

/**
 * Get trend icon
 */
function getTrendIcon(trend: string) {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    case 'declining':
      return <TrendingDown className="h-3 w-3 text-red-600" />;
    default:
      return null;
  }
}

export function DepartmentRankingsTable() {
  const { data, isLoading, isError } = useDepartmentAnalytics();

  if (isLoading) {
    return <DepartmentRankingsTableSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Rankings</CardTitle>
          <CardDescription>Failed to load rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Unable to load department rankings
          </div>
        </CardContent>
      </Card>
    );
  }

  // Null-safe rounder — protects against null/NaN reaching Math.round.
  const safeRound = (v: number | null | undefined) =>
    v != null && Number.isFinite(v) ? Math.round(v) : 0;

  // Top 5 departments — tolerate missing/undefined submission fields.
  const departmentsList = data.departments ?? [];
  const topDepartments = [...departmentsList]
    .sort((a, b) => {
      const aCompliance =
        ((a.submissions?.pdsCompliance ?? 0) +
          (a.submissions?.salnCompliance ?? 0)) /
        2;
      const bCompliance =
        ((b.submissions?.pdsCompliance ?? 0) +
          (b.submissions?.salnCompliance ?? 0)) /
        2;
      return bCompliance - aCompliance;
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Departments</CardTitle>
            <CardDescription>Ranked by overall compliance rate</CardDescription>
          </div>
          <Link href="/dashboard/organization">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              View All
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {topDepartments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No department data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header - Hidden on mobile, visible on desktop */}
            <div className="hidden px-2 pb-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-12 md:gap-4">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Department</div>
              <div className="col-span-2 text-center">Users</div>
              <div className="col-span-2 text-center">PDS</div>
              <div className="col-span-2 text-center">SALN</div>
            </div>

            {/* Table Rows */}
            {topDepartments.map((dept, index) => {
              const rank = index + 1;
              const medal = getMedal(rank);
              const _overallCompliance =
                ((dept.submissions?.pdsCompliance ?? 0) +
                  (dept.submissions?.salnCompliance ?? 0)) /
                2;

              return (
                <div
                  key={dept.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  style={rank <= 3 ? {
                    borderColor: 'var(--ranking-border)',
                    backgroundColor: 'var(--ranking-bg)',
                  } : undefined}>
                  {/* Mobile & Tablet Layout (< md) */}
                  <div className="md:hidden">
                    {/* Department Header */}
                    <div className="mb-3 flex items-start gap-3">
                      <div className="text-2xl font-bold">{medal || rank}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{dept.name}</p>
                          {getTrendIcon(dept.trend)}
                        </div>
                        <p className="text-xs text-muted-foreground">{dept.code}</p>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center gap-1 rounded-md bg-muted/30 p-2">
                        <span className="text-xs text-muted-foreground">Users</span>
                        <Badge variant="secondary" className="text-xs">
                          {dept.users.total}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-center gap-1 rounded-md bg-muted/30 p-2">
                        <span className="text-xs text-muted-foreground">PDS</span>
                        <Badge
                          variant={
                            (dept.submissions?.pdsCompliance ?? 0) >= 90
                              ? 'default'
                              : (dept.submissions?.pdsCompliance ?? 0) >= 70
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="text-xs">
                          {safeRound(dept.submissions?.pdsCompliance)}%
                        </Badge>
                      </div>
                      <div className="flex flex-col items-center gap-1 rounded-md bg-muted/30 p-2">
                        <span className="text-xs text-muted-foreground">SALN</span>
                        <Badge
                          variant={
                            (dept.submissions?.salnCompliance ?? 0) >= 90
                              ? 'default'
                              : (dept.submissions?.salnCompliance ?? 0) >= 70
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="text-xs">
                          {safeRound(dept.submissions?.salnCompliance)}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout (md+) */}
                  <div className="hidden md:grid md:grid-cols-12 md:gap-4">
                    {/* Rank */}
                    <div className="col-span-1 flex items-center text-lg font-bold">
                      {medal || rank}
                    </div>

                    {/* Department Name */}
                    <div className="col-span-5 flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">{dept.code}</p>
                      </div>
                      {getTrendIcon(dept.trend)}
                    </div>

                    {/* Users */}
                    <div className="col-span-2 flex items-center justify-center">
                      <Badge variant="secondary" className="text-xs">
                        {dept.users.total}
                      </Badge>
                    </div>

                    {/* PDS Compliance */}
                    <div className="col-span-2 flex items-center justify-center">
                      <Badge
                        variant={
                          (dept.submissions?.pdsCompliance ?? 0) >= 90
                            ? 'default'
                            : (dept.submissions?.pdsCompliance ?? 0) >= 70
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="text-xs">
                        {safeRound(dept.submissions?.pdsCompliance)}%
                      </Badge>
                    </div>

                    {/* SALN Compliance */}
                    <div className="col-span-2 flex items-center justify-center">
                      <Badge
                        variant={
                          (dept.submissions?.salnCompliance ?? 0) >= 90
                            ? 'default'
                            : (dept.submissions?.salnCompliance ?? 0) >= 70
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="text-xs">
                        {safeRound(dept.submissions?.salnCompliance)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton
 */
export function DepartmentRankingsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header skeleton - hidden on mobile */}
          <div className="hidden px-2 pb-2 md:grid md:grid-cols-12 md:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>

          {/* Row skeletons */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              {/* Mobile skeleton */}
              <div className="md:hidden">
                <div className="mb-3 flex items-start gap-3">
                  <Skeleton className="h-8 w-8" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>

              {/* Desktop skeleton */}
              <div className="hidden md:grid md:grid-cols-12 md:gap-4">
                <Skeleton className="col-span-1 h-6 w-6" />
                <div className="col-span-5 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="col-span-2 h-5 w-10" />
                <Skeleton className="col-span-2 h-5 w-10" />
                <Skeleton className="col-span-2 h-5 w-10" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
