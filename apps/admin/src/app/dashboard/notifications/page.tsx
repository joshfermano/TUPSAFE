'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  FileText,
  ClipboardCheck,
  Clock,
  Info,
  Inbox,
  BellRing,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import {
  useAdminNotifications,
  useMarkNotificationsRead,
  type AdminNotification,
} from '@/hooks/useNotificationsQuery';
import { PageTransition } from '@/components/PageTransition';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// Tab value to notification type mapping
const TAB_TYPE_MAP: Record<string, string | undefined> = {
  all: undefined,
  submissions: 'submission_status',
  approvals: 'approval_required',
  deadlines: 'deadline_reminder',
  system: 'system_update',
};

// Notification type to icon + color mapping with proper dark mode contrast
function getNotificationStyle(type: AdminNotification['type']) {
  switch (type) {
    case 'approval_required':
      return {
        icon: ClipboardCheck,
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconText: 'text-emerald-700 dark:text-emerald-300',
      };
    case 'submission_status':
      return {
        icon: FileText,
        iconBg: 'bg-blue-100 dark:bg-blue-900/50',
        iconText: 'text-blue-700 dark:text-blue-300',
      };
    case 'deadline_reminder':
      return {
        icon: Clock,
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconText: 'text-amber-700 dark:text-amber-300',
      };
    case 'system_update':
      return {
        icon: Info,
        iconBg: 'bg-slate-200 dark:bg-slate-700',
        iconText: 'text-slate-700 dark:text-slate-300',
      };
  }
}

// Single notification row -- dense feed-style layout
function NotificationCard({
  notification,
  onMarkRead,
  isMarkingRead,
}: {
  notification: AdminNotification;
  onMarkRead: (id: string) => void;
  isMarkingRead: boolean;
}) {
  const { icon: Icon, iconBg, iconText } = getNotificationStyle(
    notification.type
  );

  const isUnread = !notification.isRead;

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors',
        isUnread
          ? 'border-l-2 border-l-blue-500 border-y-border border-r-border bg-blue-50/30 dark:bg-blue-950/10'
          : 'border-transparent bg-transparent hover:bg-muted/40',
      ].join(' ')}
    >
      {/* Type icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className={`h-4 w-4 ${iconText}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-sm ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}
          >
            {notification.title}
          </span>
          {isUnread && (
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500 dark:bg-blue-400" />
          )}
        </div>
        <p className="mt-0.5 text-sm leading-snug text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      {/* Mark as read button -- only for unread items */}
      {isUnread && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          disabled={isMarkingRead}
          onClick={() => onMarkRead(notification.id)}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Mark read</span>
        </Button>
      )}
    </div>
  );
}

// Loading skeleton -- matches denser layout
function NotificationsSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-2.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state
function NotificationsEmpty({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No notifications</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilter
          ? 'No notifications match the selected filter.'
          : 'You are all caught up. New notifications will appear here.'}
      </p>
    </div>
  );
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Derive the type filter from the active tab
  const typeFilter = TAB_TYPE_MAP[activeTab];

  const filters = useMemo(
    () => ({
      page,
      limit,
      type: typeFilter,
    }),
    [page, limit, typeFilter]
  );

  const { data, isLoading, isError, error } = useAdminNotifications(filters);
  const markReadMutation = useMarkNotificationsRead();

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setPage(1);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    markReadMutation.mutate({ markAll: true });
  }, [markReadMutation]);

  const handleMarkOneRead = useCallback(
    (id: string) => {
      markReadMutation.mutate({ notificationIds: [id] });
    },
    [markReadMutation]
  );

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    if (data?.pagination) {
      setPage((p) => Math.min(data.pagination.totalPages, p + 1));
    }
  }, [data?.pagination]);

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Activity feed and system notifications
          </p>
        </div>
        <Button
          variant={unreadCount > 0 ? 'default' : 'outline'}
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markReadMutation.isPending || unreadCount === 0}
          className="gap-2"
        >
          <BellRing className="h-4 w-4" />
          Mark all as read
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 bg-white/20 text-inherit dark:bg-black/20"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Shared content across all tab values */}
        {['all', 'submissions', 'approvals', 'deadlines', 'system'].map(
          (tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {isLoading && <NotificationsSkeleton />}

              {isError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive dark:border-destructive/40 dark:bg-destructive/5 dark:text-red-400">
                  {error instanceof Error
                    ? error.message
                    : 'Failed to load notifications'}
                </div>
              )}

              {!isLoading && !isError && data?.notifications.length === 0 && (
                <NotificationsEmpty hasFilter={activeTab !== 'all'} />
              )}

              {!isLoading &&
                !isError &&
                data &&
                data.notifications.length > 0 && (
                  <div className="space-y-1">
                    {data.notifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkRead={handleMarkOneRead}
                        isMarkingRead={markReadMutation.isPending}
                      />
                    ))}
                  </div>
                )}

              {/* Pagination */}
              {!isLoading && data && data.pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}{' '}
                    ({data.pagination.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={handlePrevPage}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={handleNextPage}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          )
        )}
      </Tabs>
    </PageTransition>
  );
}
