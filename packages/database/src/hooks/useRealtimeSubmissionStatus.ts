'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRealtimeBase, getUserChannelName } from './useRealtimeBase';
import type {
  PdsSubmissionChangePayload,
  SalnSubmissionChangePayload,
  RealtimePayload,
} from '../types/realtime';
import type { SubmissionStatus } from '../types';

/**
 * Query keys for PDS submissions
 */
export const pdsKeys = {
  all: ['pds-submissions'] as const,
  user: (userId: string) => [...pdsKeys.all, userId] as const,
  detail: (submissionId: string) => [...pdsKeys.all, 'detail', submissionId] as const,
  latest: (userId: string) => [...pdsKeys.user(userId), 'latest'] as const,
  history: (userId: string) => [...pdsKeys.user(userId), 'history'] as const,
};

/**
 * Query keys for SALN submissions
 */
export const salnKeys = {
  all: ['saln-submissions'] as const,
  user: (userId: string) => [...salnKeys.all, userId] as const,
  detail: (submissionId: string) => [...salnKeys.all, 'detail', submissionId] as const,
  latest: (userId: string) => [...salnKeys.user(userId), 'latest'] as const,
  history: (userId: string) => [...salnKeys.user(userId), 'history'] as const,
};

/**
 * Status transition type for detecting meaningful changes
 */
interface StatusTransition {
  from: SubmissionStatus;
  to: SubmissionStatus;
}

/**
 * Configuration options for useRealtimeSubmissionStatus
 */
export interface UseRealtimeSubmissionStatusOptions {
  /** Whether to show toast notifications for status changes (default: true) */
  showToast?: boolean;
  /** Custom callback when submission status changes */
  onStatusChange?: (
    submissionType: 'pds' | 'saln',
    submissionId: string,
    transition: StatusTransition
  ) => void;
  /** Custom callback for approval events */
  onApproved?: (submissionType: 'pds' | 'saln', submissionId: string) => void;
  /** Custom callback for rejection events */
  onRejected?: (submissionType: 'pds' | 'saln', submissionId: string) => void;
}

/**
 * Get user-friendly status transition message
 */
function getStatusTransitionMessage(transition: StatusTransition): {
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
} {
  const { from, to } = transition;

  // Draft to Submitted
  if (from === 'draft' && to === 'submitted') {
    return {
      title: 'Submission Sent for Review',
      description: 'Your submission has been successfully sent to HR for review.',
      type: 'success',
    };
  }

  // Submitted to Reviewing
  if (from === 'submitted' && to === 'reviewing') {
    return {
      title: 'Under Review',
      description: 'Your submission is now being reviewed by HR personnel.',
      type: 'info',
    };
  }

  // Reviewing to Approved
  if (from === 'reviewing' && to === 'approved') {
    return {
      title: 'Submission Approved',
      description: 'Congratulations! Your submission has been approved.',
      type: 'success',
    };
  }

  // Any status to Approved (catch-all)
  if (to === 'approved') {
    return {
      title: 'Submission Approved',
      description: 'Your submission has been approved.',
      type: 'success',
    };
  }

  // Reviewing to Rejected
  if (from === 'reviewing' && to === 'rejected') {
    return {
      title: 'Revisions Required',
      description: 'Your submission requires revisions. Please check the comments and resubmit.',
      type: 'warning',
    };
  }

  // Any status to Rejected (catch-all)
  if (to === 'rejected') {
    return {
      title: 'Submission Requires Revisions',
      description: 'Please review the feedback and make necessary changes.',
      type: 'warning',
    };
  }

  // Rejected back to Draft (user editing)
  if (from === 'rejected' && to === 'draft') {
    return {
      title: 'Editing Mode',
      description: 'You can now make changes to your submission.',
      type: 'info',
    };
  }

  // Default fallback
  return {
    title: 'Status Updated',
    description: `Status changed from ${from} to ${to}.`,
    type: 'info',
  };
}

/**
 * Check if a status transition is meaningful (should trigger notifications)
 */
function isSignificantTransition(transition: StatusTransition): boolean {
  const { from, to } = transition;

  // Same status - not significant
  if (from === to) return false;

  // Status going backwards (except rejection flow) - not significant
  const statusOrder = ['draft', 'submitted', 'reviewing', 'approved'];
  const fromIndex = statusOrder.indexOf(from);
  const toIndex = statusOrder.indexOf(to);

  // Rejection is always significant
  if (to === 'rejected') return true;

  // Approval is always significant
  if (to === 'approved') return true;

  // Forward progress is significant
  if (toIndex > fromIndex) return true;

  // Rejected to draft is significant (editing flow)
  if (from === 'rejected' && to === 'draft') return true;

  // Everything else is not significant
  return false;
}

/**
 * Real-time hook for submission status changes with React Query integration
 *
 * Subscribes to both PDS and SALN submission tables and automatically updates
 * the React Query cache when submission statuses change. Shows contextual toast
 * notifications for significant status transitions.
 *
 * This hook intelligently detects status transitions and provides appropriate
 * feedback to the user:
 * - Draft → Submitted: Confirmation of submission
 * - Submitted → Reviewing: Notification that review has started
 * - Reviewing → Approved: Success notification with celebration
 * - Reviewing → Rejected: Warning with guidance to revise
 *
 * @param userId - User ID to subscribe to submissions for
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * function SubmissionDashboard() {
 *   const { user } = useAuth();
 *   const { status, isConnected } = useRealtimeSubmissionStatus(user?.id || '', {
 *     showToast: true,
 *     onApproved: (type, id) => {
 *       console.log(`${type} submission ${id} approved!`);
 *       // Trigger confetti or celebration animation
 *     },
 *     onRejected: (type, id) => {
 *       console.log(`${type} submission ${id} needs revisions`);
 *       // Navigate to edit page
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <ConnectionIndicator connected={isConnected} />
 *       <SubmissionList />
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeSubmissionStatus(
  userId: string,
  options: UseRealtimeSubmissionStatusOptions = {}
) {
  const {
    showToast = true,
    onStatusChange,
    onApproved,
    onRejected,
  } = options;

  const queryClient = useQueryClient();
  const channelName = getUserChannelName('submissions', userId);
  const { supabase, subscribe, status, isConnected, error } = useRealtimeBase(channelName);

  useEffect(() => {
    // Don't subscribe if no user ID
    if (!userId) {
      console.warn('[Realtime] No userId provided for submission status subscription');
      return;
    }

    subscribe(() =>
      supabase
        .channel(channelName)
        // Listen for PDS submission updates
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pds_submissions',
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePayload<PdsSubmissionChangePayload['new']>) => {
            const oldSubmission = payload.old;
            const newSubmission = payload.new;

            // Check if status actually changed
            if (!oldSubmission.status || !newSubmission.status) return;
            if (oldSubmission.status === newSubmission.status) return;

            const transition: StatusTransition = {
              from: oldSubmission.status,
              to: newSubmission.status,
            };

            // Only notify for significant transitions
            if (!isSignificantTransition(transition)) {
              console.debug('[Realtime] Ignoring non-significant PDS status change:', transition);
              return;
            }

            console.log('[Realtime] PDS submission status changed:', {
              id: newSubmission.id,
              transition,
            });

            // Show toast notification
            if (showToast) {
              const message = getStatusTransitionMessage(transition);
              const toastFn = toast[message.type] || toast;

              toastFn(message.title, {
                description: message.description,
                duration: transition.to === 'approved' ? 7000 : 5000, // Longer for approvals
                icon: transition.to === 'approved' ? '✓' : undefined,
              });
            }

            // Update React Query cache - invalidate all relevant queries
            queryClient.invalidateQueries({
              queryKey: pdsKeys.user(userId),
            });

            queryClient.invalidateQueries({
              queryKey: pdsKeys.detail(newSubmission.id),
            });

            // Call custom callbacks
            onStatusChange?.('pds', newSubmission.id, transition);

            if (transition.to === 'approved') {
              onApproved?.('pds', newSubmission.id);
            } else if (transition.to === 'rejected') {
              onRejected?.('pds', newSubmission.id);
            }
          }
        )
        // Listen for SALN submission updates
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'saln_submissions',
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePayload<SalnSubmissionChangePayload['new']>) => {
            const oldSubmission = payload.old;
            const newSubmission = payload.new;

            // Check if status actually changed
            if (!oldSubmission.status || !newSubmission.status) return;
            if (oldSubmission.status === newSubmission.status) return;

            const transition: StatusTransition = {
              from: oldSubmission.status,
              to: newSubmission.status,
            };

            // Only notify for significant transitions
            if (!isSignificantTransition(transition)) {
              console.debug('[Realtime] Ignoring non-significant SALN status change:', transition);
              return;
            }

            console.log('[Realtime] SALN submission status changed:', {
              id: newSubmission.id,
              transition,
            });

            // Show toast notification
            if (showToast) {
              const message = getStatusTransitionMessage(transition);
              const toastFn = toast[message.type] || toast;

              toastFn(message.title, {
                description: message.description,
                duration: transition.to === 'approved' ? 7000 : 5000, // Longer for approvals
                icon: transition.to === 'approved' ? '✓' : undefined,
              });
            }

            // Update React Query cache - invalidate all relevant queries
            queryClient.invalidateQueries({
              queryKey: salnKeys.user(userId),
            });

            queryClient.invalidateQueries({
              queryKey: salnKeys.detail(newSubmission.id),
            });

            // Call custom callbacks
            onStatusChange?.('saln', newSubmission.id, transition);

            if (transition.to === 'approved') {
              onApproved?.('saln', newSubmission.id);
            } else if (transition.to === 'rejected') {
              onRejected?.('saln', newSubmission.id);
            }
          }
        )
        // Listen for new submissions (INSERT) - useful for multi-device scenarios
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pds_submissions',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Invalidate PDS queries when new submission is created
            queryClient.invalidateQueries({
              queryKey: pdsKeys.user(userId),
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'saln_submissions',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Invalidate SALN queries when new submission is created
            queryClient.invalidateQueries({
              queryKey: salnKeys.user(userId),
            });
          }
        )
    );
  }, [
    userId,
    channelName,
    showToast,
    onStatusChange,
    onApproved,
    onRejected,
    queryClient,
    subscribe,
    supabase,
  ]);

  return {
    /** Current subscription status */
    status,
    /** Whether the subscription is connected */
    isConnected,
    /** Error if subscription failed */
    error,
    /** Query keys for use with React Query */
    pdsQueryKeys: pdsKeys,
    /** Query keys for use with React Query */
    salnQueryKeys: salnKeys,
  };
}

/**
 * Utility function to get submission by ID (for use in queries)
 *
 * @param supabase - Supabase client
 * @param submissionType - Type of submission
 * @param submissionId - Submission ID
 *
 * @example
 * ```typescript
 * const { data: submission } = useQuery({
 *   queryKey: pdsKeys.detail(submissionId),
 *   queryFn: () => getSubmissionById(createClient(), 'pds', submissionId),
 * });
 * ```
 */
export async function getSubmissionById(
  supabase: any,
  submissionType: 'pds' | 'saln',
  submissionId: string
) {
  const table = submissionType === 'pds' ? 'pds_submissions' : 'saln_submissions';

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', submissionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Utility function to get user's submissions (for use in queries)
 *
 * @param supabase - Supabase client
 * @param submissionType - Type of submission
 * @param userId - User ID
 * @param includeLatestOnly - Only return latest submissions (default: false)
 *
 * @example
 * ```typescript
 * const { data: submissions } = useQuery({
 *   queryKey: pdsKeys.user(userId),
 *   queryFn: () => getUserSubmissions(createClient(), 'pds', userId),
 * });
 * ```
 */
export async function getUserSubmissions(
  supabase: any,
  submissionType: 'pds' | 'saln',
  userId: string,
  includeLatestOnly = false
) {
  const table = submissionType === 'pds' ? 'pds_submissions' : 'saln_submissions';

  let query = supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (includeLatestOnly) {
    query = query.eq('is_latest', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}
