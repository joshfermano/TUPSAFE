/**
 * React Query Hooks for Registration Approval
 *
 * Type-safe hooks for fetching, mutating, and caching registration data.
 * Implements optimistic updates, automatic cache invalidation, and error handling.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchRegistrations,
  fetchRegistrationDetails,
  approveRegistration,
  rejectRegistration,
  bulkApproveRegistrations,
  fetchRegistrationStats,
  type RegistrationsListParams,
  type ApproveRegistrationData,
  type RejectRegistrationData,
  type BulkApproveData,
} from '@/lib/api/registrations';
import type { RegistrationDetail } from '@tupsafe/types';

/**
 * Query key factory for type-safe cache management
 */
export const registrationKeys = {
  all: ['registrations'] as const,
  lists: () => [...registrationKeys.all, 'list'] as const,
  list: (params: RegistrationsListParams) => [...registrationKeys.lists(), params] as const,
  details: () => [...registrationKeys.all, 'detail'] as const,
  detail: (id: string) => [...registrationKeys.details(), id] as const,
  stats: () => [...registrationKeys.all, 'stats'] as const,
};

/**
 * Fetch paginated list of registrations with filters
 *
 * @example
 * const { data, isLoading } = useRegistrations({ status: 'pending', page: 1 });
 */
export function useRegistrations(params: RegistrationsListParams = {}) {
  return useQuery({
    queryKey: registrationKeys.list(params),
    queryFn: () => fetchRegistrations(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
  });
}

/**
 * Fetch detailed information for a single registration
 *
 * @example
 * const { data } = useRegistrationDetails('reg-id');
 */
export function useRegistrationDetails(id: string) {
  return useQuery({
    queryKey: registrationKeys.detail(id),
    queryFn: () => fetchRegistrationDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch registration statistics for dashboard
 *
 * @example
 * const { data: stats } = useRegistrationStats();
 */
export function useRegistrationStats() {
  return useQuery({
    queryKey: registrationKeys.stats(),
    queryFn: fetchRegistrationStats,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
}

/**
 * Approve a pending registration with optimistic updates
 *
 * @example
 * const approve = useApproveRegistration();
 * approve.mutate({ id: 'reg-id', data: { role: 'employee' } });
 */
export function useApproveRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveRegistrationData }) =>
      approveRegistration(id, data),

    onMutate: async ({ id }) => {
      // Cancel all outgoing refetches for registrations
      await queryClient.cancelQueries({ queryKey: registrationKeys.all });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData(registrationKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: registrationKeys.lists() });
      const previousStats = queryClient.getQueryData(registrationKeys.stats());

      // Optimistically update detail view
      queryClient.setQueryData(registrationKeys.detail(id), (old: RegistrationDetail | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: 'approved' as const,
          reviewedAt: new Date().toISOString(),
        };
      });

      // Optimistically update all list queries (remove from pending, add to approved)
      queryClient.setQueriesData(
        { queryKey: registrationKeys.lists() },
        (old: any) => {
          if (!old?.registrations) return old;

          return {
            ...old,
            registrations: old.registrations.map((reg: any) =>
              reg.id === id
                ? { ...reg, status: 'approved', reviewedAt: new Date().toISOString() }
                : reg
            ),
          };
        }
      );

      // Optimistically update stats
      queryClient.setQueryData(registrationKeys.stats(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pending: Math.max(0, (old.pending || 0) - 1),
          approved: (old.approved || 0) + 1,
        };
      });

      return { previousDetail, previousLists, previousStats };
    },

    onError: (error, { id }, context) => {
      // Rollback all optimistic updates on error
      if (context?.previousDetail) {
        queryClient.setQueryData(registrationKeys.detail(id), context.previousDetail);
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousStats) {
        queryClient.setQueryData(registrationKeys.stats(), context.previousStats);
      }

      // Show error with longer duration and detailed message
      toast.error('Failed to approve registration', {
        description: error.message || 'An unexpected error occurred',
        duration: 6000, // 6 seconds for errors (vs default 4s)
      });

      console.error('[useApproveRegistration] Approval failed:', {
        registrationId: id,
        error: error.message,
      });
    },

    onSuccess: (data, { id }) => {
      toast.success('Registration approved successfully', {
        description: `Welcome email sent to ${data.user.email}`,
      });

      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: registrationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: registrationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: registrationKeys.stats() });
    },
  });
}

/**
 * Reject a pending registration with reason
 *
 * @example
 * const reject = useRejectRegistration();
 * reject.mutate({ id: 'reg-id', data: { reason: 'Invalid credentials' } });
 */
export function useRejectRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectRegistrationData }) =>
      rejectRegistration(id, data),

    onMutate: async ({ id }) => {
      // Cancel all outgoing refetches for registrations
      await queryClient.cancelQueries({ queryKey: registrationKeys.all });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData(registrationKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: registrationKeys.lists() });
      const previousStats = queryClient.getQueryData(registrationKeys.stats());

      // Optimistically update detail view
      queryClient.setQueryData(registrationKeys.detail(id), (old: RegistrationDetail | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
        };
      });

      // Optimistically update all list queries
      queryClient.setQueriesData(
        { queryKey: registrationKeys.lists() },
        (old: any) => {
          if (!old?.registrations) return old;

          return {
            ...old,
            registrations: old.registrations.map((reg: any) =>
              reg.id === id
                ? { ...reg, status: 'rejected', rejectedAt: new Date().toISOString() }
                : reg
            ),
          };
        }
      );

      // Optimistically update stats
      queryClient.setQueryData(registrationKeys.stats(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pending: Math.max(0, (old.pending || 0) - 1),
          rejected: (old.rejected || 0) + 1,
        };
      });

      return { previousDetail, previousLists, previousStats };
    },

    onError: (error, { id }, context) => {
      // Rollback all optimistic updates on error
      if (context?.previousDetail) {
        queryClient.setQueryData(registrationKeys.detail(id), context.previousDetail);
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousStats) {
        queryClient.setQueryData(registrationKeys.stats(), context.previousStats);
      }

      // Show error with longer duration and detailed message
      toast.error('Failed to reject registration', {
        description: error.message || 'An unexpected error occurred',
        duration: 6000, // 6 seconds for errors (vs default 4s)
      });

      console.error('[useRejectRegistration] Rejection failed:', {
        registrationId: id,
        error: error.message,
      });
    },

    onSuccess: (data, { id }) => {
      toast.success('Registration rejected', {
        description: 'Notification email has been sent',
      });

      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: registrationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: registrationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: registrationKeys.stats() });
    },
  });
}

/**
 * Bulk approve multiple registrations with progress tracking
 *
 * @example
 * const bulkApprove = useBulkApproveRegistrations();
 * bulkApprove.mutate({ registrationIds: [...], defaultRole: 'employee' });
 */
export function useBulkApproveRegistrations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkApproveData) => bulkApproveRegistrations(data),

    onSuccess: (response) => {
      const { summary } = response;

      if (summary.failed === 0) {
        toast.success('All registrations approved', {
          description: `Successfully approved ${summary.successful} registrations`,
        });
      } else {
        toast.warning('Bulk approval completed with errors', {
          description: `${summary.successful} approved, ${summary.failed} failed`,
        });
      }

      // Invalidate all lists and stats
      queryClient.invalidateQueries({ queryKey: registrationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: registrationKeys.stats() });
    },

    onError: (error) => {
      toast.error('Bulk approval failed', {
        description: error.message || 'An unexpected error occurred',
      });
    },
  });
}
