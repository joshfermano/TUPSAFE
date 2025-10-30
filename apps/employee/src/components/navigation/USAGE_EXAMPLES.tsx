/**
 * Toast Notification and NotificationBell Usage Examples
 *
 * This file demonstrates how to use the notification system in TUPSAFE.
 * These are example implementations - copy and adapt as needed.
 */

'use client';

import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  showSubmissionToast,
  showDeadlineToast,
  showProfileToast,
  showSystemToast,
  showWelcomeToast,
  showAutoSaveToast,
} from '@/lib/toast-templates';

// ====================
// Example 1: Form Submission with Toast Notifications
// ====================

type PDSFormData = Record<string, unknown>;

export function PDSSubmissionExample() {
  // Mock API call
  const submitPDS = async (_data: PDSFormData) => {
    // API call here
    return { id: '123', status: 'submitted' };
  };

  const submitMutation = useMutation({
    mutationFn: submitPDS,
    onSuccess: (data) => {
      // Show submission toast with confetti
      showSubmissionToast('submitted', 'pds', {
        actionUrl: `/dashboard/pds/${data.id}`,
        actionLabel: 'View Submission',
      });
    },
    onError: (error: Error) => {
      showSubmissionToast('rejected', 'pds', {
        message: error.message,
        actionUrl: '/dashboard/pds/edit',
        actionLabel: 'Try Again',
      });
    },
  });

  return (
    <button onClick={() => submitMutation.mutate({} as PDSFormData)}>
      Submit PDS
    </button>
  );
}

// ====================
// Example 2: Approval Notification with Confetti
// ====================

export function ApprovalNotificationExample() {
  const handleApproval = () => {
    showSubmissionToast('approved', 'pds', {
      message: 'Congratulations! Your PDS has been approved by the HR department.',
      actionUrl: '/dashboard/pds',
      actionLabel: 'View Approved PDS',
      showConfetti: true, // 🎉 Celebration!
    });
  };

  return <button onClick={handleApproval}>Show Approval</button>;
}

// ====================
// Example 3: Deadline Reminder System
// ====================

interface Deadline {
  id: string;
  date: string;
  type: 'pds' | 'saln';
  title: string;
}

export function DeadlineReminderExample() {
  // Fetch upcoming deadlines
  const { data: deadlines } = useQuery<Deadline[]>({
    queryKey: ['deadlines'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: '1',
          date: '2025-12-31',
          type: 'saln',
          title: 'Annual SALN Submission',
        },
      ];
    },
  });

  // Show deadline reminders
  useEffect(() => {
    if (deadlines) {
      deadlines.forEach((deadline) => {
        const deadlineDate = new Date(deadline.date);
        const daysLeft = Math.ceil(
          (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        // Only show reminders for deadlines within 7 days
        if (daysLeft > 0 && daysLeft <= 7) {
          showDeadlineToast(deadlineDate, daysLeft, deadline.type, {
            actionUrl: `/dashboard/${deadline.type}`,
            actionLabel: 'Submit Now',
          });
        }
      });
    }
  }, [deadlines]);

  return <div>Deadline reminders will show automatically</div>;
}

// ====================
// Example 4: Profile Change Notifications
// ====================

export function ProfileUpdateExample() {
  const handleRoleUpdate = () => {
    showProfileToast(
      'role',
      {
        label: 'Role Updated',
        value: 'Associate Professor',
        description: 'Your role has been updated by the administrator',
      },
      {
        actionUrl: '/dashboard/profile',
        actionLabel: 'View Profile',
      }
    );
  };

  const handleDepartmentUpdate = () => {
    showProfileToast('department', {
      label: 'Department Assignment',
      value: 'Computer Science Department',
    });
  };

  const handleSecurityAlert = () => {
    showProfileToast('security', {
      label: 'Password Changed',
      description:
        'Your password was recently changed. If this wasn\'t you, contact support immediately.',
    });
  };

  return (
    <div className="space-x-2">
      <button onClick={handleRoleUpdate}>Role Update</button>
      <button onClick={handleDepartmentUpdate}>Department Update</button>
      <button onClick={handleSecurityAlert}>Security Alert</button>
    </div>
  );
}

// ====================
// Example 5: System Notifications
// ====================

export function SystemNotificationExample() {
  const handleMaintenance = () => {
    showSystemToast(
      'System maintenance scheduled for tonight at 10 PM. Services may be temporarily unavailable.',
      'warning',
      {
        title: 'Scheduled Maintenance',
        duration: 10000, // Show for 10 seconds
      }
    );
  };

  const handleUpdate = () => {
    showSystemToast(
      'New features have been added to the system. Check them out!',
      'info',
      {
        title: 'System Update',
        actionUrl: '/changelog',
        actionLabel: 'View Changes',
      }
    );
  };

  const handleError = () => {
    showSystemToast(
      'Unable to connect to the server. Please check your internet connection.',
      'error',
      {
        title: 'Connection Error',
      }
    );
  };

  return (
    <div className="space-x-2">
      <button onClick={handleMaintenance}>Maintenance Notice</button>
      <button onClick={handleUpdate}>System Update</button>
      <button onClick={handleError}>Error Alert</button>
    </div>
  );
}

// ====================
// Example 6: Welcome Messages
// ====================

export function WelcomeMessageExample() {
  const handleFirstLogin = () => {
    showWelcomeToast('Juan Dela Cruz', true);
  };

  const handleReturningUser = () => {
    showWelcomeToast('Juan Dela Cruz', false);
  };

  return (
    <div className="space-x-2">
      <button onClick={handleFirstLogin}>First Login</button>
      <button onClick={handleReturningUser}>Returning User</button>
    </div>
  );
}

// ====================
// Example 7: Auto-Save with Toast
// ====================

export function AutoSaveExample() {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});

  const autoSaveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      // Mock API call - replace with actual save
      await new Promise((resolve) => setTimeout(resolve, 500));
      return data;
    },
    onSuccess: () => {
      showAutoSaveToast('pds', true);
    },
    onError: () => {
      showAutoSaveToast('pds', false);
    },
  });

  // Auto-save on change (debounced)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        autoSaveMutation.mutate(formData);
      }
    }, 2000); // Debounce for 2 seconds

    return () => clearTimeout(timer);
  }, [formData, autoSaveMutation]);

  return (
    <div>
      <input
        type="text"
        onChange={(e) => setFormData({ ...formData, field: e.target.value })}
        placeholder="Type to trigger auto-save..."
      />
      <p className="text-xs text-muted-foreground mt-2">
        Changes are saved automatically
      </p>
    </div>
  );
}

// ====================
// Example 8: NotificationBell Integration (Already in Header)
// ====================

/*
// The NotificationBell is already integrated in the Header component.
// IMPORTANT: Always use NotificationBellClient wrapper to prevent SSR errors!

import { NotificationBellClient } from '@/components/navigation';

export function CustomLayout() {
  return (
    <header className="flex items-center justify-between p-4">
      <div>Logo</div>
      <div className="flex items-center gap-4">
        <NotificationBellClient variant="minimal" maxVisible={10} />
        <ThemeToggle />
      </div>
    </header>
  );
}

// Why NotificationBellClient?
// - Prevents SSR errors with Supabase Realtime
// - Only renders on client side after hydration
// - Maintains proper layout with placeholder during SSR
*/

// ====================
// Example 9: Real-time Notifications in Dashboard
// ====================

/**
 * IMPORTANT: When using realtime hooks directly in your components,
 * you MUST protect against SSR errors!
 *
 * Option 1: Wrap your component with a client-only wrapper (RECOMMENDED)
 * Option 2: Use dynamic import with ssr: false
 * Option 3: Check if window exists before calling hooks
 *
 * This example shows the safest pattern.
 */
function DashboardRealtimeCore() {
  const { user } = useAuth();

  // Real-time subscription happens automatically via NotificationBell
  // But you can also use the hook directly for custom behavior:
  const { isConnected } = useRealtimeNotifications(user?.id || '', {
    showToast: false, // Don't show toast, we'll handle it manually
    onNewNotification: (notification) => {
      console.log('New notification received:', notification);

      // Custom handling based on notification type
      // Note: Adjust based on your actual notification schema
      if (notification.type === 'submission_status') {
        showSubmissionToast('approved', 'pds', {
          showConfetti: true,
        });
      }
    },
  });

  return (
    <div>
      <div className="flex items-center gap-2">
        <span>Real-time Status:</span>
        {isConnected ? (
          <span className="text-green-600">Connected</span>
        ) : (
          <span className="text-red-600">Disconnected</span>
        )}
      </div>
      {/* Dashboard content */}
    </div>
  );
}

// Client-only wrapper to prevent SSR errors
export function DashboardWithRealtimeNotifications() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render the component with realtime hooks after mounting
  if (!isMounted) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <span>Real-time Status:</span>
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return <DashboardRealtimeCore />;
}

// ====================
// Example 10: Custom Toast with Multiple Actions
// ====================

export function CustomComplexToastExample() {
  const handleComplexNotification = () => {
    // For very custom toasts, you can use Sonner directly
    import('sonner').then(({ toast }) => {
      toast.info('Submission Requires Attention', {
        description:
          'Your SALN submission has comments from the reviewer. Please address them.',
        duration: 10000,
        action: {
          label: 'View Comments',
          onClick: () => {
            window.location.href = '/dashboard/saln/comments';
          },
        },
        cancel: {
          label: 'Dismiss',
          onClick: () => console.log('Dismissed'),
        },
      } as Parameters<typeof toast.info>[1]);
    });
  };

  return <button onClick={handleComplexNotification}>Complex Toast</button>;
}

// Import React for the example
import * as React from 'react';
import { useRealtimeNotifications } from '@tupsafe/database';
import { useAuth } from '@tupsafe/mock-data/api';
