'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../providers/AuthProvider';
import { useSALNSubmissions } from '../../../../hooks/useSaln';
import { differenceInYears, format, formatDistanceToNow } from 'date-fns';
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
  Archive,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

import { NumberTicker, AnimatedGradientText } from '@tupsafe/shared-ui';
import { BlurFade } from '@tupsafe/shared-ui';
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
import { cn } from '../../../../lib/utils';
import { parseCurrencyFromDb } from '../../../../lib/validations/saln-schema';

// Type for SALN submission with parsed numbers
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
  filingType: 'joint' | 'separate' | 'not_applicable';
  createdAt: Date;
  updatedAt: Date;
}

// Status badge color configuration with TUP Manila Crimson theme
const STATUS_COLORS = {
  draft:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  submitted:
    'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  reviewing:
    'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
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

// Parse string currency from database to number
// Type assertion needed: Database returns string | null for currency fields, we parse to number
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
  filingType: 'joint' | 'separate' | 'not_applicable';
  createdAt: Date;
  updatedAt: Date;
}): SalnSubmissionWithNumbers => ({
  ...submission,
  totalAssets: parseCurrencyFromDb(submission.totalAssets),
  totalLiabilities: parseCurrencyFromDb(submission.totalLiabilities),
  netWorth: parseCurrencyFromDb(submission.netWorth),
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

// Statistics Card Component - Clean & Compact
interface StatsCardProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'crimson';
  prefix?: string;
  suffix?: string;
  showChange?: boolean;
  changeValue?: number;
}

const StatsCard = React.memo(
  ({
    label,
    value,
    icon: Icon,
    color = 'default',
    prefix,
    suffix,
    showChange = false,
    changeValue,
  }: StatsCardProps) => {
    const iconColor = {
      default:
        'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
      green:
        'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
      red: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30',
      yellow:
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
      blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
      crimson:
        'text-[oklch(0.55_0.22_15)] dark:text-[oklch(0.65_0.22_15)] bg-[oklch(0.55_0.22_15)]/5 dark:bg-[oklch(0.55_0.22_15)]/10',
    };

    return (
      <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-[oklch(0.55_0.22_15)]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {label}
              </p>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {prefix && <span className="text-lg">{prefix}</span>}
                  <NumberTicker value={value} />
                  {suffix && <span className="text-lg ml-1">{suffix}</span>}
                </div>
                {showChange &&
                  changeValue !== undefined &&
                  changeValue !== null && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'ml-1 gap-1',
                        changeValue >= 0
                          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                          : 'border-rose-500 text-rose-700 dark:text-rose-400'
                      )}>
                      {changeValue >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="text-xs font-semibold">
                        {changeValue >= 0 ? '+' : ''}
                        {changeValue.toFixed(1)}%
                      </span>
                    </Badge>
                  )}
              </div>
            </div>
            {Icon && (
              <div className={cn('p-2.5 rounded-lg', iconColor[color])}>
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatsCard.displayName = 'StatsCard';

// SALN Card Component - Clean & Compact
interface SALNCardProps {
  submission: SalnSubmissionWithNumbers;
  previousYear?: SalnSubmissionWithNumbers;
  isLatest?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

const SALNCard = React.memo(
  ({
    submission,
    previousYear,
    isLatest = false,
    onView,
    onEdit,
    onDownload,
    onPrint,
  }: SALNCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const StatusIcon = STATUS_ICONS[submission.status];
    const yearOverYearChange = calculateYearOverYearChange(
      submission,
      previousYear
    );

    return (
      <Card className="group transition-all duration-200 hover:shadow-md hover:border-[oklch(0.55_0.22_15)]">
        <div className="p-5 space-y-3.5">
          {/* Header: Year + Status + Latest Badge */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  SALN {submission.year}
                </h3>
                {isLatest && (
                  <Badge className="bg-[oklch(0.55_0.22_15)] text-white text-xs border-0">
                    Latest
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                As of December 31, {submission.year}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 px-2.5 py-0.5',
                STATUS_COLORS[submission.status]
              )}>
              <StatusIcon className="h-3 w-3" />
              <span className="capitalize font-medium text-xs">
                {submission.status}
              </span>
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

          {/* Last Updated */}
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated{' '}
            {formatDistanceToNow(new Date(submission.updatedAt), {
              addSuffix: true,
            })}
          </p>

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
                  <span className="text-slate-600 dark:text-slate-400">
                    Filing Type
                  </span>
                  <span className="font-medium capitalize text-slate-900 dark:text-slate-100">
                    {submission.filingType === 'not_applicable'
                      ? 'N/A'
                      : submission.filingType}
                  </span>
                </div>
                {submission.submittedAt && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">
                      Submitted
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {submission.approvedAt && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">
                      Approved
                    </span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {format(new Date(submission.approvedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
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
                        {submission.netWorth - previousYear.netWorth >= 0
                          ? '+'
                          : ''}
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

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
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
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="gap-1.5 h-8 text-xs">
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="gap-1.5 h-8 text-xs">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);

SALNCard.displayName = 'SALNCard';

// Loading State Component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
      Loading your SALN submissions...
    </p>
  </div>
);

// Error State Component
const ErrorState = ({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <AlertCircle className="h-16 w-16 text-rose-500" />
    <p className="text-slate-900 dark:text-slate-100 text-xl font-semibold">
      Something went wrong
    </p>
    <p className="text-slate-600 dark:text-slate-400">{error}</p>
    <Button onClick={() => window.location.reload()}>Try Again</Button>
  </div>
);

// Empty State Component
const EmptyState = ({
  onCreateNew,
  onViewArchive,
}: {
  onCreateNew: () => void;
  onViewArchive: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
    <div className="relative">
      <FileText className="h-20 w-20 text-slate-300 dark:text-slate-700" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
        No Active SALN Submissions
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
        You haven&apos;t filed any Statement of Assets, Liabilities, and Net
        Worth in the last 5 years. Start a new submission or view your archived
        records.
      </p>
    </div>
    <div className="flex gap-3">
      <Button
        onClick={onCreateNew}
        className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
        <Plus className="h-4 w-4" />
        Create New SALN
      </Button>
      <Button variant="outline" onClick={onViewArchive} className="gap-2">
        <Archive className="h-4 w-4" />
        View Archive
      </Button>
    </div>
  </div>
);

// Main SALN View Page
export default function SALNViewPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Use real hook for SALN submissions
  const { data: submissionsResponse, isLoading, error: submissionsError } = useSALNSubmissions();

  // Extract submissions from response
  const allSubmissions = useMemo(() => submissionsResponse?.data || [], [submissionsResponse]);

  const loading = isLoading;
  const error = submissionsError?.message || null;

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'date-desc' | 'date-asc' | 'networth-desc' | 'networth-asc' | 'status'
  >('date-desc');

  // Filter active submissions (0-5 years old) and parse currency strings
  const activeSubmissions = useMemo(() => {
    const filtered = allSubmissions.map(parseSubmission).filter((submission: any) => {
      const age = differenceInYears(
        new Date(),
        new Date(submission.year, 11, 31)
      );
      return age < 5;
    });

    // Apply status filter
    const statusFiltered =
      statusFilter === 'all'
        ? filtered
        : filtered.filter((s: any) => s.status === statusFilter);

    // Apply sorting
    return statusFiltered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'date-desc':
          return b.year - a.year;
        case 'date-asc':
          return a.year - b.year;
        case 'networth-desc':
          return b.netWorth - a.netWorth;
        case 'networth-asc':
          return a.netWorth - b.netWorth;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [allSubmissions, statusFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const latest = activeSubmissions[0];
    const previous = activeSubmissions[1];
    const netWorthChange =
      latest && previous
        ? ((latest.netWorth - previous.netWorth) /
            Math.abs(previous.netWorth)) *
          100
        : 0;

    // Calculate average annual change
    const approvedSubmissions = activeSubmissions
      .filter((s: any) => s.status === 'approved')
      .sort((a: any, b: any) => b.year - a.year);

    let avgAnnualChange = 0;
    if (approvedSubmissions.length >= 2) {
      const changes = [];
      for (let i = 0; i < approvedSubmissions.length - 1; i++) {
        const curr = approvedSubmissions[i];
        const prev = approvedSubmissions[i + 1];
        if (prev.netWorth !== 0) {
          changes.push(
            ((curr.netWorth - prev.netWorth) / Math.abs(prev.netWorth)) * 100
          );
        }
      }
      if (changes.length > 0) {
        avgAnnualChange =
          changes.reduce((sum, val) => sum + val, 0) / changes.length;
      }
    }

    return {
      total: activeSubmissions.length,
      latestNetWorth: latest?.netWorth || 0,
      netWorthChange,
      approved: activeSubmissions.filter((s: any) => s.status === 'approved').length,
      avgAnnualChange,
    };
  }, [activeSubmissions]);

  // Handlers
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

  const handleDownload = useCallback((id: string) => {
    console.log('Download PDF:', id);
    // TODO: Implement PDF download
  }, []);

  const handlePrint = useCallback((id: string) => {
    console.log('Print:', id);
    // TODO: Implement print functionality
  }, []);

  const handleCreateNew = useCallback(() => {
    router.push('/dashboard/saln/create');
  }, [router]);

  const handleViewArchive = useCallback(() => {
    router.push('/dashboard/saln/archive');
  }, [router]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <EmployeeOnlyGuard>
    <div className="relative min-h-screen pb-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <AnimatedGradientText className="text-2xl sm:text-3xl font-bold">
              SALN Submissions
            </AnimatedGradientText>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View and manage your Statement of Assets, Liabilities, and Net
              Worth from the last 5 years
            </p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="gap-2 shrink-0 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
            <Plus className="h-4 w-4" />
            Create New SALN
          </Button>
        </div>

        {/* Statistics */}
        {activeSubmissions.length > 0 && (
          <BlurFade delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatsCard
                label="Total Submissions"
                value={stats.total}
                icon={FileText}
                color="crimson"
              />
              <StatsCard
                label="Latest Net Worth"
                value={stats.latestNetWorth}
                prefix="₱ "
                icon={DollarSign}
                color="green"
              />
              <StatsCard
                label="Year-over-Year Change"
                value={Math.abs(stats.netWorthChange)}
                prefix={stats.netWorthChange >= 0 ? '+' : '-'}
                suffix="%"
                icon={stats.netWorthChange >= 0 ? TrendingUp : TrendingDown}
                color={stats.netWorthChange >= 0 ? 'green' : 'red'}
              />
              <StatsCard
                label="Approved SALNs"
                value={stats.approved}
                icon={CheckCircle2}
                color="green"
              />
            </div>
          </BlurFade>
        )}

        {/* Filters and Sort */}
        {activeSubmissions.length > 0 && (
          <BlurFade delay={0.15}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
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
                <SortAsc className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <Select
                  value={sortBy}
                  onValueChange={(v) =>
                    setSortBy(
                      v as
                        | 'date-desc'
                        | 'date-asc'
                        | 'networth-desc'
                        | 'networth-asc'
                        | 'status'
                    )
                  }>
                  <SelectTrigger className="w-full sm:w-[180px] h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="networth-desc">
                      Highest Net Worth
                    </SelectItem>
                    <SelectItem value="networth-asc">
                      Lowest Net Worth
                    </SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleViewArchive}
                className="gap-2 h-9">
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
            {activeSubmissions.map((submission: any, index: number) => (
              <BlurFade key={submission.id} delay={0.2 + index * 0.05}>
                <SALNCard
                  submission={submission}
                  previousYear={activeSubmissions[index + 1]}
                  isLatest={index === 0}
                  onView={() => handleView(submission.id)}
                  onEdit={() => handleEdit(submission.id)}
                  onDownload={() => handleDownload(submission.id)}
                  onPrint={() => handlePrint(submission.id)}
                />
              </BlurFade>
            ))}
          </div>
        )}
      </div>
    </div>
    </EmployeeOnlyGuard>
  );
}
