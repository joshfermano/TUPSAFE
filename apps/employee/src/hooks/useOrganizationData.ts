/**
 * Organization Data Hooks
 *
 * React Query hooks for fetching colleges, departments, offices, and positions
 * from the database with proper caching, loading states, and error handling.
 *
 * @module hooks/useOrganizationData
 */

import { useQuery } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

export interface College {
  id: string;
  name: string;
  code: string;
  officeType: 'academic';
  parentCollegeId: null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  officeType: 'academic';
  parentCollegeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Office {
  id: string;
  name: string;
  code: string;
  officeType: 'administrative';
  parentCollegeId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  title: string;
  gradeLevel: number | null;
  departmentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Query Key Factories
// ============================================================================

export const organizationKeys = {
  all: ['organization'] as const,
  colleges: () => [...organizationKeys.all, 'colleges'] as const,
  departments: () => [...organizationKeys.all, 'departments'] as const,
  departmentsByCollege: (collegeId: string) =>
    [...organizationKeys.departments(), 'byCollege', collegeId] as const,
  department: (id: string) =>
    [...organizationKeys.departments(), 'detail', id] as const,
  offices: () => [...organizationKeys.all, 'offices'] as const,
  positions: () => [...organizationKeys.all, 'positions'] as const,
  positionsByDepartment: (departmentId: string) =>
    [...organizationKeys.positions(), 'byDepartment', departmentId] as const,
};

// ============================================================================
// API Response Types
// ============================================================================

interface CollegesResponse {
  success: boolean;
  data: College[];
  meta: {
    total: number;
    cached: boolean;
  };
}

interface DepartmentsResponse {
  success: boolean;
  data: Department[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta: {
    type: string;
    collegeId: string | null;
    search: string | null;
  };
}

interface PositionsResponse {
  success: boolean;
  data: Position[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta: {
    departmentId: string | null;
  };
}

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch all colleges from the API
 */
async function fetchColleges(): Promise<College[]> {
  const response = await fetch('/api/colleges', {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch colleges');
  }

  const data: CollegesResponse = await response.json();
  return data.data;
}

/**
 * Fetch departments by college ID
 */
async function fetchDepartmentsByCollege(
  collegeId: string
): Promise<Department[]> {
  const params = new URLSearchParams({
    collegeId,
  });

  const response = await fetch(`/api/departments?${params.toString()}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch departments');
  }

  const data: DepartmentsResponse = await response.json();
  return data.data;
}

/**
 * Fetch a single department by ID
 */
async function fetchDepartment(id: string): Promise<Department | Office> {
  const response = await fetch(`/api/departments/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch department');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch all administrative offices
 */
async function fetchOffices(): Promise<Office[]> {
  const params = new URLSearchParams({
    type: 'administrative',
  });

  const response = await fetch(`/api/departments?${params.toString()}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch offices');
  }

  const data: DepartmentsResponse = await response.json();
  // Return administrative offices (API returns departments with administrative officeType)
  return data.data as unknown as Office[];
}

/**
 * Fetch positions by department ID
 */
async function fetchPositionsByDepartment(
  departmentId: string
): Promise<Position[]> {
  const params = new URLSearchParams({
    departmentId,
  });

  const response = await fetch(`/api/positions?${params.toString()}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch positions');
  }

  const data: PositionsResponse = await response.json();
  return data.data;
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch all colleges (academic offices without parent)
 *
 * Colleges are top-level academic units (e.g., College of Engineering).
 * Data is cached for 10 minutes as colleges are very stable.
 *
 * @returns Query result with colleges array
 *
 * @example
 * ```tsx
 * const { data: colleges, isLoading } = useColleges();
 * ```
 */
export function useColleges() {
  return useQuery({
    queryKey: organizationKeys.colleges(),
    queryFn: fetchColleges,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch departments for a specific college
 *
 * Returns academic departments under a specific college.
 * Only fetches when collegeId is provided (enabled flag).
 *
 * @param collegeId - UUID of the parent college
 * @returns Query result with departments array
 *
 * @example
 * ```tsx
 * const { data: departments, isLoading } = useDepartmentsByCollege(collegeId);
 * ```
 */
export function useDepartmentsByCollege(collegeId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.departmentsByCollege(collegeId || ''),
    queryFn: () => fetchDepartmentsByCollege(collegeId || ''),
    enabled: !!collegeId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch a single department by ID
 *
 * Returns details for a specific department or office.
 * Only fetches when id is provided (enabled flag).
 *
 * @param id - UUID of the department
 * @returns Query result with department details
 *
 * @example
 * ```tsx
 * const { data: department, isLoading } = useDepartment(departmentId);
 * ```
 */
export function useDepartment(id: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.department(id || ''),
    queryFn: () => fetchDepartment(id || ''),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch all administrative offices
 *
 * Returns all administrative units (non-academic departments).
 * Data is cached for 10 minutes as offices are relatively stable.
 *
 * @returns Query result with offices array
 *
 * @example
 * ```tsx
 * const { data: offices, isLoading } = useOffices();
 * ```
 */
export function useOffices() {
  return useQuery({
    queryKey: organizationKeys.offices(),
    queryFn: fetchOffices,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch positions for a specific department
 *
 * Returns organizational positions (not job openings) for a department.
 * Only fetches when departmentId is provided (enabled flag).
 *
 * @param departmentId - UUID of the department
 * @returns Query result with positions array
 *
 * @example
 * ```tsx
 * const { data: positions, isLoading } = usePositionsByDepartment(deptId);
 * ```
 */
export function usePositionsByDepartment(departmentId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.positionsByDepartment(departmentId || ''),
    queryFn: () => fetchPositionsByDepartment(departmentId || ''),
    enabled: !!departmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
