/**
 * API Response Types
 * Type definitions for API route responses used throughout the employee portal
 */

// ============================================================================
// Departments API Types
// ============================================================================

export type OfficeType = 'academic' | 'administrative';

export interface Department {
  id: string;
  name: string;
  code: string;
  officeType: OfficeType;
  parentCollegeId: string | null;
}

export interface DepartmentsResponse {
  data: Department[];
}

// ============================================================================
// Positions API Types
// ============================================================================

export type EmploymentCategory =
  | 'faculty'
  | 'administrative'
  | 'contractual'
  | 'not_applicable';

export type PositionStatus = 'open' | 'closed' | 'filled' | 'cancelled';

export interface PositionRequirements {
  education: string[];
  experience: string[];
  skills: string[];
}

export interface Position {
  id: string;
  positionTitle: string;
  positionCode: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  employmentCategory: EmploymentCategory;
  salaryGrade: string | null;
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  employmentType: string;
  description: string;
  qualifications: string[];
  responsibilities: string[];
  requirements: PositionRequirements;
  numberOfOpenings: number;
  applicationsReceived: number;
  applicationDeadline: string | null; // ISO 8601 timestamp
  isFeatured: boolean;
  status: PositionStatus;
  postedAt: string | null; // ISO 8601 timestamp
  updatedAt: string | null; // ISO 8601 timestamp
}

export interface PositionsResponse {
  data: Position[];
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface DepartmentsQueryParams {
  type?: 'colleges' | 'offices';
  collegeId?: string;
}

export interface PositionsQueryParams {
  orgId?: string;
  status?: PositionStatus;
}

// ============================================================================
// Error Response Type
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

// ============================================================================
// API Client Helper Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> = T | ApiErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isApiError(
  response: ApiResponse<unknown>
): response is ApiErrorResponse {
  return (response as ApiErrorResponse).error !== undefined;
}

/**
 * Build query string from parameters
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
