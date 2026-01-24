'use client';

import { memo } from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { cn } from '../../lib/utils';
import { useDeadlineForForm } from '../../hooks/useDeadlines';

interface DeadlineMinimalProps {
  /**
   * Form type to display deadline for
   * - 'pds': Personal Data Sheet
   * - 'saln': Statement of Assets, Liabilities, Net Worth
   */
  formType: 'pds' | 'saln';
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Format date for compact display
 * @param dateString - ISO date string (e.g., "2025-04-30")
 * @returns Formatted date string (e.g., "April 30, 2025")
 */
function formatDeadlineDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * DeadlineMinimal Component
 *
 * A compact inline badge displaying the deadline date with neutral styling.
 * Intended for use when the user has already submitted or has an approved/reviewing status,
 * where urgency styling is not appropriate.
 *
 * Features:
 * - Neutral slate/gray color scheme (no urgency color-coding)
 * - Compact inline badge style
 * - Shows "Deadline passed" when overdue
 * - Loading skeleton while fetching
 * - Returns null if no deadline exists
 *
 * @example
 * ```tsx
 * // Show PDS deadline in minimal style
 * <DeadlineMinimal formType="pds" />
 *
 * // Show SALN deadline with custom styling
 * <DeadlineMinimal formType="saln" className="mt-2" />
 * ```
 */
export const DeadlineMinimal = memo(function DeadlineMinimal({
  formType,
  className,
}: DeadlineMinimalProps) {
  const { deadline, isLoading } = useDeadlineForForm(formType);

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
          'bg-slate-100 dark:bg-slate-800',
          'animate-pulse',
          className
        )}>
        <span className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-slate-700" />
        <span className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      </span>
    );
  }

  // No deadline exists - return null
  if (!deadline) {
    return null;
  }

  const isOverdue = deadline.isOverdue;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
        'bg-slate-100 dark:bg-slate-800',
        'border border-slate-200 dark:border-slate-700',
        'text-slate-600 dark:text-slate-400',
        'text-xs font-medium',
        className
      )}>
      <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
      <span>
        {isOverdue
          ? 'Deadline passed'
          : `Deadline: ${formatDeadlineDate(deadline.deadlineDate)}`}
      </span>
    </span>
  );
});
