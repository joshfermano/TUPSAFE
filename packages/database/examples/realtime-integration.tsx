/**
 * TUPSAFE Realtime Integration Examples
 *
 * This file demonstrates how to integrate the realtime hooks
 * into your TUPSAFE application.
 *
 * These are working examples that can be adapted for your use case.
 */

'use client';

import { useEffect } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import {
  initializeRealtimeClient,
  useRealtimeNotifications,
  useRealtimeSubmissionStatus,
  useRealtimeProfile,
  notificationKeys,
  pdsKeys,
  salnKeys,
  profileKeys,
  getConnectionStatus,
  formatConnectionUptime,
} from '@tupsafe/database';
import { createClient } from '@tupsafe/auth/utils/supabase/client';

// ============================================================================
// Example 1: App Initialization (Root Layout)
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize realtime client once at app startup
    initializeRealtimeClient(() => createClient());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Toaster for notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #e5e7eb',
          },
        }}
      />
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 2: Notification Bell with Live Indicator
// ============================================================================

interface User {
  id: string;
  email: string;
}

function NotificationBell({ user }: { user: User | null }) {
  // Subscribe to real-time notifications
  const { isConnected, status } = useRealtimeNotifications(user?.id || '', {
    showToast: true,
    onNewNotification: (notification) => {
      console.log('New notification received:', notification);

      // Play sound (optional)
      if ('Audio' in window) {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(console.error);
      }

      // Update badge count (if you have one)
      // updateBadgeCount();
    },
  });

  // Fetch notifications (automatically updates from realtime)
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: notificationKeys.user(user?.id || ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Live indicator */}
        {isConnected && (
          <span className="absolute bottom-0 right-0 flex w-3 h-3">
            <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping"></span>
            <span className="relative inline-flex w-3 h-3 bg-green-500 rounded-full"></span>
          </span>
        )}
      </button>

      {/* Connection status tooltip (optional) */}
      <div className="absolute top-12 right-0 text-xs text-gray-500">
        Status: {status}
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Submission Dashboard with Real-time Updates
// ============================================================================

function SubmissionDashboard({ user }: { user: User | null }) {
  // Subscribe to submission status changes
  const { isConnected } = useRealtimeSubmissionStatus(user?.id || '', {
    showToast: true,
    onApproved: (type, submissionId) => {
      console.log(`${type} submission ${submissionId} approved!`);

      // Show celebration (optional)
      // triggerConfetti();

      // Play sound
      if ('Audio' in window) {
        const audio = new Audio('/success-sound.mp3');
        audio.play().catch(console.error);
      }
    },
    onRejected: (type, submissionId) => {
      console.log(`${type} submission ${submissionId} needs revisions`);

      // Could navigate to edit page
      // router.push(`/${type}/edit/${submissionId}`);
    },
    onStatusChange: (type, submissionId, transition) => {
      console.log(
        `Status changed from ${transition.from} to ${transition.to}`
      );

      // Track analytics
      // analytics.track('submission_status_change', {
      //   type,
      //   submissionId,
      //   from: transition.from,
      //   to: transition.to,
      // });
    },
  });

  // Fetch PDS submissions
  const { data: pdsSubmissions = [], isLoading: pdsLoading } = useQuery({
    queryKey: pdsKeys.user(user?.id || ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('pds_submissions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch SALN submissions
  const { data: salnSubmissions = [], isLoading: salnLoading } = useQuery({
    queryKey: salnKeys.user(user?.id || ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('saln_submissions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Connection indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <ConnectionIndicator connected={isConnected} />
      </div>

      {/* PDS Submissions */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">PDS Submissions</h2>
        {pdsLoading ? (
          <LoadingSpinner />
        ) : pdsSubmissions.length === 0 ? (
          <EmptyState message="No PDS submissions yet" />
        ) : (
          <SubmissionList submissions={pdsSubmissions} type="pds" />
        )}
      </section>

      {/* SALN Submissions */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">SALN Submissions</h2>
        {salnLoading ? (
          <LoadingSpinner />
        ) : salnSubmissions.length === 0 ? (
          <EmptyState message="No SALN submissions yet" />
        ) : (
          <SubmissionList submissions={salnSubmissions} type="saln" />
        )}
      </section>
    </div>
  );
}

// ============================================================================
// Example 4: Profile Page with Real-time Updates
// ============================================================================

function ProfilePage({ user }: { user: User | null }) {
  // Subscribe to profile changes
  const { isConnected } = useRealtimeProfile(user?.id || '', {
    showToast: true,
    notifyOnFields: ['role', 'departmentId', 'positionId', 'isActive'],
    onRoleChange: (oldRole, newRole) => {
      console.log(`Role changed from ${oldRole} to ${newRole}`);

      // Refresh user permissions
      // refreshPermissions();

      // Track analytics
      // analytics.track('role_changed', { oldRole, newRole });
    },
    onDeactivate: () => {
      console.log('Account deactivated');

      // Show critical alert
      toast.error('Account Deactivated', {
        description:
          'Your account has been deactivated. Please contact HR for assistance.',
        duration: 10000,
      });

      // Force logout after delay
      setTimeout(() => {
        // signOut();
      }, 5000);
    },
    onProfileUpdate: (oldProfile, newProfile, changedFields) => {
      console.log('Profile updated:', changedFields);
    },
  });

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: profileKeys.user(user?.id || ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header with connection indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <ConnectionIndicator connected={isConnected} />
      </div>

      {/* Profile details */}
      <div className="p-6 bg-white border rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-lg">
              {profile.firstName} {profile.lastName}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Role</label>
            <p className="text-lg">{profile.role}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">
              Employee ID
            </label>
            <p className="text-lg">{profile.employeeId}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="text-lg">
              {profile.isActive ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-red-600">Inactive</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Connection Status Component
// ============================================================================

function ConnectionIndicator({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {/* Status dot */}
      <div className="relative flex items-center justify-center w-3 h-3">
        {connected ? (
          <>
            <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping"></span>
            <span className="relative inline-flex w-3 h-3 bg-green-500 rounded-full"></span>
          </>
        ) : (
          <span className="relative inline-flex w-3 h-3 bg-gray-400 rounded-full"></span>
        )}
      </div>

      {/* Status text */}
      <span className="text-sm text-gray-600">
        {connected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}

// ============================================================================
// Example 6: Connection Health Debug Component (Development Only)
// ============================================================================

function ConnectionHealthDebug() {
  const [health, setHealth] = useState(() => getConnectionStatus());

  useEffect(() => {
    // Update health every second
    const interval = setInterval(() => {
      setHealth(getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed p-4 text-xs bg-white border border-gray-300 rounded-lg shadow-lg bottom-4 right-4">
      <h3 className="mb-2 font-bold">Realtime Connection Health</h3>

      <div className="space-y-1">
        <div>
          <span className="font-medium">Status:</span>{' '}
          <span
            className={
              health.status === 'connected' ? 'text-green-600' : 'text-red-600'
            }
          >
            {health.status}
          </span>
        </div>

        <div>
          <span className="font-medium">Active Channels:</span>{' '}
          {health.activeChannels}
        </div>

        <div>
          <span className="font-medium">Uptime:</span>{' '}
          {formatConnectionUptime(health.lastConnected)}
        </div>

        <div>
          <span className="font-medium">Reconnect Attempts:</span>{' '}
          {health.reconnectAttempts}
        </div>

        {health.errors.length > 0 && (
          <div>
            <span className="font-medium text-red-600">
              Recent Errors ({health.errors.length}):
            </span>
            <ul className="pl-4 mt-1 space-y-1 list-disc">
              {health.errors.slice(-3).map((error, i) => (
                <li key={i} className="text-red-600">
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components (Placeholder implementations)
// ============================================================================

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-gray-200 rounded-full border-t-blue-600 animate-spin"></div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
      {message}
    </div>
  );
}

function SubmissionList({
  submissions,
  type,
}: {
  submissions: any[];
  type: 'pds' | 'saln';
}) {
  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">
                {type.toUpperCase()} Submission
              </h3>
              <p className="text-sm text-gray-500">
                Version {submission.version}
              </p>
            </div>

            <div className="text-right">
              <StatusBadge status={submission.status} />
              <p className="mt-1 text-xs text-gray-500">
                {new Date(submission.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    reviewing: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        colors[status as keyof typeof colors] || colors.draft
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ============================================================================
// Export all examples
// ============================================================================

export {
  AppProviders,
  NotificationBell,
  SubmissionDashboard,
  ProfilePage,
  ConnectionIndicator,
  ConnectionHealthDebug,
};
