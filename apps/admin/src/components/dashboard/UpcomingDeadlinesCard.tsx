/**
 * Upcoming Deadlines Card
 *
 * Shows upcoming PDS/SALN deadlines with progress indicators
 */

'use client';

import { Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useComplianceReport } from '@/hooks/useDashboard';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Get badge variant and color based on days remaining
 */
function getDeadlineBadge(daysRemaining: number) {
  if (daysRemaining < 0) {
    return { variant: 'destructive' as const, color: 'text-red-600', label: 'Overdue' };
  }
  if (daysRemaining < 15) {
    return { variant: 'destructive' as const, color: 'text-red-600', label: `${daysRemaining}d left` };
  }
  if (daysRemaining < 30) {
    return { variant: 'secondary' as const, color: 'text-yellow-600', label: `${daysRemaining}d left` };
  }
  return { variant: 'default' as const, color: 'text-green-600', label: `${daysRemaining}d left` };
}

interface DeadlineItemProps {
  type: 'PDS' | 'SALN';
  deadline: Date | null;
  daysRemaining: number;
  submitted: number;
  expected: number;
  status: string;
}

function DeadlineItem({ type, deadline, daysRemaining, submitted, expected, status }: DeadlineItemProps) {
  const progress = expected > 0 ? (submitted / expected) * 100 : 0;
  const badge = getDeadlineBadge(daysRemaining);

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{type} Submission</p>
          {deadline && (
            <p className="text-xs text-muted-foreground">
              Due: {format(new Date(deadline), 'MMM dd, yyyy')}
            </p>
          )}
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className={cn('font-medium', badge.color)}>
            {submitted} / {expected}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {Math.round(progress)}% compliance rate
        </p>
      </div>

      {status !== 'on-track' && (
        <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-3 w-3" />
          <span className="capitalize">{status}</span>
        </div>
      )}
    </div>
  );
}

export function UpcomingDeadlinesCard() {
  const { data, isLoading, isError } = useComplianceReport();

  if (isLoading) {
    return <UpcomingDeadlinesCardSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Failed to load deadline information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Unable to load deadlines
          </div>
        </CardContent>
      </Card>
    );
  }

  const { deadlines } = data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Submission deadlines and progress</CardDescription>
          </div>
          <Link href="/dashboard/compliance">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              View Details
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* PDS Deadline */}
          {deadlines.pds.next && (
            <DeadlineItem
              type="PDS"
              deadline={deadlines.pds.next}
              daysRemaining={deadlines.pds.daysRemaining}
              submitted={deadlines.pds.submitted}
              expected={deadlines.pds.expected}
              status={deadlines.pds.status}
            />
          )}

          {/* SALN Deadline */}
          <DeadlineItem
            type="SALN"
            deadline={deadlines.saln.deadline}
            daysRemaining={deadlines.saln.daysRemaining}
            submitted={deadlines.saln.submitted}
            expected={deadlines.saln.expected}
            status={deadlines.saln.status}
          />

          {/* No deadlines */}
          {!deadlines.pds.next && !deadlines.saln.deadline && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton
 */
export function UpcomingDeadlinesCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
