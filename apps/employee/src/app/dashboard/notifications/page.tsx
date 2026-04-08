'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useUnreadCount,
  type Notification,
} from '../../../hooks';
import { cn } from '../../../lib/utils';

// =============================================================================
// Types & Constants
// =============================================================================

type NotificationType =
  | 'deadline_reminder'
  | 'submission_status'
  | 'approval_required'
  | 'system_update';

interface TabDef {
  key: string;
  label: string;
  apiType?: NotificationType;
  clientFilter?: (n: Notification) => boolean;
  emptyText: string;
}

const TABS: TabDef[] = [
  { key: 'all', label: 'All', emptyText: 'No notifications yet' },
  {
    key: 'pds',
    label: 'PDS',
    apiType: 'submission_status',
    clientFilter: (n) => n.title.includes('PDS'),
    emptyText: 'No PDS notifications',
  },
  {
    key: 'saln',
    label: 'SALN',
    apiType: 'submission_status',
    clientFilter: (n) => n.title.includes('SALN'),
    emptyText: 'No SALN notifications',
  },
  {
    key: 'certifications',
    label: 'Certifications',
    apiType: 'submission_status',
    clientFilter: (n) => n.title.toLowerCase().includes('certification'),
    emptyText: 'No certification notifications',
  },
  {
    key: 'deadlines',
    label: 'Deadlines',
    apiType: 'deadline_reminder',
    emptyText: 'No deadline reminders',
  },
  {
    key: 'system',
    label: 'System',
    apiType: 'system_update',
    emptyText: 'No system notifications',
  },
];

const ITEMS_PER_PAGE = 20;

// =============================================================================
// Skeleton
// =============================================================================

const SkeletonRows = memo(() => (
  <div className="divide-y divide-slate-100 dark:divide-slate-800">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="px-5 py-4 animate-pulse sm:px-6">
        <div className="flex items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-52 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-3.5 w-full max-w-lg rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    ))}
  </div>
));
SkeletonRows.displayName = 'SkeletonRows';

// =============================================================================
// Notification Row
// =============================================================================

interface NotificationRowProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}

const NotificationRow = memo<NotificationRowProps>(
  ({ notification, onMarkRead, isMarkingRead }) => {
    const relativeTime = useMemo(() => {
      try {
        return formatDistanceToNow(new Date(notification.createdAt), {
          addSuffix: true,
        });
      } catch {
        return 'recently';
      }
    }, [notification.createdAt]);

    const isUnread = !notification.isRead;

    return (
      <div
        className={cn(
          'px-5 py-4 border-b border-slate-100 dark:border-slate-800 transition-colors sm:px-6',
          isUnread
            ? 'bg-red-50/40 dark:bg-red-950/10'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
        )}
      >
        <div className="flex items-start gap-4">
          {/* Unread indicator */}
          <div className="mt-2 shrink-0 w-2 flex justify-center">
            {isUnread && (
              <div className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <h3
                className={cn(
                  'text-[15px] leading-snug',
                  isUnread
                    ? 'font-semibold text-slate-900 dark:text-slate-50'
                    : 'font-medium text-slate-600 dark:text-slate-400'
                )}
              >
                {notification.title}
              </h3>
              <time
                className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 mt-0.5"
                dateTime={notification.createdAt}
                title={new Date(notification.createdAt).toLocaleString('en-PH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              >
                {relativeTime}
              </time>
            </div>

            <p
              className={cn(
                'text-sm leading-relaxed mt-1',
                isUnread
                  ? 'text-slate-600 dark:text-slate-300'
                  : 'text-slate-400 dark:text-slate-500'
              )}
            >
              {notification.message}
            </p>

            {/* Mark read action */}
            {isUnread && (
              <button
                onClick={() => onMarkRead(notification.id)}
                disabled={isMarkingRead}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
              >
                <Check className="h-3 w-3" />
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
NotificationRow.displayName = 'NotificationRow';

// =============================================================================
// Main Page
// =============================================================================

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  const currentTab = useMemo(
    () => TABS.find((t) => t.key === activeTab) ?? TABS[0],
    [activeTab]
  );

  const queryParams = useMemo(() => {
    const params: { page: number; limit: number; type?: NotificationType } = {
      page,
      limit: ITEMS_PER_PAGE,
    };
    if (currentTab.apiType) {
      params.type = currentTab.apiType;
    }
    return params;
  }, [page, currentTab]);

  const { data, isLoading, isError } = useNotifications(queryParams);
  const { data: unreadCount } = useUnreadCount();
  const markRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsAsRead();

  const notifications = useMemo(() => {
    if (!data?.notifications) return [];
    if (currentTab.clientFilter) {
      return data.notifications.filter(currentTab.clientFilter);
    }
    return data.notifications;
  }, [data?.notifications, currentTab]);

  const pagination = data?.pagination;

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  const handleMarkRead = useCallback(
    (id: string) => markRead.mutate(id),
    [markRead]
  );

  const handleMarkAllRead = useCallback(
    () => markAllRead.mutate(),
    [markAllRead]
  );

  const hasUnread = typeof unreadCount === 'number' && unreadCount > 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 sm:text-2xl">
              Notifications
            </h1>
            {hasUnread && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold dark:bg-red-900/40 dark:text-red-400">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Stay updated on your submissions and deadlines
          </p>
        </div>

        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 sm:self-auto"
          >
            {markAllRead.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav
          className="-mb-px flex gap-1 overflow-x-auto"
          aria-label="Notification filters"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'whitespace-nowrap px-3 py-2.5 text-sm transition-colors border-b-2 sm:px-4',
                  isActive
                    ? 'border-red-600 text-red-700 dark:border-red-500 dark:text-red-400 font-medium'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* List */}
      <div className="rounded-b-xl border-x border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 overflow-hidden">
        {isLoading ? (
          <SkeletonRows />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-3">
              <Bell className="h-6 w-6 text-red-400 dark:text-red-500" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Failed to load notifications
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Please try again later.
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Inbox className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {currentTab.emptyText}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              You&apos;re all caught up.
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                isMarkingRead={markRead.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPreviousPage}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
