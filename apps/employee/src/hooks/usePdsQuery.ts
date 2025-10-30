'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePds as usePdsMock, type UsePdsReturn } from '@tupsafe/mock-data/api';
import type { CompletePdsData } from '@tupsafe/database';
import type { PdsSubmission } from '@tupsafe/mock-data';

/**
 * PDS query key factory
 */
export const pdsKeys = {
  all: ['pds'] as const,
  user: (userId: string) => [...pdsKeys.all, userId] as const,
  submission: (submissionId: string) => [...pdsKeys.all, 'submission', submissionId] as const,
};

/**
 * React Query wrapper for usePds hook
 *
 * @param userId - User ID to fetch PDS submissions for
 * @returns Query result with PDS submissions and mutation methods
 *
 * @example
 * ```tsx
 * const { submissions, latest, createDraft, updateSubmission } = usePdsQuery('user-123');
 *
 * // Create a new draft
 * await createDraft();
 *
 * // Update a submission with optimistic updates
 * await updateSubmission({ id: 'pds-1', data: { firstName: 'John' } });
 * ```
 */
export function usePdsQuery(userId: string) {
  const queryClient = useQueryClient();

  // Use the mock hook to get data fetching logic
  const mockHook = usePdsMock(userId);

  // Wrap in React Query with automatic caching and refetching
  const query = useQuery({
    queryKey: pdsKeys.user(userId),
    queryFn: async () => {
      // Wait for mock data to load
      if (mockHook.loading) {
        return new Promise<UsePdsReturn>((resolve) => {
          const checkInterval = setInterval(() => {
            if (!mockHook.loading) {
              clearInterval(checkInterval);
              resolve(mockHook);
            }
          }, 50);
        });
      }

      if (mockHook.error) {
        throw new Error(mockHook.error);
      }

      return mockHook;
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes - PDS data can be stale for a bit
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Mutation to create a new PDS draft
   */
  const createDraftMutation = useMutation({
    mutationFn: async () => {
      return await mockHook.createDraft();
    },
    onSuccess: (newDraft: PdsSubmission) => {
      // Add the new draft to the cache optimistically
      queryClient.setQueryData(pdsKeys.user(userId), (old: UsePdsReturn | undefined) => ({
        ...old,
        submissions: [newDraft, ...(old?.submissions || [])],
        latest: newDraft,
      }));
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: pdsKeys.user(userId) });
    },
  });

  /**
   * Mutation to update a PDS submission
   */
  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CompletePdsData> }) => {
      const success = await mockHook.updateSubmission(id, data);
      if (!success) throw new Error('Failed to update submission');
      return { id, data };
    },
    onMutate: async ({ id }: { id: string; data: Partial<CompletePdsData> }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pdsKeys.user(userId) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(pdsKeys.user(userId));

      // Optimistically update
      queryClient.setQueryData(pdsKeys.user(userId), (old: UsePdsReturn | undefined) => {
        if (!old) return old;

        const updatedSubmissions = old.submissions.map((sub: PdsSubmission) =>
          sub.id === id ? { ...sub, updatedAt: new Date() } : sub
        );

        return {
          ...old,
          submissions: updatedSubmissions,
          latest: old.latest?.id === id ? { ...old.latest, updatedAt: new Date() } : old.latest,
        };
      });

      return { previousData };
    },
    onError: (_err: Error, _variables: { id: string; data: Partial<CompletePdsData> }, context?: { previousData?: unknown }) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(pdsKeys.user(userId), context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: pdsKeys.user(userId) });
    },
  });

  /**
   * Mutation to submit PDS for review
   */
  const submitForReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const success = await mockHook.submitForReview(id);
      if (!success) throw new Error('Failed to submit for review');
      return id;
    },
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pdsKeys.user(userId) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(pdsKeys.user(userId));

      // Optimistically update status
      queryClient.setQueryData(pdsKeys.user(userId), (old: UsePdsReturn | undefined) => {
        if (!old) return old;

        const updatedSubmissions = old.submissions.map((sub: PdsSubmission) =>
          sub.id === id ? { ...sub, status: 'submitted', submittedAt: new Date() } : sub
        );

        return {
          ...old,
          submissions: updatedSubmissions,
          latest:
            old.latest?.id === id
              ? { ...old.latest, status: 'submitted', submittedAt: new Date() }
              : old.latest,
        };
      });

      return { previousData };
    },
    onError: (_err: Error, _variables: string, context?: { previousData?: unknown }) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(pdsKeys.user(userId), context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: pdsKeys.user(userId) });
    },
  });

  /**
   * Query for a complete submission (lazy loaded)
   */
  const useCompleteSubmission = (submissionId: string | null) => {
    return useQuery({
      queryKey: pdsKeys.submission(submissionId || ''),
      queryFn: () => {
        if (!submissionId) return null;
        return mockHook.getCompleteSubmission(submissionId);
      },
      enabled: !!submissionId,
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    ...query,
    submissions: query.data?.submissions ?? [],
    latest: query.data?.latest ?? null,
    getCompleteSubmission: mockHook.getCompleteSubmission,
    useCompleteSubmission,
    createDraft: createDraftMutation.mutate,
    createDraftAsync: createDraftMutation.mutateAsync,
    isCreatingDraft: createDraftMutation.isPending,
    createDraftError: createDraftMutation.error,
    updateSubmission: updateSubmissionMutation.mutate,
    updateSubmissionAsync: updateSubmissionMutation.mutateAsync,
    isUpdating: updateSubmissionMutation.isPending,
    updateError: updateSubmissionMutation.error,
    submitForReview: submitForReviewMutation.mutate,
    submitForReviewAsync: submitForReviewMutation.mutateAsync,
    isSubmitting: submitForReviewMutation.isPending,
    submitError: submitForReviewMutation.error,
  };
}

/**
 * Hook to invalidate PDS cache
 */
export function useInvalidatePds() {
  const queryClient = useQueryClient();

  return (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: pdsKeys.user(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: pdsKeys.all });
    }
  };
}
