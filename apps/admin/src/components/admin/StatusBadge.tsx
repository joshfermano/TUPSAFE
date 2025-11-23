import { memo } from 'react';
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
    className: 'bg-secondary text-secondary-foreground border-secondary',
  },
  submitted: {
    label: 'Submitted',
    icon: Clock,
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  },
  reviewing: {
    label: 'Reviewing',
    icon: Eye,
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800 animate-pulse',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  active: {
    label: 'Active',
    icon: UserCheck,
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
  },
  inactive: {
    label: 'Inactive',
    icon: UserX,
    className: 'bg-muted text-muted-foreground border-muted',
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

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium transition-colors',
        config.className,
        className
      )}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';
