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
      'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:border-blue-500/30',
  },
  reviewing: {
    label: 'Reviewing',
    icon: Eye,
    className:
      'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20 dark:border-yellow-500/30 animate-pulse',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className:
      'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 dark:border-green-500/30',
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
      'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 dark:border-green-500/30',
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
