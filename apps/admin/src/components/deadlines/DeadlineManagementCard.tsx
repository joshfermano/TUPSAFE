/**
 * Deadline Management Card Component
 *
 * Inline card component for displaying and managing submission deadlines.
 * Shows current deadline status with urgency-based color coding and action buttons.
 */

'use client';

import { useState, useMemo } from 'react';
import { format, differenceInDays, isPast, parseISO } from 'date-fns';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
} from 'lucide-react';

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { useDeadlineByFormType } from '@/hooks/useDeadlines';
import type { FormType } from '@/lib/api/deadlines';

import { SetDeadlineDialog } from './SetDeadlineDialog';
import { DeleteDeadlineDialog } from './DeleteDeadlineDialog';
import { cn } from '@/lib/utils';

interface DeadlineManagementCardProps {
  /** Form type to manage deadline for */
  formType: FormType;
  /** Year for the deadline (defaults to current year) */
  year?: number;
  /** Additional CSS classes */
  className?: string;
}

type UrgencyLevel = 'overdue' | 'urgent' | 'upcoming' | 'none';

/**
 * Get urgency level based on days remaining
 */
function getUrgencyLevel(daysRemaining: number | null | undefined): UrgencyLevel {
  if (daysRemaining === null || daysRemaining === undefined) return 'none';
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'urgent';
  return 'upcoming';
}

/**
 * Get urgency-based styling classes
 * Uses subtle left border accent with neutral backgrounds for clean, modern look
 * Perfect theme support with minimal color usage
 */
function getUrgencyStyles(urgency: UrgencyLevel): {
  border: string;
  badge: string;
  icon: string;
  progress: string;
} {
  switch (urgency) {
    case 'overdue':
      return {
        border: 'border-l-red-500 dark:border-l-red-400',
        badge: 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20',
        icon: 'text-red-600 dark:text-red-400',
        progress: 'bg-red-500',
      };
    case 'urgent':
      return {
        border: 'border-l-amber-500 dark:border-l-amber-400',
        badge: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20',
        icon: 'text-amber-600 dark:text-amber-400',
        progress: 'bg-amber-500',
      };
    case 'upcoming':
      return {
        border: 'border-l-emerald-500 dark:border-l-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        progress: 'bg-emerald-500',
      };
    default:
      return {
        border: 'border-l-muted-foreground/20',
        badge: 'bg-muted text-muted-foreground border-muted-foreground/20',
        icon: 'text-muted-foreground',
        progress: 'bg-muted-foreground',
      };
  }
}

/**
 * Format days remaining for display
 */
function formatDaysRemaining(days: number | null | undefined): string {
  if (days === null || days === undefined) return 'No deadline set';
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day remaining';
  return `${days} days remaining`;
}

export function DeadlineManagementCard({
  formType,
  year = new Date().getFullYear(),
  className,
}: DeadlineManagementCardProps) {
  const [isSetDialogOpen, setIsSetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: deadline, isLoading, error, refetch, isRefetching } = useDeadlineByFormType(formType, year);

  // Calculate days remaining from deadline date
  const daysRemaining = useMemo(() => {
    if (!deadline?.deadlineDate) return null;
    const deadlineDate = parseISO(deadline.deadlineDate);
    return differenceInDays(deadlineDate, new Date());
  }, [deadline?.deadlineDate]);

  const urgency = getUrgencyLevel(daysRemaining);
  const urgencyStyles = getUrgencyStyles(urgency);

  const formTypeLabel = formType.toUpperCase();

  // Log component state for debugging
  console.log('[DeadlineManagementCard] Render state:', {
    formType,
    year,
    isLoading,
    isRefetching,
    hasError: !!error,
    hasDeadline: !!deadline,
    errorMessage: error?.message,
  });

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('border-l-4 border-l-muted-foreground/20', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-12 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    const isAuthError = error.message?.includes('Unauthorized') || error.message?.includes('403');
    const isValidationError = error.message?.includes('Invalid request');
    const isNetworkError = error.message?.includes('Network error');

    let errorTitle = 'Failed to load deadline information';
    let errorDescription = error.message;
    let canRetry = true;

    if (isAuthError) {
      errorTitle = 'Permission denied';
      errorDescription = 'You do not have permission to view deadline information';
      canRetry = false;
    } else if (isValidationError) {
      errorTitle = 'Invalid request';
      errorDescription = 'The request parameters are invalid. Please refresh the page.';
      canRetry = false;
    } else if (isNetworkError) {
      errorTitle = 'Network error';
      errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      canRetry = true;
    }

    return (
      <Card className={cn('border-l-4 border-l-destructive', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <CardTitle className="text-base font-semibold">
                  {errorTitle}
                </CardTitle>
              </div>
              <CardDescription className="mt-1.5">
                {formTypeLabel} Submission Deadline for {year}
              </CardDescription>
            </div>
            {canRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('[DeadlineManagementCard] Retry button clicked');
                  refetch();
                }}
                disabled={isRefetching}
                className="gap-1.5"
              >
                {isRefetching ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Retry'
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-4">
            <p className="text-sm text-foreground">
              {errorDescription}
            </p>
            {isAuthError && (
              <p className="text-xs text-muted-foreground mt-2">
                Contact your administrator to request HR or Admin access.
              </p>
            )}
            {!isAuthError && !isValidationError && (
              <p className="text-xs text-muted-foreground mt-2">
                {error.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No deadline exists
  if (!deadline) {
    return (
      <>
        <Card className={cn('border-dashed border-l-4 border-l-muted-foreground/20', className)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {formTypeLabel} Submission Deadline
                </CardTitle>
                <CardDescription className="mt-1">
                  No deadline set for {year}
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsSetDialogOpen(true)}
                size="sm"
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Set Deadline
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CalendarDays className="h-5 w-5" />
              </div>
              <p className="text-sm">
                Set a submission deadline to track compliance and send automated reminders.
              </p>
            </div>
          </CardContent>
        </Card>

        <SetDeadlineDialog
          open={isSetDialogOpen}
          onOpenChange={setIsSetDialogOpen}
          formType={formType}
          defaultYear={year}
        />
      </>
    );
  }

  // Deadline exists - show with urgency styling
  const deadlineDate = parseISO(deadline.deadlineDate);
  const isOverdue = isPast(deadlineDate) && urgency === 'overdue';

  // Calculate compliance percentage
  const compliancePercentage = deadline.complianceStats
    ? Math.round(
        ((deadline.complianceStats.submitted || 0) /
          (deadline.complianceStats.totalEmployees || 1)) *
          100
      )
    : 0;

  return (
    <>
      <Card className={cn('border-l-4', urgencyStyles.border, className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  {formTypeLabel} Submission Deadline
                </CardTitle>
                <Badge variant="outline" className={cn('text-xs font-medium', urgencyStyles.badge)}>
                  {year}
                </Badge>
              </div>
              <CardDescription className="mt-1.5">
                {formatDaysRemaining(daysRemaining)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSetDialogOpen(true)}
                className="h-8 w-8 p-0"
                title="Edit deadline"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Remove deadline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-6">
            {/* Left section - Date and Reminders */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className={cn('h-4 w-4', urgencyStyles.icon)} />
                <span className="text-sm font-medium">
                  {format(deadlineDate, 'MMMM d, yyyy')}
                </span>
              </div>
              {deadline.reminderDaysBefore && deadline.reminderDaysBefore.length > 0 && (
                <div className="flex items-center gap-2">
                  {isOverdue ? (
                    <AlertTriangle className={cn('h-4 w-4', urgencyStyles.icon)} />
                  ) : urgency === 'urgent' ? (
                    <Clock className={cn('h-4 w-4', urgencyStyles.icon)} />
                  ) : (
                    <CheckCircle2 className={cn('h-4 w-4', urgencyStyles.icon)} />
                  )}
                  <div className="flex items-center gap-1.5">
                    {deadline.reminderDaysBefore
                      .sort((a, b) => b - a)
                      .map((days) => (
                        <Badge
                          key={days}
                          variant="outline"
                          className="text-xs px-2 py-0.5 font-normal"
                        >
                          {days}d
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right section - Compliance Stats */}
            {deadline.complianceStats && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tabular-nums">
                    {compliancePercentage}
                  </span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {deadline.complianceStats.submitted} / {deadline.complianceStats.totalEmployees} submitted
                </div>
                {/* Progress bar */}
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className={cn('h-full rounded-full transition-all', urgencyStyles.progress)}
                    style={{ width: `${compliancePercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <SetDeadlineDialog
        open={isSetDialogOpen}
        onOpenChange={setIsSetDialogOpen}
        formType={formType}
        existingDeadline={deadline}
        defaultYear={year}
      />

      <DeleteDeadlineDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deadline={deadline}
      />
    </>
  );
}
