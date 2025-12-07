/**
 * SALN (Statement of Assets, Liabilities, and Net Worth) Hooks
 *
 * React Query hooks for managing SALN submissions including
 * CRUD operations, submission workflow, archiving, and year-over-year comparison.
 *
 * @module hooks/useSALN
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type SALNStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'rejected';

export type FilingType = 'joint' | 'separate' | 'not_applicable';

export interface RealProperty {
  description: string;
  kind: string;
  exactLocation: string;
  assessedValue: number;
  currentFairMarketValue: number;
  acquisitionYear: number;
  acquisitionMode: string;
  acquisitionCost: number;
}

export interface PersonalProperty {
  description: string;
  acquisitionYear: number;
  acquisitionCost: number;
}

export interface Liability {
  nature: string;
  creditor: string;
  outstandingBalance: number;
}

export interface BusinessInterest {
  businessName: string;
  businessAddress: string;
  nature: string;
  dateAcquired: string;
}

export interface RelativeInGov {
  name: string;
  relationship: string;
  position: string;
  agency: string;
}

export interface SALNSubmission {
  id: string;
  userId: string;
  year: number;
  filingType: FilingType;
  status: SALNStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  realProperties: RealProperty[];
  personalProperties: PersonalProperty[];
  liabilities: Liability[];
  businessInterests: BusinessInterest[];
  relativesInGov: RelativeInGov[];
}

export interface SALNFilters {
  year?: number;
  status?: SALNStatus;
  page?: number;
  limit?: number;
}

export interface CreateSALNData {
  year: number;
  filingType: FilingType;
  realProperties?: RealProperty[];
  personalProperties?: PersonalProperty[];
  liabilities?: Liability[];
  businessInterests?: BusinessInterest[];
  relativesInGov?: RelativeInGov[];
}

export interface UpdateSALNData extends Partial<CreateSALNData> {
  status?: SALNStatus;
}

export interface SALNComparison {
  year1: number;
  year2: number;
  saln1: SALNSubmission;
  saln2: SALNSubmission;
  comparison: {
    realPropertiesAdded: RealProperty[];
    realPropertiesRemoved: RealProperty[];
    personalPropertiesAdded: PersonalProperty[];
    personalPropertiesRemoved: PersonalProperty[];
    liabilitiesAdded: Liability[];
    liabilitiesRemoved: Liability[];
    totalAssetsChange: number;
    totalLiabilitiesChange: number;
    netWorthChange: number;
  };
}

// ============================================================================
// Query Key Factory
// ============================================================================

export const salnKeys = {
  all: ['saln'] as const,
  lists: () => [...salnKeys.all, 'list'] as const,
  list: (filters?: SALNFilters) => [...salnKeys.lists(), filters] as const,
  details: () => [...salnKeys.all, 'detail'] as const,
  detail: (id: string) => [...salnKeys.details(), id] as const,
  archived: () => [...salnKeys.all, 'archived'] as const,
  comparisons: () => [...salnKeys.all, 'comparison'] as const,
  comparison: (year1: number, year2: number) =>
    [...salnKeys.comparisons(), year1, year2] as const,
};

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch all SALN submissions for the current user
 */
async function fetchSALNSubmissions(filters?: SALNFilters) {
  const params = new URLSearchParams();

  if (filters?.year) {
    params.set('year', String(filters.year));
  }
  if (filters?.status) {
    params.set('status', filters.status);
  }
  if (filters?.page) {
    params.set('page', String(filters.page));
  }
  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }

  const response = await fetch(`/api/saln?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch SALN submissions');
  }

  const result = await response.json();
  return result;
}

/**
 * Fetch a single SALN submission by ID
 */
async function fetchSALNSubmission(id: string) {
  const response = await fetch(`/api/saln/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch SALN submission');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Fetch archived SALN submissions
 */
async function fetchArchivedSALN() {
  const response = await fetch('/api/saln/archive', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch archived SALN');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Compare two SALN submissions by year
 */
async function compareSALN(year1: number, year2: number) {
  const params = new URLSearchParams({
    year1: String(year1),
    year2: String(year2),
  });

  const response = await fetch(`/api/saln/compare?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to compare SALN submissions');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create a new SALN submission
 */
async function createSALN(data: CreateSALNData) {
  const response = await fetch('/api/saln', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create SALN');
  }

  return response.json();
}

/**
 * Update an existing SALN submission
 */
async function updateSALN(id: string, data: UpdateSALNData) {
  const response = await fetch(`/api/saln/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update SALN');
  }

  return response.json();
}

/**
 * Submit SALN for approval
 */
async function submitSALN(id: string) {
  const response = await fetch(`/api/saln/${id}/submit`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit SALN');
  }

  return response.json();
}

/**
 * Archive a SALN submission
 */
async function archiveSALN(id: string) {
  const response = await fetch(`/api/saln/${id}/archive`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to archive SALN');
  }

  return response.json();
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch all SALN submissions for the current user
 *
 * Supports filtering by year, status, and pagination.
 * Data is cached for 2 minutes (dynamic content).
 *
 * @param filters - Optional filters (year, status, page, limit)
 * @returns Query result with SALN submissions array
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSALNSubmissions({ year: 2024 });
 * ```
 */
export function useSALNSubmissions(filters?: SALNFilters) {
  return useQuery({
    queryKey: salnKeys.list(filters),
    queryFn: () => fetchSALNSubmissions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch a single SALN submission by ID
 *
 * Returns detailed SALN data including all sections.
 * Only fetches when id is provided.
 *
 * @param id - SALN submission UUID
 * @returns Query result with SALN details
 *
 * @example
 * ```tsx
 * const { data: saln, isLoading } = useSALNSubmission(salnId);
 * ```
 */
export function useSALNSubmission(id: string | null) {
  return useQuery({
    queryKey: salnKeys.detail(id || ''),
    queryFn: () => fetchSALNSubmission(id || ''),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch archived SALN submissions
 *
 * Returns all archived SALN records for the current user.
 *
 * @returns Query result with archived SALN array
 *
 * @example
 * ```tsx
 * const { data: archived, isLoading } = useArchivedSALN();
 * ```
 */
export function useArchivedSALN() {
  return useQuery({
    queryKey: salnKeys.archived(),
    queryFn: fetchArchivedSALN,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook to compare two SALN submissions by year
 *
 * Provides year-over-year comparison of assets, liabilities, and net worth.
 * Useful for compliance checks and trend analysis.
 *
 * @param year1 - First year to compare
 * @param year2 - Second year to compare
 * @returns Query result with comparison data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCompareSALN(2023, 2024);
 * ```
 */
export function useCompareSALN(year1: number | null, year2: number | null) {
  return useQuery({
    queryKey: salnKeys.comparison(year1 || 0, year2 || 0),
    queryFn: () => compareSALN(year1!, year2!),
    enabled: !!year1 && !!year2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook to create a new SALN submission
 *
 * Validates year uniqueness before creation.
 * Automatically invalidates the SALN list cache on success.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const createMutation = useCreateSALN();
 * createMutation.mutate(salnData);
 * ```
 */
export function useCreateSALN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSALN,
    onSuccess: (data) => {
      // Invalidate SALN lists to trigger refetch
      queryClient.invalidateQueries({ queryKey: salnKeys.lists() });

      toast.success('SALN created successfully', {
        description: `Your SALN for year ${data.data.year} has been created.`,
      });

      return data;
    },
    onError: (error: Error) => {
      toast.error('Failed to create SALN', {
        description:
          error.message || 'An error occurred while creating your SALN.',
      });
    },
  });
}

/**
 * Hook to update an existing SALN submission
 *
 * Supports optimistic updates for immediate UI feedback.
 * Automatically invalidates relevant cache on success.
 *
 * @param id - SALN submission UUID
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateSALN(salnId);
 * updateMutation.mutate(updatedData);
 * ```
 */
export function useUpdateSALN(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSALNData) => updateSALN(id, data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: salnKeys.detail(id) });

      // Snapshot the previous value
      const previousSALN = queryClient.getQueryData(salnKeys.detail(id));

      // Optimistically update to the new value
      if (previousSALN) {
        queryClient.setQueryData(salnKeys.detail(id), {
          ...previousSALN,
          ...newData,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousSALN };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousSALN) {
        queryClient.setQueryData(salnKeys.detail(id), context.previousSALN);
      }

      toast.error('Failed to update SALN', {
        description:
          error.message || 'An error occurred while updating your SALN.',
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: salnKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: salnKeys.lists() });

      toast.success('SALN updated successfully', {
        description: 'Your changes have been saved.',
      });
    },
  });
}

/**
 * Hook to submit SALN for approval
 *
 * Changes SALN status from 'draft' to 'submitted'.
 * Invalidates dashboard stats and comparisons after submission.
 *
 * @param id - SALN submission UUID
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const submitMutation = useSubmitSALN(salnId);
 * submitMutation.mutate();
 * ```
 */
export function useSubmitSALN(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitSALN(id),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: salnKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: salnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salnKeys.comparisons() });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      toast.success('SALN submitted successfully', {
        description:
          'Your SALN has been submitted for review. You will be notified once it has been reviewed.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to submit SALN', {
        description:
          error.message || 'An error occurred while submitting your SALN.',
      });
    },
  });
}

/**
 * Hook to archive a SALN submission
 *
 * Moves SALN to archived state.
 * Invalidates both regular and archived lists.
 *
 * @param id - SALN submission UUID
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const archiveMutation = useArchiveSALN(salnId);
 * archiveMutation.mutate();
 * ```
 */
export function useArchiveSALN(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => archiveSALN(id),
    onSuccess: () => {
      // Invalidate all SALN queries
      queryClient.invalidateQueries({ queryKey: salnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salnKeys.archived() });
      queryClient.invalidateQueries({ queryKey: salnKeys.detail(id) });

      toast.success('SALN archived successfully', {
        description: 'Your SALN has been moved to the archive.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to archive SALN', {
        description:
          error.message || 'An error occurred while archiving your SALN.',
      });
    },
  });
}

/**
 * Hook to get the latest SALN submission
 *
 * Returns the most recent SALN submission for the current year.
 * If no submission exists for the current year, returns the latest from any year.
 * Useful for year-over-year comparisons and dashboard displays.
 *
 * @returns Query with latest SALN submission or undefined
 *
 * @example
 * ```tsx
 * const { data: latestSALN, isLoading } = useLatestSALN();
 * ```
 */
export function useLatestSALN() {
  const currentYear = new Date().getFullYear();

  return useQuery({
    queryKey: [...salnKeys.all, 'latest', currentYear],
    queryFn: async () => {
      // Try to get current year's SALN first
      const currentYearResponse = await fetch(
        `/api/saln?year=${currentYear}&limit=1`,
        { credentials: 'include' }
      );

      if (currentYearResponse.ok) {
        const currentYearResult = await currentYearResponse.json();
        if (currentYearResult.data && currentYearResult.data.length > 0) {
          return currentYearResult.data[0];
        }
      }

      // If no current year SALN, get the latest from any year
      const latestResponse = await fetch('/api/saln?limit=1', {
        credentials: 'include',
      });

      if (!latestResponse.ok) {
        const error = await latestResponse.json();
        throw new Error(error.error || 'Failed to fetch latest SALN');
      }

      const latestResult = await latestResponse.json();
      return latestResult.data && latestResult.data.length > 0
        ? latestResult.data[0]
        : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: true,
  });
}
