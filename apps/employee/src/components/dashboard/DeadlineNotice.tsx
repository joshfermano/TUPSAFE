'use client';

import { memo } from 'react';
import { CalendarIcon, ClockIcon } from '@radix-ui/react-icons';
import { cn } from '../../lib/utils';
import {
  useDeadlineForForm,
  type UrgencyLevel,
} from '../../hooks/useDeadlines';

interface DeadlineNoticeProps {
  /**
   * Form type to display deadline for
   * - 'pds': Personal Data Sheet
   * - 'saln': Statement of Assets, Liabilities, Net Worth
   */
  formType: 'pds' | 'saln';
  /**
   * Display variant
   * - 'inline': Compact row for empty states
   * - 'banner': Full-width notice for create pages
   */
  variant: 'inline' | 'banner';
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Urgency-based styling configuration
 */
const urgencyStyles: Record<
  UrgencyLevel,
  {
    inline: {
      text: string;
      icon: string;
    };
    banner: {
      container: string;
      icon: string;
      text: string;
      badge: string;
    };
  }
> = {
  critical: {
    inline: {
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-500 dark:text-red-400',
    },
    banner: {
      container:
        'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-700 dark:text-red-300',
      badge:
        'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 ring-red-600/20 dark:ring-red-400/20',
    },
  },
  warning: {
    inline: {
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'text-amber-500 dark:text-amber-400',
    },
    banner: {
      container:
        'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50',
      icon: 'text-amber-600 dark:text-amber-400',
      text: 'text-amber-700 dark:text-amber-300',
      badge:
        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 ring-amber-600/20 dark:ring-amber-400/20',
    },
  },
  normal: {
    inline: {
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: 'text-emerald-500 dark:text-emerald-400',
    },
    banner: {
      container:
        'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50',
      icon: 'text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-700 dark:text-emerald-300',
      badge:
        'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20 dark:ring-emerald-400/20',
    },
  },
};

/**
 * Format date for display
 */
function formatDeadlineDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format days remaining text
 */
function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`;
  }
  if (daysRemaining === 0) {
    return 'Due today';
  }
  if (daysRemaining === 1) {
    return '1 day remaining';
  }
  return `${daysRemaining} days remaining`;
}

/**
 * Loading skeleton for inline variant
 */
function InlineSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 animate-pulse',
        className
      )}>
      <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

/**
 * Loading skeleton for banner variant
 */
function BannerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 animate-pulse',
        className
      )}>
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

/**
 * Inline variant component
 * Compact row with icon, date, and days remaining
 */
function InlineNotice({
  deadline,
  urgencyLevel,
  className,
}: {
  deadline: { deadlineDate: string; daysRemaining: number };
  urgencyLevel: UrgencyLevel;
  className?: string;
}) {
  const styles = urgencyStyles[urgencyLevel].inline;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        className
      )}>
      <CalendarIcon className={cn('h-4 w-4 flex-shrink-0', styles.icon)} />
      <span className={cn('font-medium', styles.text)}>
        Deadline: {formatDeadlineDate(deadline.deadlineDate)}
      </span>
      <span className="text-slate-300 dark:text-slate-600">|</span>
      <span className={cn('font-medium', styles.text)}>
        {formatDaysRemaining(deadline.daysRemaining)}
      </span>
    </div>
  );
}

/**
 * Banner variant component
 * Full-width notice with prominent styling
 */
function BannerNotice({
  deadline,
  urgencyLevel,
  formType,
  className,
}: {
  deadline: { deadlineDate: string; daysRemaining: number };
  urgencyLevel: UrgencyLevel;
  formType: 'pds' | 'saln';
  className?: string;
}) {
  const styles = urgencyStyles[urgencyLevel].banner;
  const formLabel = formType === 'pds' ? 'PDS' : 'SALN';
  const isOverdue = deadline.daysRemaining < 0;
  const isCritical = urgencyLevel === 'critical';

  return (
    <div
      className={cn(
        'w-full rounded-lg border p-4',
        styles.container,
        className
      )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            {isOverdue ? (
              <ClockIcon className={cn('h-5 w-5', styles.icon)} />
            ) : (
              <CalendarIcon className={cn('h-5 w-5', styles.icon)} />
            )}
          </div>
          <div className="min-w-0">
            <p className={cn('text-sm font-medium', styles.text)}>
              {formLabel} Submission {isOverdue ? 'was due' : 'due'}{' '}
              {formatDeadlineDate(deadline.deadlineDate)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isOverdue
                ? 'Please submit as soon as possible'
                : isCritical
                  ? 'Submit soon to avoid penalties'
                  : 'Ensure all information is accurate before submitting'}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
              styles.badge
            )}>
            <ClockIcon className="h-3 w-3" />
            {formatDaysRemaining(deadline.daysRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * DeadlineNotice Component
 *
 * A lightweight deadline notice component with two display variants.
 * Uses the useDeadlineForForm hook to fetch deadline data.
 *
 * Variants:
 * - 'inline': Compact row for empty states - shows icon, date, and days remaining
 * - 'banner': Full-width notice for create pages - prominent display with urgency styling
 *
 * Urgency levels:
 * - critical (< 7 days): Red styling
 * - warning (7-30 days): Amber styling
 * - normal (> 30 days): Green styling
 *
 * @example
 * ```tsx
 * // Inline variant for empty states
 * <DeadlineNotice formType="pds" variant="inline" />
 *
 * // Banner variant for form pages
 * <DeadlineNotice formType="saln" variant="banner" />
 *
 * // With custom styling
 * <DeadlineNotice formType="pds" variant="banner" className="mb-6" />
 * ```
 */
export const DeadlineNotice = memo(function DeadlineNotice({
  formType,
  variant,
  className,
}: DeadlineNoticeProps) {
  const { deadline, isLoading, urgencyLevel } = useDeadlineForForm(formType);

  // Loading state
  if (isLoading) {
    return variant === 'inline' ? (
      <InlineSkeleton className={className} />
    ) : (
      <BannerSkeleton className={className} />
    );
  }

  // No deadline exists - return null
  if (!deadline) {
    return null;
  }

  // Determine effective urgency level (default to 'normal' if not set)
  const effectiveUrgency = urgencyLevel ?? 'normal';

  // Render appropriate variant
  if (variant === 'inline') {
    return (
      <InlineNotice
        deadline={deadline}
        urgencyLevel={effectiveUrgency}
        className={className}
      />
    );
  }

  return (
    <BannerNotice
      deadline={deadline}
      urgencyLevel={effectiveUrgency}
      formType={formType}
      className={className}
    />
  );
});
