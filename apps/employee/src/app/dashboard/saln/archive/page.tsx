'use client';

/**
 * SALN Archive Page - Matching PDS Archive Design
 *
 * Design Features:
 * - Consistent with PDS archive page design patterns
 * - Year grouping functionality with collapsible groups
 * - Statistics cards with animated numbers
 * - Filter controls with decade options
 * - Archive notice on cards
 * - Proper empty state with action button
 * - Responsive design for mobile/tablet/desktop
 */

import React, { useMemo, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../providers/AuthProvider';
import { useSALNSubmissions } from '../../../../hooks/useSaln';
import { useSALNPdf } from '../../../../hooks/useSalnPdf';
import type { SALNData } from '../../../../components/saln/pdf';
import { toast } from 'sonner';
import { differenceInYears, format, formatDistanceToNow } from 'date-fns';
import { EmployeeOnlyGuard } from '../../../../components/guards/EmployeeOnlyGuard';
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
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  CreditCard,
  AlertCircle,
  History,
} from 'lucide-react';

// UI Components
import { BlurFade, NumberTicker, Badge } from '@tupsafe/shared-ui';
import { Button } from '../../../../components/ui/button';
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

// Status badge color configuration with TUP Manila theme
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
} as const;

const STATUS_ICONS = {
  draft: FileEdit,
  submitted: Clock,
  reviewing: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
} as const;

// Parse string currency from database to number
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

// Get decade from year
const getDecade = (year: number): string => {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
};

// Statistics Card Component
interface StatsCardProps {
  label: string;
  value: number;
  icon?: React.ElementType;
  color?: 'default' | 'green' | 'yellow' | 'blue' | 'red' | 'purple';
  delay?: number;
}

const StatsCard = memo(
  ({
    label,
    value,
    icon: Icon,
    color = 'default',
    delay = 0,
  }: StatsCardProps) => {
    const colorClasses = {
      default: 'from-slate-500 to-slate-600',
      green: 'from-emerald-500 to-emerald-600',
      yellow: 'from-amber-500 to-amber-600',
      blue: 'from-blue-500 to-blue-600',
      red: 'from-rose-500 to-rose-600',
      purple: 'from-purple-500 to-purple-600',
    };

    return (
      <BlurFade delay={delay}>
        <Card className="relative overflow-hidden h-full transition-all duration-200 hover:shadow-md hover:border-[oklch(0.55_0.22_15)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {label}
                </p>
                <div className="text-2xl font-bold bg-gradient-to-r from-[oklch(0.55_0.22_15)] to-[oklch(0.65_0.22_15)] bg-clip-text text-transparent">
                  <NumberTicker value={value} />
                </div>
              </div>
              {Icon && (
                <div
                  className={cn(
                    'p-2.5 rounded-full bg-gradient-to-br',
                    colorClasses[color],
                    'bg-opacity-10'
                  )}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    );
  }
);

StatsCard.displayName = 'StatsCard';

// Archived SALN Card Component
interface ArchivedSALNCardProps {
  submission: SalnSubmissionWithNumbers;
  previousYear?: SalnSubmissionWithNumbers;
  onView: () => void;
  onDownload: () => void;
  onPrint: () => void;
  delay?: number;
}

const ArchivedSALNCard = memo(
  ({
    submission,
    previousYear,
    onView,
    onDownload,
    onPrint,
    delay = 0,
  }: ArchivedSALNCardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const StatusIcon =
      STATUS_ICONS[submission.status as keyof typeof STATUS_ICONS];
    const yearEnd = new Date(submission.year, 11, 31);
    const yearsAgo = differenceInYears(new Date(), yearEnd);
    const yearOverYearChange = calculateYearOverYearChange(
      submission,
      previousYear
    );

    const sections = useMemo(
      () => [
        { name: 'Personal Information', completed: true },
        { name: 'Declarant & Spouse Details', completed: true },
        { name: 'Assets & Liabilities', completed: true },
        { name: 'Business Interests', completed: true },
        { name: 'Relatives in Government', completed: true },
      ],
      []
    );

    return (
      <BlurFade delay={delay}>
        <Card className="h-full transition-all duration-200 hover:border-[oklch(0.55_0.22_15)] hover:shadow-md">
          <CardContent className="p-5 space-y-3.5">
            {/* Header with Archive Badge */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    SALN {submission.year}
                  </h3>
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-700 dark:border-amber-600 dark:text-amber-500 gap-1 px-2 py-0.5 text-xs">
                    <Archive className="h-3 w-3" />
                    Archived
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {submission.submittedAt
                    ? `Submitted ${yearsAgo} years ago`
                    : `Created ${yearsAgo} years ago`}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'gap-1.5 px-2 py-0.5 text-xs',
                  STATUS_COLORS[submission.status as keyof typeof STATUS_COLORS]
                )}>
                <StatusIcon className="h-3 w-3" />
                <span className="capitalize font-medium">
                  {submission.status}
                </span>
              </Badge>
            </div>

            {/* Version and Archive Info */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                CY {submission.year}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {format(new Date(submission.updatedAt), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <History className="h-3 w-3" />
                {yearsAgo} years old
              </span>
            </div>

            {/* Financial Summary */}
            <div className="space-y-2">
              {/* Total Assets */}
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
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
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
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
              <div className="p-2.5 bg-gradient-to-br from-amber-500/5 via-amber-600/5 to-amber-700/5 border border-amber-500/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
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

            {/* Expandable Sections Preview */}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between hover:bg-slate-100 dark:hover:bg-slate-800 h-8">
                  <span className="text-xs font-medium">View Sections</span>
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2.5">
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
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="default"
                size="sm"
                onClick={onView}
                className="gap-1.5 h-8 text-xs bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="gap-1.5 h-8 text-xs"
                disabled={false}>
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="gap-1.5 h-8 text-xs"
                disabled={false}>
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
            </div>

            {/* Archive Notice */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-2.5">
              <p className="text-xs text-amber-700 dark:text-amber-500 flex items-center gap-1.5">
                <Archive className="h-3 w-3 shrink-0" />
                <span>
                  This is an archived record (5+ years old) and cannot be edited
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    );
  }
);

ArchivedSALNCard.displayName = 'ArchivedSALNCard';

// Loading State Component
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3.5">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
      Loading archived submissions...
    </p>
  </div>
));

LoadingState.displayName = 'LoadingState';

// Error State Component
const ErrorState = memo(({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3.5">
    <AlertCircle className="h-12 w-12 text-rose-500" />
    <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold">
      Something went wrong
    </p>
    <p className="text-slate-600 dark:text-slate-400 text-sm">{error}</p>
    <Button
      variant="default"
      onClick={() => window.location.reload()}
      className="bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
      Try Again
    </Button>
  </div>
));

ErrorState.displayName = 'ErrorState';

// Empty State Component
const EmptyState = memo(({ onViewActive }: { onViewActive: () => void }) => (
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
      onClick={onViewActive}
      className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white">
      <Eye className="h-4 w-4" />
      View Active Submissions
    </Button>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Year Group Component
interface YearGroupProps {
  year: number;
  submissions: SalnSubmissionWithNumbers[];
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onPrint: (id: string) => void;
}

const YearGroup = memo(
  ({ year, submissions, onView, onDownload, onPrint }: YearGroupProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
      <div className="space-y-3.5">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between hover:bg-slate-100 dark:hover:bg-slate-800 p-3.5 h-auto">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4.5 w-4.5 text-[oklch(0.55_0.22_15)]" />
            <div className="text-left">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {year}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {submissions.length}{' '}
                {submissions.length === 1 ? 'submission' : 'submissions'}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          )}
        </Button>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pl-3">
            {submissions.map((submission, index) => {
              const previousYear = submissions[index + 1];
              return (
                <ArchivedSALNCard
                  key={submission.id}
                  submission={submission}
                  previousYear={previousYear}
                  onView={() => onView(submission.id)}
                  onDownload={() => onDownload(submission.id)}
                  onPrint={() => onPrint(submission.id)}
                  delay={index * 0.05}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

YearGroup.displayName = 'YearGroup';

// Main SALN Archive Page
export default function SALNArchivePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { downloadPDF, openPDFInNewTab, isGenerating } = useSALNPdf();

  // Use real hook for SALN submissions
  const {
    data: submissionsResponse,
    isLoading,
    error: submissionsError,
  } = useSALNSubmissions();

  // Extract all submissions from response
  const allSubmissions = useMemo(
    () => submissionsResponse?.data || [],
    [submissionsResponse]
  );

  const loading = isLoading;
  const error = submissionsError?.message || null;

  // Transform submission data to SALNData format for PDF
  const transformSALNToData = useCallback(
    (submission: any): SALNData => {
      return {
        id: submission.id,
        year: submission.year,
        filingType: submission.filingType || 'not_applicable',
        declarantInfo: {
          surname: profile?.lastName || '',
          firstName: profile?.firstName || '',
          middleInitial: profile?.middleName || null,
          position: submission.position || '',
          agency:
            submission.agency ||
            'Technological University of the Philippines - Manila',
          officeAddress: submission.officeAddress || '',
        },
        spouseInfo:
          submission.filingType === 'joint' && submission.spouseName
            ? {
                surname: submission.spouseName?.split(' ').pop() || '',
                firstName: submission.spouseName?.split(' ')[0] || '',
                middleInitial: submission.spouseName?.split(' ')[1]?.charAt(0) || null,
                position: '',
                agency: '',
                officeAddress: '',
              }
            : undefined,
        children: [],
        realProperties: submission.realProperties || [],
        personalProperties: submission.personalProperties || [],
        liabilities: submission.liabilities || [],
        businessInterests:
          submission.businessInterests?.map((bi: any) => ({
            entityName: bi.businessName || bi.entityName || '',
            businessAddress: bi.businessAddress || '',
            natureOfBusiness: bi.nature || bi.natureOfBusiness || '',
            dateOfAcquisition: bi.dateAcquired || bi.dateOfAcquisition || '',
          })) || [],
        relativesInGov:
          submission.relativesInGov?.map((rel: any) => ({
            name: rel.name || '',
            relationship: rel.relationship || '',
            position: rel.position || '',
            agencyAddress: rel.agency || rel.agencyAddress || '',
          })) || [],
        totalAssets: parseFloat(submission.totalAssets || '0'),
        totalLiabilities: parseFloat(submission.totalLiabilities || '0'),
        netWorth: parseFloat(submission.netWorth || '0'),
      };
    },
    [profile]
  );

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [decadeFilter, setDecadeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'status'>(
    'date-desc'
  );
  const [groupByYear, setGroupByYear] = useState(true);

  // Filter archived submissions (5+ years old) and parse currency strings
  const archivedSubmissions = useMemo(() => {
    const filtered = allSubmissions
      .map(parseSubmission)
      .filter((submission: SalnSubmissionWithNumbers) => {
        const yearEnd = new Date(submission.year, 11, 31); // December 31 of submission year
        const age = differenceInYears(new Date(), yearEnd);
        return age >= 5; // Show 5+ years old
      });

    // Apply status filter
    const statusFiltered =
      statusFilter === 'all'
        ? filtered
        : filtered.filter(
            (s: SalnSubmissionWithNumbers) => s.status === statusFilter
          );

    // Apply decade filter
    const decadeFiltered =
      decadeFilter === 'all'
        ? statusFiltered
        : statusFiltered.filter((s: SalnSubmissionWithNumbers) => {
            return getDecade(s.year) === decadeFilter;
          });

    // Apply sorting
    return decadeFiltered.sort(
      (a: SalnSubmissionWithNumbers, b: SalnSubmissionWithNumbers) => {
        switch (sortBy) {
          case 'date-desc':
            return b.year - a.year;
          case 'date-asc':
            return a.year - b.year;
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      }
    );
  }, [allSubmissions, statusFilter, decadeFilter, sortBy]);

  // Group submissions by year
  const groupedByYear = useMemo(() => {
    const groups: Record<number, SalnSubmissionWithNumbers[]> = {};
    archivedSubmissions.forEach((submission: SalnSubmissionWithNumbers) => {
      const year = submission.year;
      if (!groups[year]) groups[year] = [];
      groups[year].push(submission);
    });
    return Object.entries(groups).sort(([yearA], [yearB]) =>
      sortBy === 'date-desc'
        ? Number(yearB) - Number(yearA)
        : Number(yearA) - Number(yearB)
    );
  }, [archivedSubmissions, sortBy]);

  // Get available decades
  const availableDecades = useMemo(() => {
    const decades = new Set<string>();
    allSubmissions
      .map(parseSubmission)
      .filter((s: SalnSubmissionWithNumbers) => {
        const yearEnd = new Date(s.year, 11, 31);
        const age = differenceInYears(new Date(), yearEnd);
        return age >= 5;
      })
      .forEach((s: SalnSubmissionWithNumbers) => {
        decades.add(getDecade(s.year));
      });
    return Array.from(decades).sort().reverse();
  }, [allSubmissions]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (archivedSubmissions.length === 0) {
      return { total: 0, approved: 0, rejected: 0, oldestYear: 0 };
    }

    const oldestSubmission = archivedSubmissions.reduce(
      (oldest: SalnSubmissionWithNumbers, current: SalnSubmissionWithNumbers) => {
        return current.year < oldest.year ? current : oldest;
      },
      archivedSubmissions[0]
    );

    return {
      total: archivedSubmissions.length,
      approved: archivedSubmissions.filter(
        (s: SalnSubmissionWithNumbers) => s.status === 'approved'
      ).length,
      rejected: archivedSubmissions.filter(
        (s: SalnSubmissionWithNumbers) => s.status === 'rejected'
      ).length,
      oldestYear: oldestSubmission.year,
    };
  }, [archivedSubmissions]);

  // Handlers
  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/saln/view/${id}`);
    },
    [router]
  );

  const handleDownload = useCallback(
    async (id: string) => {
      try {
        const submission = archivedSubmissions.find((s: SalnSubmissionWithNumbers) => s.id === id);
        if (!submission) {
          toast.error('Submission not found');
          return;
        }
        const salnPdfData = transformSALNToData(submission);
        await downloadPDF(salnPdfData);
        toast.success('SALN PDF downloaded successfully');
      } catch (error) {
        toast.error('Failed to generate PDF');
        console.error('PDF generation error:', error);
      }
    },
    [archivedSubmissions, transformSALNToData, downloadPDF]
  );

  const handlePrint = useCallback(
    async (id: string) => {
      try {
        const submission = archivedSubmissions.find((s: SalnSubmissionWithNumbers) => s.id === id);
        if (!submission) {
          toast.error('Submission not found');
          return;
        }
        const salnPdfData = transformSALNToData(submission);
        await openPDFInNewTab(salnPdfData);
      } catch (error) {
        toast.error('Failed to open PDF');
        console.error('PDF preview error:', error);
      }
    },
    [archivedSubmissions, transformSALNToData, openPDFInNewTab]
  );

  const handleViewActive = useCallback(() => {
    router.push('/dashboard/saln/view');
  }, [router]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <EmployeeOnlyGuard>
      <div className="min-h-screen pb-10">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <BlurFade delay={0}>
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                    SALN Archive
                  </h1>
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-700 dark:border-amber-600 dark:text-amber-500 px-2 py-0.5 text-xs">
                    <Archive className="h-3 w-3 mr-1" />
                    Historical Records
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  View archived SALN submissions from 5+ years ago
                </p>
              </div>
            </BlurFade>
            <BlurFade delay={0.05}>
              <Button
                variant="default"
                onClick={handleViewActive}
                className="gap-2 shrink-0 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
                <Eye className="h-4 w-4" />
                View Active Submissions
              </Button>
            </BlurFade>
          </div>

          {/* Statistics */}
          {archivedSubmissions.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatsCard
                label="Total Archived"
                value={stats.total}
                icon={Archive}
                color="purple"
                delay={0.1}
              />
              <StatsCard
                label="Approved"
                value={stats.approved}
                icon={CheckCircle2}
                color="green"
                delay={0.15}
              />
              <StatsCard
                label="Rejected"
                value={stats.rejected}
                icon={XCircle}
                color="red"
                delay={0.2}
              />
              <StatsCard
                label="Oldest Record"
                value={stats.oldestYear}
                icon={History}
                color="blue"
                delay={0.25}
              />
            </div>
          )}

          {/* Filters and Sort */}
          {archivedSubmissions.length > 0 && (
            <BlurFade delay={0.3}>
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {availableDecades.length > 1 && (
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <Select value={decadeFilter} onValueChange={setDecadeFilter}>
                      <SelectTrigger className="w-full sm:w-[160px] h-9">
                        <SelectValue placeholder="Filter by decade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Decades</SelectItem>
                        {availableDecades.map((decade) => (
                          <SelectItem key={decade} value={decade}>
                            {decade}
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
                      setSortBy(v as 'date-desc' | 'date-asc' | 'status')
                    }>
                    <SelectTrigger className="w-full sm:w-[160px] h-9">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Newest First</SelectItem>
                      <SelectItem value="date-asc">Oldest First</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant={groupByYear ? 'default' : 'outline'}
                  onClick={() => setGroupByYear(!groupByYear)}
                  className={cn(
                    'gap-2 h-9',
                    groupByYear &&
                      'bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]'
                  )}>
                  <Calendar className="h-4 w-4" />
                  Group by Year
                </Button>
              </div>
            </BlurFade>
          )}

          {/* Cards Grid or Empty State */}
          {archivedSubmissions.length === 0 ? (
            <BlurFade delay={0.35}>
              <EmptyState onViewActive={handleViewActive} />
            </BlurFade>
          ) : groupByYear ? (
            <div className="space-y-6">
              {groupedByYear.map(([year, yearSubmissions], idx) => (
                <BlurFade key={year} delay={0.35 + idx * 0.05}>
                  <YearGroup
                    year={Number(year)}
                    submissions={yearSubmissions}
                    onView={handleView}
                    onDownload={handleDownload}
                    onPrint={handlePrint}
                  />
                </BlurFade>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {archivedSubmissions.map(
                (submission: SalnSubmissionWithNumbers, index: number) => {
                  const previousYear = archivedSubmissions[index + 1];
                  return (
                    <ArchivedSALNCard
                      key={submission.id}
                      submission={submission}
                      previousYear={previousYear}
                      onView={() => handleView(submission.id)}
                      onDownload={() => handleDownload(submission.id)}
                      onPrint={() => handlePrint(submission.id)}
                      delay={0.35 + index * 0.05}
                    />
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </EmployeeOnlyGuard>
  );
}
