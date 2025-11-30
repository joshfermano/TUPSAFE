'use client';

/**
 * PDS View Page - Minimalistic & Premium Design
 *
 * Design Philosophy:
 * - Clean, modern, and minimalistic interface
 * - Premium feel through typography and spacing
 * - Subtle animations for smooth UX
 * - TUP Manila red theme integration
 * - Compact, space-efficient layouts
 *
 * Performance optimizations:
 * - React.memo on all child components
 * - useMemo for expensive calculations
 * - useCallback for event handlers
 * - Minimal animation overhead
 *
 * Target: < 200 KB First Load JS
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../providers/AuthProvider';
import { usePds } from '@tupsafe/mock-data/api';
import { usePDSPdf } from '../../../../hooks/usePDSPdf';
import { transformPdsForPdf } from '../../../../lib/utils/pds-transformations';
import { toast } from 'sonner';
import type { PdsSubmission } from '@tupsafe/mock-data';
import { differenceInYears, format, formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Download,
  Printer,
  Edit,
  Eye,
  Plus,
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  Archive,
  Loader2,
  Info,
} from 'lucide-react';

// Subtle UI Components - Magic UI used sparingly
import { NumberTicker, BlurFade } from '@tupsafe/shared-ui';

// Standard UI Components
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Progress } from '../../../../components/ui/progress';
import { Card, CardContent } from '../../../../components/ui/card';
import { Tooltip } from '../../../../components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../../components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { cn } from '../../../../lib/utils';

// ============================================================================
// CONFIGURATION
// ============================================================================

const STATUS_COLORS = {
  draft:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  submitted:
    'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  reviewing:
    'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  approved:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  rejected:
    'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
};

const STATUS_ICONS = {
  draft: FileEdit,
  submitted: Clock,
  reviewing: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateCompletion = (submission: PdsSubmission): number => {
  if (submission.status === 'approved') return 100;
  if (submission.status === 'submitted' || submission.status === 'reviewing')
    return 95;
  if (submission.status === 'draft') return Math.floor(Math.random() * 40) + 50;
  return 0;
};

// ============================================================================
// STATISTICS CARD COMPONENT
// ============================================================================

interface StatsCardProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  color?: 'default' | 'green' | 'yellow' | 'blue' | 'red';
}

const StatsCard = React.memo(
  ({ label, value, icon: Icon, color = 'default' }: StatsCardProps) => {
    const iconColors = {
      default: 'text-slate-500 dark:text-slate-400',
      green: 'text-emerald-600 dark:text-emerald-500',
      yellow: 'text-amber-600 dark:text-amber-500',
      blue: 'text-blue-600 dark:text-blue-500',
      red: 'text-rose-600 dark:text-rose-500',
    };

    const iconBgColors = {
      default: 'bg-slate-100 dark:bg-slate-800',
      green: 'bg-emerald-50 dark:bg-emerald-950/30',
      yellow: 'bg-amber-50 dark:bg-amber-950/30',
      blue: 'bg-blue-50 dark:bg-blue-950/30',
      red: 'bg-rose-50 dark:bg-rose-950/30',
    };

    return (
      <Card className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {label}
              </p>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                <NumberTicker value={value} />
              </div>
            </div>
            {Icon && (
              <div className={cn('p-2.5 rounded-lg', iconBgColors[color])}>
                <Icon className={cn('h-5 w-5', iconColors[color])} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatsCard.displayName = 'StatsCard';

// ============================================================================
// PDS CARD COMPONENT - ENHANCED
// ============================================================================

// Helper function to get PDF restriction message based on status
// PDF is available for: approved, submitted, reviewing
// PDF is NOT available for: draft, rejected
const getPdfRestrictionMessage = (
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reviewing'
): string => {
  switch (status) {
    case 'draft':
      return 'Submit your PDS to enable PDF download';
    case 'rejected':
      return 'Address feedback and resubmit to enable PDF download';
    case 'approved':
    case 'submitted':
    case 'reviewing':
      return 'PDF download available';
    default:
      return 'Submit your PDS to enable PDF download';
  }
};

interface PDSCardProps {
  submission: PdsSubmission;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onPrint: () => void;
  isGenerating?: boolean;
}

const PDSCard = React.memo(
  ({
    submission,
    onView,
    onEdit,
    onDownload,
    onPrint,
    isGenerating = false,
  }: PDSCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const completion = useMemo(
      () => calculateCompletion(submission),
      [submission]
    );

    // Check if PDF download/print is allowed
    // PDF is available for: approved, submitted, reviewing
    // PDF is NOT available for: draft, rejected
    const canDownloadPDF =
      submission.status === 'approved' ||
      submission.status === 'submitted' ||
      submission.status === 'reviewing';

    const StatusIcon =
      STATUS_ICONS[submission.status as keyof typeof STATUS_ICONS];
    const submissionYear = submission.submittedAt
      ? new Date(submission.submittedAt).getFullYear()
      : new Date(submission.createdAt).getFullYear();

    const sections = useMemo(
      () => [
        { name: 'Personal Information', completed: true },
        { name: 'Family Background', completed: true },
        { name: 'Educational Background', completed: completion > 60 },
        { name: 'Civil Service Eligibility', completed: completion > 70 },
        { name: 'Work Experience', completed: completion > 80 },
        { name: 'Voluntary Work', completed: completion > 85 },
        { name: 'Training Programs', completed: completion > 90 },
        { name: 'Other Information', completed: completion > 95 },
      ],
      [completion]
    );

    return (
      <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-[oklch(0.55_0.22_15)] dark:hover:border-[oklch(0.65_0.24_15)] transition-all duration-200">
        <CardContent className="p-5 space-y-3.5">
          {/* Header */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-0.5 truncate">
                Personal Data Sheet {submissionYear}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {submission.submittedAt
                  ? `Submitted ${formatDistanceToNow(
                      new Date(submission.submittedAt),
                      { addSuffix: true }
                    )}`
                  : `Created ${formatDistanceToNow(
                      new Date(submission.createdAt),
                      { addSuffix: true }
                    )}`}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 px-2 py-0.5 shrink-0',
                STATUS_COLORS[submission.status as keyof typeof STATUS_COLORS]
              )}>
              <StatusIcon className="h-3 w-3" />
              <span className="capitalize text-xs font-medium">
                {submission.status}
              </span>
            </Badge>
          </div>

          {/* Completion Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Completion
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-semibold">
                {completion}%
              </span>
            </div>
            <Progress value={completion} className="h-1.5" />
          </div>

          {/* Version and Last Updated */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />v{submission.version}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(submission.updatedAt), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Expandable Sections Preview */}
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between h-8 hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="text-xs font-medium">View Sections</span>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="space-y-1.5">
                {sections.map((section, index) => (
                  <li key={index} className="flex items-center gap-2 text-xs">
                    {section.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                    )}
                    <span
                      className={cn(
                        section.completed
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-500'
                      )}>
                      {section.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="gap-1.5 h-8 text-xs">
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
              {(submission.status === 'draft' ||
                submission.status === 'rejected') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-1.5 h-8 text-xs">
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
              <Tooltip
                content={getPdfRestrictionMessage(
                  submission.status as
                    | 'draft'
                    | 'submitted'
                    | 'approved'
                    | 'rejected'
                    | 'reviewing'
                )}
                disabled={canDownloadPDF}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={canDownloadPDF ? onDownload : undefined}
                  disabled={isGenerating || !canDownloadPDF}
                  className={cn(
                    'gap-1.5 h-8 text-xs',
                    !canDownloadPDF && 'opacity-50 cursor-not-allowed'
                  )}>
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  PDF
                </Button>
              </Tooltip>
              <Tooltip
                content={getPdfRestrictionMessage(
                  submission.status as
                    | 'draft'
                    | 'submitted'
                    | 'approved'
                    | 'rejected'
                    | 'reviewing'
                )}
                disabled={canDownloadPDF}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={canDownloadPDF ? onPrint : undefined}
                  disabled={isGenerating || !canDownloadPDF}
                  className={cn(
                    'gap-1.5 h-8 text-xs',
                    !canDownloadPDF && 'opacity-50 cursor-not-allowed'
                  )}>
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Printer className="h-3.5 w-3.5" />
                  )}
                  Print
                </Button>
              </Tooltip>
            </div>
            {/* PDF Restriction Notice */}
            {!canDownloadPDF && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Info className="h-3 w-3 shrink-0" />
                <span>
                  {getPdfRestrictionMessage(
                    submission.status as
                      | 'draft'
                      | 'submitted'
                      | 'approved'
                      | 'rejected'
                      | 'reviewing'
                  )}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

PDSCard.displayName = 'PDSCard';

// ============================================================================
// STATE COMPONENTS
// ============================================================================

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
      Loading your PDS submissions...
    </p>
  </div>
);

const ErrorState = ({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <XCircle className="h-16 w-16 text-rose-500" />
    <p className="text-slate-900 dark:text-slate-100 text-xl font-semibold">
      Something went wrong
    </p>
    <p className="text-slate-600 dark:text-slate-400">{error}</p>
    <Button onClick={() => window.location.reload()}>Try Again</Button>
  </div>
);

const EmptyState = ({
  onCreateNew,
  onViewArchive,
}: {
  onCreateNew: () => void;
  onViewArchive: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-5 px-4">
    {/* Icon Container */}
    <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800">
      <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
    </div>

    {/* Text Content */}
    <div className="text-center space-y-2 max-w-md">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        No Active PDS Submissions
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        You haven&apos;t created any Personal Data Sheet in the last 5 years.
        Start a new submission or view your archived records.
      </p>
    </div>

    {/* Action Buttons */}
    <div className="flex gap-3">
      <Button
        onClick={onCreateNew}
        className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white">
        <Plus className="h-4 w-4" />
        Create New PDS
      </Button>
      <Button variant="outline" onClick={onViewArchive} className="gap-2">
        <Archive className="h-4 w-4" />
        View Archive
      </Button>
    </div>
  </div>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PDSViewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { submissions, getCompleteSubmission, loading, error } = usePds(
    user?.id || ''
  );

  // PDF generation hook
  const { downloadPDF, openPDFInNewTab, isGenerating } = usePDSPdf();

  // Track which submission is currently being processed
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'date-desc' | 'date-asc' | 'status' | 'completion'
  >('date-desc');

  // Filter active submissions (0-5 years old)
  const activeSubmissions = useMemo(() => {
    const filtered = submissions.filter((submission) => {
      const submissionDate = submission.submittedAt || submission.createdAt;
      const age = differenceInYears(new Date(), new Date(submissionDate));
      return age < 5;
    });

    // Apply status filter
    const statusFiltered =
      statusFilter === 'all'
        ? filtered
        : filtered.filter((s) => s.status === statusFilter);

    // Apply sorting
    return statusFiltered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'status':
          return a.status.localeCompare(b.status);
        case 'completion':
          return calculateCompletion(b) - calculateCompletion(a);
        default:
          return 0;
      }
    });
  }, [submissions, statusFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(
    () => ({
      total: activeSubmissions.length,
      approved: activeSubmissions.filter((s) => s.status === 'approved').length,
      pending: activeSubmissions.filter(
        (s) => s.status === 'submitted' || s.status === 'reviewing'
      ).length,
      drafts: activeSubmissions.filter((s) => s.status === 'draft').length,
    }),
    [activeSubmissions]
  );

  // Handlers
  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/pds/view/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/pds/edit/${id}`);
    },
    [router]
  );

  const handleDownload = useCallback(
    async (id: string) => {
      const pdsData = getCompleteSubmission(id);
      const submission = submissions.find((s) => s.id === id);

      if (!pdsData || !submission) {
        toast.error('PDS data not available', {
          description: 'Unable to generate PDF. Please try again.',
        });
        return;
      }

      setProcessingId(id);
      try {
        const pdfData = transformPdsForPdf({
          ...pdsData,
          id: submission.id,
          submittedAt: submission.submittedAt,
          version: submission.version,
        });

        toast.loading('Generating PDF...', { id: `pdf-download-${id}` });
        await downloadPDF(pdfData);
        toast.success('PDF downloaded successfully', {
          id: `pdf-download-${id}`,
          description: `PDS_${pdfData.personalInfo.surname}_${pdfData.personalInfo.firstName}.pdf`,
        });
      } catch (error) {
        toast.error('Failed to generate PDF', {
          id: `pdf-download-${id}`,
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        });
      } finally {
        setProcessingId(null);
      }
    },
    [getCompleteSubmission, submissions, downloadPDF]
  );

  const handlePrint = useCallback(
    async (id: string) => {
      const pdsData = getCompleteSubmission(id);
      const submission = submissions.find((s) => s.id === id);

      if (!pdsData || !submission) {
        toast.error('PDS data not available', {
          description: 'Unable to generate PDF for printing. Please try again.',
        });
        return;
      }

      setProcessingId(id);
      try {
        const pdfData = transformPdsForPdf({
          ...pdsData,
          id: submission.id,
          submittedAt: submission.submittedAt,
          version: submission.version,
        });

        toast.loading('Preparing print preview...', { id: `pdf-print-${id}` });
        await openPDFInNewTab(pdfData);
        toast.success('PDF opened in new tab', {
          id: `pdf-print-${id}`,
          description:
            'Use the browser print function (Ctrl+P / Cmd+P) to print.',
        });
      } catch (error) {
        toast.error('Failed to open print preview', {
          id: `pdf-print-${id}`,
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        });
      } finally {
        setProcessingId(null);
      }
    },
    [getCompleteSubmission, submissions, openPDFInNewTab]
  );

  const handleCreateNew = useCallback(() => {
    router.push('/dashboard/pds/create');
  }, [router]);

  const handleViewArchive = useCallback(() => {
    router.push('/dashboard/pds/archive');
  }, [router]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen pb-12">
      <div className="space-y-6">
        {/* Header */}
        <BlurFade delay={0.05}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                PDS Submissions
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View and manage your active Personal Data Sheet submissions from
                the last 5 years
              </p>
            </div>
            <Button onClick={handleCreateNew} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Create New PDS
            </Button>
          </div>
        </BlurFade>

        {/* Statistics */}
        {activeSubmissions.length > 0 && (
          <BlurFade delay={0.1}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatsCard
                label="Total Submissions"
                value={stats.total}
                icon={FileText}
              />
              <StatsCard
                label="Approved"
                value={stats.approved}
                icon={CheckCircle2}
                color="green"
              />
              <StatsCard
                label="Pending Review"
                value={stats.pending}
                icon={Clock}
                color="yellow"
              />
              <StatsCard
                label="Drafts"
                value={stats.drafts}
                icon={FileEdit}
                color="blue"
              />
            </div>
          </BlurFade>
        )}

        {/* Filters and Sort */}
        {activeSubmissions.length > 0 && (
          <BlurFade delay={0.15}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <SortAsc className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleViewArchive}
                className="gap-2 h-9 shrink-0">
                <Archive className="h-4 w-4" />
                View Archive
              </Button>
            </div>
          </BlurFade>
        )}

        {/* Cards Grid or Empty State */}
        {activeSubmissions.length === 0 ? (
          <BlurFade delay={0.2}>
            <EmptyState
              onCreateNew={handleCreateNew}
              onViewArchive={handleViewArchive}
            />
          </BlurFade>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeSubmissions.map((submission, index) => (
              <BlurFade key={submission.id} delay={0.2 + index * 0.05}>
                <PDSCard
                  submission={submission}
                  onView={() => handleView(submission.id)}
                  onEdit={() => handleEdit(submission.id)}
                  onDownload={() => handleDownload(submission.id)}
                  onPrint={() => handlePrint(submission.id)}
                  isGenerating={isGenerating && processingId === submission.id}
                />
              </BlurFade>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
