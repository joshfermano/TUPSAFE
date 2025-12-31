/**
 * Jobs Listing Page
 *
 * Main jobs management page with:
 * - Statistics cards
 * - Advanced filtering
 * - Positions data table
 * - Create/Edit position dialogs
 * - Standardized pagination
 */

'use client';

import { useState, useMemo } from 'react';
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
  CreateJobDialog,
  EditJobDialog,
} from '@/components/jobs';
import { useOpenPositions } from '@/hooks/useJobsQuery';
import { usePagination } from '@/hooks/usePagination';
import { useQuery } from '@tanstack/react-query';
import type { OpenPositionsFilters } from '@/hooks/useJobsQuery';
import type { CreateOpenPositionData, UpdateOpenPositionData, JobsStatsResponse } from '@tupsafe/types';
import { toast } from 'sonner';

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editPositionId, setEditPositionId] = useState<string | null>(null);

  // Pagination state
  const { page, pageSize, paginationParams, setPage, setPageSize } = usePagination(20);

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
    createPosition,
    isCreating,
    createError,
    updatePosition,
    isUpdating,
    updateError,
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

  const handleEdit = (id: string) => {
    setEditPositionId(id);
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

  const handleCreatePosition = (data: CreateOpenPositionData) => {
    createPosition(data, {
      onSuccess: () => {
        toast.success('Position created successfully');
        setCreateDialogOpen(false);
      },
      onError: (error) => {
        toast.error('Failed to create position', {
          description: error.message,
        });
      },
    });
  };

  const handleUpdatePosition = (data: UpdateOpenPositionData) => {
    if (!editPositionId) return;

    updatePosition(
      { id: editPositionId, data },
      {
        onSuccess: () => {
          toast.success('Position updated successfully');
          setEditPositionId(null);
        },
        onError: (error) => {
          toast.error('Failed to update position', {
            description: error.message,
          });
        },
      }
    );
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
        <Button onClick={() => setCreateDialogOpen(true)}>
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

      {/* Create Error */}
      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Creating Position</AlertTitle>
          <AlertDescription>{createError.message}</AlertDescription>
        </Alert>
      )}

      {/* Update Error */}
      {updateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Updating Position</AlertTitle>
          <AlertDescription>{updateError.message}</AlertDescription>
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
            onEdit={handleEdit}
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

      {/* Dialogs */}
      <CreateJobDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreatePosition}
        isLoading={isCreating}
      />

      <EditJobDialog
        positionId={editPositionId}
        open={!!editPositionId}
        onOpenChange={(open) => !open && setEditPositionId(null)}
        onSubmit={handleUpdatePosition}
        isLoading={isUpdating}
      />
    </div>
  );
}
