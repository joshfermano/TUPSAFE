'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SalnSubmissionsListResponse } from '@tupsafe/types';

/**
 * SALN submissions query key factory
 */
export const salnSubmissionsKeys = {
  all: ['submissions', 'saln'] as const,
  list: (filters: SalnSubmissionsFilters) =>
    [...salnSubmissionsKeys.all, 'list', filters] as const,
  detail: (submissionId: string) =>
    [...salnSubmissionsKeys.all, 'detail', submissionId] as const,
  complete: (submissionId: string) =>
    [...salnSubmissionsKeys.all, 'complete', submissionId] as const,
};

/**
 * Filters for SALN submissions queries
 */
export interface SalnSubmissionsFilters {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
  year?: number;
  search?: string;
  sortBy?: 'submittedAt' | 'updatedAt' | 'employeeName' | 'netWorth';
  sortOrder?: 'asc' | 'desc';
}

/**
 * React Query hook for managing SALN submissions in the admin portal
 *
 * Supports filtering by status, year, department, and search.
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
 * } = useSalnSubmissionsQuery({ year: 2025, status: 'submitted' });
 *
 * // Approve a submission
 * await approveSubmission({ submissionId: 'saln-123', reviewNotes: 'Approved' });
 * ```
 */
export function useSalnSubmissionsQuery(filters: SalnSubmissionsFilters = {}) {
  const queryClient = useQueryClient();

  // Main query for submissions list
  const query = useQuery<SalnSubmissionsListResponse, Error>({
    queryKey: salnSubmissionsKeys.list(filters),
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
      if (filters.year) params.append('year', filters.year.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(
        `/api/submissions/saln?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to fetch submissions: ${response.statusText}`
        );
      }

      const data: SalnSubmissionsListResponse = await response.json();
      return data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Query for a complete SALN submission with all sections and user details
   */
  const useCompleteSubmission = (submissionId: string | null) => {
    return useQuery({
      queryKey: salnSubmissionsKeys.complete(submissionId || ''),
      queryFn: async () => {
        if (!submissionId) return null;

        const response = await fetch(`/api/submissions/saln/${submissionId}`);

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
   * Mutation to approve a SALN submission
   */
  const approveSubmissionMutation = useMutation({
    mutationFn: async ({
      submissionId,
      reviewNotes,
      reviewedBy: _reviewedBy,
    }: {
      submissionId: string;
      reviewNotes?: string;
      reviewedBy: string;
    }) => {
      const response = await fetch(`/api/submissions/saln/${submissionId}/approve`, {
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
      await queryClient.cancelQueries({ queryKey: salnSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<SalnSubmissionsListResponse>(
        salnSubmissionsKeys.list(filters)
      );

      // Optimistically update status
      queryClient.setQueryData<SalnSubmissionsListResponse>(
        salnSubmissionsKeys.list(filters),
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
          salnSubmissionsKeys.list(filters),
          context.previousSubmissions
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: salnSubmissionsKeys.all });
      // Also invalidate dashboard stats as approval affects compliance
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['saln', 'stats'] });
    },
  });

  /**
   * Mutation to reject a SALN submission
   */
  const rejectSubmissionMutation = useMutation({
    mutationFn: async ({
      submissionId,
      reviewNotes,
      reviewedBy: _reviewedBy,
    }: {
      submissionId: string;
      reviewNotes: string;
      reviewedBy: string;
    }) => {
      const response = await fetch(`/api/submissions/saln/${submissionId}/reject`, {
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
      await queryClient.cancelQueries({ queryKey: salnSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<SalnSubmissionsListResponse>(
        salnSubmissionsKeys.list(filters)
      );

      // Optimistically update status
      queryClient.setQueryData<SalnSubmissionsListResponse>(
        salnSubmissionsKeys.list(filters),
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
          salnSubmissionsKeys.list(filters),
          context.previousSubmissions
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: salnSubmissionsKeys.all });
      // Also invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['saln', 'stats'] });
    },
  });

  /**
   * Mutation to request changes on a submission (return to draft)
   */
  const requestChangesMutation = useMutation({
    mutationFn: async ({
      submissionId,
      reviewNotes,
      reviewedBy: _reviewedBy,
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
        `/api/submissions/saln/${submissionId}/request-changes`,
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
      await queryClient.cancelQueries({ queryKey: salnSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<SalnSubmissionsListResponse>(
        salnSubmissionsKeys.list(filters)
      );

      // Optimistically update status to draft
      queryClient.setQueryData<SalnSubmissionsListResponse>(
        salnSubmissionsKeys.list(filters),
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
          salnSubmissionsKeys.list(filters),
          context.previousSubmissions
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salnSubmissionsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['saln', 'stats'] });
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
 * Hook to invalidate SALN submissions cache
 */
export function useInvalidateSalnSubmissions() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: salnSubmissionsKeys.all });
  };
}
