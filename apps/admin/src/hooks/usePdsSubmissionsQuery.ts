'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PdsSubmissionsListResponse,
  PdsSubmissionListItem,
} from '@tupsafe/types';

/**
 * PDS submissions query key factory
 */
export const pdsSubmissionsKeys = {
  all: ['submissions', 'pds'] as const,
  list: (filters: PdsSubmissionsFilters) =>
    [...pdsSubmissionsKeys.all, 'list', filters] as const,
  detail: (submissionId: string) =>
    [...pdsSubmissionsKeys.all, 'detail', submissionId] as const,
  complete: (submissionId: string) =>
    [...pdsSubmissionsKeys.all, 'complete', submissionId] as const,
};

/**
 * Filters for PDS submissions queries
 */
export interface PdsSubmissionsFilters {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
  search?: string;
  sortBy?: 'submittedAt' | 'updatedAt' | 'employeeName';
  sortOrder?: 'asc' | 'desc';
}

/**
 * React Query hook for managing PDS submissions in the admin portal
 *
 * Supports filtering by status, department, and date range.
 * Includes mutations for approving and rejecting submissions with optimistic updates.
 *
 * @param filters - Optional filters for the submissions query
 * @returns Query result with submissions and mutation methods
 *
 * @example
 * ```tsx
 * const {
 *   submissions,
 *   isLoading,
 *   approveSubmission,
 *   rejectSubmission,
 * } = usePdsSubmissionsQuery({ status: 'submitted' });
 *
 * // Approve a submission
 * await approveSubmission({ submissionId: 'pds-123', reviewNotes: 'Approved' });
 * ```
 */
export function usePdsSubmissionsQuery(filters: PdsSubmissionsFilters = {}) {
  const queryClient = useQueryClient();

  // Main query for submissions list
  const query = useQuery<PdsSubmissionsListResponse, Error>({
    queryKey: pdsSubmissionsKeys.list(filters),
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.department && filters.department !== 'all') {
        params.append('department', filters.department);
      }
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(
        `/api/submissions/pds?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to fetch submissions: ${response.statusText}`
        );
      }

      const data: PdsSubmissionsListResponse = await response.json();
      return data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Query for a complete PDS submission with all sections and user details
   */
  const useCompleteSubmission = (submissionId: string | null) => {
    return useQuery({
      queryKey: pdsSubmissionsKeys.complete(submissionId || ''),
      queryFn: async () => {
        if (!submissionId) return null;

        const response = await fetch(`/api/submissions/pds/${submissionId}`);

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to fetch submission: ${response.statusText}`
          );
        }

        const data = await response.json();
        return data;
      },
      enabled: !!submissionId,
      staleTime: 5 * 60 * 1000,
      retry: 2,
    });
  };

  /**
   * Mutation to approve a PDS submission
   */
  const approveSubmissionMutation = useMutation({
    mutationFn: async ({
      submissionId,
      reviewNotes,
      reviewedBy,
    }: {
      submissionId: string;
      reviewNotes?: string;
      reviewedBy: string;
    }) => {
      const response = await fetch(`/api/submissions/pds/${submissionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to approve submission: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    },
    onMutate: async ({ submissionId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pdsSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<PdsSubmissionsListResponse>(
        pdsSubmissionsKeys.list(filters)
      );

      // Optimistically update status
      queryClient.setQueryData<PdsSubmissionsListResponse>(
        pdsSubmissionsKeys.list(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            submissions: old.submissions.map((item) =>
              item.id === submissionId
                ? {
                    ...item,
                    status: 'approved' as const,
                    approvedAt: new Date(),
                    updatedAt: new Date(),
                  }
                : item
            ),
          };
        }
      );

      return { previousSubmissions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousSubmissions) {
        queryClient.setQueryData(
          pdsSubmissionsKeys.list(filters),
          context.previousSubmissions
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: pdsSubmissionsKeys.all });
      // Also invalidate dashboard stats as approval affects compliance
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pds', 'stats'] });
    },
  });

  /**
   * Mutation to reject a PDS submission
   */
  const rejectSubmissionMutation = useMutation({
    mutationFn: async ({
      submissionId,
      reviewNotes,
      reviewedBy,
    }: {
      submissionId: string;
      reviewNotes: string;
      reviewedBy: string;
    }) => {
      const response = await fetch(`/api/submissions/pds/${submissionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to reject submission: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    },
    onMutate: async ({ submissionId, reviewNotes }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pdsSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<PdsSubmissionsListResponse>(
        pdsSubmissionsKeys.list(filters)
      );

      // Optimistically update status
      queryClient.setQueryData<PdsSubmissionsListResponse>(
        pdsSubmissionsKeys.list(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            submissions: old.submissions.map((item) =>
              item.id === submissionId
                ? {
                    ...item,
                    status: 'rejected' as const,
                    rejectionReason: reviewNotes,
                    pdfFilePath: null,
                    updatedAt: new Date(),
                  }
                : item
            ),
          };
        }
      );

      return { previousSubmissions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousSubmissions) {
        queryClient.setQueryData(
          pdsSubmissionsKeys.list(filters),
          context.previousSubmissions
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: pdsSubmissionsKeys.all });
      // Also invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pds', 'stats'] });
    },
  });

  /**
   * Mutation to request changes on a submission (return to draft)
   */
  const requestChangesMutation = useMutation({
    mutationFn: async ({
      submissionId,
      reviewNotes,
      reviewedBy,
    }: {
      submissionId: string;
      reviewNotes: string;
      reviewedBy: string;
    }) => {
      // Validate notes length
      if (reviewNotes.length < 10) {
        throw new Error('Notes must be at least 10 characters');
      }

      const response = await fetch(
        `/api/submissions/pds/${submissionId}/request-changes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notes: reviewNotes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to request changes: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    },
    onMutate: async ({ submissionId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pdsSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<PdsSubmissionsListResponse>(
        pdsSubmissionsKeys.list(filters)
      );

      // Optimistically update status to draft
      queryClient.setQueryData<PdsSubmissionsListResponse>(
        pdsSubmissionsKeys.list(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            submissions: old.submissions.map((item) =>
              item.id === submissionId
                ? {
                    ...item,
                    status: 'draft' as const,
                    updatedAt: new Date(),
                  }
                : item
            ),
          };
        }
      );

      return { previousSubmissions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousSubmissions) {
        queryClient.setQueryData(
          pdsSubmissionsKeys.list(filters),
          context.previousSubmissions
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdsSubmissionsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pds', 'stats'] });
    },
  });

  return {
    ...query,
    submissions: query.data?.submissions ?? [],
    pagination: query.data?.pagination,
    stats: query.data?.stats,
    useCompleteSubmission,
    approveSubmission: approveSubmissionMutation.mutate,
    approveSubmissionAsync: approveSubmissionMutation.mutateAsync,
    isApproving: approveSubmissionMutation.isPending,
    approveError: approveSubmissionMutation.error,
    rejectSubmission: rejectSubmissionMutation.mutate,
    rejectSubmissionAsync: rejectSubmissionMutation.mutateAsync,
    isRejecting: rejectSubmissionMutation.isPending,
    rejectError: rejectSubmissionMutation.error,
    requestChanges: requestChangesMutation.mutate,
    requestChangesAsync: requestChangesMutation.mutateAsync,
    isRequestingChanges: requestChangesMutation.isPending,
    requestChangesError: requestChangesMutation.error,
  };
}

/**
 * Hook to invalidate PDS submissions cache
 */
export function useInvalidatePdsSubmissions() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: pdsSubmissionsKeys.all });
  };
}
