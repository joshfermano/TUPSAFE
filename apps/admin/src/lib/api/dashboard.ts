/**
 * Dashboard API Client
 *
 * Centralized API client for dashboard analytics endpoints
 */

import type {
  DashboardOverviewResponse,
  DashboardTrendsResponse,
  DashboardDepartmentsResponse,
  DashboardComplianceResponse,
  DashboardActivityResponse,
  TrendsQueryParams,
  ActivityQueryParams,
  ExportQueryParams,
} from '@tupsafe/types';

/**
 * Fetch main dashboard overview metrics
 */
export async function fetchDashboardOverview(): Promise<DashboardOverviewResponse> {
  const response = await fetch('/api/dashboard/overview', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard overview');
  }

  return response.json();
}

/**
 * Fetch trend data for charts
 */
export async function fetchDashboardTrends(
  params: TrendsQueryParams
): Promise<DashboardTrendsResponse> {
  const searchParams = new URLSearchParams({
    period: params.period,
    metric: params.metric,
    groupBy: params.groupBy,
  });

  const response = await fetch(`/api/dashboard/trends?${searchParams}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard trends');
  }

  return response.json();
}

/**
 * Fetch department analytics
 */
export async function fetchDepartmentAnalytics(): Promise<DashboardDepartmentsResponse> {
  const response = await fetch('/api/dashboard/departments', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch department analytics');
  }

  return response.json();
}

/**
 * Fetch compliance report
 */
export async function fetchComplianceReport(): Promise<DashboardComplianceResponse> {
  const response = await fetch('/api/dashboard/compliance', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch compliance report');
  }

  return response.json();
}

/**
 * Fetch recent activity log with pagination
 */
export async function fetchRecentActivity(
  params: Partial<ActivityQueryParams> = {}
): Promise<DashboardActivityResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.type) searchParams.set('type', params.type);
  if (params.userId) searchParams.set('userId', params.userId);
  if (params.startDate) searchParams.set('startDate', params.startDate.toISOString());
  if (params.endDate) searchParams.set('endDate', params.endDate.toISOString());

  const response = await fetch(`/api/dashboard/activity?${searchParams}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }

  return response.json();
}

/**
 * Export dashboard data
 */
export async function exportDashboardData(params: ExportQueryParams): Promise<Blob> {
  const searchParams = new URLSearchParams({
    reportType: params.reportType,
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
    format: params.format,
  });

  if (params.departmentId) {
    searchParams.set('departmentId', params.departmentId);
  }

  const response = await fetch(`/api/dashboard/export?${searchParams}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to export dashboard data');
  }

  return response.blob();
}

/**
 * Download exported data as file
 */
export function downloadExportedData(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
