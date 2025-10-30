'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/components/ui/badge';

// Status type definition
export type Status = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

export interface StatusBadgeProps extends Omit<React.ComponentProps<typeof Badge>, 'variant'> {
  status: Status;
}

// Status configuration with colors aligned to TUPSAFE branding
const statusConfig: Record<Status, {
  label: string;
  variant: VariantProps<typeof badgeVariants>['variant'];
  className: string;
}> = {
  draft: {
    label: 'Draft',
    variant: 'outline',
    className: 'border-muted-foreground/30 text-muted-foreground bg-muted/50',
  },
  pending: {
    label: 'Pending',
    variant: 'outline',
    className: 'border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
  },
  approved: {
    label: 'Approved',
    variant: 'outline',
    className: 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    className: 'border-transparent',
  },
  archived: {
    label: 'Archived',
    variant: 'outline',
    className: 'border-blue-500/50 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
  },
};

/**
 * StatusBadge Component
 *
 * A memoized badge component for displaying document/submission status
 * Uses TUPSAFE color scheme for consistent branding
 *
 * @param status - The status to display (draft, pending, approved, rejected, archived)
 * @param className - Optional additional classes
 */
const StatusBadgeComponent = ({ status, className, ...props }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium transition-colors duration-200',
        config.className,
        className
      )}
      {...props}
    >
      {config.label}
    </Badge>
  );
};

// Memoize for performance optimization
export const StatusBadge = memo(StatusBadgeComponent);
StatusBadge.displayName = 'StatusBadge';
