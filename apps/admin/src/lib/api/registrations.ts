/**
 * Registration Approval API Client
 *
 * Provides type-safe functions for interacting with the Registration Approval API endpoints.
 * All functions handle errors and return properly typed responses.
 */

// Types for API responses
export interface Registration {
  id: string;
  userId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  employeeId: string | null;
  applicantId: string | null;
  userType: 'employee' | 'applicant';
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  position: {
    id: string;
    title: string;
  } | null;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy: {
    id: string;
    name: string;
  } | null;
  reviewedAt: string | null;
  adminNotes: string | null;
}

export interface RegistrationDetails extends Registration {
  accountStatus: 'pending' | 'active' | 'suspended' | 'rejected';
  emailVerifiedAt: string | null;
  phoneNumber: string | null;
  role: 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor';
  academicRank: string | null;
  tenureStatus: string | null;
  employmentType: string | null;
  campusAssignment: string | null;
  rejectedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationStats {
  pending: number;
  approved: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  rejected: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  averageApprovalTime: string;
  averageApprovalTimeHours: number;
  byDepartment: Array<{
    departmentId: string | null;
    departmentName: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    email: string;
    action: 'approved' | 'rejected';
    timestamp: string;
    reviewerName: string;
  }>;
}

export interface RegistrationsListParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected';
  userType?: 'employee' | 'applicant';
  departmentId?: string;
  search?: string;
  sortBy?: 'requestedAt' | 'firstName' | 'lastName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface RegistrationsListResponse {
  registrations: Registration[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface ApproveRegistrationData {
  role?: 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor';
  assignedDepartmentId?: string;
  assignedPositionId?: string;
  notes?: string;
  sendWelcomeEmail?: boolean;
}

export interface ApproveRegistrationResponse {
  success: true;
  user: {
    id: string;
    email: string;
    employeeId: string;
    role: string;
  };
  message: string;
}

export interface RejectRegistrationData {
  reason: string;
  notes?: string;
  sendEmail?: boolean;
}

export interface RejectRegistrationResponse {
  success: true;
  registrationId: string;
  message: string;
}

export interface BulkApproveData {
  registrationIds: string[];
  defaultRole?: 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor';
  notes?: string;
  sendWelcomeEmails?: boolean;
}

export interface BulkApproveResponse {
  success: true;
  results: Array<{
    registrationId: string;
    userId: string | null;
    email: string;
    status: 'approved' | 'failed';
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Base API URL for registration endpoints
 */
const API_BASE = '/api/registrations';

/**
 * Fetch paginated list of registrations with filters
 */
export async function fetchRegistrations(
  params: RegistrationsListParams = {}
): Promise<RegistrationsListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.status) searchParams.set('status', params.status);
  if (params.userType) searchParams.set('userType', params.userType);
  if (params.departmentId) searchParams.set('departmentId', params.departmentId);
  if (params.search) searchParams.set('search', params.search);
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
    error: 'Failed to fetch registrations'
  }));

  if (!response.ok) {
    const errorMessage = responseData.error || 'Failed to fetch registrations';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[fetchRegistrations] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Fetch detailed information for a single registration
 */
export async function fetchRegistrationDetails(id: string): Promise<RegistrationDetails> {
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
    error: 'Failed to fetch registration details'
  }));

  if (!response.ok) {
    const errorMessage = responseData.error || 'Failed to fetch registration details';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[fetchRegistrationDetails] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Approve a pending registration
 */
export async function approveRegistration(
  id: string,
  data: ApproveRegistrationData
): Promise<ApproveRegistrationResponse> {
  const response = await fetch(`${API_BASE}/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  // Parse response body once to avoid consuming it twice
  const responseData = await response.json().catch(() => ({
    success: false,
    error: 'Failed to approve registration'
  }));

  // CRITICAL: Check both HTTP status AND data.success
  if (!response.ok || !responseData.success) {
    const errorMessage = responseData.error || 'Failed to approve registration';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[approveRegistration] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    // Include details in error message for better user feedback
    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Reject a pending registration with reason
 */
export async function rejectRegistration(
  id: string,
  data: RejectRegistrationData
): Promise<RejectRegistrationResponse> {
  const response = await fetch(`${API_BASE}/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  // Parse response body once to avoid consuming it twice
  const responseData = await response.json().catch(() => ({
    success: false,
    error: 'Failed to reject registration'
  }));

  // CRITICAL: Check both HTTP status AND data.success
  if (!response.ok || !responseData.success) {
    const errorMessage = responseData.error || 'Failed to reject registration';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[rejectRegistration] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    // Include details in error message for better user feedback
    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Bulk approve multiple registrations
 */
export async function bulkApproveRegistrations(
  data: BulkApproveData
): Promise<BulkApproveResponse> {
  const response = await fetch(`${API_BASE}/bulk-approve`, {
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
    error: 'Failed to bulk approve registrations'
  }));

  // CRITICAL: Check both HTTP status AND data.success
  if (!response.ok || !responseData.success) {
    const errorMessage = responseData.error || 'Failed to bulk approve registrations';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[bulkApproveRegistrations] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    // Include details in error message for better user feedback
    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return responseData;
}

/**
 * Fetch registration statistics for dashboard
 */
export async function fetchRegistrationStats(): Promise<RegistrationStats> {
  const response = await fetch(`${API_BASE}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  // Parse response body once
  const responseData = await response.json().catch(() => ({
    success: false,
    error: 'Failed to fetch statistics'
  }));

  if (!response.ok) {
    const errorMessage = responseData.error || 'Failed to fetch statistics';
    const errorDetails = responseData.details ? ` (${responseData.details})` : '';

    console.error('[fetchRegistrationStats] API Error:', {
      status: response.status,
      error: responseData.error,
      details: responseData.details,
    });

    throw new Error(`${errorMessage}${errorDetails}`);
  }

  // Unwrap the { success, data } response
  return responseData.data || responseData;
}
