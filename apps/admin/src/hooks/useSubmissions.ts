/**
 * Submission Review React Query Hooks
 *
 * Custom hooks for managing submission data with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  SubmissionListQuery,
  SubmissionListResponse,
  PDSSubmissionDetail,
  SALNSubmissionDetail,
  ApproveSubmissionData,
  RejectSubmissionData,
  BulkApproveData,
  BulkApproveResponse,
  SubmissionStatsResponse,
  DeleteSubmissionData,
} from '@tupsafe/types';
import {
  fetchSubmissions,
  fetchPDSDetails,
  fetchSALNDetails,
  approvePDS,
  rejectPDS,
  approveSALN,
  rejectSALN,
  deletePDS,
  deleteSALN,
  bulkApproveSubmissions,
  fetchSubmissionStats,
} from '@/lib/api/submissions';

/**
 * Hook for fetching paginated submissions list
 */
export function useSubmissions(params: Partial<SubmissionListQuery>) {
  return useQuery<SubmissionListResponse, Error>({
    queryKey: ['submissions', params],
    queryFn: () => fetchSubmissions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching PDS submission details
 */
export function usePDSDetails(id: string | null) {
  return useQuery<PDSSubmissionDetail, Error>({
    queryKey: ['pds-detail', id],
    queryFn: () => fetchPDSDetails(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching SALN submission details
 */
export function useSALNDetails(id: string | null) {
  return useQuery<SALNSubmissionDetail, Error>({
    queryKey: ['saln-detail', id],
    queryFn: () => fetchSALNDetails(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching submission statistics
 */
export function useSubmissionStats() {
  return useQuery<SubmissionStatsResponse, Error>({
    queryKey: ['submission-stats'],
    queryFn: fetchSubmissionStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

/**
 * Hook for approving PDS submissions
 */
export function useApprovePDS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveSubmissionData }) =>
      approvePDS(id, data),
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['submissions'] });
      await queryClient.cancelQueries({ queryKey: ['pds-detail', id] });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData(['submissions']);

      // Optimistically update to approved state
      queryClient.setQueryData(['submissions'], (old: SubmissionListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          submissions: old.submissions.map((sub) =>
            sub.id === id ? { ...sub, status: 'approved' as const } : sub
          ),
        };
      });

      return { previousSubmissions };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSubmissions) {
        queryClient.setQueryData(['submissions'], context.previousSubmissions);
      }
      toast.error('Failed to approve PDS', {
        description: err.message,
      });
    },
    onSuccess: () => {
      toast.success('PDS Approved', {
        description: 'The submission has been approved successfully.',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission-stats'] });
    },
  });
}

/**
 * Hook for rejecting PDS submissions
 */
export function useRejectPDS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectSubmissionData }) =>
      rejectPDS(id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['submissions'] });
      await queryClient.cancelQueries({ queryKey: ['pds-detail', id] });

      const previousSubmissions = queryClient.getQueryData(['submissions']);

      queryClient.setQueryData(['submissions'], (old: SubmissionListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          submissions: old.submissions.map((sub) =>
            sub.id === id ? { ...sub, status: 'rejected' as const } : sub
          ),
        };
      });

      return { previousSubmissions };
    },
    onError: (err, variables, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(['submissions'], context.previousSubmissions);
      }
      toast.error('Failed to reject PDS', {
        description: err.message,
      });
    },
    onSuccess: () => {
      toast.success('PDS Rejected', {
        description: 'The submission has been rejected and the employee has been notified.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission-stats'] });
    },
  });
}

/**
 * Hook for approving SALN submissions
 */
export function useApproveSALN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveSubmissionData }) =>
      approveSALN(id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['submissions'] });
      await queryClient.cancelQueries({ queryKey: ['saln-detail', id] });

      const previousSubmissions = queryClient.getQueryData(['submissions']);

      queryClient.setQueryData(['submissions'], (old: SubmissionListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          submissions: old.submissions.map((sub) =>
            sub.id === id ? { ...sub, status: 'approved' as const } : sub
          ),
        };
      });

      return { previousSubmissions };
    },
    onError: (err, variables, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(['submissions'], context.previousSubmissions);
      }
      toast.error('Failed to approve SALN', {
        description: err.message,
      });
    },
    onSuccess: () => {
      toast.success('SALN Approved', {
        description: 'The submission has been approved successfully.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission-stats'] });
    },
  });
}

/**
 * Hook for rejecting SALN submissions
 */
export function useRejectSALN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectSubmissionData }) =>
      rejectSALN(id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['submissions'] });
      await queryClient.cancelQueries({ queryKey: ['saln-detail', id] });

      const previousSubmissions = queryClient.getQueryData(['submissions']);

      queryClient.setQueryData(['submissions'], (old: SubmissionListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          submissions: old.submissions.map((sub) =>
            sub.id === id ? { ...sub, status: 'rejected' as const } : sub
          ),
        };
      });

      return { previousSubmissions };
    },
    onError: (err, variables, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(['submissions'], context.previousSubmissions);
      }
      toast.error('Failed to reject SALN', {
        description: err.message,
      });
    },
    onSuccess: () => {
      toast.success('SALN Rejected', {
        description: 'The submission has been rejected and the employee has been notified.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission-stats'] });
    },
  });
}

/**
 * Hook for deleting PDS submissions (admin / co_admin only)
 *
 * Optimistically removes the row from the cached list, rolls back on error,
 * and invalidates list + stats + detail caches on settle.
 */
export function useDeletePDS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeleteSubmissionData }) =>
      deletePDS(id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['submissions'] });
      await queryClient.cancelQueries({ queryKey: ['pds-detail', id] });

      const previousSubmissions = queryClient.getQueryData(['submissions']);

      queryClient.setQueryData(['submissions'], (old: SubmissionListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          submissions: old.submissions.filter((sub) => sub.id !== id),
        };
      });

      return { previousSubmissions };
    },
    onError: (err, variables, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(['submissions'], context.previousSubmissions);
      }
      toast.error('Failed to delete submission', {
        description: err.message,
      });
    },
    onSuccess: () => {
      toast.success('Submission Deleted', {
        description: 'The submission has been permanently deleted and archived.',
      });
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pds-detail', id] });
    },
  });
}

/**
 * Hook for deleting SALN submissions (admin / co_admin only)
 *
 * Optimistically removes the row from the cached list, rolls back on error,
 * and invalidates list + stats + detail caches on settle.
 */
export function useDeleteSALN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeleteSubmissionData }) =>
      deleteSALN(id, data),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['submissions'] });
      await queryClient.cancelQueries({ queryKey: ['saln-detail', id] });

      const previousSubmissions = queryClient.getQueryData(['submissions']);

      queryClient.setQueryData(['submissions'], (old: SubmissionListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          submissions: old.submissions.filter((sub) => sub.id !== id),
        };
      });

      return { previousSubmissions };
    },
    onError: (err, variables, context) => {
      if (context?.previousSubmissions) {
        queryClient.setQueryData(['submissions'], context.previousSubmissions);
      }
      toast.error('Failed to delete submission', {
        description: err.message,
      });
    },
    onSuccess: () => {
      toast.success('Submission Deleted', {
        description: 'The submission has been permanently deleted and archived.',
      });
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission-stats'] });
      queryClient.invalidateQueries({ queryKey: ['saln-detail', id] });
    },
  });
}

/**
 * Hook for bulk approving submissions
 */
export function useBulkApproveSubmissions() {
  const queryClient = useQueryClient();

  return useMutation<BulkApproveResponse, Error, BulkApproveData>({
    mutationFn: bulkApproveSubmissions,
    onSuccess: (data) => {
      const { approved, failed } = data.summary;

      if (failed === 0) {
        toast.success('Bulk Approval Successful', {
          description: `Successfully approved ${approved} submission${approved > 1 ? 's' : ''}.`,
        });
      } else {
        toast.warning('Bulk Approval Completed with Errors', {
          description: `Approved ${approved}, failed ${failed}. Review results for details.`,
        });
      }
    },
    onError: (err) => {
      toast.error('Bulk Approval Failed', {
        description: err.message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission-stats'] });
    },
  });
}
