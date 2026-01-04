/**
 * Jobs Listing Page
 *
 * Main jobs management page with:
 * - Statistics cards
 * - Advanced filtering
 * - Positions data table
 * - Navigation to create/edit pages
 * - Standardized pagination
 */

'use client';

import { useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Plus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import {
  JobsStatsCards,
  JobsFilters,
  JobsDataTable,
} from '@/components/jobs';
import { useOpenPositions } from '@/hooks/useJobsQuery';
import { usePagination } from '@/hooks/usePagination';
import { useQuery } from '@tanstack/react-query';
import type { OpenPositionsFilters } from '@/hooks/useJobsQuery';
import type { JobsStatsResponse } from '@tupsafe/types';
import { toast } from 'sonner';

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pagination state
  const { page, pageSize, paginationParams, setPage, setPageSize } = usePagination(20);

  // Handle success toast from create page
  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      toast.success('Position created successfully');
      // Clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('created');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  // Build filters from URL params
  const filters = useMemo<OpenPositionsFilters>(() => {
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');
    const employmentCategory = searchParams.get('employmentCategory');
    const search = searchParams.get('search');
    const isFeatured = searchParams.get('isFeatured');

    return {
      ...paginationParams,
      status: status && status !== 'all' ? (status as 'open' | 'closed' | 'filled' | 'cancelled') : undefined,
      departmentId: departmentId && departmentId !== 'all' ? departmentId : undefined,
      employmentCategory: employmentCategory && employmentCategory !== 'all' ? (employmentCategory as 'faculty' | 'administrative' | 'contractual' | 'not_applicable') : undefined,
      search: search || undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
      sortBy: 'postedAt',
      sortOrder: 'desc',
    };
  }, [searchParams, paginationParams]);

  // Fetch positions
  const {
    positions,
    pagination,
    isLoading,
    isError,
    error,
    deletePosition,
    isDeleting,
  } = useOpenPositions(filters);

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery<JobsStatsResponse>({
    queryKey: ['jobs-stats'],
    queryFn: async () => {
      const response = await fetch('/api/jobs/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs statistics');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle actions
  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/jobs/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this position? This action cannot be undone.')) {
      deletePosition(id, {
        onSuccess: () => {
          toast.success('Position deleted successfully');
        },
        onError: (error) => {
          toast.error('Failed to delete position', {
            description: error.message,
          });
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Openings</h1>
          <p className="text-muted-foreground">
            Manage job positions and review applications
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/jobs/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Position
        </Button>
      </div>

      {/* Statistics Cards */}
      <JobsStatsCards stats={stats} isLoading={statsLoading} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Filter Positions
          </CardTitle>
          <CardDescription>
            Search and filter job positions by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobsFilters />
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Positions</AlertTitle>
          <AlertDescription>
            {error?.message || 'Failed to load positions. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Positions</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total position(s)
            {pagination && pagination.totalPages > 1 && (
              <span className="ml-2">
                (Page {pagination.page} of {pagination.totalPages})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobsDataTable
            data={positions}
            isLoading={isLoading || isDeleting}
            onViewDetails={handleViewDetails}
            onDelete={handleDelete}
          />

          {/* Standardized Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4">
              <DataTablePagination
                currentPage={page}
                totalPages={pagination.totalPages}
                pageSize={pageSize}
                total={pagination.total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemName="positions"
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
