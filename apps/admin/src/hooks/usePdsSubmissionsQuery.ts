'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MockDatabase,
  mockPdsSubmissions,
  getCompletePdsSubmission,
  type PdsSubmission,
} from '@tupsafe/mock-data';
import {
  filterSubmissionsByStatus,
  filterSubmissionsByDepartment,
  filterSubmissionsByDateRange,
  sortSubmissionsByDate,
  getSubmissionWithUserDetails,
} from '@/lib/mock-helpers';

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
  status?: string | null;
  department?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  sortOrder?: 'asc' | 'desc';
}

/**
 * PDS submission with user details
 */
export interface PdsSubmissionWithDetails {
  submission: PdsSubmission;
  user: ReturnType<typeof MockDatabase.getProfile> | undefined;
  department: ReturnType<typeof MockDatabase.getDepartment> | null;
  position: ReturnType<typeof MockDatabase.getPosition> | null;
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
  const query = useQuery<PdsSubmissionWithDetails[], Error>({
    queryKey: pdsSubmissionsKeys.list(filters),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      let submissions = [...mockPdsSubmissions];

      // Apply status filter
      if (filters.status) {
        submissions = filterSubmissionsByStatus(submissions, filters.status);
      }

      // Apply department filter
      if (filters.department) {
        submissions = filterSubmissionsByDepartment(
          submissions,
          filters.department
        );
      }

      // Apply date range filter
      if (filters.startDate || filters.endDate) {
        submissions = filterSubmissionsByDateRange(
          submissions,
          filters.startDate || null,
          filters.endDate || null
        );
      }

      // Sort submissions
      submissions = sortSubmissionsByDate(
        submissions,
        filters.sortOrder || 'desc'
      );

      // Map to include user details
      return submissions.map((submission) =>
        getSubmissionWithUserDetails(submission)
      );
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

        await new Promise((resolve) => setTimeout(resolve, 150));

        const completePds = getCompletePdsSubmission(submissionId);
        if (!completePds) return null;

        // Add user details
        const user = MockDatabase.getProfile(completePds.submission.userId);
        const department = user?.departmentId
          ? MockDatabase.getDepartment(user.departmentId)
          : null;
        const position = user?.positionId
          ? MockDatabase.getPosition(user.positionId)
          : null;

        return {
          ...completePds,
          user,
          department,
          position,
        };
      },
      enabled: !!submissionId,
      staleTime: 5 * 60 * 1000,
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const submissionIndex = mockPdsSubmissions.findIndex(
        (s) => s.id === submissionId
      );
      if (submissionIndex === -1) {
        throw new Error('Submission not found');
      }

      const updatedSubmission: PdsSubmission = {
        ...mockPdsSubmissions[submissionIndex],
        status: 'approved',
        approvedBy: reviewedBy,
        approvedAt: new Date(),
        rejectionReason: null,
        pdfFilePath: `/pds/${new Date().getFullYear()}/pds-${submissionId}.pdf`,
        updatedAt: new Date(),
      };

      mockPdsSubmissions[submissionIndex] = updatedSubmission;

      return getSubmissionWithUserDetails(updatedSubmission);
    },
    onMutate: async ({ submissionId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pdsSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<
        PdsSubmissionWithDetails[]
      >(pdsSubmissionsKeys.list(filters));

      // Optimistically update status
      queryClient.setQueryData<PdsSubmissionWithDetails[]>(
        pdsSubmissionsKeys.list(filters),
        (old = []) =>
          old.map((item) =>
            item.submission.id === submissionId
              ? {
                  ...item,
                  submission: {
                    ...item.submission,
                    status: 'approved',
                    updatedAt: new Date(),
                  },
                }
              : item
          )
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const submissionIndex = mockPdsSubmissions.findIndex(
        (s) => s.id === submissionId
      );
      if (submissionIndex === -1) {
        throw new Error('Submission not found');
      }

      const updatedSubmission: PdsSubmission = {
        ...mockPdsSubmissions[submissionIndex],
        status: 'rejected',
        rejectionReason: reviewNotes,
        pdfFilePath: null,
        updatedAt: new Date(),
      };

      mockPdsSubmissions[submissionIndex] = updatedSubmission;

      return getSubmissionWithUserDetails(updatedSubmission);
    },
    onMutate: async ({ submissionId, reviewNotes }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pdsSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<
        PdsSubmissionWithDetails[]
      >(pdsSubmissionsKeys.list(filters));

      // Optimistically update status
      queryClient.setQueryData<PdsSubmissionWithDetails[]>(
        pdsSubmissionsKeys.list(filters),
        (old = []) =>
          old.map((item) =>
            item.submission.id === submissionId
              ? {
                  ...item,
                  submission: {
                    ...item.submission,
                    status: 'rejected',
                    rejectionReason: reviewNotes,
                    pdfFilePath: null,
                    updatedAt: new Date(),
                  },
                }
              : item
          )
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600));

      const submissionIndex = mockPdsSubmissions.findIndex(
        (s) => s.id === submissionId
      );
      if (submissionIndex === -1) {
        throw new Error('Submission not found');
      }

      const updatedSubmission: PdsSubmission = {
        ...mockPdsSubmissions[submissionIndex],
        status: 'draft',
        rejectionReason: null,
        pdfFilePath: null,
        updatedAt: new Date(),
      };

      mockPdsSubmissions[submissionIndex] = updatedSubmission;

      return getSubmissionWithUserDetails(updatedSubmission);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdsSubmissionsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    ...query,
    submissions: query.data ?? [],
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
