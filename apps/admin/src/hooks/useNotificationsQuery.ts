'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AdminNotification {
  id: string;
  userId: string;
  type: 'deadline_reminder' | 'submission_status' | 'approval_required' | 'system_update';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
}

interface NotificationsResponse {
  success: boolean;
  notifications: AdminNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

interface MarkReadResponse {
  success: boolean;
  updatedCount: number;
}

export const notificationKeys = {
  all: ['admin-notifications'] as const,
  list: (filters: NotificationFilters) =>
    [...notificationKeys.all, 'list', filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

async function fetchNotifications(
  filters: NotificationFilters
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.type) params.set('type', filters.type);
  if (filters.isRead !== undefined) params.set('isRead', String(filters.isRead));

  const response = await fetch(`/api/notifications?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error || `Failed to fetch notifications (${response.status})`
    );
  }
  return response.json();
}

async function markNotificationsRead(body: {
  notificationIds?: string[];
  markAll?: boolean;
}): Promise<MarkReadResponse> {
  const response = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error || `Failed to mark notifications as read (${response.status})`
    );
  }
  return response.json();
}

/**
 * Fetch paginated and filtered notifications for the current admin user.
 */
export function useAdminNotifications(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => fetchNotifications(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => ({
      notifications: data.notifications,
      pagination: data.pagination,
      unreadCount: data.unreadCount,
    }),
  });
}

/**
 * Mark one or more notifications as read, or mark all unread as read.
 * Invalidates notification queries on success.
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Lightweight query that returns only the unread notification count.
 * Useful for sidebar badges without loading the full notification list.
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => fetchNotifications({ limit: 1, isRead: false }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => data.unreadCount,
  });
}
