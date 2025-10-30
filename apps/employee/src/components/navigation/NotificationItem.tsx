/**
 * NotificationItem Component
 *
 * Reusable component for displaying individual notifications in lists.
 * Optimized with React.memo for performance when rendering many notifications.
 *
 * Features:
 * - Type-based icons and styling
 * - Relative timestamp formatting
 * - Unread indicator
 * - Smooth hover animations
 * - Click handler support
 * - Accessible keyboard navigation
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  Eye,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Notification type definition
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'submission' | 'deadline' | 'profile' | 'system';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

/**
 * NotificationItem props
 */
export interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
  showUnreadIndicator?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Get icon based on notification type and category
 */
function getNotificationIcon(
  type?: string,
  category?: string,
  metadata?: Record<string, unknown>
): LucideIcon {
  // Check metadata for specific status
  if (metadata?.status) {
    const statusIcons: Record<string, LucideIcon> = {
      submitted: Clock,
      approved: CheckCircle2,
      rejected: XCircle,
      reviewing: Eye,
      returned: AlertCircle,
    };
    if (statusIcons[metadata.status as string]) {
      return statusIcons[metadata.status as string];
    }
  }

  // Category-based icons
  if (category) {
    const categoryIcons: Record<string, LucideIcon> = {
      submission: FileText,
      deadline: Calendar,
      profile: User,
      system: Bell,
    };
    if (categoryIcons[category]) {
      return categoryIcons[category];
    }
  }

  // Type-based icons (fallback)
  const typeIcons: Record<string, LucideIcon> = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
  };

  return type && typeIcons[type] ? typeIcons[type] : Bell;
}

/**
 * Get icon color classes based on notification type
 */
function getIconColorClasses(type?: string): string {
  const colorMap: Record<string, string> = {
    success: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
    error: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    info: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
  };

  return colorMap[type || 'info'] || colorMap.info;
}

/**
 * Get border color classes based on notification type
 */
function getBorderColorClasses(type?: string, isRead?: boolean): string {
  if (isRead) {
    return 'border-border/30';
  }

  const colorMap: Record<string, string> = {
    success: 'border-green-200 dark:border-green-800',
    warning: 'border-amber-200 dark:border-amber-800',
    error: 'border-red-200 dark:border-red-800',
    info: 'border-blue-200 dark:border-blue-800',
  };

  return colorMap[type || 'info'] || colorMap.info;
}

/**
 * NotificationItem Component
 */
export const NotificationItem = React.memo<NotificationItemProps>(
  ({ notification, onClick, showUnreadIndicator = true, compact = false, className }) => {
    const Icon = getNotificationIcon(
      notification.type,
      notification.category,
      notification.metadata
    );

    // Format relative timestamp
    const relativeTime = React.useMemo(() => {
      try {
        return formatDistanceToNow(new Date(notification.createdAt), {
          addSuffix: true,
        });
      } catch {
        return 'recently';
      }
    }, [notification.createdAt]);

    const handleClick = () => {
      onClick?.(notification);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'group relative flex gap-3 rounded-lg border transition-all duration-200',
          'cursor-pointer select-none',
          'focus-within:ring-2 focus-within:ring-primary/20',
          compact ? 'p-3' : 'p-4',
          // Background based on read status
          notification.isRead
            ? 'bg-background/50 hover:bg-accent/50'
            : 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15',
          // Border color
          getBorderColorClasses(notification.type, notification.isRead),
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Notification: ${notification.title}`}>
        {/* Unread Indicator Dot */}
        {showUnreadIndicator && !notification.isRead && (
          <div className="absolute top-2 left-2 h-2 w-2 rounded-full bg-tup-primary animate-pulse" />
        )}

        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 rounded-full p-2',
            'transition-transform duration-200 group-hover:scale-110',
            getIconColorClasses(notification.type)
          )}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title */}
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'text-sm font-semibold leading-tight',
                notification.isRead ? 'text-foreground/80' : 'text-foreground'
              )}>
              {notification.title}
            </h4>
            {/* Timestamp */}
            <time
              className={cn(
                'text-xs whitespace-nowrap flex-shrink-0',
                notification.isRead ? 'text-muted-foreground/60' : 'text-muted-foreground'
              )}
              dateTime={notification.createdAt}
              title={new Date(notification.createdAt).toLocaleString('en-PH', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}>
              {relativeTime}
            </time>
          </div>

          {/* Message */}
          <p
            className={cn(
              'text-xs leading-relaxed',
              compact ? 'line-clamp-2' : 'line-clamp-3',
              notification.isRead ? 'text-muted-foreground/70' : 'text-muted-foreground'
            )}>
            {notification.message}
          </p>

          {/* Action Label (if exists) */}
          {notification.actionLabel && (
            <div className="flex items-center gap-1 text-xs font-medium text-primary mt-1">
              <span>{notification.actionLabel}</span>
              <svg
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

NotificationItem.displayName = 'NotificationItem';
