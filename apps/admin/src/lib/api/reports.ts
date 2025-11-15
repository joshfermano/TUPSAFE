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
 * @param type - Report type identifier
 * @returns Blob containing the exported file
 */
export async function exportReport(
  format: 'csv' | 'pdf',
  type: string
): Promise<Blob> {
  const response = await fetch(`/api/dashboard/export?format=${format}&type=${type}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to export report');
  }

  return response.blob();
}
