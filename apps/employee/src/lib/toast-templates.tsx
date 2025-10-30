/**
 * Toast Notification Templates for TUPSAFE
 *
 * Pre-configured toast functions for common scenarios with consistent
 * branding, icons, and behavior across the application.
 *
 * Features:
 * - Type-safe notification parameters
 * - Consistent TUPSAFE branding
 * - Appropriate icons for each scenario
 * - Action buttons for actionable notifications
 * - Smart duration based on importance
 */

import React from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  XCircle,
  Info,
  Bell,
  Calendar,
  AlertTriangle,
  User,
  Building2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

/**
 * Submission status types
 */
export type SubmissionStatus = 'submitted' | 'approved' | 'rejected' | 'reviewing' | 'returned';

/**
 * Document types for submissions
 */
export type DocumentType = 'pds' | 'saln';

/**
 * Profile change types
 */
export type ProfileChangeType =
  | 'role'
  | 'department'
  | 'college'
  | 'info'
  | 'security'
  | 'important';

/**
 * System notification types
 */
export type SystemNotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Toast configuration interface
 */
interface ToastConfig {
  icon: LucideIcon;
  duration: number;
  className?: string;
}

/**
 * Get submission status configuration
 */
function getSubmissionConfig(status: SubmissionStatus): ToastConfig {
  const configs: Record<SubmissionStatus, ToastConfig> = {
    submitted: {
      icon: Clock,
      duration: 5000,
      className: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30',
    },
    approved: {
      icon: CheckCircle2,
      duration: 7000,
      className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    },
    rejected: {
      icon: XCircle,
      duration: 8000,
      className: 'border-red-500/50 bg-red-50 dark:bg-red-950/30',
    },
    reviewing: {
      icon: Eye,
      duration: 5000,
      className: 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/30',
    },
    returned: {
      icon: AlertCircle,
      duration: 7000,
      className: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30',
    },
  };

  return configs[status];
}

/**
 * Show submission status toast
 *
 * @param status - Submission status
 * @param type - Document type (PDS or SALN)
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * showSubmissionToast('approved', 'pds', {
 *   actionUrl: '/dashboard/pds',
 *   actionLabel: 'View PDS',
 *   message: 'Your submission has been reviewed and approved.'
 * });
 * ```
 */
export function showSubmissionToast(
  status: SubmissionStatus,
  type: DocumentType,
  options?: {
    message?: string;
    actionUrl?: string;
    actionLabel?: string;
    showConfetti?: boolean;
  }
) {
  const config = getSubmissionConfig(status);
  const Icon = config.icon;
  const typeLabel = type.toUpperCase();

  // Default messages based on status
  const defaultMessages: Record<SubmissionStatus, string> = {
    submitted: `Your ${typeLabel} has been submitted successfully and is pending review.`,
    approved: `Congratulations! Your ${typeLabel} has been approved.`,
    rejected: `Your ${typeLabel} submission requires attention. Please review the feedback.`,
    reviewing: `Your ${typeLabel} is currently being reviewed by the administrator.`,
    returned: `Your ${typeLabel} has been returned for revision. Please check the comments.`,
  };

  const message = options?.message || defaultMessages[status];

  // Status-specific toast types
  const statusToastMap: Record<SubmissionStatus, keyof typeof toast> = {
    submitted: 'info',
    approved: 'success',
    rejected: 'error',
    reviewing: 'info',
    returned: 'warning',
  };

  // Trigger confetti for approvals if requested
  if (status === 'approved' && options?.showConfetti && typeof window !== 'undefined') {
    // Import confetti dynamically to avoid bundle bloat
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }).catch(() => {
      // Silently fail if confetti can't be loaded
    });
  }

  const toastOptions: {
    description: string;
    duration: number;
    icon?: React.ReactNode;
    className?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } = {
    description: message,
    duration: config.duration,
    icon: Icon ? <Icon className="h-5 w-5" /> : undefined,
    className: config.className,
    action: options?.actionUrl
      ? {
          label: options.actionLabel || 'View',
          onClick: () => {
            window.location.href = options.actionUrl!;
          },
        }
      : undefined,
  };

  const toastMessage = `${typeLabel} ${status.charAt(0).toUpperCase() + status.slice(1)}`;

  // Call appropriate toast function
  switch (statusToastMap[status]) {
    case 'success':
      toast.success(toastMessage, toastOptions);
      break;
    case 'error':
      toast.error(toastMessage, toastOptions);
      break;
    case 'warning':
      toast.warning(toastMessage, toastOptions);
      break;
    default:
      toast.info(toastMessage, toastOptions);
  }
}

/**
 * Show deadline approaching toast
 *
 * @param deadline - Deadline date
 * @param daysLeft - Number of days remaining
 * @param type - Document type
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * showDeadlineToast(new Date('2025-12-31'), 5, 'saln', {
 *   actionUrl: '/dashboard/saln',
 *   actionLabel: 'Submit Now'
 * });
 * ```
 */
export function showDeadlineToast(
  deadline: Date,
  daysLeft: number,
  type: DocumentType,
  options?: {
    actionUrl?: string;
    actionLabel?: string;
  }
) {
  const typeLabel = type.toUpperCase();
  const deadlineStr = deadline.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Determine urgency level
  let toastType: 'info' | 'warning' | 'error';
  let urgencyLabel: string;
  let className: string;

  if (daysLeft > 7) {
    toastType = 'info';
    urgencyLabel = 'Upcoming';
    className = 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30';
  } else if (daysLeft >= 3) {
    toastType = 'warning';
    urgencyLabel = 'Soon';
    className = 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30';
  } else {
    toastType = 'error';
    urgencyLabel = 'Urgent';
    className = 'border-red-500/50 bg-red-50 dark:bg-red-950/30';
  }

  const daysText = daysLeft === 1 ? '1 day' : `${daysLeft} days`;
  const message = `Your ${typeLabel} submission is due in ${daysText} (${deadlineStr}). Please submit before the deadline.`;

  const deadlineOptions: {
    description: string;
    duration: number;
    icon?: React.ReactNode;
    className?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } = {
    description: message,
    duration: 10000, // Longer duration for important deadlines
    icon: Calendar ? <Calendar className="h-5 w-5" /> : undefined,
    className,
    action: options?.actionUrl
      ? {
          label: options.actionLabel || 'Submit Now',
          onClick: () => {
            window.location.href = options.actionUrl!;
          },
        }
      : undefined,
  };

  toast[toastType](`${urgencyLabel}: ${typeLabel} Deadline Approaching`, deadlineOptions);
}

/**
 * Show profile change toast
 *
 * @param changeType - Type of profile change
 * @param details - Change details
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * showProfileToast('role', {
 *   label: 'Role Updated',
 *   value: 'Associate Professor'
 * });
 * ```
 */
export function showProfileToast(
  changeType: ProfileChangeType,
  details: {
    label: string;
    value?: string;
    description?: string;
  },
  options?: {
    actionUrl?: string;
    actionLabel?: string;
  }
) {
  // Icon mapping for different change types
  const iconMap: Record<ProfileChangeType, LucideIcon> = {
    role: User,
    department: Building2,
    college: Building2,
    info: Info,
    security: AlertCircle,
    important: AlertTriangle,
  };

  const Icon = iconMap[changeType];

  // Determine toast type based on change type
  const isImportant = ['security', 'important'].includes(changeType);
  const toastType = isImportant ? 'warning' : 'info';

  const title = details.label;
  const description = details.value
    ? `${details.description || 'Updated to'}: ${details.value}`
    : details.description;

  const profileOptions: {
    description?: string;
    duration: number;
    icon?: React.ReactNode;
    className?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } = {
    description,
    duration: isImportant ? 8000 : 5000,
    icon: Icon ? <Icon className="h-5 w-5" /> : undefined,
    className: isImportant
      ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30'
      : 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30',
    action: options?.actionUrl
      ? {
          label: options.actionLabel || 'View Profile',
          onClick: () => {
            window.location.href = options.actionUrl!;
          },
        }
      : undefined,
  };

  toast[toastType](title, profileOptions);
}

/**
 * Show system notification toast
 *
 * @param message - Notification message
 * @param type - Notification type
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * showSystemToast('System maintenance scheduled for tonight at 10 PM', 'warning', {
 *   title: 'Scheduled Maintenance',
 *   duration: 10000
 * });
 * ```
 */
export function showSystemToast(
  message: string,
  type: SystemNotificationType = 'info',
  options?: {
    title?: string;
    duration?: number;
    actionUrl?: string;
    actionLabel?: string;
  }
) {
  const iconMap: Record<SystemNotificationType, LucideIcon> = {
    info: Bell,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
  };

  const classNameMap: Record<SystemNotificationType, string> = {
    info: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30',
    success: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    warning: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30',
    error: 'border-red-500/50 bg-red-50 dark:bg-red-950/30',
  };

  const Icon = iconMap[type];
  const title = options?.title || 'System Notification';

  const systemOptions: {
    description: string;
    duration: number;
    icon?: React.ReactNode;
    className?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } = {
    description: message,
    duration: options?.duration || 6000,
    icon: Icon ? <Icon className="h-5 w-5" /> : undefined,
    className: classNameMap[type],
    action: options?.actionUrl
      ? {
          label: options.actionLabel || 'Learn More',
          onClick: () => {
            window.location.href = options.actionUrl!;
          },
        }
      : undefined,
  };

  toast[type](title, systemOptions);
}

/**
 * Show welcome notification for new users
 *
 * @param userName - User's name
 * @param isFirstLogin - Whether this is the first login
 */
export function showWelcomeToast(userName?: string, isFirstLogin: boolean = false) {
  const title = isFirstLogin ? 'Welcome to TUPSAFE!' : `Welcome back${userName ? `, ${userName}` : ''}!`;
  const description = isFirstLogin
    ? 'Get started by completing your Personal Data Sheet (PDS) and Statement of Assets, Liabilities, and Net Worth (SALN).'
    : 'Access your dashboard to view your submissions and notifications.';

  const welcomeOptions: {
    description: string;
    duration: number;
    icon?: React.ReactNode;
    className?: string;
    action: {
      label: string;
      onClick: () => void;
    };
  } = {
    description,
    duration: 6000,
    icon: Sparkles ? <Sparkles className="h-5 w-5" /> : undefined,
    className: 'border-tup-primary/50 bg-tup-primary/5',
    action: {
      label: isFirstLogin ? 'Get Started' : 'Go to Dashboard',
      onClick: () => {
        window.location.href = '/dashboard';
      },
    },
  };

  toast.success(title, welcomeOptions);
}

/**
 * Show auto-save notification
 *
 * @param type - Document type
 * @param success - Whether auto-save was successful
 */
export function showAutoSaveToast(type: DocumentType, success: boolean = true) {
  const typeLabel = type.toUpperCase();

  if (success) {
    const successOptions: {
      description: string;
      duration: number;
      icon?: React.ReactNode;
      className?: string;
    } = {
      description: `Your ${typeLabel} changes have been automatically saved.`,
      duration: 2000,
      icon: CheckCircle2 ? <CheckCircle2 className="h-4 w-4" /> : undefined,
      className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    };
    toast.success('Draft Saved', successOptions);
  } else {
    const errorOptions: {
      description: string;
      duration: number;
      icon?: React.ReactNode;
      className?: string;
      action: {
        label: string;
        onClick: () => void;
      };
    } = {
      description: `Unable to save your ${typeLabel} draft. Please try again.`,
      duration: 5000,
      icon: XCircle ? <XCircle className="h-4 w-4" /> : undefined,
      className: 'border-red-500/50 bg-red-50 dark:bg-red-950/30',
      action: {
        label: 'Retry',
        onClick: () => {
          // Retry logic will be handled by the form component
          window.location.reload();
        },
      },
    };
    toast.error('Save Failed', errorOptions);
  }
}
