/**
 * Toast Notification Templates for TUPSAFE Admin Portal
 *
 * Pre-configured toast functions for admin-specific actions with consistent
 * branding, professional styling, and behavior.
 *
 * Features:
 * - Type-safe notification parameters
 * - Professional admin-focused messaging
 * - Appropriate icons for each administrative action
 * - Action buttons for actionable notifications
 * - Smart duration based on importance and context
 * - WCAG 2.1 AA compliant color contrast
 */

import React from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  UserPlus,
  UserX,
  UserCheck,
  UserMinus,
  Shield,
  FileCheck,
  FileX,
  FileClock,
  FileWarning,
  Download,
  Upload,
  CheckCheck,
  AlertTriangle,
  Settings,
  Database,
  Mail,
  Bell,
  Eye,
  Users,
  Building2,
  type LucideIcon,
} from 'lucide-react';

/**
 * Document types for submissions
 */
export type DocumentType = 'pds' | 'saln';

/**
 * User status types
 */
export type UserStatus = 'active' | 'inactive' | 'suspended';

/**
 * Bulk action types
 */
export type BulkActionType = 'approve' | 'reject' | 'delete' | 'export' | 'notify';

/**
 * System notification types
 */
export type SystemNotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Toast action callback
 */
interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Base toast options
 */
interface BaseToastOptions {
  onView?: () => void;
  onUndo?: () => void;
  actionLabel?: string;
  duration?: number;
}

// ============================================================================
// USER MANAGEMENT TOASTS
// ============================================================================

/**
 * Show toast when a new user is created
 *
 * @param userName - Name of the created user
 * @param role - User's role
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastUserCreated('Juan Dela Cruz', 'Faculty Member', {
 *   onView: () => router.push('/admin/users/123')
 * });
 * ```
 */
export function toastUserCreated(
  userName: string,
  role: string,
  options?: BaseToastOptions
) {
  toast.success('User Created Successfully', {
    description: `${userName} has been added as ${role}.`,
    icon: <UserPlus className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 5000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View User',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast when a user profile is updated
 *
 * @param userName - Name of the updated user
 * @param changes - Description of changes made
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastUserUpdated('Maria Santos', 'Role and department updated', {
 *   onView: () => router.push('/admin/users/456')
 * });
 * ```
 */
export function toastUserUpdated(
  userName: string,
  changes?: string,
  options?: BaseToastOptions
) {
  const description = changes
    ? `${userName}'s profile updated: ${changes}`
    : `${userName}'s profile has been updated successfully.`;

  toast.success('User Updated', {
    description,
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 5000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View Changes',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast when a user is deleted
 *
 * @param userName - Name of the deleted user
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastUserDeleted('Pedro Reyes', {
 *   onUndo: () => handleRestoreUser('789')
 * });
 * ```
 */
export function toastUserDeleted(userName: string, options?: BaseToastOptions) {
  toast.warning('User Deleted', {
    description: `${userName} has been removed from the system.`,
    icon: <UserX className="h-5 w-5 text-amber-600" />,
    duration: options?.duration || 6000,
    className: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30',
    action: options?.onUndo
      ? {
          label: options.actionLabel || 'Undo',
          onClick: options.onUndo,
        }
      : undefined,
  });
}

/**
 * Show toast when a user's role is changed
 *
 * @param userName - Name of the user
 * @param oldRole - Previous role
 * @param newRole - New role
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastRoleChanged('Ana Garcia', 'Instructor', 'Assistant Professor');
 * ```
 */
export function toastRoleChanged(
  userName: string,
  oldRole: string,
  newRole: string,
  options?: BaseToastOptions
) {
  toast.info('User Role Changed', {
    description: `${userName}'s role changed from ${oldRole} to ${newRole}.`,
    icon: <Shield className="h-5 w-5 text-blue-600" />,
    duration: options?.duration || 5000,
    className: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View User',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast when a user account is activated
 *
 * @param userName - Name of the user
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastUserActivated('Carlos Reyes');
 * ```
 */
export function toastUserActivated(userName: string, options?: BaseToastOptions) {
  toast.success('User Activated', {
    description: `${userName}'s account has been activated.`,
    icon: <UserCheck className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 4000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View User',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast when a user account is deactivated
 *
 * @param userName - Name of the user
 * @param reason - Optional reason for deactivation
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastUserDeactivated('Lisa Cruz', 'Temporary suspension');
 * ```
 */
export function toastUserDeactivated(
  userName: string,
  reason?: string,
  options?: BaseToastOptions
) {
  const description = reason
    ? `${userName}'s account deactivated. Reason: ${reason}`
    : `${userName}'s account has been deactivated.`;

  toast.warning('User Deactivated', {
    description,
    icon: <UserMinus className="h-5 w-5 text-amber-600" />,
    duration: options?.duration || 5000,
    className: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30',
    action: options?.onUndo
      ? {
          label: options.actionLabel || 'Undo',
          onClick: options.onUndo,
        }
      : undefined,
  });
}

// ============================================================================
// SUBMISSION REVIEW TOASTS
// ============================================================================

/**
 * Show toast when a PDS/SALN submission is approved
 *
 * @param type - Document type (PDS or SALN)
 * @param employeeName - Name of the employee
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastSubmissionApproved('pds', 'Roberto Tan', {
 *   onView: () => router.push('/admin/submissions/pds/123')
 * });
 * ```
 */
export function toastSubmissionApproved(
  type: DocumentType,
  employeeName: string,
  options?: BaseToastOptions
) {
  const typeLabel = type.toUpperCase();

  toast.success(`${typeLabel} Approved`, {
    description: `${employeeName}'s ${typeLabel} submission has been approved.`,
    icon: <FileCheck className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 6000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View Details',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast when a PDS/SALN submission is rejected
 *
 * @param type - Document type (PDS or SALN)
 * @param employeeName - Name of the employee
 * @param reason - Optional rejection reason
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastSubmissionRejected('saln', 'Elena Cruz', 'Incomplete financial disclosures');
 * ```
 */
export function toastSubmissionRejected(
  type: DocumentType,
  employeeName: string,
  reason?: string,
  options?: BaseToastOptions
) {
  const typeLabel = type.toUpperCase();
  const description = reason
    ? `${employeeName}'s ${typeLabel} rejected. Reason: ${reason}`
    : `${employeeName}'s ${typeLabel} submission has been rejected.`;

  toast.error(`${typeLabel} Rejected`, {
    description,
    icon: <FileX className="h-5 w-5 text-red-600" />,
    duration: options?.duration || 7000,
    className: 'border-red-500/50 bg-red-50 dark:bg-red-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View Submission',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast when revisions/changes are requested on a submission
 *
 * @param type - Document type (PDS or SALN)
 * @param employeeName - Name of the employee
 * @param comments - Review comments
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastChangesRequested('pds', 'Miguel Santos', 'Please update employment history');
 * ```
 */
export function toastChangesRequested(
  type: DocumentType,
  employeeName: string,
  comments?: string,
  options?: BaseToastOptions
) {
  const typeLabel = type.toUpperCase();
  const description = comments
    ? `Revision requested for ${employeeName}'s ${typeLabel}: ${comments}`
    : `Revision has been requested for ${employeeName}'s ${typeLabel}.`;

  toast.info('Changes Requested', {
    description,
    icon: <FileWarning className="h-5 w-5 text-blue-600" />,
    duration: options?.duration || 6000,
    className: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View Comments',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast when submission is marked for review
 *
 * @param type - Document type (PDS or SALN)
 * @param employeeName - Name of the employee
 * @param assignedReviewer - Name of assigned reviewer
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastSubmissionUnderReview('saln', 'Sofia Reyes', 'Admin User');
 * ```
 */
export function toastSubmissionUnderReview(
  type: DocumentType,
  employeeName: string,
  assignedReviewer?: string,
  options?: BaseToastOptions
) {
  const typeLabel = type.toUpperCase();
  const description = assignedReviewer
    ? `${employeeName}'s ${typeLabel} is now under review by ${assignedReviewer}.`
    : `${employeeName}'s ${typeLabel} is now under review.`;

  toast.info('Submission Under Review', {
    description,
    icon: <FileClock className="h-5 w-5 text-purple-600" />,
    duration: options?.duration || 5000,
    className: 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View Submission',
          onClick: options.onView,
        }
      : undefined,
  });
}

// ============================================================================
// BULK OPERATIONS TOASTS
// ============================================================================

/**
 * Show toast when a bulk action is completed
 *
 * @param action - Type of bulk action
 * @param count - Number of items affected
 * @param type - Optional type of items (users, submissions, etc.)
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastBulkActionComplete('approve', 15, 'PDS submissions');
 * ```
 */
export function toastBulkActionComplete(
  action: BulkActionType,
  count: number,
  type?: string,
  options?: BaseToastOptions
) {
  const actionLabels: Record<BulkActionType, string> = {
    approve: 'Approved',
    reject: 'Rejected',
    delete: 'Deleted',
    export: 'Exported',
    notify: 'Notified',
  };

  const iconMap: Record<BulkActionType, LucideIcon> = {
    approve: CheckCheck,
    reject: XCircle,
    delete: UserX,
    export: Download,
    notify: Mail,
  };

  const Icon = iconMap[action];
  const actionLabel = actionLabels[action];
  const itemType = type || 'items';
  const itemText = count === 1 ? itemType.replace(/s$/, '') : itemType;

  const description = `Successfully ${actionLabel.toLowerCase()} ${count} ${itemText}.`;

  // Different toast types based on action
  const toastType: 'success' | 'warning' | 'info' =
    action === 'delete' ? 'warning' : action === 'notify' ? 'info' : 'success';

  const classNameMap = {
    success: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    warning: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30',
    info: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30',
  };

  toast[toastType](`Bulk ${actionLabel}`, {
    description,
    icon: <Icon className="h-5 w-5" />,
    duration: options?.duration || 5000,
    className: classNameMap[toastType],
    action: options?.onUndo
      ? {
          label: options.actionLabel || 'Undo',
          onClick: options.onUndo,
        }
      : undefined,
  });
}

// ============================================================================
// EXPORT/IMPORT TOASTS
// ============================================================================

/**
 * Show toast when an export operation completes
 *
 * @param format - Export format (CSV, PDF, Excel)
 * @param fileName - Name of exported file
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastExportComplete('CSV', 'submissions_2025.csv');
 * ```
 */
export function toastExportComplete(
  format: string,
  fileName?: string,
  options?: BaseToastOptions
) {
  const description = fileName
    ? `${format} export complete: ${fileName}`
    : `Your ${format} export has been completed successfully.`;

  toast.success('Export Completed', {
    description,
    icon: <Download className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 5000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'Download',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast when an import operation completes
 *
 * @param recordCount - Number of records imported
 * @param errors - Number of errors encountered
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastImportComplete(150, 3, {
 *   onView: () => showImportReport()
 * });
 * ```
 */
export function toastImportComplete(
  recordCount: number,
  errors: number = 0,
  options?: BaseToastOptions
) {
  const hasErrors = errors > 0;
  const description = hasErrors
    ? `Imported ${recordCount} records with ${errors} errors.`
    : `Successfully imported ${recordCount} records.`;

  const toastType = hasErrors ? 'warning' : 'success';
  const className = hasErrors
    ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30'
    : 'border-green-500/50 bg-green-50 dark:bg-green-950/30';

  toast[toastType]('Import Completed', {
    description,
    icon: <Upload className="h-5 w-5" />,
    duration: options?.duration || 6000,
    className,
    action: options?.onView && hasErrors
      ? {
          label: options.actionLabel || 'View Report',
          onClick: options.onView,
        }
      : undefined,
  });
}

// ============================================================================
// SYSTEM TOASTS
// ============================================================================

/**
 * Show generic success toast
 *
 * @param title - Success message title
 * @param description - Optional description
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastSuccess('Settings Saved', 'Your preferences have been updated.');
 * ```
 */
export function toastSuccess(
  title: string,
  description?: string,
  options?: BaseToastOptions
) {
  toast.success(title, {
    description,
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 4000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show generic error toast
 *
 * @param title - Error message title
 * @param description - Optional error description
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastError('Operation Failed', 'Unable to save changes. Please try again.');
 * ```
 */
export function toastError(
  title: string,
  description?: string,
  options?: BaseToastOptions
) {
  toast.error(title, {
    description,
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    duration: options?.duration || 8000,
    className: 'border-red-500/50 bg-red-50 dark:bg-red-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'Details',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show generic warning toast
 *
 * @param title - Warning message title
 * @param description - Optional warning description
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastWarning('Pending Submissions', 'You have 5 submissions awaiting review.');
 * ```
 */
export function toastWarning(
  title: string,
  description?: string,
  options?: BaseToastOptions
) {
  toast.warning(title, {
    description,
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    duration: options?.duration || 6000,
    className: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show generic info toast
 *
 * @param title - Info message title
 * @param description - Optional info description
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastInfo('System Update', 'A new version is available.');
 * ```
 */
export function toastInfo(
  title: string,
  description?: string,
  options?: BaseToastOptions
) {
  toast.info(title, {
    description,
    icon: <Info className="h-5 w-5 text-blue-600" />,
    duration: options?.duration || 5000,
    className: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'Learn More',
          onClick: options.onView,
        }
      : undefined,
  });
}

// ============================================================================
// NOTIFICATION TOASTS
// ============================================================================

/**
 * Show toast when notifications are sent to users
 *
 * @param count - Number of users notified
 * @param message - Notification message preview
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastNotificationSent(25, 'SALN deadline reminder');
 * ```
 */
export function toastNotificationSent(
  count: number,
  message?: string,
  options?: BaseToastOptions
) {
  const userText = count === 1 ? 'user' : 'users';
  const description = message
    ? `Notification sent to ${count} ${userText}: "${message}"`
    : `Notification successfully sent to ${count} ${userText}.`;

  toast.success('Notification Sent', {
    description,
    icon: <Bell className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 5000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
  });
}

// ============================================================================
// DEPARTMENT/COLLEGE MANAGEMENT TOASTS
// ============================================================================

/**
 * Show toast when department/college is created
 *
 * @param type - 'department' or 'college'
 * @param name - Name of the department/college
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastOrganizationalUnitCreated('department', 'Computer Science');
 * ```
 */
export function toastOrganizationalUnitCreated(
  type: 'department' | 'college',
  name: string,
  options?: BaseToastOptions
) {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  toast.success(`${typeLabel} Created`, {
    description: `${name} has been added successfully.`,
    icon: <Building2 className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 5000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || `View ${typeLabel}`,
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast when department/college is updated
 *
 * @param type - 'department' or 'college'
 * @param name - Name of the department/college
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastOrganizationalUnitUpdated('college', 'College of Engineering');
 * ```
 */
export function toastOrganizationalUnitUpdated(
  type: 'department' | 'college',
  name: string,
  options?: BaseToastOptions
) {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  toast.success(`${typeLabel} Updated`, {
    description: `${name} has been updated successfully.`,
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 5000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
  });
}

// ============================================================================
// COMPLIANCE TOASTS
// ============================================================================

/**
 * Show toast for compliance deadline reminders
 *
 * @param count - Number of users to remind
 * @param type - Document type
 * @param daysLeft - Days until deadline
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastComplianceReminder(45, 'saln', 7);
 * ```
 */
export function toastComplianceReminder(
  count: number,
  type: DocumentType,
  daysLeft: number,
  options?: BaseToastOptions
) {
  const typeLabel = type.toUpperCase();
  const userText = count === 1 ? 'user' : 'users';
  const dayText = daysLeft === 1 ? 'day' : 'days';

  toast.warning('Compliance Reminder Sent', {
    description: `Reminder sent to ${count} ${userText} about ${typeLabel} deadline (${daysLeft} ${dayText} remaining).`,
    icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
    duration: options?.duration || 6000,
    className: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'View Report',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast for compliance report generation
 *
 * @param reportType - Type of report
 * @param period - Reporting period
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastComplianceReportGenerated('Department Compliance', 'Q1 2025');
 * ```
 */
export function toastComplianceReportGenerated(
  reportType: string,
  period?: string,
  options?: BaseToastOptions
) {
  const description = period
    ? `${reportType} report for ${period} has been generated.`
    : `${reportType} report has been generated successfully.`;

  toast.success('Report Generated', {
    description,
    icon: <FileCheck className="h-5 w-5 text-green-600" />,
    duration: options?.duration || 5000,
    className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'Download Report',
          onClick: options.onView,
        }
      : undefined,
  });
}

// ============================================================================
// DATABASE/SYSTEM TOASTS
// ============================================================================

/**
 * Show toast for system maintenance notifications
 *
 * @param message - Maintenance message
 * @param scheduledTime - Optional scheduled time
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastSystemMaintenance('Scheduled database maintenance', '10:00 PM - 11:00 PM');
 * ```
 */
export function toastSystemMaintenance(
  message: string,
  scheduledTime?: string,
  options?: BaseToastOptions
) {
  const description = scheduledTime
    ? `${message} scheduled for ${scheduledTime}.`
    : message;

  toast.warning('System Maintenance', {
    description,
    icon: <Settings className="h-5 w-5 text-amber-600" />,
    duration: options?.duration || 10000,
    className: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30',
    action: options?.onView
      ? {
          label: options.actionLabel || 'Learn More',
          onClick: options.onView,
        }
      : undefined,
  });
}

/**
 * Show toast for database backup completion
 *
 * @param success - Whether backup succeeded
 * @param size - Optional backup size
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * toastDatabaseBackup(true, '2.5 GB');
 * ```
 */
export function toastDatabaseBackup(
  success: boolean,
  size?: string,
  options?: BaseToastOptions
) {
  if (success) {
    const description = size
      ? `Database backup completed successfully (${size}).`
      : 'Database backup completed successfully.';

    toast.success('Backup Completed', {
      description,
      icon: <Database className="h-5 w-5 text-green-600" />,
      duration: options?.duration || 5000,
      className: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
    });
  } else {
    toast.error('Backup Failed', {
      description: 'Database backup failed. Please check system logs.',
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      duration: options?.duration || 8000,
      className: 'border-red-500/50 bg-red-50 dark:bg-red-950/30',
      action: options?.onView
        ? {
            label: options.actionLabel || 'View Logs',
            onClick: options.onView,
          }
        : undefined,
    });
  }
}
