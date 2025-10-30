'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { StatusBadge, type Status } from './StatusBadge';
import { cn } from '@/lib/utils';

export interface ActivityItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  date: string;
  status?: Status;
  className?: string;
}

/**
 * Formats date to relative time (e.g., "2 days ago", "Just now")
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

/**
 * ActivityItem Component
 *
 * Displays a single activity item with icon, title, description, and optional status
 * Features subtle entrance animation with Framer Motion
 * Memoized for optimal performance in lists
 *
 * @param icon - Lucide icon component
 * @param title - Activity title
 * @param description - Activity description
 * @param date - ISO date string
 * @param status - Optional status badge
 */
const ActivityItemComponent = ({
  icon: Icon,
  title,
  description,
  date,
  status,
  className,
}: ActivityItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg',
        'hover:bg-muted/50 dark:hover:bg-muted/30',
        'transition-colors duration-200 group',
        className
      )}>
      {/* Icon Container */}
      <motion.div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          'bg-primary/10 dark:bg-primary/20',
          'text-primary transition-transform duration-200',
          'group-hover:scale-110'
        )}
        whileHover={{ rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
        <Icon className="h-5 w-5" />
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
            {title}
          </h4>
          {status && <StatusBadge status={status} />}
        </div>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {description}
        </p>
        <time className="text-xs text-muted-foreground/80 font-medium">
          {formatRelativeTime(date)}
        </time>
      </div>
    </motion.div>
  );
};

// Memoize for performance optimization
export const ActivityItem = memo(ActivityItemComponent);
ActivityItem.displayName = 'ActivityItem';
