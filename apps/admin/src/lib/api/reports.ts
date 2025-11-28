/**
 * Reports API Client
 *
 * API client functions for reports analytics endpoints
 */

import type { ReportsOverviewResponse } from '@tupsafe/types';

const API_BASE = '/api/reports';

/**
 * Fetch reports overview data
 *
 * Returns comprehensive analytics for the reports dashboard:
 * - Compliance overview metrics
 * - Submission statistics
 * - 6-month submission trends
 * - Department compliance rankings
 * - Status distribution
 * - Recent activity feed
 */
export async function fetchReportsOverview(): Promise<ReportsOverviewResponse> {
  const response = await fetch(API_BASE, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch reports');
  }

  return response.json();
}

/**
 * Export report data
 *
 * Triggers a file download with the specified format
 *
 * @param format - Export format ('csv' | 'pdf')
 * @param reportType - Report type identifier ('users' | 'registrations' | 'submissions' | 'compliance')
 * @returns Blob containing the exported file
 */
export async function exportReport(
  format: 'csv' | 'pdf',
  reportType: 'users' | 'registrations' | 'submissions' | 'compliance'
): Promise<Blob> {
  // Build query params with required fields
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1); // Start of year
  const endDate = now;

  const searchParams = new URLSearchParams({
    format,
    reportType,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  const response = await fetch(`/api/dashboard/export?${searchParams}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to export report');
  }

  return response.blob();
}
