/**
 * Deadline Management React Query Hooks
 *
 * Type-safe hooks for fetching, mutating, and caching deadline data.
 * Implements optimistic updates, automatic cache invalidation, and error handling.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchDeadlines,
  fetchDeadlineById,
  fetchDeadlineByFormTypeAndYear,
  createDeadline,
  updateDeadline,
  deleteDeadline,
  type DeadlinesListParams,
  type DeadlinesListResponse,
  type DeadlineDetailResponse,
  type CreateDeadlineData,
  type UpdateDeadlineData,
  type FormType,
} from '@/lib/api/deadlines';

/**
 * Query key factory for type-safe cache management
 */
export const deadlineKeys = {
  all: ['deadlines'] as const,
  lists: () => [...deadlineKeys.all, 'list'] as const,
  list: (params: DeadlinesListParams) => [...deadlineKeys.lists(), params] as const,
  details: () => [...deadlineKeys.all, 'detail'] as const,
  detail: (id: string) => [...deadlineKeys.details(), id] as const,
  lookup: () => [...deadlineKeys.all, 'lookup'] as const,
  byFormTypeAndYear: (formType: FormType, year: number) =>
    [...deadlineKeys.lookup(), formType, year] as const,
};

/**
 * Fetch paginated list of deadlines with filters
 *
 * @example
 * const { data, isLoading } = useDeadlines({ formType: 'pds', isActive: true });
 */
export function useDeadlines(params: DeadlinesListParams = {}) {
  return useQuery<DeadlinesListResponse, Error>({
    queryKey: deadlineKeys.list(params),
    queryFn: () => fetchDeadlines(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch detailed information for a single deadline by ID
 *
 * @example
 * const { data } = useDeadlineById('deadline-id');
 */
export function useDeadlineById(id: string | null) {
  return useQuery<DeadlineDetailResponse, Error>({
    queryKey: deadlineKeys.detail(id || ''),
    queryFn: () => fetchDeadlineById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch deadline by form type and year (unique combination)
 * Returns null if no deadline exists for the given form type and year
 *
 * @example
 * const { data } = useDeadlineByFormType('pds', 2024);
 */
export function useDeadlineByFormType(formType: FormType | null, year: number | null) {
  return useQuery<DeadlineDetailResponse | null, Error>({
    queryKey: deadlineKeys.byFormTypeAndYear(formType || 'pds', year || 0),
    queryFn: async () => {
      console.log('[useDeadlineByFormType] Query function started:', {
        formType,
        year,
        timestamp: new Date().toISOString(),
      });

      try {
        const result = await fetchDeadlineByFormTypeAndYear(formType!, year!);

        console.log('[useDeadlineByFormType] Query completed:', {
          formType,
          year,
          found: !!result,
          deadlineId: result?.id,
        });

        return result;
      } catch (error) {
        console.error('[useDeadlineByFormType] Query failed:', {
          formType,
          year,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    enabled: !!formType && !!year && year > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on authorization errors (403)
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('403')) {
        console.log('[useDeadlineByFormType] Skipping retry for authorization error');
        return false;
      }

      // Don't retry on validation errors (400)
      if (error?.message?.includes('Invalid request')) {
        console.log('[useDeadlineByFormType] Skipping retry for validation error');
        return false;
      }

      // Retry up to 2 times for network or server errors
      const shouldRetry = failureCount < 2;
      console.log('[useDeadlineByFormType] Retry decision:', {
        failureCount,
        shouldRetry,
        error: error?.message,
      });

      return shouldRetry;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
      console.log('[useDeadlineByFormType] Retry delay:', {
        attemptIndex,
        delayMs: delay,
      });
      return delay;
    },
  });
}

/**
 * Create a new deadline with cache invalidation
 *
 * @example
 * const createMutation = useCreateDeadline();
 * createMutation.mutate({
 *   formType: 'pds',
 *   year: 2024,
 *   deadlineDate: '2024-04-15',
 *   reminderDaysBefore: [30, 15, 7, 3, 1]
 * });
 */
export function useCreateDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeadlineData) => createDeadline(data),

    onSuccess: (response) => {
      const { deadline } = response;
      const formTypeLabel = deadline.formType.toUpperCase();

      toast.success('Deadline created successfully', {
        description: `${formTypeLabel} deadline for ${deadline.year} has been created.`,
      });

      // Invalidate all deadline lists to refetch with new data
      queryClient.invalidateQueries({ queryKey: deadlineKeys.lists() });

      // Also invalidate the specific lookup key
      queryClient.invalidateQueries({
        queryKey: deadlineKeys.byFormTypeAndYear(deadline.formType, deadline.year),
      });
    },

    onError: (error) => {
      toast.error('Failed to create deadline', {
        description: error.message || 'An unexpected error occurred',
        duration: 6000,
      });

      console.error('[useCreateDeadline] Creation failed:', {
        error: error.message,
      });
    },
  });
}

/**
 * Update an existing deadline with optimistic updates
 *
 * @example
 * const updateMutation = useUpdateDeadline();
 * updateMutation.mutate({
 *   id: 'deadline-id',
 *   data: { deadlineDate: '2024-05-01', isActive: true }
 * });
 */
export function useUpdateDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeadlineData }) =>
      updateDeadline(id, data),

    onMutate: async ({ id, data }) => {
      // Cancel all outgoing refetches for deadlines
      await queryClient.cancelQueries({ queryKey: deadlineKeys.all });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData<DeadlineDetailResponse>(
        deadlineKeys.detail(id)
      );
      const previousLists = queryClient.getQueriesData<DeadlinesListResponse>({
        queryKey: deadlineKeys.lists(),
      });

      // Optimistically update detail view
      if (previousDetail) {
        queryClient.setQueryData<DeadlineDetailResponse>(
          deadlineKeys.detail(id),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              ...data,
            };
          }
        );
      }

      // Optimistically update all list queries
      queryClient.setQueriesData<DeadlinesListResponse>(
        { queryKey: deadlineKeys.lists() },
        (old) => {
          if (!old?.deadlines) return old;

          return {
            ...old,
            deadlines: old.deadlines.map((deadline) =>
              deadline.id === id
                ? { ...deadline, ...data }
                : deadline
            ),
          };
        }
      );

      return { previousDetail, previousLists };
    },

    onError: (error, { id }, context) => {
      // Rollback all optimistic updates on error
      if (context?.previousDetail) {
        queryClient.setQueryData(deadlineKeys.detail(id), context.previousDetail);
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error('Failed to update deadline', {
        description: error.message || 'An unexpected error occurred',
        duration: 6000,
      });

      console.error('[useUpdateDeadline] Update failed:', {
        deadlineId: id,
        error: error.message,
      });
    },

    onSuccess: (response, { id }) => {
      const { deadline } = response;
      const formTypeLabel = deadline.formType.toUpperCase();

      toast.success('Deadline updated successfully', {
        description: `${formTypeLabel} deadline for ${deadline.year} has been updated.`,
      });

      // Invalidate and refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: deadlineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deadlineKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: deadlineKeys.byFormTypeAndYear(deadline.formType, deadline.year),
      });
    },
  });
}

/**
 * Delete a deadline with cache invalidation
 *
 * @example
 * const deleteMutation = useDeleteDeadline();
 * deleteMutation.mutate('deadline-id');
 */
export function useDeleteDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDeadline(id),

    onMutate: async (id) => {
      // Cancel all outgoing refetches for deadlines
      await queryClient.cancelQueries({ queryKey: deadlineKeys.all });

      // Snapshot previous values for potential rollback
      const previousLists = queryClient.getQueriesData<DeadlinesListResponse>({
        queryKey: deadlineKeys.lists(),
      });

      // Optimistically remove from all list queries
      queryClient.setQueriesData<DeadlinesListResponse>(
        { queryKey: deadlineKeys.lists() },
        (old) => {
          if (!old?.deadlines) return old;

          return {
            ...old,
            deadlines: old.deadlines.filter((deadline) => deadline.id !== id),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1),
            },
          };
        }
      );

      return { previousLists };
    },

    onError: (error, id, context) => {
      // Rollback all optimistic updates on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error('Failed to delete deadline', {
        description: error.message || 'An unexpected error occurred',
        duration: 6000,
      });

      console.error('[useDeleteDeadline] Deletion failed:', {
        deadlineId: id,
        error: error.message,
      });
    },

    onSuccess: (response, id) => {
      toast.success('Deadline deleted successfully', {
        description: 'The deadline has been deactivated.',
      });

      // Invalidate all lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: deadlineKeys.lists() });

      // Remove the detail from cache using the mutation variable id
      queryClient.removeQueries({ queryKey: deadlineKeys.detail(id) });

      // Invalidate lookup queries for this formType+year combination
      // The response now includes formType and year from the API
      if (response.formType && response.year) {
        queryClient.invalidateQueries({
          queryKey: deadlineKeys.byFormTypeAndYear(response.formType, response.year),
        });
      }

      // Also invalidate all lookup queries to be safe
      queryClient.invalidateQueries({ queryKey: deadlineKeys.lookup() });
    },
  });
}

/**
 * Toggle deadline active status (convenience hook)
 *
 * @example
 * const toggleMutation = useToggleDeadlineStatus();
 * toggleMutation.mutate({ id: 'deadline-id', isActive: false });
 */
export function useToggleDeadlineStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateDeadline(id, { isActive }),

    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: deadlineKeys.all });

      const previousLists = queryClient.getQueriesData<DeadlinesListResponse>({
        queryKey: deadlineKeys.lists(),
      });

      // Optimistically update status in all list queries
      queryClient.setQueriesData<DeadlinesListResponse>(
        { queryKey: deadlineKeys.lists() },
        (old) => {
          if (!old?.deadlines) return old;

          return {
            ...old,
            deadlines: old.deadlines.map((deadline) =>
              deadline.id === id
                ? { ...deadline, isActive }
                : deadline
            ),
          };
        }
      );

      return { previousLists };
    },

    onError: (error, _variables, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error('Failed to update deadline status', {
        description: error.message || 'An unexpected error occurred',
        duration: 6000,
      });
    },

    onSuccess: (response, { isActive }) => {
      const statusText = isActive ? 'activated' : 'deactivated';

      toast.success(`Deadline ${statusText}`, {
        description: `The deadline has been ${statusText} successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: deadlineKeys.lists() });
    },
  });
}

/**
 * Utility hook to invalidate all deadline caches
 *
 * @example
 * const invalidate = useInvalidateDeadlines();
 * invalidate(); // Call to refresh all deadline data
 */
export function useInvalidateDeadlines() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: deadlineKeys.all });
  };
}

/**
 * Utility hook to prefetch deadline details
 *
 * @example
 * const prefetch = usePrefetchDeadline();
 * prefetch('deadline-id'); // Call on hover to preload data
 */
export function usePrefetchDeadline() {
  const queryClient = useQueryClient();

  return (_id: string) => {
    queryClient.prefetchQuery({
      queryKey: deadlineKeys.detail(_id),
      queryFn: () => fetchDeadlineById(_id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
