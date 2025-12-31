/**
 * Compliance Overview
 *
 * Overall compliance summary with grade and metrics
 */

'use client';

import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useComplianceReport } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

/**
 * Get grade color
 */
function getGradeColor(grade: string) {
  switch (grade) {
    case 'A':
      return 'text-green-600 dark:text-green-400 border-green-600';
    case 'B':
      return 'text-blue-600 dark:text-blue-400 border-blue-600';
    case 'C':
      return 'text-yellow-600 dark:text-yellow-400 border-yellow-600';
    case 'D':
    case 'F':
      return 'text-red-600 dark:text-red-400 border-red-600';
    default:
      return 'text-muted-foreground border-muted-foreground';
  }
}

export function ComplianceOverview() {
  const { data, isLoading, isError } = useComplianceReport();

  if (isLoading) {
    return <ComplianceOverviewSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
          <CardDescription>Failed to load compliance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Unable to load compliance overview
          </div>
        </CardContent>
      </Card>
    );
  }

  const { overall } = data;
  const isImproving = overall.comparison.percentageChange > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Overview</CardTitle>
        <CardDescription>Overall compliance performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Compliance Rate with Grade */}
          <div className="flex items-center gap-6">
            <div
              className={cn(
                'flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4',
                getGradeColor(overall.grade)
              )}>
              <div className="text-center">
                <p className={cn('text-3xl font-bold', getGradeColor(overall.grade))}>
                  {overall.grade}
                </p>
                <p className="text-xs text-muted-foreground">Grade</p>
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-2xl font-bold">{overall.complianceRate.toFixed(1)}%</p>
                <Badge variant={isImproving ? 'default' : 'secondary'}>
                  {isImproving ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(overall.comparison.percentageChange).toFixed(1)}%
                </Badge>
              </div>
              <Progress value={overall.complianceRate} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                Overall compliance rate across all departments
              </p>
            </div>
          </div>

          {/* Comparison with Last Month */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              {isImproving ? (
                <Award className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isImproving ? 'Improving!' : 'Needs Attention'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {overall.comparison.lastMonth.toFixed(1)}% last month •{' '}
                  {isImproving ? '+' : ''}
                  {overall.comparison.percentageChange.toFixed(1)}% change
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">PDS Compliance</p>
              <p className="text-xl font-bold">{data.deadlines.pds.submitted}</p>
              <p className="text-xs text-muted-foreground">
                of {data.deadlines.pds.expected} employees
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">SALN Compliance</p>
              <p className="text-xl font-bold">{data.deadlines.saln.submitted}</p>
              <p className="text-xs text-muted-foreground">
                of {data.deadlines.saln.expected} employees
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton
 */
export function ComplianceOverviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
