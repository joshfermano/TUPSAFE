/**
 * Pending Tasks Widget
 *
 * Actionable task list with links to relevant pages
 */

'use client';

import { CheckSquare, AlertCircle, Clock, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardOverviewResponse } from '@tupsafe/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PendingTasksWidgetProps {
  data: DashboardOverviewResponse;
}

interface TaskItemProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  href: string;
  urgent?: boolean;
  description?: string;
}

function TaskItem({ icon, label, count, href, urgent, description }: TaskItemProps) {
  return (
    <Link href={href} className="block">
      <div
        className={cn(
          'group flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50',
          urgent && 'border-destructive/20 bg-destructive/5'
        )}>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground',
            urgent && 'bg-destructive/10 text-destructive'
          )}>
          {/* We clone the icon to override its className if needed, or rely on text color */}
          {/* Actually the icon prop is a ReactNode, so we can't easily clone with new props unless it's a valid element. 
              But the icon passed has className set. We should probably just use the parent color for SVG fill/stroke. 
              The original code passed specific colors. We will assume the passed icon handles its color or inherits.
              Wait, the original code had hardcoded colors in the passed icon className.
          */}
          <div className={cn(urgent ? "text-destructive" : "text-foreground")}>
            {/* We wrap it to force color if needed, but the passed icon might have its own class. 
               Let's look at how it's called. 
               <Users className="h-4 w-4 text-blue-600" />
               Shadcn prefers text-primary or foreground.
            */}
             {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{label}</p>
            {urgent && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0">
          {count}
        </Badge>
      </div>
    </Link>
  );
}

export function PendingTasksWidget({ data }: PendingTasksWidgetProps) {
  const { registrations, submissions, compliance, alerts } = data;

  // Calculate tasks
  const tasks: TaskItemProps[] = [];

  // Pending registrations
  if (registrations.pending > 0) {
    tasks.push({
      icon: <Users className="h-4 w-4" />, // removed text-blue-600
      label: 'Review Registrations',
      count: registrations.pending,
      href: '/dashboard/registrations',
      urgent: registrations.pending > 10,
      description: registrations.pending > 10 ? 'High volume of pending requests' : undefined,
    });
  }

  // Pending PDS submissions
  if (submissions.pending.pds > 0) {
    tasks.push({
      icon: <FileText className="h-4 w-4" />, // removed text-green-600
      label: 'Review PDS Submissions',
      count: submissions.pending.pds,
      href: '/dashboard/submissions?type=pds&status=submitted',
      urgent: submissions.pending.pds > 15,
    });
  }

  // Pending SALN submissions
  if (submissions.pending.saln > 0) {
    tasks.push({
      icon: <FileText className="h-4 w-4" />, // removed text-purple-600
      label: 'Review SALN Submissions',
      count: submissions.pending.saln,
      href: '/dashboard/submissions?type=saln&status=submitted',
      urgent: submissions.pending.saln > 15,
    });
  }

  // Overdue PDS
  if (compliance.pds.overdue > 0) {
    tasks.push({
      icon: <AlertCircle className="h-4 w-4" />, // removed text-red-600, handled by urgent
      label: 'Overdue PDS',
      count: compliance.pds.overdue,
      href: '/dashboard/compliance',
      urgent: true,
      description: `${compliance.pds.overdue} employees have not submitted PDS`,
    });
  }

  // Overdue SALN
  if (compliance.saln.overdue > 0) {
    tasks.push({
      icon: <AlertCircle className="h-4 w-4" />,
      label: 'Overdue SALN',
      count: compliance.saln.overdue,
      href: '/dashboard/compliance',
      urgent: true,
      description: `${compliance.saln.overdue} employees have not submitted SALN`,
    });
  }

  // Low compliance departments (from alerts)
  const lowComplianceAlert = alerts.find((alert) =>
    alert.id.includes('compliance')
  );
  if (lowComplianceAlert) {
    tasks.push({
      icon: <Clock className="h-4 w-4" />,
      label: lowComplianceAlert.title,
      count: 1,
      href: lowComplianceAlert.action?.url || '/dashboard/compliance',
      urgent: lowComplianceAlert.type === 'error',
      description: lowComplianceAlert.message,
    });
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>
              {tasks.length === 0 ? 'All caught up!' : `${tasks.length} items need attention`}
            </CardDescription>
          </div>
          {tasks.length > 0 && (
            <Badge variant="outline" className="text-sm">
              {tasks.reduce((sum, task) => sum + task.count, 0)} total
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckSquare className="mb-4 h-12 w-12 text-green-600" />
            <p className="text-sm font-medium">All tasks completed!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No pending actions at this time
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <TaskItem key={index} {...task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for pending tasks
 */
export function PendingTasksWidgetSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-8 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
