'use client';

/**
 * SALN Archive Page - Clean & Minimalistic Design
 *
 * Design Principles:
 * - Clean, minimalistic layout with no heavy backgrounds
 * - Modern & premium feel with subtle hover effects
 * - Compact & space-efficient design
 * - TUP Manila branding with subtle red accents
 * - Optimized performance with minimal animations
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../providers/AuthProvider';
import { useSaln } from '@tupsafe/mock-data/api';
import { differenceInYears, format, formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Download,
  Printer,
  Eye,
  Archive,
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Info,
} from 'lucide-react';

import { NumberTicker } from '../../../../components/ui/number-ticker';
import { BlurFade } from '../../../../components/ui/blur-fade';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent } from '../../../../components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../../components/ui/alert';
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseSubmission = (submission: any): SalnSubmissionWithNumbers => ({
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

// Statistics Card Component
interface StatsCardProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'crimson' | 'amber';
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
    const colorClasses = {
      default: 'from-slate-500 to-slate-600',
      green: 'from-emerald-500 to-emerald-600',
      red: 'from-rose-500 to-rose-600',
      yellow: 'from-amber-500 to-amber-600',
      blue: 'from-blue-500 to-blue-600',
      crimson: 'from-[oklch(0.55_0.22_15)] to-[oklch(0.65_0.22_15)]',
      amber: 'from-amber-600 to-amber-700',
    };

    return (
      <Card className="border-slate-200 dark:border-slate-800 hover:border-[oklch(0.55_0.22_15)] transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {label}
              </p>
              <div className="flex items-baseline gap-2">
                <div
                  className={cn(
                    'text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
                    colorClasses[color]
                  )}>
                  {prefix && <span className="text-xl">{prefix}</span>}
                  <NumberTicker value={value} />
                  {suffix && <span className="text-xl ml-1">{suffix}</span>}
                </div>
                {showChange &&
                  changeValue !== undefined &&
                  changeValue !== null && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'ml-2 gap-1 px-2 py-0.5',
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
              <div
                className={cn(
                  'p-2.5 rounded-full bg-gradient-to-br opacity-80',
                  colorClasses[color]
                )}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatsCard.displayName = 'StatsCard';

// Archived SALN Card Component (No Edit Button)
interface ArchivedSALNCardProps {
  submission: SalnSubmissionWithNumbers;
  previousYear?: SalnSubmissionWithNumbers;
  yearsArchived: number;
  onView: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

const ArchivedSALNCard = React.memo(
  ({
    submission,
    previousYear,
    yearsArchived,
    onView,
    onDownload,
    onPrint,
  }: ArchivedSALNCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const StatusIcon = STATUS_ICONS[submission.status];
    const yearOverYearChange = calculateYearOverYearChange(
      submission,
      previousYear
    );

    return (
      <Card className="cursor-pointer transition-all hover:shadow-md hover:border-[oklch(0.55_0.22_15)] border-slate-200 dark:border-slate-800">
        <CardContent className="p-5 space-y-3.5">
          {/* Header: Year + Status + Archived Badge */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  SALN {submission.year}
                </h3>
                <Badge
                  variant="outline"
                  className="border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 text-xs">
                  <Archive className="h-3 w-3 mr-1" />
                  Archived ({yearsArchived}y ago)
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                As of December 31, {submission.year}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 px-2 py-0.5',
                STATUS_COLORS[submission.status]
              )}>
              <StatusIcon className="h-3 w-3" />
              <span className="capitalize font-medium text-xs">
                {submission.status}
              </span>
            </Badge>
          </div>

          {/* Financial Summary */}
          <div className="space-y-2.5">
            {/* Total Assets */}
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Total Assets
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  ₱ <NumberTicker value={submission.totalAssets} />
                </span>
              </div>
            </div>

            {/* Total Liabilities */}
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
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
            <div className="p-3 bg-gradient-to-br from-amber-500/5 via-amber-600/5 to-amber-700/5 border border-amber-500/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Net Worth
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-lg font-bold',
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
                        'gap-1 px-2 py-0.5',
                        yearOverYearChange >= 0
                          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                          : 'border-rose-500 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20'
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
                className="w-full justify-between hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="text-sm font-medium">Financial Details</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
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
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">
                      Submitted
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {submission.approvedAt && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
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
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
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
                    <div className="flex justify-between items-center py-2">
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

          {/* Action Buttons - NO EDIT BUTTON FOR ARCHIVED RECORDS */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="gap-1.5 h-8 text-xs hover:border-[oklch(0.55_0.22_15)] transition-colors">
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="gap-1.5 h-8 text-xs hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="gap-1.5 h-8 text-xs hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ArchivedSALNCard.displayName = 'ArchivedSALNCard';

// Loading State Component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
      Loading archived SALN submissions...
    </p>
  </div>
);

// Error State Component
const ErrorState = ({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
    <AlertCircle className="h-12 w-12 text-rose-500" />
    <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold">
      Something went wrong
    </p>
    <p className="text-slate-600 dark:text-slate-400 text-sm">{error}</p>
    <Button onClick={() => window.location.reload()} className="h-9">
      Try Again
    </Button>
  </div>
);

// Empty State Component
const EmptyState = ({ onBackToActive }: { onBackToActive: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-5 px-4">
    {/* Icon Container */}
    <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800">
      <Archive className="h-10 w-10 text-slate-400 dark:text-slate-500" />
    </div>

    {/* Text Content */}
    <div className="text-center space-y-2 max-w-md">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        No Archived SALN Submissions
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Your archived SALN submissions (older than 5 years) will appear here.
        Check your active submissions to see recent records.
      </p>
    </div>

    {/* Action Button */}
    <Button
      onClick={onBackToActive}
      className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white">
      <ArrowLeft className="h-4 w-4" />
      View Active Submissions
    </Button>
  </div>
);

// Main SALN Archive Page
export default function SALNArchivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { submissions, loading, error } = useSaln(user?.id || '');

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'date-desc' | 'date-asc' | 'networth-desc' | 'networth-asc' | 'status'
  >('date-desc');
  const [decadeFilter, setDecadeFilter] = useState<string>('all');

  // Filter archived submissions (5+ years old) and parse currency strings
  const archivedSubmissions = useMemo(() => {
    const filtered = submissions.map(parseSubmission).filter((submission) => {
      const yearEnd = new Date(submission.year, 11, 31); // December 31 of submission year
      const age = differenceInYears(new Date(), yearEnd);
      return age >= 5; // Show 5+ years old
    });

    // Apply status filter
    let statusFiltered =
      statusFilter === 'all'
        ? filtered
        : filtered.filter((s) => s.status === statusFilter);

    // Apply decade filter
    if (decadeFilter !== 'all') {
      const decadeStart = parseInt(decadeFilter);
      statusFiltered = statusFiltered.filter(
        (s) => s.year >= decadeStart && s.year < decadeStart + 10
      );
    }

    // Apply sorting
    return statusFiltered.sort((a, b) => {
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
  }, [submissions, statusFilter, sortBy, decadeFilter]);

  // Get available decades for filtering
  const availableDecades = useMemo(() => {
    const decades = new Set<number>();
    archivedSubmissions.forEach((submission) => {
      const decade = Math.floor(submission.year / 10) * 10;
      decades.add(decade);
    });
    return Array.from(decades).sort((a, b) => b - a);
  }, [archivedSubmissions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const oldest = archivedSubmissions[archivedSubmissions.length - 1];
    const approvedSubmissions = archivedSubmissions.filter(
      (s) => s.status === 'approved'
    );

    const avgNetWorth =
      approvedSubmissions.length > 0
        ? approvedSubmissions.reduce((sum, s) => sum + s.netWorth, 0) /
          approvedSubmissions.length
        : 0;

    const totalYearsSpan = oldest ? new Date().getFullYear() - oldest.year : 0;

    return {
      total: archivedSubmissions.length,
      oldestYear: oldest?.year || 0,
      avgNetWorth,
      totalYearsSpan,
    };
  }, [archivedSubmissions]);

  // Handlers
  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/saln/view/${id}`);
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

  const handleBackToActive = useCallback(() => {
    router.push('/dashboard/saln/view');
  }, [router]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
              SALN Archive
            </h1>
            <Badge className="bg-gradient-to-r from-amber-600 to-amber-700 text-white border-0 px-2 py-0.5 text-xs">
              Historical Records
            </Badge>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            View archived financial disclosures from 5 or more years ago
          </p>
        </div>
        <Button
          onClick={handleBackToActive}
          className="gap-2 shrink-0 h-9 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
          <ArrowLeft className="h-4 w-4" />
          Back to Active Submissions
        </Button>
      </div>

      {/* Archive Notice */}
      <BlurFade delay={0.05}>
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <Info className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-300 text-sm">
            Historical Records
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
            These are archived SALN submissions from 5 or more years ago.
            Archived records are read-only and cannot be edited.
          </AlertDescription>
        </Alert>
      </BlurFade>

      {/* Statistics */}
      {archivedSubmissions.length > 0 && (
        <BlurFade delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatsCard
              label="Total Archived Submissions"
              value={stats.total}
              icon={Archive}
              color="amber"
            />
            <StatsCard
              label="Oldest Submission Year"
              value={stats.oldestYear}
              icon={FileText}
              color="default"
            />
            <StatsCard
              label="Average Archived Net Worth"
              value={stats.avgNetWorth}
              prefix="₱ "
              icon={DollarSign}
              color="green"
            />
            <StatsCard
              label="Total Archived Years"
              value={stats.totalYearsSpan}
              suffix=" years"
              icon={Clock}
              color="blue"
            />
          </div>
        </BlurFade>
      )}

      {/* Filters and Sort */}
      {archivedSubmissions.length > 0 && (
        <BlurFade delay={0.15}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-9">
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
            {availableDecades.length > 1 && (
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <Select value={decadeFilter} onValueChange={setDecadeFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="Filter by decade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Decades</SelectItem>
                    {availableDecades.map((decade) => (
                      <SelectItem key={decade} value={decade.toString()}>
                        {decade}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="networth-desc">
                    Highest Net Worth
                  </SelectItem>
                  <SelectItem value="networth-asc">Lowest Net Worth</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </BlurFade>
      )}

      {/* Cards Grid or Empty State */}
      {archivedSubmissions.length === 0 ? (
        <BlurFade delay={0.2}>
          <EmptyState onBackToActive={handleBackToActive} />
        </BlurFade>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {archivedSubmissions.map((submission, index) => {
            const yearEnd = new Date(submission.year, 11, 31);
            const yearsArchived = differenceInYears(new Date(), yearEnd);

            return (
              <BlurFade key={submission.id} delay={0.2 + index * 0.05}>
                <ArchivedSALNCard
                  submission={submission}
                  previousYear={archivedSubmissions[index + 1]}
                  yearsArchived={yearsArchived}
                  onView={() => handleView(submission.id)}
                  onDownload={() => handleDownload(submission.id)}
                  onPrint={() => handlePrint(submission.id)}
                />
              </BlurFade>
            );
          })}
        </div>
      )}
    </div>
  );
}
