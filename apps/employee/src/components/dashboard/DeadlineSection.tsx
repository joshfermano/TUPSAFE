'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons';
import { MagicCard } from '../ui/magic-card';
import { BlurFade } from '../ui/blur-fade';
import { ShineBorder } from '../ui/shine-border';
import { cn } from '../../lib/utils';
import {
  useDeadlineForForm,
  type UrgencyLevel,
} from '../../hooks/useDeadlines';
import { useLatestPDS } from '../../hooks';
import { DeadlineCountdown } from './DeadlineCountdown';

interface DeadlineSectionProps {
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
 * Form type display configuration
 */
const formTypeConfig = {
  pds: {
    label: 'Personal Data Sheet',
    shortLabel: 'PDS',
    description: 'Update your personal information',
    submitPath: '/dashboard/pds',
    icon: CalendarIcon,
  },
  saln: {
    label: 'Statement of Assets, Liabilities & Net Worth',
    shortLabel: 'SALN',
    description: 'Submit your financial declaration',
    submitPath: '/dashboard/saln',
    icon: ClockIcon,
  },
};

/**
 * Urgency-based styling configuration
 * Defines colors, gradients, and effects for each urgency level
 */
const urgencyConfig: Record<
  UrgencyLevel,
  {
    containerClass: string;
    gradientColors: { from: string; to: string; color: string };
    shineBorderColor: string[];
    iconClass: string;
    buttonClass: string;
    borderClass: string;
    bgClass: string;
  }
> = {
  critical: {
    containerClass: 'border-red-300 dark:border-red-800/60',
    gradientColors: {
      from: '#ef4444',
      to: '#dc2626',
      color: 'rgba(239, 68, 68, 0.15)',
    },
    shineBorderColor: ['#ef4444', '#dc2626', '#b91c1c'],
    iconClass: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    buttonClass:
      'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white shadow-lg shadow-red-500/25',
    borderClass: 'border-red-200 dark:border-red-800/50',
    bgClass:
      'bg-gradient-to-br from-red-50/80 via-white to-red-50/50 dark:from-red-950/30 dark:via-slate-900 dark:to-red-950/20',
  },
  warning: {
    containerClass: 'border-amber-300 dark:border-amber-800/60',
    gradientColors: {
      from: '#f59e0b',
      to: '#d97706',
      color: 'rgba(245, 158, 11, 0.12)',
    },
    shineBorderColor: ['#f59e0b', '#d97706', '#b45309'],
    iconClass:
      'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    buttonClass:
      'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-lg shadow-amber-500/25',
    borderClass: 'border-amber-200 dark:border-amber-800/50',
    bgClass:
      'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20',
  },
  normal: {
    containerClass: 'border-emerald-200 dark:border-emerald-800/50',
    gradientColors: {
      from: '#10b981',
      to: '#059669',
      color: 'rgba(16, 185, 129, 0.08)',
    },
    shineBorderColor: ['#10b981', '#059669', '#047857'],
    iconClass:
      'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    buttonClass:
      'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    borderClass: 'border-emerald-200 dark:border-emerald-800/50',
    bgClass:
      'bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/15',
  },
};

/**
 * Format date for display
 */
function formatDeadlineDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * DeadlineSection Component
 *
 * A persistent, non-dismissible deadline display section for the employee dashboard.
 * Shows upcoming deadlines for PDS or SALN submissions with urgency-based styling.
 *
 * Features:
 * - Uses Magic UI components (MagicCard, BlurFade, ShineBorder)
 * - Urgency-based visual styling:
 *   - Critical (< 7 days): Red gradient, pulsing animation, red glow ShineBorder
 *   - Warning (7-30 days): Amber gradient, amber glow ShineBorder
 *   - Normal (> 30 days): Blue/green gradient, subtle ShineBorder
 * - Animated countdown using DeadlineCountdown component
 * - Direct link to submission form
 * - Loading and empty states
 *
 * @example
 * ```tsx
 * // Show PDS deadline
 * <DeadlineSection formType="pds" />
 *
 * // Show SALN deadline
 * <DeadlineSection formType="saln" />
 *
 * // With custom styling
 * <DeadlineSection formType="pds" className="mb-6" />
 * ```
 */
export const DeadlineSection = memo(function DeadlineSection({
  formType,
  className,
}: DeadlineSectionProps) {
  const { deadline, isLoading, isError, urgencyLevel } =
    useDeadlineForForm(formType);

  // Fetch latest PDS submission to check if approved
  const { data: latestSubmission, isLoading: isLoadingLatest } = useLatestPDS();

  const config = formTypeConfig[formType];
  const Icon = config.icon;

  // Debug logging to verify deadline data
  if (deadline) {
    console.log(`[DeadlineSection ${formType}] Deadline data:`, {
      deadlineDate: deadline.deadlineDate,
      daysRemaining: deadline.daysRemaining,
      urgencyLevel,
      isOverdue: deadline.isOverdue,
    });
  }

  // Check if user has an approved PDS for this deadline's year
  // If approved, don't show the deadline section
  const hasApprovedSubmission =
    latestSubmission?.status === 'approved' &&
    latestSubmission?.year === deadline?.year;

  // Hide deadline if user has approved submission for this year
  if (hasApprovedSubmission) {
    console.log(`[DeadlineSection ${formType}] Hiding deadline - approved submission exists for year ${deadline?.year}`);
    return null;
  }

  // Loading state - wait for both deadline and latest submission data
  if (isLoading || isLoadingLatest) {
    return (
      <BlurFade delay={0.1} inView>
        <div
          className={cn(
            'relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6',
            'animate-pulse',
            className
          )}>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-16 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </BlurFade>
    );
  }

  // Error state
  if (isError) {
    return (
      <BlurFade delay={0.1} inView>
        <div
          className={cn(
            'relative rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 p-6',
            className
          )}>
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              Failed to load {config.shortLabel} deadline
            </span>
          </div>
        </div>
      </BlurFade>
    );
  }

  // No deadline found
  if (!deadline) {
    return (
      <BlurFade delay={0.1} inView>
        <div
          className={cn(
            'relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6',
            className
          )}>
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium">
              No active {config.shortLabel} deadline
            </span>
          </div>
        </div>
      </BlurFade>
    );
  }

  // Active deadline display
  const urgency = urgencyConfig[urgencyLevel || 'normal'];
  const isCritical = urgencyLevel === 'critical';
  const isOverdue = deadline.isOverdue;

  return (
    <BlurFade delay={0.1} inView>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -2 }}
        className={cn('relative', className)}>
        <MagicCard
          gradientSize={300}
          gradientColor={urgency.gradientColors.color}
          gradientOpacity={isCritical || isOverdue ? 0.12 : 0.06}
          gradientFrom={urgency.gradientColors.from}
          gradientTo={urgency.gradientColors.to}
          className={cn(
            'relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300',
            urgency.containerClass,
            urgency.bgClass,
            'hover:shadow-md'
          )}>
          {/* Shine border effect - always visible for urgent, hover for normal */}
          <div
            className={cn(
              'transition-opacity duration-300',
              isCritical || isOverdue
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            )}>
            <ShineBorder
              borderWidth={isCritical || isOverdue ? 2 : 1}
              duration={isCritical ? 6 : 10}
              shineColor={urgency.shineBorderColor}
            />
          </div>

          {/* Critical/Overdue pulsing background overlay */}
          {(isCritical || isOverdue) && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 dark:from-red-500/10 dark:to-red-500/10"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Content container */}
          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {/* Left section: Icon and form info */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Icon container */}
                <motion.div
                  className={cn(
                    'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                    urgency.iconClass
                  )}
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  {isOverdue ? (
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </motion.div>

                {/* Form type label and deadline info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {config.shortLabel} Submission
                    </h3>
                    {isCritical && !isOverdue && (
                      <motion.span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}>
                        Urgent
                      </motion.span>
                    )}
                    {isOverdue && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {config.label}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      Due: {formatDeadlineDate(deadline.deadlineDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center section: Countdown */}
              <div className="flex items-center justify-center sm:px-4">
                <DeadlineCountdown
                  daysRemaining={deadline.daysRemaining}
                  urgencyLevel={urgencyLevel || 'normal'}
                  size="default"
                />
              </div>
            </div>
          </div>
        </MagicCard>
      </motion.div>
    </BlurFade>
  );
});
