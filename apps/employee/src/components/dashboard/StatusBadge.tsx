'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { cn } from '../../lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '../ui/badge';

// Status type definition
export type Status = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

export interface StatusBadgeProps
  extends Omit<React.ComponentProps<typeof Badge>, 'variant'> {
  status: Status;
}

// Status configuration with colors aligned to TUPSAFE branding
const statusConfig: Record<
  Status,
  {
    label: string;
    variant: VariantProps<typeof badgeVariants>['variant'];
    className: string;
    animate?: boolean; // Whether to add special animation
  }
> = {
  draft: {
    label: 'Draft',
    variant: 'outline',
    className: 'border-muted-foreground/30 text-muted-foreground bg-muted/50',
    animate: false,
  },
  pending: {
    label: 'Pending Review',
    variant: 'outline',
    className:
      'border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
    animate: true, // Pulse animation for pending
  },
  approved: {
    label: 'Approved',
    variant: 'outline',
    className:
      'border-green-500/50 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30',
    animate: true, // Shiny text for approved
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    className: 'border-transparent',
    animate: false,
  },
  archived: {
    label: 'Archived',
    variant: 'outline',
    className:
      'border-red-500/50 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30',
    animate: false,
  },
};

/**
 * StatusBadge Component
 *
 * A memoized badge component for displaying document/submission status
 * Uses TUPSAFE color scheme for consistent branding with subtle MagicUI enhancements
 *
 * @param status - The status to display (draft, pending, approved, rejected, archived)
 * @param className - Optional additional classes
 */
const StatusBadgeComponent = ({
  status,
  className,
  ...props
}: StatusBadgeProps) => {
  const config = statusConfig[status];

  // Pulse animation for pending status
  if (status === 'pending' && config.animate) {
    return (
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
          opacity: [1, 0.9, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}>
        <Badge
          variant={config.variant}
          className={cn(
            'font-medium transition-colors duration-200',
            config.className,
            className
          )}
          {...props}>
          <span className="relative flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            {config.label}
          </span>
        </Badge>
      </motion.div>
    );
  }

  // Shiny text for approved status
  if (status === 'approved' && config.animate) {
    return (
      <Badge
        variant={config.variant}
        className={cn(
          'font-medium transition-colors duration-200',
          config.className,
          className
        )}
        {...props}>
        <AnimatedShinyText
          className="inline-flex items-center justify-center transition ease-out hover:text-green-600 hover:duration-300 hover:dark:text-green-300"
          shimmerWidth={100}>
          <span className="text-xs font-medium">✓ {config.label}</span>
        </AnimatedShinyText>
      </Badge>
    );
  }

  // Default rendering for other statuses
  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium transition-colors duration-200',
        config.className,
        className
      )}
      {...props}>
      {config.label}
    </Badge>
  );
};

// Memoize for performance optimization
export const StatusBadge = memo(StatusBadgeComponent);
StatusBadge.displayName = 'StatusBadge';
