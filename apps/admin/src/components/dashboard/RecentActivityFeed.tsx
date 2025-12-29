/**
 * Recent Activity Feed
 *
 * Timeline-style activity log with user avatars and action icons
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import { UserPlus, CheckCircle, FileCheck, XCircle, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { DashboardOverviewResponse } from '@tupsafe/types';
import Link from 'next/link';

interface RecentActivityFeedProps {
  activities: DashboardOverviewResponse['recentActivity'];
}

/**
 * Get icon based on activity type
 */
function getActivityIcon(type: string) {
  switch (type) {
    case 'user_created':
      return <UserPlus className="h-4 w-4 text-blue-600" />;
    case 'registration_approved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'submission_approved':
      return <FileCheck className="h-4 w-4 text-green-600" />;
    case 'submission_rejected':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

/**
 * Get color class based on activity type
 */
function getActivityColor(type: string) {
  switch (type) {
    case 'user_created':
      return 'text-blue-600 dark:text-blue-400';
    case 'registration_approved':
    case 'submission_approved':
      return 'text-green-600 dark:text-green-400';
    case 'submission_rejected':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/audit-logs">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity: any, index: number) => (
              <div key={activity.id}>
                <div className="flex items-start gap-3">
                  {/* Activity Icon */}
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-relaxed">
                      <span className={getActivityColor(activity.type)}>{activity.description}</span>
                    </p>

                    {/* User Info */}
                    {activity.user && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={activity.user.avatarUrl || undefined} alt={activity.user.name} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(activity.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {activity.user.name}
                          {activity.user.role && ` • ${activity.user.role}`}
                        </span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Separator */}
                {index < activities.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for activity feed
 */
export function RecentActivityFeedSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
