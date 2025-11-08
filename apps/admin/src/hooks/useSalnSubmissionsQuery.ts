'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MockDatabase,
  mockSalnSubmissions,
  getCompleteSalnSubmission,
  type SalnSubmission,
} from '@tupsafe/mock-data';
import {
  filterSubmissionsByStatus,
  filterSubmissionsByDepartment,
  filterSubmissionsByDateRange,
  sortSubmissionsByDate,
  getSubmissionWithUserDetails,
} from '@/lib/mock-helpers';

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
  byYear: (year: number) => [...salnSubmissionsKeys.all, 'year', year] as const,
};

/**
 * Filters for SALN submissions queries
 */
export interface SalnSubmissionsFilters {
  status?: string | null;
  year?: number | null;
  department?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  sortOrder?: 'asc' | 'desc';
}

/**
 * SALN submission with user details
 */
export interface SalnSubmissionWithDetails {
  submission: SalnSubmission;
  user: ReturnType<typeof MockDatabase.getProfile> | undefined;
  department: ReturnType<typeof MockDatabase.getDepartment> | null;
  position: ReturnType<typeof MockDatabase.getPosition> | null;
}

/**
 * React Query hook for managing SALN submissions in the admin portal
 *
 * Supports filtering by status, year, department, and date range.
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
  const query = useQuery<SalnSubmissionWithDetails[], Error>({
    queryKey: salnSubmissionsKeys.list(filters),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      let submissions = [...mockSalnSubmissions];

      // Apply year filter
      if (filters.year) {
        submissions = submissions.filter((s) => s.year === filters.year);
      }

      // Apply status filter
      if (filters.status) {
        submissions = filterSubmissionsByStatus(submissions, filters.status);
      }

      // Apply department filter
      if (filters.department) {
        submissions = filterSubmissionsByDepartment(submissions, filters.department);
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
      submissions = sortSubmissionsByDate(submissions, filters.sortOrder || 'desc');

      // Map to include user details
      return submissions.map((submission) => getSubmissionWithUserDetails(submission));
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Query for a complete SALN submission with all financial data and user details
   */
  const useCompleteSubmission = (submissionId: string | null) => {
    return useQuery({
      queryKey: salnSubmissionsKeys.complete(submissionId || ''),
      queryFn: async () => {
        if (!submissionId) return null;

        await new Promise((resolve) => setTimeout(resolve, 150));

        const completeSaln = getCompleteSalnSubmission(submissionId);
        if (!completeSaln) return null;

        // Add user details
        const user = MockDatabase.getProfile(completeSaln.submission.userId);
        const department = user?.departmentId ? MockDatabase.getDepartment(user.departmentId) : null;
        const position = user?.positionId ? MockDatabase.getPosition(user.positionId) : null;

        return {
          ...completeSaln,
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
   * Query for submissions by year
   */
  const useSubmissionsByYear = (year: number) => {
    return useQuery({
      queryKey: salnSubmissionsKeys.byYear(year),
      queryFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));

        const submissions = mockSalnSubmissions.filter((s) => s.year === year);
        return submissions.map((submission) => getSubmissionWithUserDetails(submission));
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Mutation to approve a SALN submission
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

      const submissionIndex = mockSalnSubmissions.findIndex((s) => s.id === submissionId);
      if (submissionIndex === -1) {
        throw new Error('Submission not found');
      }

      const updatedSubmission: SalnSubmission = {
        ...mockSalnSubmissions[submissionIndex],
        status: 'approved',
        approvedBy: reviewedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      };

      mockSalnSubmissions[submissionIndex] = updatedSubmission;

      return getSubmissionWithUserDetails(updatedSubmission);
    },
    onMutate: async ({ submissionId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: salnSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<SalnSubmissionWithDetails[]>(
        salnSubmissionsKeys.list(filters)
      );

      // Optimistically update status
      queryClient.setQueryData<SalnSubmissionWithDetails[]>(
        salnSubmissionsKeys.list(filters),
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
        queryClient.setQueryData(salnSubmissionsKeys.list(filters), context.previousSubmissions);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: salnSubmissionsKeys.all });
      // Also invalidate dashboard stats as approval affects compliance
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  /**
   * Mutation to reject a SALN submission
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

      const submissionIndex = mockSalnSubmissions.findIndex((s) => s.id === submissionId);
      if (submissionIndex === -1) {
        throw new Error('Submission not found');
      }

      const updatedSubmission: SalnSubmission = {
        ...mockSalnSubmissions[submissionIndex],
        status: 'rejected',
        updatedAt: new Date(),
      };

      mockSalnSubmissions[submissionIndex] = updatedSubmission;

      return getSubmissionWithUserDetails(updatedSubmission);
    },
    onMutate: async ({ submissionId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: salnSubmissionsKeys.all });

      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData<SalnSubmissionWithDetails[]>(
        salnSubmissionsKeys.list(filters)
      );

      // Optimistically update status
      queryClient.setQueryData<SalnSubmissionWithDetails[]>(
        salnSubmissionsKeys.list(filters),
        (old = []) =>
          old.map((item) =>
            item.submission.id === submissionId
              ? {
                  ...item,
                  submission: {
                    ...item.submission,
                    status: 'rejected',
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
        queryClient.setQueryData(salnSubmissionsKeys.list(filters), context.previousSubmissions);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: salnSubmissionsKeys.all });
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

      const submissionIndex = mockSalnSubmissions.findIndex((s) => s.id === submissionId);
      if (submissionIndex === -1) {
        throw new Error('Submission not found');
      }

      const updatedSubmission: SalnSubmission = {
        ...mockSalnSubmissions[submissionIndex],
        status: 'draft',
        updatedAt: new Date(),
      };

      mockSalnSubmissions[submissionIndex] = updatedSubmission;

      return getSubmissionWithUserDetails(updatedSubmission);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salnSubmissionsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  /**
   * Get year-over-year comparison for a user
   */
  const getYearOverYearComparison = (userId: string, year: number) => {
    const currentYearSubmission = mockSalnSubmissions.find(
      (s) => s.userId === userId && s.year === year
    );
    const previousYearSubmission = mockSalnSubmissions.find(
      (s) => s.userId === userId && s.year === year - 1
    );

    if (!currentYearSubmission) return null;

    return {
      currentYear: currentYearSubmission,
      previousYear: previousYearSubmission,
      hasComparison: !!previousYearSubmission,
    };
  };

  return {
    ...query,
    submissions: query.data ?? [],
    useCompleteSubmission,
    useSubmissionsByYear,
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
    getYearOverYearComparison,
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
