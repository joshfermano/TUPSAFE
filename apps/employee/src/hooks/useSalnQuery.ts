'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSaln as useSalnMock, type UseSalnReturn } from '@tupsafe/mock-data/api';
import type { CompleteSalnData } from '@tupsafe/database';
import type { SalnSubmission } from '@tupsafe/mock-data';

/**
 * SALN query key factory
 */
export const salnKeys = {
  all: ['saln'] as const,
  user: (userId: string) => [...salnKeys.all, userId] as const,
  submission: (submissionId: string) => [...salnKeys.all, 'submission', submissionId] as const,
  year: (userId: string, year: number) => [...salnKeys.user(userId), 'year', year] as const,
};

/**
 * React Query wrapper for useSaln hook
 *
 * @param userId - User ID to fetch SALN submissions for
 * @returns Query result with SALN submissions and mutation methods
 *
 * @example
 * ```tsx
 * const { submissions, latest, createDraft, updateSubmission } = useSalnQuery('user-123');
 *
 * // Create a new draft for 2024
 * await createDraft(2024);
 *
 * // Update a submission with optimistic updates
 * await updateSubmission({
 *   id: 'saln-1',
 *   data: {
 *     realProperties: [{ kind: 'House', location: 'Manila' }]
 *   }
 * });
 * ```
 */
export function useSalnQuery(userId: string) {
  const queryClient = useQueryClient();

  // Use the mock hook to get data fetching logic
  const mockHook = useSalnMock(userId);

  // Wrap in React Query with automatic caching and refetching
  const query = useQuery({
    queryKey: salnKeys.user(userId),
    queryFn: async () => {
      // Wait for mock data to load
      if (mockHook.loading) {
        return new Promise<UseSalnReturn>((resolve) => {
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
    staleTime: 3 * 60 * 1000, // 3 minutes - SALN data can be stale for a bit
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Mutation to create a new SALN draft
   */
  const createDraftMutation = useMutation({
    mutationFn: async (year: number) => {
      return await mockHook.createDraft(year);
    },
    onSuccess: (newDraft: SalnSubmission) => {
      // Add the new draft to the cache optimistically
      queryClient.setQueryData(salnKeys.user(userId), (old: UseSalnReturn | undefined) => ({
        ...old,
        submissions: [newDraft, ...(old?.submissions || [])],
        latest: newDraft,
      }));
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: salnKeys.user(userId) });
    },
  });

  /**
   * Mutation to update a SALN submission
   */
  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CompleteSalnData> }) => {
      const success = await mockHook.updateSubmission(id, data);
      if (!success) throw new Error('Failed to update submission');
      return { id, data };
    },
    onMutate: async ({ id, data }: { id: string; data: Partial<CompleteSalnData> }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: salnKeys.user(userId) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(salnKeys.user(userId));

      // Calculate totals for optimistic update
      let totalAssets = 0;
      let totalLiabilities = 0;

      if (data.realProperties) {
        totalAssets += data.realProperties.reduce(
          (sum: number, prop: { currentFairMarketValue?: string | number }) => sum + Number(prop.currentFairMarketValue || 0),
          0
        );
      }

      if (data.personalProperties) {
        totalAssets += data.personalProperties.reduce(
          (sum: number, prop: { acquisitionCost?: string | number }) => sum + Number(prop.acquisitionCost || 0),
          0
        );
      }

      if (data.liabilities) {
        totalLiabilities = data.liabilities.reduce(
          (sum: number, liability: { outstandingBalance?: string | number }) => sum + Number(liability.outstandingBalance || 0),
          0
        );
      }

      const netWorth = totalAssets - totalLiabilities;

      // Optimistically update
      queryClient.setQueryData(salnKeys.user(userId), (old: UseSalnReturn | undefined) => {
        if (!old) return old;

        const updatedSubmissions = old.submissions.map((sub: SalnSubmission) =>
          sub.id === id
            ? {
                ...sub,
                totalAssets: totalAssets > 0 ? totalAssets.toFixed(2) : sub.totalAssets,
                totalLiabilities:
                  totalLiabilities > 0 ? totalLiabilities.toFixed(2) : sub.totalLiabilities,
                netWorth: netWorth !== 0 ? netWorth.toFixed(2) : sub.netWorth,
                updatedAt: new Date(),
              }
            : sub
        );

        return {
          ...old,
          submissions: updatedSubmissions,
          latest:
            old.latest?.id === id
              ? {
                  ...old.latest,
                  totalAssets: totalAssets > 0 ? totalAssets.toFixed(2) : old.latest.totalAssets,
                  totalLiabilities:
                    totalLiabilities > 0
                      ? totalLiabilities.toFixed(2)
                      : old.latest.totalLiabilities,
                  netWorth: netWorth !== 0 ? netWorth.toFixed(2) : old.latest.netWorth,
                  updatedAt: new Date(),
                }
              : old.latest,
        };
      });

      return { previousData };
    },
    onError: (_err: Error, _variables: { id: string; data: Partial<CompleteSalnData> }, context?: { previousData?: unknown }) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(salnKeys.user(userId), context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: salnKeys.user(userId) });
    },
  });

  /**
   * Mutation to submit SALN for review
   */
  const submitForReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const success = await mockHook.submitForReview(id);
      if (!success) throw new Error('Failed to submit for review');
      return id;
    },
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: salnKeys.user(userId) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(salnKeys.user(userId));

      // Optimistically update status
      queryClient.setQueryData(salnKeys.user(userId), (old: UseSalnReturn | undefined) => {
        if (!old) return old;

        const updatedSubmissions = old.submissions.map((sub: SalnSubmission) =>
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
        queryClient.setQueryData(salnKeys.user(userId), context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: salnKeys.user(userId) });
    },
  });

  /**
   * Query for a complete submission (lazy loaded)
   */
  const useCompleteSubmission = (submissionId: string | null) => {
    return useQuery({
      queryKey: salnKeys.submission(submissionId || ''),
      queryFn: () => {
        if (!submissionId) return null;
        return mockHook.getCompleteSubmission(submissionId);
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
      queryKey: salnKeys.year(userId, year),
      queryFn: () => {
        return query.data?.submissions.filter((sub) => sub.year === year) ?? [];
      },
      enabled: !!query.data,
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    ...query,
    submissions: query.data?.submissions ?? [],
    latest: query.data?.latest ?? null,
    getCompleteSubmission: mockHook.getCompleteSubmission,
    useCompleteSubmission,
    useSubmissionsByYear,
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
 * Hook to invalidate SALN cache
 */
export function useInvalidateSaln() {
  const queryClient = useQueryClient();

  return (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: salnKeys.user(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: salnKeys.all });
    }
  };
}
