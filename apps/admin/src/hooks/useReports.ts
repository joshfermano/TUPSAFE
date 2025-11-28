/**
 * Reports React Query Hooks
 *
 * Centralized hooks for reports data fetching with caching and exports
 */

'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ReportsOverviewResponse } from '@tupsafe/types';
import { fetchReportsOverview, exportReport } from '@/lib/api/reports';

/**
 * Query key factory for reports
 */
export const reportsKeys = {
  all: ['reports'] as const,
  overview: () => [...reportsKeys.all, 'overview'] as const,
  exports: () => [...reportsKeys.all, 'exports'] as const,
};

/**
 * Hook for reports overview data
 *
 * Stale time: 5 minutes
 * Cache time: 10 minutes
 */
export function useReportsOverview() {
  return useQuery<ReportsOverviewResponse, Error>({
    queryKey: reportsKeys.overview(),
    queryFn: fetchReportsOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for exporting reports
 *
 * Automatically triggers download on success
 */
export function useExportReport() {
  return useMutation({
    mutationFn: ({
      format,
      reportType,
    }: {
      format: 'csv' | 'pdf';
      reportType: 'users' | 'registrations' | 'submissions' | 'compliance';
    }) => exportReport(format, reportType),
    onSuccess: (blob, { format, reportType }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tupsafe-${reportType}-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Report exported as ${format.toUpperCase()}`, {
        description: 'Download started successfully.',
      });
    },
    onError: (error) => {
      toast.error('Failed to export report', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });
}
