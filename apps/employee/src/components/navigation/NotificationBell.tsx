/**
 * NotificationBell Component
 *
 * Real-time notification center with bell icon, unread badge, and dropdown popover.
 * Integrates with Supabase real-time subscriptions for instant notification delivery.
 *
 * Features:
 * - Real-time notification updates
 * - Animated unread badge
 * - Pulse animation on new notifications
 * - Dropdown with recent notifications
 * - Mark as read functionality
 * - Mark all as read button
 * - Skeleton loading states
 * - Empty state
 * - Accessibility compliant
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellDot, Check, ExternalLink, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

// Notification Components
import { NotificationItem, type Notification } from './NotificationItem';

// Database hooks
import {
  useRealtimeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  notificationKeys,
} from '@tupsafe/database';
import { createClient } from '@tupsafe/auth';

// Mock auth (replace with real auth)
import { useAuth } from '@tupsafe/mock-data/api';

/**
 * Skeleton loader for notifications
 */
function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg border border-border/30 animate-pulse">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-2/3 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state for notifications
 */
function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">No notifications yet</h3>
      <p className="text-xs text-muted-foreground max-w-[250px]">
        When you receive updates about your submissions or profile, they&apos;ll appear here.
      </p>
    </div>
  );
}

/**
 * NotificationBell Props
 */
export interface NotificationBellProps {
  /** Maximum number of notifications to show in dropdown (default: 5) */
  maxVisible?: number;
  /** Custom className for the bell button */
  className?: string;
  /** Variant style */
  variant?: 'default' | 'minimal';
}

/**
 * NotificationBell Component
 */
export function NotificationBell({
  maxVisible = 5,
  className,
  variant = 'default',
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get current user (replace with real auth)
  const { user } = useAuth();
  const userId = user?.id || '';

  // Create Supabase client
  const supabase = createClient();

  // Real-time subscription
  // NOTE: This component should be wrapped with NotificationBellClient
  // to prevent SSR errors. See NotificationBellClient.tsx for details.
  const { isConnected } = useRealtimeNotifications(userId, {
    showToast: false, // We'll handle toasts separately
    onNewNotification: () => {
      // Trigger pulse animation
      setHasNewNotification(true);
      setTimeout(() => setHasNewNotification(false), 3000);
    },
  });

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery<Notification[]>({
    queryKey: notificationKeys.user(userId),
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Fetch more than we show for "View All"

      if (error) throw error;

      // Map database fields to component interface
      return (data || []).map((notif: {
        id: string;
        title: string;
        message: string;
        type: string;
        category: string;
        is_read: boolean;
        created_at: string;
        action_url?: string;
        action_label?: string;
        metadata?: Record<string, unknown>;
      }): Notification => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: (['info', 'success', 'warning', 'error'].includes(notif.type) ? notif.type : 'info') as 'info' | 'success' | 'warning' | 'error',
        category: (['submission', 'deadline', 'profile', 'system'].includes(notif.category) ? notif.category : undefined) as 'submission' | 'deadline' | 'profile' | 'system' | undefined,
        isRead: notif.is_read,
        createdAt: notif.created_at,
        actionUrl: notif.action_url,
        actionLabel: notif.action_label,
        metadata: notif.metadata,
      }));
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });

  // Unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Recent notifications (for dropdown)
  const recentNotifications = notifications.slice(0, maxVisible);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(supabase, notificationId),
    onSuccess: () => {
      // Real-time subscription will handle cache update
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(supabase, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.user(userId) });
    },
  });

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to action URL if exists
    if (notification.actionUrl) {
      setIsOpen(false);
      router.push(notification.actionUrl);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  // Don't render if no user
  if (!userId) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant === 'minimal' ? 'ghost' : 'outline'}
          size="sm"
          className={cn(
            'relative',
            variant === 'minimal' && 'h-8 w-8 rounded-full p-0',
            'hover:bg-primary/10 transition-all duration-200',
            'focus-visible:ring-2 focus-visible:ring-primary/20',
            className
          )}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
          <motion.div
            animate={hasNewNotification ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}>
            {unreadCount > 0 ? (
              <BellDot className="h-4 w-4 text-foreground" />
            ) : (
              <Bell className="h-4 w-4 text-muted-foreground" />
            )}
          </motion.div>

          {/* Unread Badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute -top-1 -right-1">
                <Badge
                  variant="destructive"
                  className={cn(
                    'h-5 min-w-[20px] px-1 flex items-center justify-center',
                    'text-[10px] font-bold',
                    'bg-tup-primary border-background',
                    'shadow-lg',
                    hasNewNotification && 'animate-pulse'
                  )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection Status Indicator (subtle) */}
          {isConnected && (
            <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className={cn(
          'w-[380px] p-0',
          'bg-background/95 backdrop-blur-xl',
          'border-border/50 shadow-xl',
          'rounded-2xl'
        )}
        sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {isConnected && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                Live updates
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="h-7 text-xs hover:bg-primary/10">
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4">
              <NotificationSkeleton />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Failed to load notifications</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: notificationKeys.user(userId) })}
                className="mt-2">
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            <div className="p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleNotificationClick}
                    compact
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator className="bg-border/50" />
            <div className="p-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full justify-center hover:bg-primary/10">
                <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                  View all notifications
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
