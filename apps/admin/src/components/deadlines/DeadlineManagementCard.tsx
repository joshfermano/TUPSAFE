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
 */
function getUrgencyStyles(urgency: UrgencyLevel): {
  card: string;
  badge: string;
  icon: string;
  text: string;
} {
  switch (urgency) {
    case 'overdue':
      return {
        card: 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-700 dark:text-red-300',
      };
    case 'urgent':
      return {
        card: 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        icon: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-700 dark:text-amber-300',
      };
    case 'upcoming':
      return {
        card: 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        icon: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-emerald-700 dark:text-emerald-300',
      };
    default:
      return {
        card: '',
        badge: 'bg-muted text-muted-foreground',
        icon: 'text-muted-foreground',
        text: 'text-muted-foreground',
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
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
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
      <Card className={cn('border-destructive/50', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {errorTitle}
              </CardTitle>
              <CardDescription className="mt-1.5 text-muted-foreground">
                {formTypeLabel} Submission Deadline for {year}
              </CardDescription>
              <p className="text-sm mt-2 text-destructive/90">
                {errorDescription}
              </p>
              {isAuthError && (
                <p className="text-xs text-muted-foreground mt-2">
                  Contact your administrator to request HR or Admin access.
                </p>
              )}
              {!isAuthError && !isValidationError && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error details: {error.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Unable to load deadline
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAuthError && 'Authorization required'}
                  {isValidationError && 'Invalid parameters provided'}
                  {isNetworkError && 'Check your connection and try again'}
                  {!isAuthError && !isValidationError && !isNetworkError && 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No deadline exists
  if (!deadline) {
    return (
      <>
        <Card className={cn('border-dashed', className)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {formTypeLabel} Submission Deadline
                </CardTitle>
                <CardDescription>
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
          <CardContent>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
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

  return (
    <>
      <Card className={cn(urgencyStyles.card, className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  {formTypeLabel} Submission Deadline
                </CardTitle>
                <Badge
                  variant="secondary"
                  className={cn('text-xs', urgencyStyles.badge)}
                >
                  {year}
                </Badge>
              </div>
              <CardDescription className={cn('mt-1', urgencyStyles.text)}>
                {formatDaysRemaining(daysRemaining)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsSetDialogOpen(true)}
                className="h-8 w-8"
                title="Edit deadline"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Remove deadline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                isOverdue
                  ? 'bg-red-100 dark:bg-red-900/50'
                  : urgency === 'urgent'
                  ? 'bg-amber-100 dark:bg-amber-900/50'
                  : 'bg-emerald-100 dark:bg-emerald-900/50'
              )}
            >
              {isOverdue ? (
                <AlertTriangle className={cn('h-6 w-6', urgencyStyles.icon)} />
              ) : urgency === 'urgent' ? (
                <Clock className={cn('h-6 w-6', urgencyStyles.icon)} />
              ) : (
                <CheckCircle2 className={cn('h-6 w-6', urgencyStyles.icon)} />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(deadlineDate, 'MMMM d, yyyy')}
                </span>
              </div>
              {deadline.reminderDaysBefore && deadline.reminderDaysBefore.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Reminders:</span>
                  {deadline.reminderDaysBefore
                    .sort((a, b) => b - a)
                    .map((days) => (
                      <Badge key={days} variant="outline" className="text-xs px-1.5 py-0">
                        {days}d
                      </Badge>
                    ))}
                </div>
              )}
            </div>
            {deadline.complianceStats && (
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {Math.round(
                    ((deadline.complianceStats.submitted || 0) /
                      (deadline.complianceStats.totalEmployees || 1)) *
                      100
                  )}
                  %
                </div>
                <div className="text-xs text-muted-foreground">
                  {deadline.complianceStats.submitted} / {deadline.complianceStats.totalEmployees} submitted
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
