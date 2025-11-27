'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  OpenPositionListResponse,
  OpenPositionDetail,
  JobApplicationListResponse,
  JobApplicationDetail,
  CreateOpenPositionData,
  UpdateOpenPositionData,
  UpdateApplicationStatusData,
  PositionStatus,
  ApplicationStatus,
} from '@tupsafe/types';

/**
 * Jobs and applications query key factory
 */
export const jobsKeys = {
  all: ['jobs'] as const,
  positions: () => [...jobsKeys.all, 'positions'] as const,
  positionsList: (filters: OpenPositionsFilters) =>
    [...jobsKeys.positions(), 'list', filters] as const,
  positionDetail: (id: string) =>
    [...jobsKeys.positions(), 'detail', id] as const,
  applications: () => [...jobsKeys.all, 'applications'] as const,
  applicationsList: (filters: ApplicationsFilters) =>
    [...jobsKeys.applications(), 'list', filters] as const,
  applicationDetail: (id: string) =>
    [...jobsKeys.applications(), 'detail', id] as const,
  positionApplications: (positionId: string, filters: PositionApplicationsFilters) =>
    [...jobsKeys.positions(), positionId, 'applications', filters] as const,
};

/**
 * Filters for open positions queries
 */
export interface OpenPositionsFilters {
  page?: number;
  limit?: number;
  status?: PositionStatus | 'all';
  departmentId?: string;
  employmentCategory?: string;
  search?: string;
  isFeatured?: boolean;
  sortBy?: 'postedAt' | 'applicationDeadline' | 'positionTitle' | 'applicationsReceived';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filters for applications queries
 */
export interface ApplicationsFilters {
  page?: number;
  limit?: number;
  status?: ApplicationStatus | 'all';
  positionId?: string;
  departmentId?: string;
  search?: string;
  sortBy?: 'applicationDate' | 'applicantName' | 'status' | 'reviewedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filters for position-specific applications
 */
export interface PositionApplicationsFilters {
  page?: number;
  limit?: number;
  status?: ApplicationStatus | 'all';
}

/**
 * React Query hook for managing open positions
 *
 * Provides listing, filtering, and CRUD operations for job positions.
 *
 * @param filters - Optional filters for the positions query
 * @returns Query result with positions and mutation methods
 *
 * @example
 * ```tsx
 * const {
 *   positions,
 *   pagination,
 *   isLoading,
 *   createPosition,
 *   updatePosition,
 *   deletePosition,
 * } = useOpenPositions({ status: 'open' });
 *
 * // Create a new position
 * await createPosition(positionData);
 * ```
 */
export function useOpenPositions(filters: OpenPositionsFilters = {}) {
  const queryClient = useQueryClient();

  // Main query for positions list
  const query = useQuery<OpenPositionListResponse, Error>({
    queryKey: jobsKeys.positionsList(filters),
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.departmentId) {
        params.append('departmentId', filters.departmentId);
      }
      if (filters.employmentCategory && filters.employmentCategory !== 'all') {
        params.append('employmentCategory', filters.employmentCategory);
      }
      if (filters.search) params.append('search', filters.search);
      if (filters.isFeatured !== undefined) {
        params.append('isFeatured', filters.isFeatured.toString());
      }
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/jobs?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch positions: ${response.statusText}`
        );
      }

      const data: OpenPositionListResponse = await response.json();
      return data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Mutation to create a new position
   */
  const createPositionMutation = useMutation({
    mutationFn: async (data: CreateOpenPositionData) => {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to create position: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      // Invalidate positions list to refetch
      queryClient.invalidateQueries({ queryKey: jobsKeys.positions() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  /**
   * Mutation to update a position
   */
  const updatePositionMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOpenPositionData;
    }) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to update position: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobsKeys.positions() });

      // Snapshot previous value
      const previousPositions = queryClient.getQueryData<OpenPositionListResponse>(
        jobsKeys.positionsList(filters)
      );

      // Optimistically update the position in the list
      queryClient.setQueryData<OpenPositionListResponse>(
        jobsKeys.positionsList(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            positions: old.positions.map((position) =>
              position.id === id
                ? { ...position, ...data }
                : position
            ),
          };
        }
      );

      return { previousPositions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousPositions) {
        queryClient.setQueryData(
          jobsKeys.positionsList(filters),
          context.previousPositions
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: jobsKeys.positions() });
      queryClient.invalidateQueries({
        queryKey: jobsKeys.positionDetail(variables.id)
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  /**
   * Mutation to delete a position
   */
  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to delete position: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobsKeys.positions() });

      // Snapshot previous value
      const previousPositions = queryClient.getQueryData<OpenPositionListResponse>(
        jobsKeys.positionsList(filters)
      );

      // Optimistically remove from list
      queryClient.setQueryData<OpenPositionListResponse>(
        jobsKeys.positionsList(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            positions: old.positions.filter((position) => position.id !== id),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        }
      );

      return { previousPositions };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousPositions) {
        queryClient.setQueryData(
          jobsKeys.positionsList(filters),
          context.previousPositions
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: jobsKeys.positions() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    ...query,
    positions: query.data?.positions ?? [],
    pagination: query.data?.pagination,
    createPosition: createPositionMutation.mutate,
    createPositionAsync: createPositionMutation.mutateAsync,
    isCreating: createPositionMutation.isPending,
    createError: createPositionMutation.error,
    updatePosition: updatePositionMutation.mutate,
    updatePositionAsync: updatePositionMutation.mutateAsync,
    isUpdating: updatePositionMutation.isPending,
    updateError: updatePositionMutation.error,
    deletePosition: deletePositionMutation.mutate,
    deletePositionAsync: deletePositionMutation.mutateAsync,
    isDeleting: deletePositionMutation.isPending,
    deleteError: deletePositionMutation.error,
  };
}

/**
 * React Query hook for fetching a single position's details
 *
 * @param id - Position ID
 * @returns Query result with position details
 *
 * @example
 * ```tsx
 * const { position, isLoading } = useOpenPositionDetails(positionId);
 * ```
 */
export function useOpenPositionDetails(id: string | null) {
  return useQuery<OpenPositionDetail | null, Error>({
    queryKey: jobsKeys.positionDetail(id || ''),
    queryFn: async () => {
      if (!id) return null;

      const response = await fetch(`/api/jobs/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch position: ${response.statusText}`
        );
      }

      const data: OpenPositionDetail = await response.json();
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * React Query hook for fetching applications for a specific position
 *
 * @param positionId - Position ID
 * @param filters - Optional filters for applications
 * @returns Query result with applications list
 *
 * @example
 * ```tsx
 * const { applications, pagination, isLoading } = usePositionApplications(
 *   positionId,
 *   { status: 'pending' }
 * );
 * ```
 */
export function usePositionApplications(
  positionId: string | null,
  filters: PositionApplicationsFilters = {}
) {
  return useQuery<JobApplicationListResponse | null, Error>({
    queryKey: jobsKeys.positionApplications(positionId || '', filters),
    queryFn: async () => {
      if (!positionId) return null;

      // Build query parameters
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await fetch(
        `/api/jobs/${positionId}/applications?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch applications: ${response.statusText}`
        );
      }

      const data: JobApplicationListResponse = await response.json();
      return data;
    },
    enabled: !!positionId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2,
  });
}

/**
 * React Query hook for fetching application details
 *
 * @param id - Application ID
 * @returns Query result with application details
 *
 * @example
 * ```tsx
 * const { application, applicant, position, statusHistory, isLoading } =
 *   useApplicationDetails(applicationId);
 * ```
 */
export function useApplicationDetails(id: string | null) {
  return useQuery<JobApplicationDetail | null, Error>({
    queryKey: jobsKeys.applicationDetail(id || ''),
    queryFn: async () => {
      if (!id) return null;

      const response = await fetch(`/api/applications/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch application: ${response.statusText}`
        );
      }

      const data: JobApplicationDetail = await response.json();
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * React Query hook for managing job applications
 *
 * Provides listing and status update operations for applications.
 *
 * @param filters - Optional filters for the applications query
 * @returns Query result with applications and mutation methods
 *
 * @example
 * ```tsx
 * const {
 *   applications,
 *   pagination,
 *   isLoading,
 *   updateApplicationStatus,
 * } = useJobApplications({ status: 'pending' });
 *
 * // Update application status
 * await updateApplicationStatus({
 *   applicationId: 'app-123',
 *   status: 'shortlisted',
 *   notes: 'Candidate meets requirements',
 * });
 * ```
 */
export function useJobApplications(filters: ApplicationsFilters = {}) {
  const queryClient = useQueryClient();

  // Main query for applications list
  const query = useQuery<JobApplicationListResponse, Error>({
    queryKey: jobsKeys.applicationsList(filters),
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.positionId) {
        params.append('positionId', filters.positionId);
      }
      if (filters.departmentId) {
        params.append('departmentId', filters.departmentId);
      }
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/applications?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch applications: ${response.statusText}`
        );
      }

      const data: JobApplicationListResponse = await response.json();
      return data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Mutation to update application status
   */
  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({
      applicationId,
      data,
    }: {
      applicationId: string;
      data: UpdateApplicationStatusData;
    }) => {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to update application status: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result;
    },
    onMutate: async ({ applicationId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobsKeys.applications() });

      // Snapshot previous value
      const previousApplications = queryClient.getQueryData<JobApplicationListResponse>(
        jobsKeys.applicationsList(filters)
      );

      // Optimistically update status
      queryClient.setQueryData<JobApplicationListResponse>(
        jobsKeys.applicationsList(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            applications: old.applications.map((app) =>
              app.id === applicationId
                ? {
                    ...app,
                    status: data.status,
                    reviewedAt: new Date(),
                    interviewDate: data.interviewDate || app.interviewDate,
                  }
                : app
            ),
          };
        }
      );

      return { previousApplications };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousApplications) {
        queryClient.setQueryData(
          jobsKeys.applicationsList(filters),
          context.previousApplications
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: jobsKeys.applications() });
      queryClient.invalidateQueries({
        queryKey: jobsKeys.applicationDetail(variables.applicationId)
      });
      // Also invalidate position details to update application stats
      queryClient.invalidateQueries({ queryKey: jobsKeys.positions() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    ...query,
    applications: query.data?.applications ?? [],
    pagination: query.data?.pagination,
    updateApplicationStatus: updateApplicationStatusMutation.mutate,
    updateApplicationStatusAsync: updateApplicationStatusMutation.mutateAsync,
    isUpdatingStatus: updateApplicationStatusMutation.isPending,
    updateStatusError: updateApplicationStatusMutation.error,
  };
}

/**
 * Hook to invalidate jobs-related cache
 */
export function useInvalidateJobs() {
  const queryClient = useQueryClient();

  return {
    invalidatePositions: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.positions() });
    },
    invalidateApplications: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.applications() });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: jobsKeys.all });
    },
  };
}
