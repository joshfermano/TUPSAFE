'use client';

import React, { useMemo, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../providers/AuthProvider';
import { usePDSSubmissions, type PDSSubmission } from '../../../../hooks/usePDS';
import { usePDSPdf } from '../../../../hooks/usePDSPdf';
import { transformPdsForPdf } from '../../../../lib/utils/pds-transformations';
import { toast } from 'sonner';
import { BlurFade, Badge, NumberTicker } from '@tupsafe/shared-ui';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Input } from '../../../../components/ui/input';
import { format } from 'date-fns';
import {
  FileText,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  XCircle,
  SortAsc,
  Calendar,
  User,
  Search,
  Loader2,
  AlertCircle,
  FolderCheck,
  FileEdit,
  Trash2,
  Filter,
} from 'lucide-react';
import { useDebounce } from '../../../../hooks/useDebounce';
import { usePagination } from '../../../../hooks/usePagination';
import { CardGridPagination } from '../../../../components/ui/card-grid-pagination';

type SortOption = 'date-desc' | 'date-asc' | 'year-desc' | 'year-asc';
type StatusFilter = 'all' | 'approved' | 'rejected';

interface Submission {
  id: string;
  year: number;
  version: number;
  status: string;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  reviewNotes: string | null;
}

/**
 * Loading State Component
 */
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Loader2 className="h-12 w-12 animate-spin text-[oklch(0.55_0.22_15)]" />
    <p className="text-slate-600 dark:text-slate-400">Loading submissions...</p>
  </div>
));
LoadingState.displayName = 'LoadingState';

/**
 * Error State Component
 */
const ErrorState = memo<{ message: string }>(({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <div className="rounded-full bg-rose-100 dark:bg-rose-950/30 p-4">
      <AlertCircle className="h-12 w-12 text-rose-600 dark:text-rose-400" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold">Error Loading Submissions</h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-md">{message}</p>
    </div>
  </div>
));
ErrorState.displayName = 'ErrorState';

/**
 * Empty State Component
 */
const EmptyState = memo<{ hasFilters: boolean; onClearFilters: () => void }>(
  ({ hasFilters, onClearFilters }) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
        <FolderCheck className="h-12 w-12 text-slate-600 dark:text-slate-400" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">
          {hasFilters ? 'No Results Found' : 'No Submissions'}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          {hasFilters
            ? 'No submissions match your current filters. Try adjusting your search.'
            : "You don't have any approved or rejected PDS submissions yet."}
        </p>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
);
EmptyState.displayName = 'EmptyState';

/**
 * Stats Card Component
 */
const StatsCard = memo<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  delay: number;
}>(({ title, value, icon, delay }) => (
  <BlurFade delay={delay} inView>
    <Card className="border-slate-200 dark:border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold">
              {typeof value === 'number' ? <NumberTicker value={value} /> : value}
            </p>
          </div>
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3">{icon}</div>
        </div>
      </CardContent>
    </Card>
  </BlurFade>
));
StatsCard.displayName = 'StatsCard';

/**
 * Approved Card Component
 */
const ApprovedCard = memo<{
  submission: Submission;
  delay: number;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onPrint: (id: string) => void;
  isDownloading?: boolean;
}>(({ submission, delay, onView, onDownload, onPrint, isDownloading = false }) => (
  <BlurFade delay={delay} inView>
    <Card className="border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/30 p-2.5">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">PDS {submission.year}</h3>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {submission.submittedAt && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>Submitted: {format(submission.submittedAt, 'MMM dd, yyyy')}</span>
              </div>
            )}
            {submission.approvedAt && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Approved: {format(submission.approvedAt, 'MMM dd, yyyy')}</span>
              </div>
            )}
            {submission.approvedBy && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <User className="h-4 w-4" />
                <span>Approved by: {submission.approvedBy}</span>
              </div>
            )}
            {submission.reviewNotes && (
              <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                  Review Notes
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {submission.reviewNotes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(submission.id)}
              className="flex-1 min-w-[100px]">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(submission.id)}
              disabled={isDownloading}
              className="flex-1 min-w-[100px]">
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPrint(submission.id)}
              disabled={isDownloading}
              className="flex-1 min-w-[100px]">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </BlurFade>
));
ApprovedCard.displayName = 'ApprovedCard';

/**
 * Rejected Card Component
 */
const RejectedCard = memo<{
  submission: Submission;
  delay: number;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}>(({ submission, delay, onView, onEdit, onDelete }) => (
  <BlurFade delay={delay} inView>
    <Card className="border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-rose-100 dark:bg-rose-950/30 p-2.5">
                <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">PDS {submission.year}</h3>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800">
              <XCircle className="h-3 w-3 mr-1" />
              Rejected
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {submission.submittedAt && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>Submitted: {format(submission.submittedAt, 'MMM dd, yyyy')}</span>
              </div>
            )}
            {submission.approvedBy && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <User className="h-4 w-4" />
                <span>Reviewed by: {submission.approvedBy}</span>
              </div>
            )}
            {submission.rejectionReason && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800">
                <p className="text-xs font-medium text-rose-700 dark:text-rose-400 mb-1">
                  Rejection Reason
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {submission.rejectionReason}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(submission.id)}
              className="flex-1 min-w-[100px]">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(submission.id)}
              className="flex-1 min-w-[100px]">
              <FileEdit className="h-4 w-4 mr-2" />
              Edit & Resubmit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(submission.id)}
              className="flex-1 min-w-[100px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </BlurFade>
));
RejectedCard.displayName = 'RejectedCard';

/**
 * Filter Bar Component
 */
const FilterBar = memo<{
  statusFilter: StatusFilter;
  sortBy: SortOption;
  searchQuery: string;
  onStatusChange: (status: StatusFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onSearchChange: (query: string) => void;
}>(({ statusFilter, sortBy, searchQuery, onStatusChange, onSortChange, onSearchChange }) => (
  <BlurFade delay={0.35} inView>
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search by year or version..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[160px] h-9">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <SortAsc className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[160px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="year-desc">Year (Newest)</SelectItem>
            <SelectItem value="year-asc">Year (Oldest)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </BlurFade>
));
FilterBar.displayName = 'FilterBar';

/**
 * Main Page Component
 */
export default function SubmissionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    data: pdsResponse,
    isLoading: loading,
    error: queryError,
  } = usePDSSubmissions();

  // PDF generation hook
  const { downloadPDF, openPDFInNewTab, isGenerating } = usePDSPdf();

  // Pagination hook
  const { page, pageSize, setPage, setPageSize } = usePagination(20);

  // Track which submission is being downloaded
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const submissions = useMemo(() => {
    if (!pdsResponse?.data) return [];
    return pdsResponse.data;
  }, [pdsResponse]);

  const error = queryError?.message || null;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter submissions (approved + rejected only)
  const filteredSubmissions = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];

    let filtered = submissions.filter(
      (submission: PDSSubmission) =>
        submission.status === 'approved' || submission.status === 'rejected'
    );

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s: PDSSubmission) => s.status === statusFilter);
    }

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (s: PDSSubmission) =>
          s.year.toString().includes(query) ||
          s.version.toString().includes(query)
      );
    }

    // Apply sorting
    return filtered.sort((a: PDSSubmission, b: PDSSubmission) => {
      switch (sortBy) {
        case 'date-desc': {
          const dateA = a.approvedAt || a.submittedAt || new Date(0);
          const dateB = b.approvedAt || b.submittedAt || new Date(0);
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        }
        case 'date-asc': {
          const dateA = a.approvedAt || a.submittedAt || new Date(0);
          const dateB = b.approvedAt || b.submittedAt || new Date(0);
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        }
        case 'year-desc':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        default:
          return 0;
      }
    });
  }, [submissions, statusFilter, debouncedSearchQuery, sortBy]);

  // Client-side pagination - slice the filtered submissions
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredSubmissions.slice(startIndex, endIndex);
  }, [filteredSubmissions, page, pageSize]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredSubmissions.length / pageSize);
  }, [filteredSubmissions.length, pageSize]);

  // Calculate statistics
  const stats = useMemo(() => {
    const approved = filteredSubmissions.filter((s: PDSSubmission) => s.status === 'approved').length;
    const rejected = filteredSubmissions.filter((s: PDSSubmission) => s.status === 'rejected').length;

    return {
      total: filteredSubmissions.length,
      approved,
      rejected,
    };
  }, [filteredSubmissions]);

  // Event handlers
  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/pds/view/${id}`);
    },
    [router]
  );

  /**
   * Fetch complete PDS data and download as PDF
   */
  const handleDownload = useCallback(
    async (id: string) => {
      try {
        setDownloadingId(id);
        toast.loading('Preparing PDF...', { id: 'pds-pdf-download' });

        // Fetch complete PDS data
        const response = await fetch(`/api/pds/${id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch PDS data');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error('Invalid API response: Missing data');
        }

        const pdsData = result.data;

        // Validate required data before transformation
        if (!pdsData.personalInfo) {
          throw new Error('Cannot generate PDF: Personal information is missing');
        }

        if (!pdsData.personalInfo.surname || !pdsData.personalInfo.firstName) {
          throw new Error('Cannot generate PDF: Name fields are required (surname and first name)');
        }

        console.log('PDS Data structure:', {
          hasSubmission: !!pdsData.submission,
          hasPersonalInfo: !!pdsData.personalInfo,
          hasFamilyBackground: !!pdsData.familyBackground,
          hasEducation: !!pdsData.education,
          year: pdsData.submission?.year || pdsData.year,
          version: pdsData.submission?.version || pdsData.version,
        });

        // Transform to PDF format
        const pdfReadyData = transformPdsForPdf(pdsData);

        console.log('PDF Ready Data validation:', {
          hasPersonalInfo: !!pdfReadyData.personalInfo,
          surname: pdfReadyData.personalInfo?.surname,
          firstName: pdfReadyData.personalInfo?.firstName,
        });

        // Generate and download PDF
        await downloadPDF(pdfReadyData);

        toast.success('PDS PDF downloaded successfully', {
          id: 'pds-pdf-download',
          description: `PDS for CY ${pdsData.submission?.year || pdsData.year || 'N/A'} has been downloaded.`,
        });
      } catch (error) {
        console.error('PDF download error:', error);
        toast.error('Failed to download PDF', {
          id: 'pds-pdf-download',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadPDF]
  );

  /**
   * Fetch complete PDS data and open PDF in new tab for printing
   */
  const handlePrint = useCallback(
    async (id: string) => {
      try {
        setDownloadingId(id);
        toast.loading('Preparing PDF for print...', { id: 'pds-pdf-print' });

        // Fetch complete PDS data
        const response = await fetch(`/api/pds/${id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch PDS data');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error('Invalid API response: Missing data');
        }

        const pdsData = result.data;

        // Validate required data before transformation
        if (!pdsData.personalInfo) {
          throw new Error('Cannot generate PDF: Personal information is missing');
        }

        if (!pdsData.personalInfo.surname || !pdsData.personalInfo.firstName) {
          throw new Error('Cannot generate PDF: Name fields are required (surname and first name)');
        }

        // Transform to PDF format
        const pdfReadyData = transformPdsForPdf(pdsData);

        // Open PDF in new tab for printing
        await openPDFInNewTab(pdfReadyData);

        toast.success('PDF opened in new tab', {
          id: 'pds-pdf-print',
          description: 'Use your browser\'s print function to print the PDF.',
        });
      } catch (error) {
        console.error('PDF print error:', error);
        toast.error('Failed to open PDF', {
          id: 'pds-pdf-print',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      } finally {
        setDownloadingId(null);
      }
    },
    [openPDFInNewTab]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/pds/edit/${id}`);
    },
    [router]
  );

  const handleDelete = useCallback((id: string) => {
    // TODO: Implement delete functionality with confirmation
    console.log('Delete submission:', id);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchQuery('');
    setSortBy('date-desc');
  }, []);

  const hasActiveFilters = useMemo(
    () => statusFilter !== 'all' || debouncedSearchQuery !== '',
    [statusFilter, debouncedSearchQuery]
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pb-10">
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen pb-10">
        <ErrorState message={error || 'Failed to load submissions'} />
      </div>
    );
  }

  const isEmpty = filteredSubmissions.length === 0;

  return (
    <div className="min-h-screen pb-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BlurFade delay={0}>
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  PDS Submissions
                </h1>
                <Badge
                  variant="outline"
                  className="border-slate-500 text-slate-700 dark:border-slate-600 dark:text-slate-400 px-2 py-0.5 text-xs">
                  <FolderCheck className="h-3 w-3 mr-1" />
                  History
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View all your approved and rejected PDS submissions
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Statistics */}
        {!isEmpty && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
            <StatsCard
              title="Total Submissions"
              value={stats.total}
              icon={
                <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              }
              delay={0.1}
            />
            <StatsCard
              title="Approved"
              value={stats.approved}
              icon={
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              }
              delay={0.15}
            />
            <StatsCard
              title="Rejected"
              value={stats.rejected}
              icon={
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              }
              delay={0.2}
            />
          </div>
        )}

        {/* Filters and Sort */}
        {!isEmpty && (
          <FilterBar
            statusFilter={statusFilter}
            sortBy={sortBy}
            searchQuery={searchQuery}
            onStatusChange={setStatusFilter}
            onSortChange={setSortBy}
            onSearchChange={setSearchQuery}
          />
        )}

        {/* Submissions Grid or Empty State */}
        {isEmpty ? (
          <BlurFade delay={0.4}>
            <EmptyState hasFilters={hasActiveFilters} onClearFilters={handleClearFilters} />
          </BlurFade>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedSubmissions.map((submission: PDSSubmission, index: number) => {
                const mappedSubmission: Submission = {
                  id: submission.id,
                  year: submission.year,
                  version: submission.version,
                  status: submission.status,
                  submittedAt: submission.submittedAt,
                  approvedAt: submission.approvedAt,
                  approvedBy: null,
                  rejectionReason: null,
                  reviewNotes: null,
                };

                if (submission.status === 'approved') {
                  return (
                    <ApprovedCard
                      key={submission.id}
                      submission={mappedSubmission}
                      delay={0.4 + index * 0.05}
                      onView={handleView}
                      onDownload={handleDownload}
                      onPrint={handlePrint}
                      isDownloading={downloadingId === submission.id || isGenerating}
                    />
                  );
                } else {
                  return (
                    <RejectedCard
                      key={submission.id}
                      submission={mappedSubmission}
                      delay={0.4 + index * 0.05}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  );
                }
              })}
            </div>

            {/* Pagination */}
            <BlurFade delay={0.5} inView>
              <CardGridPagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                total={filteredSubmissions.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemName="submissions"
              />
            </BlurFade>
          </>
        )}
      </div>
    </div>
  );
}
