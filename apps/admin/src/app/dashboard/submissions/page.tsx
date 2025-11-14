/**
 * Submissions Review Page
 *
 * Main page for reviewing and managing PDS/SALN submissions
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus } from 'lucide-react';
import {
  SubmissionStatsCards,
  SubmissionFilters,
  SubmissionsDataTable,
  PDSDetailsDialog,
  SALNDetailsDialog,
  ApproveSubmissionDialog,
  RejectSubmissionDialog,
  BulkApproveDialog,
} from '@/components/submissions';
import type { FilterState } from '@/components/submissions/SubmissionFilters';
import {
  useSubmissions,
  useSubmissionStats,
  useApprovePDS,
  useRejectPDS,
  useApproveSALN,
  useRejectSALN,
  useBulkApproveSubmissions,
} from '@/hooks/useSubmissions';
import type { SubmissionListItem } from '@tupsafe/types';

export default function SubmissionsPage() {
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'submitted',
    page: 1,
  });

  // Selected submissions for bulk operations
  const [selectedSubmissions, setSelectedSubmissions] = useState<SubmissionListItem[]>([]);

  // Dialog states
  const [pdsDetailsOpen, setPdsDetailsOpen] = useState(false);
  const [salnDetailsOpen, setSalnDetailsOpen] = useState(false);
  const [detailsSubmissionId, setDetailsSubmissionId] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<{
    id: string;
    type: 'pds' | 'saln';
    employeeName: string;
    employeeId?: string;
  } | null>(null);

  // Data fetching
  const { data: submissionsData, isLoading: submissionsLoading } = useSubmissions({
    page: filters.page,
    limit: 20,
    type: filters.type,
    status: filters.status,
    departmentId: filters.departmentId,
    fiscalYear: filters.fiscalYear,
    search: filters.search,
  });

  const { data: stats, isLoading: statsLoading } = useSubmissionStats();

  // Mutations
  const approvePDSMutation = useApprovePDS();
  const rejectPDSMutation = useRejectPDS();
  const approveSALNMutation = useApproveSALN();
  const rejectSALNMutation = useRejectSALN();
  const bulkApproveMutation = useBulkApproveSubmissions();

  // Handlers
  const handleViewDetails = (id: string, type: 'pds' | 'saln') => {
    setDetailsSubmissionId(id);
    if (type === 'pds') {
      setPdsDetailsOpen(true);
    } else {
      setSalnDetailsOpen(true);
    }
  };

  const handleApprove = (id: string, type: 'pds' | 'saln') => {
    const submission = submissionsData?.submissions.find((s) => s.id === id);
    if (submission) {
      setCurrentSubmission({
        id,
        type,
        employeeName: `${submission.employee.firstName} ${submission.employee.lastName}`,
        employeeId: submission.employee.employeeId || undefined,
      });
      setApproveDialogOpen(true);
    }
  };

  const handleReject = (id: string, type: 'pds' | 'saln') => {
    const submission = submissionsData?.submissions.find((s) => s.id === id);
    if (submission) {
      setCurrentSubmission({
        id,
        type,
        employeeName: `${submission.employee.firstName} ${submission.employee.lastName}`,
        employeeId: submission.employee.employeeId || undefined,
      });
      setRejectDialogOpen(true);
    }
  };

  const handleConfirmApprove = async (notes?: string) => {
    if (!currentSubmission) return;

    try {
      if (currentSubmission.type === 'pds') {
        await approvePDSMutation.mutateAsync({
          id: currentSubmission.id,
          data: { notes },
        });
      } else {
        await approveSALNMutation.mutateAsync({
          id: currentSubmission.id,
          data: { notes },
        });
      }
      setApproveDialogOpen(false);
      setCurrentSubmission(null);
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleConfirmReject = async (reason: string, notes?: string) => {
    if (!currentSubmission) return;

    try {
      if (currentSubmission.type === 'pds') {
        await rejectPDSMutation.mutateAsync({
          id: currentSubmission.id,
          data: { reason, notes },
        });
      } else {
        await rejectSALNMutation.mutateAsync({
          id: currentSubmission.id,
          data: { reason, notes },
        });
      }
      setRejectDialogOpen(false);
      setCurrentSubmission(null);
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const handleBulkApprove = () => {
    if (selectedSubmissions.length > 0) {
      setBulkApproveDialogOpen(true);
    }
  };

  const handleConfirmBulkApprove = async (notes?: string) => {
    const submissionIds = selectedSubmissions.map((s) => ({
      id: s.id,
      type: s.type,
    }));

    const result = await bulkApproveMutation.mutateAsync({
      submissionIds,
      notes,
    });

    setSelectedSubmissions([]);
    return result;
  };

  const canBulkApprove = selectedSubmissions.length > 0;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submission Review</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve PDS and SALN submissions from employees
          </p>
        </div>
        {canBulkApprove && (
          <Button onClick={handleBulkApprove} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Bulk Approve ({selectedSubmissions.length})
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <SubmissionStatsCards stats={stats} isLoading={statsLoading} />

      {/* Filters */}
      <SubmissionFilters onFilterChange={setFilters} />

      {/* Data Table */}
      <SubmissionsDataTable
        data={submissionsData?.submissions || []}
        isLoading={submissionsLoading}
        onViewDetails={handleViewDetails}
        onApprove={handleApprove}
        onReject={handleReject}
        onBulkSelect={setSelectedSubmissions}
      />

      {/* Pagination */}
      {submissionsData && submissionsData.submissions.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {submissionsData.submissions.length} of{' '}
            {submissionsData.pagination.total} submissions
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              disabled={filters.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              disabled={
                submissionsData.submissions.length < 20 ||
                submissionsData.submissions.length === submissionsData.pagination.total
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialogs */}
      <PDSDetailsDialog
        open={pdsDetailsOpen}
        onOpenChange={setPdsDetailsOpen}
        submissionId={detailsSubmissionId}
        onApprove={() => {
          setPdsDetailsOpen(false);
          if (detailsSubmissionId) {
            handleApprove(detailsSubmissionId, 'pds');
          }
        }}
        onReject={() => {
          setPdsDetailsOpen(false);
          if (detailsSubmissionId) {
            handleReject(detailsSubmissionId, 'pds');
          }
        }}
      />

      <SALNDetailsDialog
        open={salnDetailsOpen}
        onOpenChange={setSalnDetailsOpen}
        submissionId={detailsSubmissionId}
        onApprove={() => {
          setSalnDetailsOpen(false);
          if (detailsSubmissionId) {
            handleApprove(detailsSubmissionId, 'saln');
          }
        }}
        onReject={() => {
          setSalnDetailsOpen(false);
          if (detailsSubmissionId) {
            handleReject(detailsSubmissionId, 'saln');
          }
        }}
      />

      {/* Action Dialogs */}
      <ApproveSubmissionDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        submission={currentSubmission}
        onConfirm={handleConfirmApprove}
        isLoading={approvePDSMutation.isPending || approveSALNMutation.isPending}
      />

      <RejectSubmissionDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        submission={currentSubmission}
        onConfirm={handleConfirmReject}
        isLoading={rejectPDSMutation.isPending || rejectSALNMutation.isPending}
      />

      <BulkApproveDialog
        open={bulkApproveDialogOpen}
        onOpenChange={setBulkApproveDialogOpen}
        submissions={selectedSubmissions}
        onConfirm={handleConfirmBulkApprove}
      />
    </div>
  );
}
