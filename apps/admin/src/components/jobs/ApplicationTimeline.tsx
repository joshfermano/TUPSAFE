/**
 * Application Timeline Component
 *
 * Displays application status history chronologically with visual timeline
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  UserCheck,
  UserX,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@tupsafe/types';

interface TimelineItem {
  id: string;
  previousStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  changedAt: Date;
  notes: string | null;
}

interface ApplicationTimelineProps {
  timeline: TimelineItem[];
  isLoading?: boolean;
}

/**
 * Status configuration with icons and colors
 */
const statusConfig: Record<ApplicationStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900',
  },
  under_review: {
    label: 'Under Review',
    icon: Eye,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  shortlisted: {
    label: 'Shortlisted',
    icon: FileText,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
  },
  for_interview: {
    label: 'For Interview',
    icon: Calendar,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900',
  },
  interviewed: {
    label: 'Interviewed',
    icon: UserCheck,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900',
  },
  for_final_review: {
    label: 'Final Review',
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: UserX,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900',
  },
  hired: {
    label: 'Hired',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900',
  },
};

export function ApplicationTimeline({ timeline, isLoading }: ApplicationTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No status changes recorded yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort timeline by date (newest first)
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          {/* Timeline items */}
          <div className="space-y-6">
            {sortedTimeline.map((item, index) => {
              const config = statusConfig[item.newStatus];
              const Icon = config.icon;
              const isLatest = index === 0;

              return (
                <div key={item.id} className="relative flex gap-4">
                  {/* Timeline dot with icon */}
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background',
                      config.bgColor,
                      isLatest && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>

                  {/* Timeline content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-medium mb-1',
                            config.color,
                            config.bgColor
                          )}
                        >
                          {config.label}
                        </Badge>
                        {item.previousStatus && (
                          <span className="text-xs text-muted-foreground ml-2">
                            from {statusConfig[item.previousStatus].label}
                          </span>
                        )}
                      </div>
                      {isLatest && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <time className="font-medium">
                          {format(new Date(item.changedAt), 'MMM dd, yyyy h:mm a')}
                        </time>
                        <span className="text-muted-foreground">
                          ({formatDistanceToNow(new Date(item.changedAt), { addSuffix: true })})
                        </span>
                      </div>

                      {item.changedBy && (
                        <div className="text-sm text-muted-foreground">
                          by {item.changedBy.firstName} {item.changedBy.lastName}
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">
                          <p className="text-muted-foreground italic">&ldquo;{item.notes}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
