/**
 * Submission Statistics Cards
 *
 * Displays key metrics for submission review dashboard
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle2, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { SubmissionStatsResponse } from '@tupsafe/types';

interface SubmissionStatsCardsProps {
  stats: SubmissionStatsResponse | undefined;
  isLoading: boolean;
}

export function SubmissionStatsCards({ stats, isLoading }: SubmissionStatsCardsProps) {
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

  const pendingTotal = stats.pending.total;
  const approvedThisWeek = stats.approved.thisWeek;
  const avgReviewTime = stats.averageReviewTime;
  const complianceRate = stats.complianceRate;

  const isUrgent = pendingTotal > 20;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Pending Review Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Review
          </CardTitle>
          <FileText className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{pendingTotal}</div>
            {isUrgent && (
              <AlertCircle className="h-4 w-4 text-orange-600" aria-label="Urgent" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.pending.pds} PDS, {stats.pending.saln} SALN
            {isUrgent && ' - Needs attention'}
          </p>
        </CardContent>
      </Card>

      {/* Approved This Week Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Approved This Week
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{approvedThisWeek}</div>
            <TrendingUp className="h-3 w-3 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.approved.thisMonth} this month
          </p>
        </CardContent>
      </Card>

      {/* Average Review Time Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Review Time
          </CardTitle>
          <Clock className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgReviewTime}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {parseFloat(avgReviewTime) < 2 ? 'Excellent' : 'Good'} performance
          </p>
        </CardContent>
      </Card>

      {/* Compliance Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Compliance Rate
          </CardTitle>
          <div className="relative h-4 w-4">
            <svg className="h-4 w-4 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-muted"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-teal-600"
                strokeWidth="3"
                strokeDasharray={`${complianceRate} ${100 - complianceRate}`}
              />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{complianceRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {complianceRate >= 90
              ? 'Excellent'
              : complianceRate >= 70
                ? 'Good'
                : 'Needs improvement'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
