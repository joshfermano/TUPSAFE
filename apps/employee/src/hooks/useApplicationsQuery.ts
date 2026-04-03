'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Application types
 */
export interface Position {
  id: string;
  title: string;
  code: string;
  employmentCategory: string;
  salaryGrade: string | null;
  employmentType: string;
  applicationDeadline: string;
  department: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  applicationDate: string;
  coverLetter: string | null;
  resumeUrl: string | null;
  interviewDate: string | null;
  interviewLocation: string | null;
  reviewerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  position: Position;
}

export interface ApplicationDetails extends Application {
  additionalDocuments: string[];
  pdsSubmissionId: string | null;
  interviewNotes: string | null;
  finalDecision: string | null;
  rejectionReason: string | null;
  position: Position & {
    description: string;
    qualifications: string[];
    responsibilities: string[];
    requirements: {
      education: string[];
      experience: string[];
      skills: string[];
    };
    salaryRangeMin: number | null;
    salaryRangeMax: number | null;
    numberOfOpenings: number;
  };
  statusHistory: Array<{
    id: string;
    previousStatus: string | null;
    newStatus: string;
    changedAt: string;
    notes: string | null;
    changedBy: string;
  }>;
}

export interface OpenPosition {
  id: string;
  positionTitle: string;
  positionCode: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  employmentCategory: string;
  salaryGrade: string | null;
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  employmentType: string;
  description: string;
  qualifications: string[];
  responsibilities: string[];
  requirements: {
    education: string[];
    experience: string[];
    skills: string[];
  };
  numberOfOpenings: number;
  applicationsReceived: number;
  applicationDeadline: string;
  isFeatured: boolean;
  status: string;
  postedAt: string;
  updatedAt: string;
  hasApplied: boolean;
  applicationStatus: string | null;
}

/**
 * Query key factory
 */
export const applicationsKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationsKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) =>
    [...applicationsKeys.lists(), filters] as const,
  details: () => [...applicationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationsKeys.details(), id] as const,
};

export const positionsKeys = {
  all: ['positions'] as const,
  lists: () => [...positionsKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) =>
    [...positionsKeys.lists(), filters] as const,
};

/**
 * Hook to fetch all applications for the current applicant
 *
 * @param filters - Optional filters (status)
 * @returns Query result with applications
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useApplicationsQuery({ status: 'pending' });
 * ```
 */
export function useApplicationsQuery(filters?: { status?: string }) {
  return useQuery({
    queryKey: applicationsKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) {
        params.append('status', filters.status);
      }

      const response = await fetch(`/api/applications?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const result = await response.json();
      // apiSuccess wraps in { success, data } envelope — unwrap it
      const data = result.data || result;
      return data as { applications: Application[]; total: number };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch single application details
 *
 * @param id - Application ID
 * @returns Query result with application details
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useApplicationQuery('app-123');
 * ```
 */
export function useApplicationQuery(id: string | null) {
  return useQuery({
    queryKey: applicationsKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;

      const response = await fetch(`/api/applications/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Application not found');
        }
        throw new Error('Failed to fetch application details');
      }

      const data = await response.json();
      return data as ApplicationDetails;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch open positions
 *
 * @param filters - Optional filters (department, employmentCategory, sort)
 * @returns Query result with open positions
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useOpenPositionsQuery({
 *   employmentCategory: 'faculty',
 *   sort: 'salary'
 * });
 * ```
 */
export function useOpenPositionsQuery(filters?: {
  department?: string;
  employmentCategory?: string;
  sort?: 'deadline' | 'salary' | 'posted';
}) {
  return useQuery({
    queryKey: positionsKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'open' });
      if (filters?.department) {
        params.append('orgId', filters.department);
      }
      if (filters?.employmentCategory) {
        params.append('employmentCategory', filters.employmentCategory);
      }
      if (filters?.sort) {
        params.append('sort', filters.sort);
      }

      const response = await fetch(`/api/positions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch open positions');
      }

      const result = await response.json();
      const positions = result.data as OpenPosition[];

      return {
        positions,
        featured: positions.filter((p) => p.isFeatured),
        regular: positions.filter((p) => !p.isFeatured),
        total: positions.length,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Mutation to withdraw an application (if pending)
 *
 * @example
 * ```tsx
 * const withdrawMutation = useWithdrawApplicationMutation();
 * withdrawMutation.mutate('app-123');
 * ```
 */
export function useWithdrawApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw' }),
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw application');
      }

      return response.json();
    },
    onSuccess: (_, applicationId) => {
      // Invalidate applications list
      queryClient.invalidateQueries({ queryKey: applicationsKeys.lists() });
      // Invalidate the specific application detail
      queryClient.invalidateQueries({
        queryKey: applicationsKeys.detail(applicationId),
      });
    },
  });
}

/**
 * Hook to invalidate applications cache
 */
export function useInvalidateApplications() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
  };
}

/**
 * Hook to invalidate positions cache
 */
export function useInvalidatePositions() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: positionsKeys.all });
  };
}
