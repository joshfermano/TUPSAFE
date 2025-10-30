/**
 * Supabase Realtime Types
 *
 * Type definitions for Supabase Realtime subscriptions and events.
 * These types enable type-safe real-time data synchronization across
 * the TUPSAFE application.
 *
 * Key Features:
 * - Real-time database change notifications (INSERT, UPDATE, DELETE)
 * - Type-safe payload structures for all events
 * - Support for table-specific subscriptions
 * - Notification system types
 * - Channel configuration types
 *
 * @module realtime
 */

import type {
  Profile,
  PdsSubmission,
  SalnSubmission,
  Notification,
  ApprovalWorkflow,
  SubmissionStatus,
  NotificationType,
} from '../types';

/**
 * Supabase Realtime Event Types
 *
 * Represents the type of database operation that triggered the event.
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/**
 * Supabase Realtime Change Event
 *
 * Standard event structure for database changes in Supabase.
 */
export type RealtimeChangeEvent =
  | 'postgres_changes'
  | 'broadcast'
  | 'presence';

/**
 * Generic Realtime Payload
 *
 * Structure of the payload received from Supabase Realtime for database changes.
 *
 * @template T - The type of the database record (row)
 */
export interface RealtimePayload<T = Record<string, unknown>> {
  /** Database schema name (usually 'public') */
  schema: string;

  /** Database table name */
  table: string;

  /** Timestamp when the change was committed */
  commit_timestamp: string;

  /** Type of database operation */
  eventType: RealtimeEvent;

  /** New record data (for INSERT and UPDATE) */
  new: T;

  /** Old record data (for UPDATE and DELETE) */
  old: T | Record<string, never>;

  /** Any errors that occurred during the operation */
  errors: null | string[];
}

/**
 * Realtime Subscription Configuration
 *
 * Configuration options for subscribing to database changes.
 */
export interface RealtimeSubscriptionConfig {
  /** Event type to subscribe to */
  event: RealtimeEvent;

  /** Database schema (default: 'public') */
  schema: string;

  /** Table name to subscribe to */
  table: string;

  /** Optional filter for specific rows */
  filter?: string;
}

/**
 * Realtime Channel Status
 *
 * Possible states of a Realtime channel connection.
 */
export type RealtimeChannelStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error'
  | 'closed'
  | 'errored'
  | 'joined'
  | 'joining'
  | 'leaving';

/**
 * Profile Change Payload
 *
 * Typed payload for profile table changes.
 */
export interface ProfileChangePayload extends RealtimePayload<Profile> {
  table: 'profiles';
}

/**
 * PDS Submission Change Payload
 *
 * Typed payload for PDS submission changes.
 */
export interface PdsSubmissionChangePayload
  extends RealtimePayload<PdsSubmission> {
  table: 'pds_submissions';
}

/**
 * SALN Submission Change Payload
 *
 * Typed payload for SALN submission changes.
 */
export interface SalnSubmissionChangePayload
  extends RealtimePayload<SalnSubmission> {
  table: 'saln_submissions';
}

/**
 * Notification Change Payload
 *
 * Typed payload for notification table changes.
 */
export interface NotificationChangePayload
  extends RealtimePayload<Notification> {
  table: 'notifications';
}

/**
 * Approval Workflow Change Payload
 *
 * Typed payload for approval workflow changes.
 */
export interface ApprovalWorkflowChangePayload
  extends RealtimePayload<ApprovalWorkflow> {
  table: 'approval_workflows';
}

/**
 * Notification Event Payload
 *
 * Structure for real-time notification events in the application.
 * Used for displaying toast notifications based on database changes.
 */
export interface NotificationEventPayload {
  /** Unique notification ID */
  id: string;

  /** User ID this notification belongs to */
  userId: string;

  /** Notification type */
  type: NotificationType;

  /** Notification title */
  title: string;

  /** Notification message */
  message: string;

  /** Whether the notification has been read */
  isRead: boolean;

  /** When the notification was created */
  createdAt: string;

  /** Optional link to related resource */
  link?: string;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Submission Status Change Event
 *
 * Event payload for tracking submission status changes in real-time.
 * Useful for updating UI when submission status changes.
 */
export interface SubmissionStatusChangeEvent {
  /** Submission ID (PDS or SALN) */
  submissionId: string;

  /** Type of submission */
  submissionType: 'pds' | 'saln';

  /** Old status */
  oldStatus: SubmissionStatus;

  /** New status */
  newStatus: SubmissionStatus;

  /** User who initiated the status change */
  changedBy: string;

  /** Timestamp of the change */
  changedAt: string;

  /** Optional comment or reason for the change */
  comment?: string;
}

/**
 * Profile Update Event
 *
 * Event payload for tracking profile changes in real-time.
 */
export interface ProfileUpdateEvent {
  /** Profile ID */
  profileId: string;

  /** Fields that were updated */
  updatedFields: Partial<Profile>;

  /** Timestamp of the update */
  updatedAt: string;
}

/**
 * Deadline Reminder Event
 *
 * Event payload for deadline reminder notifications.
 */
export interface DeadlineReminderEvent {
  /** Submission type */
  submissionType: 'pds' | 'saln';

  /** Deadline date */
  deadline: string;

  /** Days remaining until deadline */
  daysRemaining: number;

  /** Target user ID */
  userId: string;
}

/**
 * Broadcast Event Types
 *
 * Custom broadcast event types for application-specific real-time updates.
 */
export type BroadcastEventType =
  | 'notification'
  | 'status_change'
  | 'profile_update'
  | 'deadline_reminder'
  | 'system_message';

/**
 * Broadcast Message
 *
 * Structure for custom broadcast messages sent through Realtime channels.
 */
export interface BroadcastMessage<T = unknown> {
  /** Event type */
  type: BroadcastEventType;

  /** Message payload */
  payload: T;

  /** Timestamp */
  timestamp: string;

  /** Sender ID (optional) */
  senderId?: string;
}

/**
 * Presence State
 *
 * Structure for tracking user presence in the application.
 */
export interface PresenceState {
  /** User ID */
  userId: string;

  /** Current page/section */
  currentPage?: string;

  /** User status */
  status: 'online' | 'away' | 'busy';

  /** Last activity timestamp */
  lastActivity: string;
}

/**
 * Realtime Error
 *
 * Structure for handling Realtime errors.
 */
export interface RealtimeError {
  /** Error message */
  message: string;

  /** Error code (if available) */
  code?: string;

  /** Additional error details */
  details?: Record<string, unknown>;

  /** Timestamp when error occurred */
  timestamp: string;
}

/**
 * Subscription Callback Types
 *
 * Type definitions for subscription callback functions.
 */
export type RealtimeCallback<T = unknown> = (payload: RealtimePayload<T>) => void;
export type NotificationCallback = (payload: NotificationEventPayload) => void;
export type StatusChangeCallback = (payload: SubmissionStatusChangeEvent) => void;
export type ProfileUpdateCallback = (payload: ProfileUpdateEvent) => void;
export type ErrorCallback = (error: RealtimeError) => void;

/**
 * Channel Options
 *
 * Configuration options for creating a Realtime channel.
 */
export interface ChannelOptions {
  /** Channel name */
  name: string;

  /** Whether to enable presence tracking */
  presence?: boolean;

  /** Whether to enable broadcast */
  broadcast?: boolean;

  /** Postgres changes configuration */
  postgresChanges?: RealtimeSubscriptionConfig[];

  /** Error callback */
  onError?: ErrorCallback;
}
