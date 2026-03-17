/**
 * Organization Management API Client
 *
 * Provides type-safe API client functions for organization management operations.
 * All functions use fetch with proper error handling and type safety.
 */

import type {
  OrganizationQuery,
  OrganizationListResponse,
  DepartmentWithStats,
  CollegeWithDepartments,
  CreateCollegeInput,
  CreateDepartmentInput,
  CreateOfficeInput,
  UpdateDepartmentInput,
  DepartmentDependencies,
  ReassignAndDeleteResponse,
  ApiError,
} from '@tupsafe/types';
import type { ReassignAndDeleteInput } from '@tupsafe/types';

const API_BASE = '/api/organization';

/**
 * Fetch list of organizational units with filters
 */
export async function fetchOrganizations(
  params: Partial<OrganizationQuery> = {}
): Promise<OrganizationListResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const url = `${API_BASE}?${searchParams.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to fetch organizations');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Fetch detailed information about a specific organizational unit
 */
export async function fetchOrganizationDetail(
  id: string
): Promise<DepartmentWithStats> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to fetch organization details');
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Fetch college with nested departments
 */
export async function fetchCollegeWithDepartments(
  collegeId: string
): Promise<CollegeWithDepartments> {
  const response = await fetch(`${API_BASE}/colleges/${collegeId}/departments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to fetch college with departments');
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Fetch departments under a specific college
 */
export async function fetchDepartmentsByCollege(
  collegeId: string
): Promise<DepartmentWithStats[]> {
  const response = await fetch(`${API_BASE}/colleges/${collegeId}/departments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to fetch departments');
  }

  const result = await response.json();
  // Handle both array response and object with data property
  if (Array.isArray(result)) {
    return result;
  }
  if (result.data?.departments) {
    return result.data.departments;
  }
  return result.departments || [];
}

/**
 * Create a new college
 */
export async function createCollege(
  data: CreateCollegeInput
): Promise<DepartmentWithStats> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, type: 'college' }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to create college');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Create a new department
 */
export async function createDepartment(
  data: CreateDepartmentInput
): Promise<DepartmentWithStats> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, type: 'department' }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to create department');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Create a new office
 */
export async function createOffice(
  data: CreateOfficeInput
): Promise<DepartmentWithStats> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, type: 'office' }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to create office');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Update an organizational unit
 */
export async function updateOrganization(
  id: string,
  data: UpdateDepartmentInput
): Promise<DepartmentWithStats> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to update organization');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Delete an organizational unit (soft or hard delete)
 */
export async function deleteOrganization(
  id: string,
  hard = true
): Promise<{ success: true }> {
  const response = await fetch(`${API_BASE}/${id}${hard ? '?hard=true' : ''}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to delete organization');
  }

  const result = await response.json();
  return { success: result.success };
}

/**
 * Reactivate a soft-deleted organizational unit
 */
export async function reactivateOrganization(
  id: string
): Promise<DepartmentWithStats> {
  const response = await fetch(`${API_BASE}/${id}/reactivate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to reactivate organization');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Fetch dependency information for a department
 * Shows employees, positions, and child departments blocking deletion
 */
export async function fetchDepartmentDependencies(
  id: string
): Promise<DepartmentDependencies> {
  const response = await fetch(`${API_BASE}/${id}/dependencies`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to fetch department dependencies');
  }

  const result = await response.json();
  // API returns dependencies directly, not wrapped in { data: ... }
  return result;
}

/**
 * Reassign employees and positions to another department, then delete the source
 */
export async function reassignAndDelete(
  id: string,
  data: ReassignAndDeleteInput
): Promise<ReassignAndDeleteResponse> {
  const response = await fetch(`${API_BASE}/${id}/reassign-and-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || 'Failed to reassign and delete');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}
