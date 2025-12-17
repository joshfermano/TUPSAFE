'use client';

import React, { useMemo, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useSALNSubmissions } from '../../../../hooks/useSALN';
import { format, formatDistanceToNow } from 'date-fns';
import { EmployeeOnlyGuard } from '../../../../components/guards/EmployeeOnlyGuard';
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  CreditCard,
  AlertCircle,
  Loader2,
  Search,
  Calendar,
  User,
  Trash2,
} from 'lucide-react';

import { NumberTicker, BlurFade } from '@tupsafe/shared-ui';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent } from '../../../../components/ui/card';
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
import { Input } from '../../../../components/ui/input';
import { cn } from '../../../../lib/utils';
import { parseCurrencyFromDb } from '../../../../lib/validations/saln-schema';
import { useDebounce } from '../../../../hooks/useDebounce';

// Type definitions
type SortOption = 'date-desc' | 'date-asc' | 'year-desc' | 'year-asc';
type StatusFilter = 'all' | 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';

interface SalnSubmissionWithNumbers {
  id: string;
  userId: string;
  year: number;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  submittedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  reviewNotes: string | null;
  filingType: 'joint' | 'separate' | 'not_applicable';
  createdAt: Date;
  updatedAt: Date;
}

// Parse string currency from database to number
const parseSubmission = (submission: {
  id: string;
  userId: string;
  year: number;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  totalAssets: string | number | null;
  totalLiabilities: string | number | null;
  netWorth: string | number | null;
  submittedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  reviewNotes: string | null;
  filingType: 'joint' | 'separate' | 'not_applicable';
  createdAt: Date;
  updatedAt: Date;
}): SalnSubmissionWithNumbers => ({
  ...submission,
  totalAssets: parseCurrencyFromDb(submission.totalAssets),
  totalLiabilities: parseCurrencyFromDb(submission.totalLiabilities),
  netWorth: parseCurrencyFromDb(submission.netWorth),
  rejectionReason: submission.rejectionReason || null,
  reviewNotes: submission.reviewNotes || null,
});

// Calculate year-over-year change
const calculateYearOverYearChange = (
  current: SalnSubmissionWithNumbers,
  previous?: SalnSubmissionWithNumbers
) => {
  if (!previous) return null;
  const currentNetWorth = current.netWorth;
  const previousNetWorth = previous.netWorth;
  if (previousNetWorth === 0) return null;
  return (
    ((currentNetWorth - previousNetWorth) / Math.abs(previousNetWorth)) * 100
  );
};

/**
 * Loading State Component - Matches PDS pattern
 */
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Loader2 className="h-12 w-12 animate-spin text-[oklch(0.55_0.22_15)]" />
    <p className="text-slate-600 dark:text-slate-400">Loading submissions...</p>
  </div>
));
LoadingState.displayName = 'LoadingState';

/**
 * Error State Component - Matches PDS pattern
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
 * Empty State Component - Matches PDS pattern with proper styling
 */
const EmptyState = memo<{
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateNew: () => void;
}>(({ hasFilters, onClearFilters, onCreateNew }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-5 px-4">
    <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-5">
      <FileText className="h-20 w-20 text-slate-600 dark:text-slate-400" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        {hasFilters ? 'No Results Found' : 'No SALN Submissions'}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
        {hasFilters
          ? 'No submissions match your current filters. Try adjusting your search.'
          : "You don't have any SALN submissions yet. Create your first SALN to get started."}
      </p>
    </div>
    <div className="flex gap-3">
      {hasFilters ? (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear Filters
        </Button>
      ) : (
        <Button
          onClick={onCreateNew}
          className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
          <Plus className="h-4 w-4" />
          Create New SALN
        </Button>
      )}
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

/**
 * Stats Card Component - Matches PDS pattern exactly
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
 * Approved SALN Card - Matches PDS approved card pattern
 */
const ApprovedCard = memo<{
  submission: SalnSubmissionWithNumbers;
  previousYear?: SalnSubmissionWithNumbers;
  delay: number;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onPrint: (id: string) => void;
}>(({ submission, previousYear, delay, onView, onDownload, onPrint }) => {
  const [isOpen, setIsOpen] = useState(false);
  const yearOverYearChange = calculateYearOverYearChange(submission, previousYear);

  return (
    <BlurFade delay={delay} inView>
      <Card className="border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300">
        <CardContent className="p-5 space-y-3.5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/30 p-2.5">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">SALN {submission.year}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  As of December 31, {submission.year}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          </div>

          {/* Financial Summary */}
          <div className="space-y-2">
            {/* Total Assets */}
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Total Assets
                </span>
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                ₱ <NumberTicker value={submission.totalAssets} />
              </span>
            </div>

            {/* Total Liabilities */}
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Total Liabilities
                </span>
              </div>
              <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                ₱ <NumberTicker value={submission.totalLiabilities} />
              </span>
            </div>

            {/* Net Worth - Highlighted */}
            <div className="relative p-3 bg-slate-50 dark:bg-slate-900/50 border border-[oklch(0.55_0.22_15)]/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Net Worth
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-base font-bold',
                      submission.netWorth >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    )}>
                    ₱ <NumberTicker value={submission.netWorth} />
                  </span>
                  {yearOverYearChange !== null && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'gap-0.5 px-1.5 py-0',
                        yearOverYearChange >= 0
                          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                          : 'border-rose-500 text-rose-700 dark:text-rose-400'
                      )}>
                      {yearOverYearChange >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="text-xs font-bold">
                        {yearOverYearChange >= 0 ? '+' : ''}
                        {Math.abs(yearOverYearChange).toFixed(1)}%
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
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

          {/* Expandable Details */}
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between hover:bg-slate-100 dark:hover:bg-slate-800 h-8">
                <span className="text-xs font-medium">Financial Details</span>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Filing Type</span>
                  <span className="font-medium capitalize text-slate-900 dark:text-slate-100">
                    {submission.filingType === 'not_applicable'
                      ? 'N/A'
                      : submission.filingType}
                  </span>
                </div>
                {yearOverYearChange !== null && previousYear && (
                  <>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400">
                        Previous Year Net Worth
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        ₱{' '}
                        {previousYear.netWorth.toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-600 dark:text-slate-400">
                        Net Worth Change
                      </span>
                      <span
                        className={cn(
                          'font-bold',
                          submission.netWorth - previousYear.netWorth >= 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        )}>
                        {submission.netWorth - previousYear.netWorth >= 0 ? '+' : ''}
                        ₱{' '}
                        {Math.abs(
                          submission.netWorth - previousYear.netWorth
                        ).toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Actions - Matches PDS pattern with flex-wrap gap-2 */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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
              className="flex-1 min-w-[100px]">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPrint(submission.id)}
              className="flex-1 min-w-[100px]">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </BlurFade>
  );
});
ApprovedCard.displayName = 'ApprovedCard';

/**
 * Rejected SALN Card - Matches PDS rejected card pattern
 */
const RejectedCard = memo<{
  submission: SalnSubmissionWithNumbers;
  delay: number;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}>(({ submission, delay, onView, onEdit, onDelete }) => (
  <BlurFade delay={delay} inView>
    <Card className="border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-300">
      <CardContent className="p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-100 dark:bg-rose-950/30 p-2.5">
              <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">SALN {submission.year}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                As of December 31, {submission.year}
              </p>
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

        {/* Actions - Matches PDS pattern with flex-wrap gap-2 */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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
      </CardContent>
    </Card>
  </BlurFade>
));
RejectedCard.displayName = 'RejectedCard';

/**
 * Draft SALN Card - For draft status submissions
 */
const DraftCard = memo<{
  submission: SalnSubmissionWithNumbers;
  delay: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}>(({ submission, delay, onEdit, onDelete }) => (
  <BlurFade delay={delay} inView>
    <Card className="border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300">
      <CardContent className="p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-950/30 p-2.5">
              <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">SALN {submission.year}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                As of December 31, {submission.year}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>
              Created: {formatDistanceToNow(submission.createdAt, { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            <span>
              Updated: {formatDistanceToNow(submission.updatedAt, { addSuffix: true })}
            </span>
          </div>

          {/* Draft Notice */}
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
              Draft Status
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              This SALN is saved as a draft. Continue editing to complete and submit it.
            </p>
          </div>
        </div>

        {/* Actions - Edit and Delete for drafts */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(submission.id)}
            className="flex-1 min-w-[100px] bg-[oklch(0.55_0.22_15)] text-white hover:bg-[oklch(0.50_0.22_15)]">
            <Edit className="h-4 w-4 mr-2" />
            Continue Editing
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
      </CardContent>
    </Card>
  </BlurFade>
));
DraftCard.displayName = 'DraftCard';

/**
 * Submitted SALN Card - For submitted status (pending review)
 */
const SubmittedCard = memo<{
  submission: SalnSubmissionWithNumbers;
  delay: number;
  onView: (id: string) => void;
}>(({ submission, delay, onView }) => (
  <BlurFade delay={delay} inView>
    <Card className="border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
      <CardContent className="p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950/30 p-2.5">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">SALN {submission.year}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                As of December 31, {submission.year}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        </div>

        {/* Financial Summary */}
        <div className="space-y-2">
          {/* Total Assets */}
          <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Total Assets
              </span>
            </div>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
              ₱ <NumberTicker value={submission.totalAssets} />
            </span>
          </div>

          {/* Total Liabilities */}
          <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Total Liabilities
              </span>
            </div>
            <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
              ₱ <NumberTicker value={submission.totalLiabilities} />
            </span>
          </div>

          {/* Net Worth */}
          <div className="relative p-3 bg-slate-50 dark:bg-slate-900/50 border border-[oklch(0.55_0.22_15)]/20 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Net Worth
                </span>
              </div>
              <span
                className={cn(
                  'text-base font-bold',
                  submission.netWorth >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                )}>
                ₱ <NumberTicker value={submission.netWorth} />
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          {submission.submittedAt && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>Submitted: {format(submission.submittedAt, 'MMM dd, yyyy')}</span>
            </div>
          )}

          {/* Pending Notice */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
              Pending Review
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Your SALN has been submitted and is waiting for review by HR.
            </p>
          </div>
        </div>

        {/* Actions - View only for submitted */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(submission.id)}
            className="flex-1 min-w-[100px]">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  </BlurFade>
));
SubmittedCard.displayName = 'SubmittedCard';

/**
 * Reviewing SALN Card - For reviewing status (under review)
 */
const ReviewingCard = memo<{
  submission: SalnSubmissionWithNumbers;
  delay: number;
  onView: (id: string) => void;
}>(({ submission, delay, onView }) => (
  <BlurFade delay={delay} inView>
    <Card className="border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300">
      <CardContent className="p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 dark:bg-purple-950/30 p-2.5">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">SALN {submission.year}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                As of December 31, {submission.year}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800">
            <Eye className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        </div>

        {/* Financial Summary */}
        <div className="space-y-2">
          {/* Total Assets */}
          <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Total Assets
              </span>
            </div>
            <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
              ₱ <NumberTicker value={submission.totalAssets} />
            </span>
          </div>

          {/* Total Liabilities */}
          <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Total Liabilities
              </span>
            </div>
            <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
              ₱ <NumberTicker value={submission.totalLiabilities} />
            </span>
          </div>

          {/* Net Worth */}
          <div className="relative p-3 bg-slate-50 dark:bg-slate-900/50 border border-[oklch(0.55_0.22_15)]/20 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[oklch(0.55_0.22_15)]" />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Net Worth
                </span>
              </div>
              <span
                className={cn(
                  'text-base font-bold',
                  submission.netWorth >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                )}>
                ₱ <NumberTicker value={submission.netWorth} />
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          {submission.submittedAt && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>Submitted: {format(submission.submittedAt, 'MMM dd, yyyy')}</span>
            </div>
          )}

          {/* Review Notice */}
          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">
              Under Review
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Your SALN is currently being reviewed by HR. You&apos;ll be notified once the review is complete.
            </p>
          </div>
        </div>

        {/* Actions - View only for reviewing */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(submission.id)}
            className="flex-1 min-w-[100px]">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  </BlurFade>
));
ReviewingCard.displayName = 'ReviewingCard';

/**
 * Filter Bar Component - Matches PDS pattern exactly
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
          placeholder="Search by year..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="reviewing">Under Review</SelectItem>
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
 * Main SALN Submissions Page
 */
export default function SALNViewPage() {
  const router = useRouter();

  // Use real hook for SALN submissions
  const { data: submissionsResponse, isLoading, error } = useSALNSubmissions();

  // Extract submissions from response
  const allSubmissions = useMemo(
    () => submissionsResponse?.data || [],
    [submissionsResponse]
  );

  const loading = isLoading;
  const errorMessage = error?.message || null;

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter submissions based on status
  const filteredSubmissions = useMemo(() => {
    if (!allSubmissions) return [];

    // Parse submissions - show ALL statuses
    let filtered = allSubmissions.map(parseSubmission);

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s: SalnSubmissionWithNumbers) => s.status === statusFilter);
    }

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((s: SalnSubmissionWithNumbers) => s.year.toString().includes(query));
    }

    // Apply sorting
    return filtered.sort((a: SalnSubmissionWithNumbers, b: SalnSubmissionWithNumbers) => {
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
  }, [allSubmissions, statusFilter, debouncedSearchQuery, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const draft = filteredSubmissions.filter((s: SalnSubmissionWithNumbers) => s.status === 'draft').length;
    const submitted = filteredSubmissions.filter((s: SalnSubmissionWithNumbers) => s.status === 'submitted').length;
    const reviewing = filteredSubmissions.filter((s: SalnSubmissionWithNumbers) => s.status === 'reviewing').length;
    const approved = filteredSubmissions.filter((s: SalnSubmissionWithNumbers) => s.status === 'approved').length;
    const rejected = filteredSubmissions.filter((s: SalnSubmissionWithNumbers) => s.status === 'rejected').length;

    return {
      total: filteredSubmissions.length,
      draft,
      submitted,
      reviewing,
      approved,
      rejected,
    };
  }, [filteredSubmissions]);

  // Event handlers
  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/saln/view/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/saln/edit/${id}`);
    },
    [router]
  );

  const handleDownload = useCallback(
    (id: string) => {
      router.push(`/dashboard/saln/view/${id}`);
    },
    [router]
  );

  const handlePrint = useCallback(
    (id: string) => {
      router.push(`/dashboard/saln/view/${id}`);
    },
    [router]
  );

  const handleDelete = useCallback((id: string) => {
    // TODO: Implement delete functionality with confirmation
    console.log('Delete submission:', id);
  }, []);

  const handleCreateNew = useCallback(() => {
    router.push('/dashboard/saln/create');
  }, [router]);

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
      <EmployeeOnlyGuard>
        <div className="min-h-screen pb-10">
          <LoadingState />
        </div>
      </EmployeeOnlyGuard>
    );
  }

  // Error state
  if (errorMessage) {
    return (
      <EmployeeOnlyGuard>
        <div className="min-h-screen pb-10">
          <ErrorState message={errorMessage || 'Failed to load submissions'} />
        </div>
      </EmployeeOnlyGuard>
    );
  }

  const isEmpty = filteredSubmissions.length === 0;

  return (
    <EmployeeOnlyGuard>
      <div className="min-h-screen pb-10">
        <div className="space-y-6">
          {/* Header - Matches PDS pattern */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <BlurFade delay={0}>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  SALN Submissions
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  View all your SALN submissions and track their status
                </p>
              </div>
            </BlurFade>
          </div>

          {/* Statistics - Matches PDS pattern with grid-cols-2 lg:grid-cols-3 gap-3.5 */}
          {!isEmpty && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
              <StatsCard
                title="Total Submissions"
                value={stats.total}
                icon={<FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
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
                icon={<XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                delay={0.2}
              />
            </div>
          )}

          {/* Filter Bar - Matches PDS pattern */}
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
              <EmptyState
                hasFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                onCreateNew={handleCreateNew}
              />
            </BlurFade>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubmissions.map((submission: SalnSubmissionWithNumbers, index: number) => {
                const previousYear = filteredSubmissions[index + 1];
                const delay = 0.4 + index * 0.05;

                // Render appropriate card based on submission status
                switch (submission.status) {
                  case 'draft':
                    return (
                      <DraftCard
                        key={submission.id}
                        submission={submission}
                        delay={delay}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    );

                  case 'submitted':
                    return (
                      <SubmittedCard
                        key={submission.id}
                        submission={submission}
                        delay={delay}
                        onView={handleView}
                      />
                    );

                  case 'reviewing':
                    return (
                      <ReviewingCard
                        key={submission.id}
                        submission={submission}
                        delay={delay}
                        onView={handleView}
                      />
                    );

                  case 'approved':
                    return (
                      <ApprovedCard
                        key={submission.id}
                        submission={submission}
                        previousYear={previousYear}
                        delay={delay}
                        onView={handleView}
                        onDownload={handleDownload}
                        onPrint={handlePrint}
                      />
                    );

                  case 'rejected':
                    return (
                      <RejectedCard
                        key={submission.id}
                        submission={submission}
                        delay={delay}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    );

                  default:
                    // Fallback for any unexpected status
                    return null;
                }
              })}
            </div>
          )}
        </div>
      </div>
    </EmployeeOnlyGuard>
  );
}
