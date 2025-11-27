'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Position detail type
 */
export interface PositionDetail {
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
  hasApplied: boolean;
  applicationStatus: string | null;
  daysUntilDeadline: number;
}

/**
 * Application submission data
 */
export interface ApplicationSubmission {
  positionId: string;
  coverLetter: string;
  resumeUrl?: string;
  pdsSubmissionId?: string;
  additionalDocuments?: string[];
}

/**
 * Query key factory
 */
export const positionsKeys = {
  all: ['positions'] as const,
  lists: () => [...positionsKeys.all, 'list'] as const,
  list: (filters?: Record<string, string>) =>
    [...positionsKeys.lists(), filters] as const,
  details: () => [...positionsKeys.all, 'detail'] as const,
  detail: (id: string) => [...positionsKeys.details(), id] as const,
};

/**
 * Hook to fetch single position details
 *
 * @param id - Position ID
 * @returns Query result with position details
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePositionQuery('position-123');
 * ```
 */
export function usePositionQuery(id: string | null) {
  return useQuery({
    queryKey: positionsKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;

      const response = await fetch(`/api/positions/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Position not found');
        }
        throw new Error('Failed to fetch position details');
      }

      const result = await response.json();
      return result.data as PositionDetail;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Mutation to apply for a position
 *
 * @example
 * ```tsx
 * const applyMutation = useApplyForPositionMutation();
 *
 * const handleApply = async () => {
 *   await applyMutation.mutateAsync({
 *     positionId: 'pos-123',
 *     coverLetter: 'I am interested...',
 *     resumeUrl: 'https://example.com/resume.pdf'
 *   });
 * };
 * ```
 */
export function useApplyForPositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApplicationSubmission) => {
      const response = await fetch(`/api/positions/${data.positionId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter: data.coverLetter,
          resumeUrl: data.resumeUrl,
          pdsSubmissionId: data.pdsSubmissionId,
          additionalDocuments: data.additionalDocuments,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit application');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate position details to update "hasApplied" status
      queryClient.invalidateQueries({
        queryKey: positionsKeys.detail(variables.positionId),
      });

      // Invalidate open positions list
      queryClient.invalidateQueries({
        queryKey: positionsKeys.lists(),
      });

      // Invalidate applications list
      queryClient.invalidateQueries({
        queryKey: ['applications'],
      });
    },
  });
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
