import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Eye,
  UserCheck,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Status configuration mapping for StatusBadge component
 * Defines visual appearance and icons for each status type
 */
const statusConfig = {
  draft: {
    label: 'Draft',
    icon: FileText,
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700',
  },
  submitted: {
    label: 'Submitted',
    icon: Clock,
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  },
  reviewing: {
    label: 'Reviewing',
    icon: Eye,
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className:
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700',
  },
  active: {
    label: 'Active',
    icon: UserCheck,
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700',
  },
  inactive: {
    label: 'Inactive',
    icon: UserX,
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700',
  },
} as const;

export type StatusType = keyof typeof statusConfig;

interface StatusBadgeProps {
  /** The status to display */
  status: StatusType;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the icon */
  showIcon?: boolean;
}

/**
 * StatusBadge Component
 *
 * Displays a status badge with color coding and optional icon.
 * Used throughout the admin portal to show submission and user statuses.
 *
 * @example
 * ```tsx
 * <StatusBadge status="approved" />
 * <StatusBadge status="reviewing" showIcon={false} />
 * ```
 */
export const StatusBadge = memo(function StatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const shouldReduceMotion = useReducedMotion();

  // Pulse animation for "reviewing" status
  const pulseAnimation =
    status === 'reviewing' && !shouldReduceMotion
      ? {
          scale: [1, 1.02, 1],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        }
      : {};

  return (
    <motion.span
      layout
      animate={pulseAnimation}
      transition={{ duration: 0.3 }}
      style={{ display: 'inline-flex' }}
    >
      <Badge
        variant="outline"
        className={cn(
          'inline-flex items-center gap-1 font-medium transition-colors duration-300',
          config.className,
          className,
        )}
      >
        {showIcon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    </motion.span>
  );
});

StatusBadge.displayName = 'StatusBadge';
