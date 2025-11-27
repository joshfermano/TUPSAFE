/**
 * Jobs Statistics Cards
 *
 * Displays key metrics for jobs management dashboard
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, FileText, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { JobsStatsResponse } from '@tupsafe/types';

interface JobsStatsCardsProps {
  stats: JobsStatsResponse | undefined;
  isLoading: boolean;
}

export function JobsStatsCards({ stats, isLoading }: JobsStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const totalActive = stats.overview.totalActivePositions;
  const openPositions = stats.byStatus.open;
  const totalApplications = stats.overview.totalApplicationsReceived;
  const positionsFilled = stats.overview.positionsFilled;

  const avgApplications = stats.overview.averageApplicationsPerPosition;
  const hasUrgentDeadlines = stats.upcomingDeadlines.some((d) => d.daysRemaining <= 7);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Active Positions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Positions
          </CardTitle>
          <Briefcase className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{totalActive}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {openPositions} open, {stats.byStatus.filled} filled
          </p>
        </CardContent>
      </Card>

      {/* Open Positions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Open Positions
          </CardTitle>
          <div className="relative">
            <Briefcase className="h-4 w-4 text-green-600" />
            {hasUrgentDeadlines && (
              <AlertCircle
                className="h-3 w-3 text-orange-600 absolute -top-1 -right-1"
                aria-label="Urgent deadlines"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{openPositions}</div>
            <TrendingUp className="h-3 w-3 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {hasUrgentDeadlines ? 'Urgent deadlines approaching' : 'Actively recruiting'}
          </p>
        </CardContent>
      </Card>

      {/* Applications Received Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Applications Received
          </CardTitle>
          <FileText className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalApplications}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg {avgApplications.toFixed(1)} per position
          </p>
        </CardContent>
      </Card>

      {/* Positions Filled Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Positions Filled
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{positionsFilled}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalActive > 0
              ? `${((positionsFilled / totalActive) * 100).toFixed(1)}% fill rate`
              : 'No active positions'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
