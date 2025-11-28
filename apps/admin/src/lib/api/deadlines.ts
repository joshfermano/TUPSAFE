/**
 * Deadline Management API Client
 *
 * Provides type-safe functions for interacting with the Deadlines API endpoints.
 * All functions handle errors and return properly typed responses.
 */

// Types for deadline entities
export type FormType = 'pds' | 'saln';

export interface Deadline {
  id: string;
  formType: FormType;
  year: number;
  deadlineDate: string; // ISO date string (YYYY-MM-DD)
  reminderDaysBefore: number[];
  isActive: boolean;
  createdAt: string;
}

export interface DeadlineWithStats extends Deadline {
  submissionCount?: number;
  complianceRate?: number;
  daysRemaining?: number;
  status?: 'upcoming' | 'active' | 'passed' | 'inactive';
}

// Query parameters for listing deadlines
export interface DeadlinesListParams {
  page?: number;
  limit?: number;
  formType?: FormType;
  year?: number;
  isActive?: boolean;
  sortBy?: 'deadlineDate' | 'year' | 'formType' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Response types
export interface DeadlinesListResponse {
  deadlines: DeadlineWithStats[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DeadlineDetailResponse extends DeadlineWithStats {
  complianceStats?: {
    totalEmployees: number;
    submitted: number;
    pending: number;
    overdue: number;
  };
}

// Input types for create/update operations
export interface CreateDeadlineData {
  formType: FormType;
  year: number;
  deadlineDate: string; // ISO date string (YYYY-MM-DD)
  reminderDaysBefore?: number[];
  isActive?: boolean;
}

export interface UpdateDeadlineData {
  deadlineDate?: string;
  reminderDaysBefore?: number[];
  isActive?: boolean;
}

// Response types for mutations
export interface CreateDeadlineResponse {
  success: true;
  deadline: Deadline;
  message: string;
}

export interface UpdateDeadlineResponse {
  success: true;
  deadline: Deadline;
  message: string;
}

export interface DeleteDeadlineResponse {
  success: true;
  deadlineId: string;
  message: string;
}

/**
 * Base API URL for deadline endpoints
 */
const API_BASE = '/api/deadlines';

/**
 * Fetch paginated list of deadlines with filters
 */
export async function fetchDeadlines(
  params: DeadlinesListParams = {}
): Promise<DeadlinesListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.formType) searchParams.set('formType', params.formType);
  if (params.year) searchParams.set('year', params.year.toString());
  if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const url = `${API_BASE}?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  // Parse response body once
  const responseData = await response.json().catch(() => ({
    success: false,
    error: 'Failed to fetch deadlines',
  }));

  if (!response.ok) {
    const errorMessage = responseData.error || 'Failed to fetch deadlines';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[fetchDeadlines] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Fetch detailed information for a single deadline by ID
 */
export async function fetchDeadlineById(id: string): Promise<DeadlineDetailResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  // Parse response body once
  const responseData = await response.json().catch(() => ({
    success: false,
    error: 'Failed to fetch deadline details',
  }));

  if (!response.ok) {
    const errorMessage = responseData.error || 'Failed to fetch deadline details';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[fetchDeadlineById] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Fetch deadline by form type and year (unique combination)
 */
export async function fetchDeadlineByFormTypeAndYear(
  formType: FormType,
  year: number
): Promise<DeadlineDetailResponse | null> {
  const searchParams = new URLSearchParams();
  searchParams.set('formType', formType);
  searchParams.set('year', year.toString());

  const response = await fetch(`${API_BASE}/lookup?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  // Parse response body once
  const responseData = await response.json().catch(() => ({
    success: false,
    error: 'Failed to fetch deadline',
  }));

  // Return null if not found (404)
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorMessage = responseData.error || 'Failed to fetch deadline';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[fetchDeadlineByFormTypeAndYear] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Create a new deadline
 */
export async function createDeadline(data: CreateDeadlineData): Promise<CreateDeadlineResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  // Parse response body once
  const responseData = await response.json().catch(() => ({
    success: false,
    error: 'Failed to create deadline',
  }));

  // Check both HTTP status AND data.success
  if (!response.ok || !responseData.success) {
    const errorMessage = responseData.error || 'Failed to create deadline';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[createDeadline] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Update an existing deadline
 */
export async function updateDeadline(
  id: string,
  data: UpdateDeadlineData
): Promise<UpdateDeadlineResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  // Parse response body once
  const responseData = await response.json().catch(() => ({
    success: false,
    error: 'Failed to update deadline',
  }));

  // Check both HTTP status AND data.success
  if (!response.ok || !responseData.success) {
    const errorMessage = responseData.error || 'Failed to update deadline';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[updateDeadline] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Delete a deadline
 */
export async function deleteDeadline(id: string): Promise<DeleteDeadlineResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  // Parse response body once
  const responseData = await response.json().catch(() => ({
    success: false,
    error: 'Failed to delete deadline',
  }));

  // Check both HTTP status AND data.success
  if (!response.ok || !responseData.success) {
    const errorMessage = responseData.error || 'Failed to delete deadline';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[deleteDeadline] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}
