/**
 * PDS (Personal Data Sheet) Hooks
 *
 * React Query hooks for managing PDS submissions including
 * CRUD operations, submission workflow, and archiving.
 *
 * @module hooks/usePDS
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type PDSStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'rejected';

export interface PDSSubmission {
  id: string;
  userId: string;
  status: PDSStatus;
  version: number;
  year: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PDSFilters {
  status?: PDSStatus;
  page?: number;
  limit?: number;
}

export interface CreatePDSData {
  version?: number;
  personalInfo?: Record<string, any>;
  familyBackground?: Record<string, any>;
  children?: Array<Record<string, any>>;
  education?: Array<Record<string, any>>;
  civilService?: Array<Record<string, any>>;
  workExperience?: Array<Record<string, any>>;
  voluntaryWork?: Array<Record<string, any>>;
  training?: Array<Record<string, any>>;
  otherInfo?: Record<string, any>;
}

export interface UpdatePDSData extends CreatePDSData {
  status?: PDSStatus;
}

// ============================================================================
// Query Key Factory
// ============================================================================

export const pdsKeys = {
  all: ['pds'] as const,
  lists: () => [...pdsKeys.all, 'list'] as const,
  list: (filters?: PDSFilters) => [...pdsKeys.lists(), filters] as const,
  details: () => [...pdsKeys.all, 'detail'] as const,
  detail: (id: string) => [...pdsKeys.details(), id] as const,
  archived: () => [...pdsKeys.all, 'archived'] as const,
};

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch all PDS submissions for the current user
 */
async function fetchPDSSubmissions(filters?: PDSFilters) {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set('status', filters.status);
  }
  if (filters?.page) {
    params.set('page', String(filters.page));
  }
  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }

  const response = await fetch(`/api/pds?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch PDS submissions');
  }

  const result = await response.json();
  return result;
}

/**
 * Fetch a single PDS submission by ID
 */
async function fetchPDSSubmission(id: string) {
  const response = await fetch(`/api/pds/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch PDS submission');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Fetch archived PDS submissions
 */
async function fetchArchivedPDS() {
  const response = await fetch('/api/pds/archive', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch archived PDS');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a new PDS submission
 */
async function createPDS(data: CreatePDSData) {
  const response = await fetch('/api/pds', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create PDS');
  }

  return response.json();
}

/**
 * Update an existing PDS submission
 */
async function updatePDS(id: string, data: UpdatePDSData) {
  const response = await fetch(`/api/pds/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update PDS');
  }

  return response.json();
}

/**
 * Submit PDS for approval
 */
async function submitPDS(id: string) {
  const response = await fetch(`/api/pds/${id}/submit`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit PDS');
  }

  return response.json();
}

/**
 * Archive a PDS submission
 */
async function archivePDS(id: string) {
  const response = await fetch(`/api/pds/${id}/archive`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to archive PDS');
  }

  return response.json();
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch all PDS submissions for the current user
 *
 * Supports filtering by status and pagination.
 * Data is cached for 2 minutes (dynamic content).
 *
 * @param filters - Optional filters (status, page, limit)
 * @returns Query result with PDS submissions array
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePDSSubmissions({ status: 'draft' });
 * ```
 */
export function usePDSSubmissions(filters?: PDSFilters) {
  return useQuery({
    queryKey: pdsKeys.list(filters),
    queryFn: () => fetchPDSSubmissions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch a single PDS submission by ID
 *
 * Returns detailed PDS data including all sections.
 * Only fetches when id is provided.
 *
 * @param id - PDS submission UUID
 * @returns Query result with PDS details
 *
 * @example
 * ```tsx
 * const { data: pds, isLoading } = usePDSSubmission(pdsId);
 * ```
 */
export function usePDSSubmission(id: string | null) {
  return useQuery({
    queryKey: pdsKeys.detail(id || ''),
    queryFn: () => fetchPDSSubmission(id || ''),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch archived PDS submissions
 *
 * Returns all archived PDS records for the current user.
 *
 * @returns Query result with archived PDS array
 *
 * @example
 * ```tsx
 * const { data: archived, isLoading } = useArchivedPDS();
 * ```
 */
export function useArchivedPDS() {
  return useQuery({
    queryKey: pdsKeys.archived(),
    queryFn: fetchArchivedPDS,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Fetch the user's latest PDS submission
 */
async function fetchLatestPDS() {
  const response = await fetch('/api/pds/latest', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch latest PDS');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Hook to fetch the user's latest PDS submission
 *
 * Returns minimal data about the most recent PDS (status, year, approval date).
 * Used by components like DeadlineSection to determine visibility.
 *
 * @returns Query result with latest PDS info or null
 *
 * @example
 * ```tsx
 * const { data: latest, isLoading } = useLatestPDS();
 * if (latest?.status === 'approved' && latest?.year === 2025) {
 *   // Hide deadline for this year
 * }
 * ```
 */
export function useLatestPDS() {
  return useQuery({
    queryKey: [...pdsKeys.all, 'latest'] as const,
    queryFn: fetchLatestPDS,
    staleTime: 2 * 60 * 1000, // 2 minutes (dynamic content)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to create a new PDS submission
 *
 * Automatically invalidates the PDS list cache on success.
 * Shows success/error toast notifications.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const createMutation = useCreatePDS();
 * createMutation.mutate(pdsData);
 * ```
 */
export function useCreatePDS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPDS,
    onSuccess: (data) => {
      // Invalidate PDS lists to trigger refetch
      queryClient.invalidateQueries({ queryKey: pdsKeys.lists() });

      toast.success('PDS created successfully', {
        description: 'Your Personal Data Sheet has been created.',
      });

      return data;
    },
    onError: (error: Error) => {
      toast.error('Failed to create PDS', {
        description: error.message || 'An error occurred while creating your PDS.',
      });
    },
  });
}

/**
 * Hook to update an existing PDS submission
 *
 * Supports optimistic updates for immediate UI feedback.
 * Automatically invalidates relevant cache on success.
 *
 * @param id - PDS submission UUID
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdatePDS(pdsId);
 * updateMutation.mutate(updatedData);
 * ```
 */
export function useUpdatePDS(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePDSData) => updatePDS(id, data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: pdsKeys.detail(id) });

      // Snapshot the previous value
      const previousPDS = queryClient.getQueryData(pdsKeys.detail(id));

      // Optimistically update to the new value
      if (previousPDS) {
        queryClient.setQueryData(pdsKeys.detail(id), {
          ...previousPDS,
          ...newData,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousPDS };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousPDS) {
        queryClient.setQueryData(pdsKeys.detail(id), context.previousPDS);
      }

      toast.error('Failed to update PDS', {
        description: error.message || 'An error occurred while updating your PDS.',
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: pdsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pdsKeys.lists() });

      toast.success('PDS updated successfully', {
        description: 'Your changes have been saved.',
      });
    },
  });
}

/**
 * Hook to submit PDS for approval
 *
 * Changes PDS status from 'draft' to 'submitted'.
 * Invalidates dashboard stats after submission.
 *
 * @param id - PDS submission UUID
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const submitMutation = useSubmitPDS(pdsId);
 * submitMutation.mutate();
 * ```
 */
export function useSubmitPDS(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitPDS(id),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: pdsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: pdsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      toast.success('PDS submitted successfully', {
        description:
          'Your PDS has been submitted for review. You will be notified once it has been reviewed.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to submit PDS', {
        description: error.message || 'An error occurred while submitting your PDS.',
      });
    },
  });
}

/**
 * Hook to archive a PDS submission
 *
 * Moves PDS to archived state.
 * Invalidates both regular and archived lists.
 *
 * @param id - PDS submission UUID
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const archiveMutation = useArchivePDS(pdsId);
 * archiveMutation.mutate();
 * ```
 */
export function useArchivePDS(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => archivePDS(id),
    onSuccess: () => {
      // Invalidate all PDS queries
      queryClient.invalidateQueries({ queryKey: pdsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pdsKeys.archived() });
      queryClient.invalidateQueries({ queryKey: pdsKeys.detail(id) });

      toast.success('PDS archived successfully', {
        description: 'Your PDS has been moved to the archive.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to archive PDS', {
        description: error.message || 'An error occurred while archiving your PDS.',
      });
    },
  });
}
