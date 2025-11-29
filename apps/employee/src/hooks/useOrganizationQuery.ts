/**
 * React Query Hooks for Organization Data
 * Provides type-safe hooks for fetching departments and positions
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  Department,
  DepartmentsResponse,
  Position,
  PositionsResponse,
  DepartmentsQueryParams,
  PositionsQueryParams,
  ApiErrorResponse,
} from '../types/api';
import { buildQueryString, isApiError } from '../types/api';

// ============================================================================
// Departments Hooks
// ============================================================================

/**
 * Fetch all colleges (academic departments without parent)
 */
export function useCollegesQuery() {
  return useQuery<Department[], Error>({
    queryKey: ['departments', 'colleges'],
    queryFn: async () => {
      const response = await fetch('/api/departments?type=colleges');

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || 'Failed to fetch colleges');
      }

      const data: DepartmentsResponse = await response.json();
      return data.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour - matches API cache
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Fetch all administrative offices
 */
export function useOfficesQuery() {
  return useQuery<Department[], Error>({
    queryKey: ['departments', 'offices'],
    queryFn: async () => {
      const response = await fetch('/api/departments?type=offices');

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || 'Failed to fetch offices');
      }

      const data: DepartmentsResponse = await response.json();
      return data.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Fetch departments under a specific college
 */
export function useDepartmentsByCollegeQuery(collegeId: string | null) {
  return useQuery<Department[], Error>({
    queryKey: ['departments', 'by-college', collegeId],
    queryFn: async () => {
      if (!collegeId) {
        return [];
      }

      const response = await fetch(`/api/departments?collegeId=${collegeId}`);

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || 'Failed to fetch departments');
      }

      const data: DepartmentsResponse = await response.json();
      return data.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!collegeId, // Only run query if collegeId is provided
  });
}

/**
 * Fetch all active departments
 */
export function useDepartmentsQuery(params?: DepartmentsQueryParams) {
  const queryString = params
    ? buildQueryString(params as Record<string, string>)
    : '';

  return useQuery<Department[], Error>({
    queryKey: ['departments', params],
    queryFn: async () => {
      const response = await fetch(`/api/departments${queryString}`);

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || 'Failed to fetch departments');
      }

      const data: DepartmentsResponse = await response.json();
      return data.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// ============================================================================
// Positions Hooks
// ============================================================================

/**
 * Fetch all open positions
 */
export function useOpenPositionsQuery() {
  return useQuery<Position[], Error>({
    queryKey: ['positions', 'open'],
    queryFn: async () => {
      const response = await fetch('/api/positions?status=open');

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || 'Failed to fetch positions');
      }

      const data: PositionsResponse = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - shorter due to deadline expiration
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Fetch featured open positions
 */
export function useFeaturedPositionsQuery() {
  return useQuery<Position[], Error>({
    queryKey: ['positions', 'featured'],
    queryFn: async () => {
      const response = await fetch('/api/positions?status=open');

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || 'Failed to fetch featured positions');
      }

      const data: PositionsResponse = await response.json();
      // Filter for featured positions
      return data.data.filter((position) => position.isFeatured);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Fetch positions by department/office
 */
export function usePositionsByDepartmentQuery(departmentId: string | null) {
  return useQuery<Position[], Error>({
    queryKey: ['positions', 'by-department', departmentId],
    queryFn: async () => {
      if (!departmentId) {
        return [];
      }

      const response = await fetch(
        `/api/positions?status=open&orgId=${departmentId}`
      );

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || 'Failed to fetch positions');
      }

      const data: PositionsResponse = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!departmentId, // Only run query if departmentId is provided
  });
}

/**
 * Fetch positions with custom filters
 */
export function usePositionsQuery(params?: PositionsQueryParams) {
  const queryString = params
    ? buildQueryString(params as Record<string, string>)
    : '';

  return useQuery<Position[], Error>({
    queryKey: ['positions', params],
    queryFn: async () => {
      const response = await fetch(`/api/positions${queryString}`);

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || 'Failed to fetch positions');
      }

      const data: PositionsResponse = await response.json();
      return data.data;
    },
    staleTime: params?.status === 'open' ? 5 * 60 * 1000 : 60 * 60 * 1000, // 5 min for open, 1 hour for others
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Fetch a single position by ID
 */
export function usePositionQuery(positionId: string | null) {
  return useQuery<Position | null, Error>({
    queryKey: ['position', positionId],
    queryFn: async () => {
      if (!positionId) {
        return null;
      }

      // Fetch all open positions and find the matching one
      // In a production app, you'd want a dedicated endpoint for this
      const response = await fetch('/api/positions?status=open');

      if (!response.ok) {
        const error: ApiErrorResponse = await response.json();
        throw new Error(error.error || 'Failed to fetch position');
      }

      const data: PositionsResponse = await response.json();
      const position = data.data.find((p) => p.id === positionId);

      if (!position) {
        throw new Error('Position not found');
      }

      return position;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!positionId,
  });
}
