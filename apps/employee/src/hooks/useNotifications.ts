import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Notification item structure
 */
interface Notification {
  id: string;
  type: 'deadline_reminder' | 'submission_status' | 'approval_required' | 'system_update';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

/**
 * Pagination metadata
 */
interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Notifications response
 */
interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  pagination: Pagination;
}

/**
 * Query parameters for fetching notifications
 */
interface NotificationsQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: 'deadline_reminder' | 'submission_status' | 'approval_required' | 'system_update';
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Fetch notifications from API
 */
async function fetchNotifications(params?: NotificationsQueryParams): Promise<NotificationsResponse> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.isRead !== undefined) queryParams.set('isRead', params.isRead.toString());
  if (params?.type) queryParams.set('type', params.type);
  if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.set('dateTo', params.dateTo);

  const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch notifications');
  }

  return response.json();
}

/**
 * Mark a notification as read
 */
async function markNotificationAsRead(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead(): Promise<void> {
  const response = await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mark all notifications as read');
  }
}

/**
 * Hook to fetch notifications with pagination and filters
 */
export function useNotifications(params?: NotificationsQueryParams) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => fetchNotifications(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to mark a single notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueriesData({ queryKey: ['notifications'] });

      // Optimistically update notification
      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: ['notifications'] },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            notifications: old.notifications.map((notification) =>
              notification.id === notificationId
                ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                : notification
            ),
          };
        }
      );

      return { previousNotifications };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error('Failed to mark notification as read');
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueriesData({ queryKey: ['notifications'] });

      // Optimistically update all notifications
      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: ['notifications'] },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            notifications: old.notifications.map((notification) => ({
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            })),
          };
        }
      );

      return { previousNotifications };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error('Failed to mark all notifications as read');
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      toast.success('All notifications marked as read');
    },
  });
}

/**
 * Export types for use in components
 */
export type {
  Notification,
  Pagination,
  NotificationsQueryParams,
};
