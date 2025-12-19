/**
 * Registration Approval Management Page
 *
 * Comprehensive interface for managing pending registration requests.
 * Features: statistics dashboard, filtering, bulk actions, approve/reject workflows.
 */

'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, UserPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  RegistrationStatsCards,
  RegistrationFilters,
  RegistrationsDataTable,
  RegistrationDetailsDialog,
  ApproveRegistrationDialog,
  RejectRegistrationDialog,
  BulkApproveDialog,
} from '@/components/registrations';
import type { RegistrationFiltersState } from '@/components/registrations/RegistrationFilters';
import {
  useRegistrations,
  useRegistrationStats,
  registrationKeys,
} from '@/hooks/useRegistrations';
import type { Registration } from '@/lib/api/registrations';
import {
  useRealtimeRegistrations,
  type UseRealtimeRegistrationsOptions,
} from '@tupsafe/database';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { PendingRegistration } from '@tupsafe/database';

export default function RegistrationsPage() {
  // Query client for Realtime integration
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<RegistrationFiltersState>({
    status: 'pending', // Default to pending
  });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Dialog states
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    registration: Registration | null;
  }>({ open: false, registration: null });

  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    registration: Registration | null;
  }>({ open: false, registration: null });

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    registration: Registration | null;
  }>({ open: false, registration: null });

  const [bulkApproveDialog, setBulkApproveDialog] = useState(false);

  // Data fetching
  const { data: stats, isLoading: isStatsLoading } = useRegistrationStats();
  const { data, isLoading: isRegistrationsLoading } = useRegistrations({
    page,
    limit: pageSize,
    ...filters,
  });

  // Real-time subscription for live updates
  const { isConnected: isRealtimeConnected } = useRealtimeRegistrations({
    queryClient,
    queryKeys: [
      ['registrations', 'list'],
      ['registrations', 'stats'],
    ],
    showNotifications: true,
    onNotification: (
      eventType: 'INSERT' | 'UPDATE' | 'DELETE',
      payload: RealtimePostgresChangesPayload<PendingRegistration>
    ) => {
      console.log('[Registrations] Real-time event:', eventType, payload);

      // Clear selection if a selected registration was updated by another admin
      if (eventType === 'UPDATE' || eventType === 'DELETE') {
        const newRecord = payload.new as PendingRegistration | undefined;
        const oldRecord = payload.old as PendingRegistration | undefined;
        const updatedId = newRecord?.id || oldRecord?.id;

        if (updatedId && selectedRows.has(updatedId)) {
          setSelectedRows((prev) => {
            const next = new Set(prev);
            next.delete(updatedId);
            return next;
          });
        }
      }
    },
  });

  const registrations = data?.registrations || [];
  const pagination = data?.pagination;

  // Handlers (memoized to prevent unnecessary re-renders of ActionsCell)
  const handleViewDetails = useCallback((registration: Registration) => {
    setDetailsDialog({ open: true, registration });
  }, []);

  const handleApprove = useCallback((registration: Registration) => {
    setApproveDialog({ open: true, registration });
  }, []);

  const handleReject = useCallback((registration: Registration) => {
    setRejectDialog({ open: true, registration });
  }, []);

  const handleBulkApprove = () => {
    if (selectedRows.size === 0) return;
    setBulkApproveDialog(true);
  };

  const handleFiltersChange = (newFilters: RegistrationFiltersState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
    setSelectedRows(new Set()); // Clear selection
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedRows(new Set()); // Clear selection on page change
  };

  // Get selected registrations for bulk actions
  const selectedRegistrations = registrations.filter((r) =>
    selectedRows.has(r.id)
  );

  const canBulkApprove =
    selectedRegistrations.length > 0 &&
    selectedRegistrations.every((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Registration Approvals
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and manage pending registration requests
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Manual Registration
          </Button>
        </div>
      </div>

      <Separator />

      {/* Statistics Cards */}
      <RegistrationStatsCards stats={stats} isLoading={isStatsLoading} />

      <Separator />

      {/* Filters */}
      <RegistrationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        departments={[]} // TODO: Fetch departments from API
      />

      {/* Bulk Actions Bar */}
      {selectedRows.size > 0 && (
        <Card className="p-4 flex items-center justify-between bg-muted/50 border-primary/20">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {selectedRows.size} registration
              {selectedRows.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="link"
              onClick={() => setSelectedRows(new Set())}
              className="h-auto p-0 text-sm">
              Clear selection
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleBulkApprove}
              disabled={!canBulkApprove}
              className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Bulk Approve ({selectedRows.size})
            </Button>
          </div>
        </Card>
      )}

      {/* Data Table */}
      <RegistrationsDataTable
        registrations={registrations}
        isLoading={isRegistrationsLoading}
        onViewDetails={handleViewDetails}
        onApprove={handleApprove}
        onReject={handleReject}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  className={
                    page === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {/* Page numbers */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first page, last page, current page, and pages around current
                  return (
                    p === 1 ||
                    p === pagination.totalPages ||
                    Math.abs(p - page) <= 1
                  );
                })
                .map((p, index, array) => {
                  // Add ellipsis if there's a gap
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && p - prevPage > 1;

                  return (
                    <PaginationItem key={p}>
                      {showEllipsis && <PaginationEllipsis />}
                      <PaginationLink
                        onClick={() => handlePageChange(p)}
                        isActive={page === p}
                        className="cursor-pointer">
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    handlePageChange(Math.min(pagination.totalPages, page + 1))
                  }
                  className={
                    page === pagination.totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Summary Footer */}
      {pagination && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {(page - 1) * pageSize + 1} to{' '}
          {Math.min(page * pageSize, pagination.total)} of {pagination.total}{' '}
          registrations
        </div>
      )}

      {/* Dialogs */}
      <RegistrationDetailsDialog
        registration={detailsDialog.registration}
        open={detailsDialog.open}
        onOpenChange={(open) =>
          setDetailsDialog({
            open,
            registration: open ? detailsDialog.registration : null,
          })
        }
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <ApproveRegistrationDialog
        registration={approveDialog.registration}
        open={approveDialog.open}
        onOpenChange={(open) =>
          setApproveDialog({
            open,
            registration: open ? approveDialog.registration : null,
          })
        }
        departments={[]} // TODO: Fetch departments from API
        positions={[]} // TODO: Fetch positions from API
      />

      <RejectRegistrationDialog
        registration={rejectDialog.registration}
        open={rejectDialog.open}
        onOpenChange={(open) =>
          setRejectDialog({
            open,
            registration: open ? rejectDialog.registration : null,
          })
        }
      />

      <BulkApproveDialog
        registrations={selectedRegistrations}
        open={bulkApproveDialog}
        onOpenChange={setBulkApproveDialog}
        onSuccess={() => {
          setSelectedRows(new Set());
        }}
      />
    </div>
  );
}
