/**
 * Submission Review API Client
 *
 * Type-safe API client functions for submission review operations
 */

import type {
  SubmissionListQuery,
  SubmissionListResponse,
  PDSSubmissionDetail,
  SALNSubmissionDetail,
  ApproveSubmissionData,
  RejectSubmissionData,
  BulkApproveData,
  BulkApproveResponse,
  SubmissionStatsResponse,
  DeleteSubmissionData,
} from '@tupsafe/types';

const API_BASE = '/api/submissions';

/**
 * Fetch paginated list of submissions with filters
 */
export async function fetchSubmissions(
  params: Partial<SubmissionListQuery>
): Promise<SubmissionListResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`${API_BASE}?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch submissions');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Fetch PDS submission details
 */
export async function fetchPDSDetails(id: string): Promise<PDSSubmissionDetail> {
  const response = await fetch(`${API_BASE}/pds/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch PDS details');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Fetch SALN submission details
 */
export async function fetchSALNDetails(id: string): Promise<SALNSubmissionDetail> {
  const response = await fetch(`${API_BASE}/saln/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch SALN details');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Approve PDS submission
 */
export async function approvePDS(
  id: string,
  data: ApproveSubmissionData
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/pds/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve PDS');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Reject PDS submission
 */
export async function rejectPDS(
  id: string,
  data: RejectSubmissionData
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/pds/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reject PDS');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Approve SALN submission
 */
export async function approveSALN(
  id: string,
  data: ApproveSubmissionData
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/saln/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve SALN');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Reject SALN submission
 */
export async function rejectSALN(
  id: string,
  data: RejectSubmissionData
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/saln/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reject SALN');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Delete PDS submission (admin / co_admin only)
 *
 * Permanently deletes a PDS submission at any status. A snapshot is archived
 * server-side for compliance before the row is removed.
 */
export async function deletePDS(
  id: string,
  data: DeleteSubmissionData
): Promise<{ success: boolean; message: string; data: { id: string } }> {
  const response = await fetch(`${API_BASE}/pds/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete PDS');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result : result;
}

/**
 * Delete SALN submission (admin / co_admin only)
 *
 * Permanently deletes a SALN submission at any status. A snapshot is archived
 * server-side for compliance before the row is removed.
 */
export async function deleteSALN(
  id: string,
  data: DeleteSubmissionData
): Promise<{ success: boolean; message: string; data: { id: string } }> {
  const response = await fetch(`${API_BASE}/saln/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete SALN');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result : result;
}

/**
 * Bulk approve submissions
 */
export async function bulkApproveSubmissions(
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to bulk approve submissions');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}

/**
 * Fetch submission statistics
 */
export async function fetchSubmissionStats(): Promise<SubmissionStatsResponse> {
  const response = await fetch(`${API_BASE}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch submission statistics');
  }

  const result = await response.json();
  return result.success === true && 'data' in result ? result.data : result;
}
