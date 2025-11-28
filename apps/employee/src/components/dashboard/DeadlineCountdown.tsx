'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';
import type { UrgencyLevel } from '@/hooks/useDeadlines';

interface DeadlineCountdownProps {
  /**
   * Number of days remaining until deadline
   * Negative values indicate overdue
   */
  daysRemaining: number;
  /**
   * Urgency level for color styling
   * - critical: < 7 days (red, pulsing)
   * - warning: 7-30 days (amber)
   * - normal: > 30 days (blue/green)
   */
  urgencyLevel: UrgencyLevel;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * DeadlineCountdown Component
 *
 * Animated countdown display for days remaining until deadline.
 * Uses Magic UI's NumberTicker for smooth number transitions.
 *
 * Features:
 * - Animated number transitions using NumberTicker
 * - Color-coded based on urgency level (critical/warning/normal)
 * - Pulsing animation for critical deadlines
 * - Shows "Overdue" when deadline has passed
 * - Responsive size variants
 *
 * @example
 * ```tsx
 * <DeadlineCountdown daysRemaining={5} urgencyLevel="critical" />
 * <DeadlineCountdown daysRemaining={15} urgencyLevel="warning" size="lg" />
 * <DeadlineCountdown daysRemaining={-3} urgencyLevel="critical" /> // Shows "Overdue"
 * ```
 */
export const DeadlineCountdown = memo(function DeadlineCountdown({
  daysRemaining,
  urgencyLevel,
  className,
  size = 'default',
}: DeadlineCountdownProps) {
  const isOverdue = daysRemaining < 0;
  const displayDays = Math.abs(daysRemaining);

  // Size-based styling
  const sizeStyles = {
    sm: {
      number: 'text-2xl',
      label: 'text-xs',
      container: 'gap-0.5',
    },
    default: {
      number: 'text-4xl',
      label: 'text-sm',
      container: 'gap-1',
    },
    lg: {
      number: 'text-5xl',
      label: 'text-base',
      container: 'gap-1.5',
    },
  };

  // Urgency-based color styling
  const urgencyStyles = {
    critical: {
      number: 'text-red-600 dark:text-red-400',
      label: 'text-red-600/80 dark:text-red-400/80',
      glow: 'drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]',
    },
    warning: {
      number: 'text-amber-600 dark:text-amber-400',
      label: 'text-amber-600/80 dark:text-amber-400/80',
      glow: 'drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]',
    },
    normal: {
      number: 'text-emerald-600 dark:text-emerald-400',
      label: 'text-emerald-600/80 dark:text-emerald-400/80',
      glow: '',
    },
  };

  const currentSize = sizeStyles[size];
  const currentUrgency = urgencyStyles[urgencyLevel];

  // Whether to apply pulsing animation for critical deadlines
  const shouldPulse = urgencyLevel === 'critical' && !isOverdue;

  // Overdue state
  if (isOverdue) {
    return (
      <motion.div
        className={cn(
          'flex flex-col items-center justify-center',
          currentSize.container,
          className
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className={cn(
            'flex items-center gap-2',
            currentSize.number,
            'font-bold text-red-600 dark:text-red-400',
            'drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]'
          )}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <span className="tracking-tight">Overdue</span>
        </motion.div>
        <span
          className={cn(
            currentSize.label,
            'font-medium text-red-600/70 dark:text-red-400/70'
          )}
        >
          {displayDays} {displayDays === 1 ? 'day' : 'days'} past due
        </span>
      </motion.div>
    );
  }

  // Normal countdown display
  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center',
        currentSize.container,
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={
        shouldPulse
          ? {
              opacity: [1, 0.9, 1],
              scale: [1, 1.02, 1],
              y: 0,
            }
          : { opacity: 1, y: 0 }
      }
      transition={
        shouldPulse
          ? { duration: 2, repeat: Infinity }
          : { duration: 0.4 }
      }
    >
      <div
        className={cn(
          'flex items-baseline gap-1',
          currentUrgency.glow
        )}
      >
        <NumberTicker
          value={displayDays}
          direction="down"
          delay={0.1}
          className={cn(
            currentSize.number,
            'font-bold tabular-nums tracking-tight',
            currentUrgency.number
          )}
        />
      </div>
      <motion.span
        className={cn(
          currentSize.label,
          'font-medium tracking-wide uppercase',
          currentUrgency.label
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {displayDays === 1 ? 'day left' : 'days left'}
      </motion.span>
    </motion.div>
  );
});
