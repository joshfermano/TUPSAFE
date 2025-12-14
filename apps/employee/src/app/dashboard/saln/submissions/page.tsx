'use client';

/**
 * Approved SALN Submissions Page
 *
 * Displays ONLY approved SALN submissions for the logged-in user.
 *
 * Features:
 * - Filter to show approved submissions only (status === 'approved')
 * - Statistics cards showing total approved, total net worth, latest year
 * - Responsive card grid displaying submission details
 * - Actions: View, Download PDF, Print
 * - Loading and empty states
 * - Search by year and sort options
 *
 * Performance:
 * - React.memo for all components
 * - useMemo for expensive calculations
 * - useCallback for event handlers
 * - Optimized with NumberTicker for smooth animations
 */

import React, { useMemo, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../providers/AuthProvider';
import { useSALNSubmissions } from '../../../../hooks/useSaln';
import { useSALNPdf } from '../../../../hooks/useSALNPdf';
import type { SALNData } from '../../../../components/saln/pdf';
import { toast } from 'sonner';
import { BlurFade, Badge, NumberTicker, AnimatedGradientText } from '@tupsafe/shared-ui';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { EmployeeOnlyGuard } from '../../../../components/guards/EmployeeOnlyGuard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { cn } from '../../../../lib/utils';
import { format } from 'date-fns';
import {
  Landmark,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  SortAsc,
  Calendar,
  DollarSign,
  FileCheck,
  Search,
  X,
} from 'lucide-react';

// Types
type SortOption = 'date-desc' | 'date-asc' | 'year-desc' | 'year-asc' | 'networth-desc' | 'networth-asc';

interface ApprovedSalnSubmission {
  id: string;
  year: number;
  status: 'approved';
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
}

// Loading State Component
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3.5">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
      Loading approved SALN submissions...
    </p>
  </div>
));

LoadingState.displayName = 'LoadingState';

// Error State Component
const ErrorState = memo(({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3.5">
    <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-100 dark:bg-rose-900/20">
      <Landmark className="h-10 w-10 text-rose-500" />
    </div>
    <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold">
      Something went wrong
    </p>
    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md text-center">
      {error}
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white rounded-lg transition-colors">
      Try Again
    </button>
  </div>
));

ErrorState.displayName = 'ErrorState';

// Empty State Component
const EmptyState = memo(({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
    <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20">
      <FileCheck className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        {hasFilters ? 'No matching submissions' : 'No approved SALN submissions'}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
        {hasFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'You don\'t have any approved SALN submissions yet. Submit a SALN to get started.'}
      </p>
    </div>
    {hasFilters && (
      <Button
        onClick={onClearFilters}
        variant="outline"
        className="mt-2">
        <X className="h-4 w-4 mr-2" />
        Clear Filters
      </Button>
    )}
  </div>
));

EmptyState.displayName = 'EmptyState';

// Stats Card Component
const StatsCard = memo(
  ({
    icon: Icon,
    label,
    value,
    prefix,
    delay = 0,
    className,
  }: {
    icon: React.ElementType;
    label: string;
    value: number;
    prefix?: string;
    delay?: number;
    className?: string;
  }) => (
    <BlurFade delay={delay}>
      <Card className={cn('border-slate-200 dark:border-slate-800', className)}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                {label}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {prefix && <span className="text-lg mr-0.5">{prefix}</span>}
                <NumberTicker value={value} />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </BlurFade>
  )
);

StatsCard.displayName = 'StatsCard';

// Approved SALN Card Component
const ApprovedSalnCard = memo(
  ({
    submission,
    onView,
    onDownload,
    onPrint,
    delay = 0,
  }: {
    submission: ApprovedSalnSubmission;
    onView: () => void;
    onDownload: () => void;
    onPrint: () => void;
    delay?: number;
  }) => {
    const netWorth = parseFloat(submission.netWorth || '0');
    const totalAssets = parseFloat(submission.totalAssets || '0');
    const totalLiabilities = parseFloat(submission.totalLiabilities || '0');

    return (
      <BlurFade delay={delay}>
        <Card className="h-full border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-700">
          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    SALN {submission.year}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Approved on {submission.approvedAt ? format(new Date(submission.approvedAt), 'MMM dd, yyyy') : 'N/A'}
                </p>
              </div>
              <Badge
                className={cn(
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                  'px-2.5 py-1 text-xs font-medium'
                )}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            </div>

            {/* Net Worth */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Net Worth
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                ₱{netWorth.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Assets & Liabilities */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Assets</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  ₱{totalAssets.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Liabilities</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  ₱{totalLiabilities.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="text-xs">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="text-xs"
                disabled={false}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="text-xs"
                disabled={false}>
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print
              </Button>
            </div>
          </CardContent>
        </Card>
      </BlurFade>
    );
  }
);

ApprovedSalnCard.displayName = 'ApprovedSalnCard';

// Skeleton Card Component
const SkeletonCard = memo(({ delay = 0 }: { delay?: number }) => (
  <BlurFade delay={delay}>
    <div className="h-full border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
        </div>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" />
      </div>
      <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    </div>
  </BlurFade>
));

SkeletonCard.displayName = 'SkeletonCard';

// Main SALN Submissions Page
export default function SalnSubmissionsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { downloadPDF, openPDFInNewTab, isGenerating } = useSALNPdf();

  // Use real hook for SALN submissions
  const { data: submissionsResponse, isLoading, error: submissionsError } = useSALNSubmissions();

  // Extract all submissions from response
  const allSubmissions = useMemo(() => submissionsResponse?.data || [], [submissionsResponse]);
  const error = submissionsError;

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
  const [sortBy, setSortBy] = useState<SortOption>('year-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter only approved submissions
  const approvedSubmissions = useMemo(() => {
    return allSubmissions.filter((s: any) => s.status === 'approved') as ApprovedSalnSubmission[];
  }, [allSubmissions]);

  // Apply search and sort
  const filteredSubmissions = useMemo(() => {
    let filtered = [...approvedSubmissions];

    // Apply search filter (by year)
    if (searchQuery) {
      filtered = filtered.filter((s) =>
        s.year.toString().includes(searchQuery)
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (
            new Date(b.approvedAt || b.updatedAt).getTime() -
            new Date(a.approvedAt || a.updatedAt).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.approvedAt || a.updatedAt).getTime() -
            new Date(b.approvedAt || b.updatedAt).getTime()
          );
        case 'year-desc':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        case 'networth-desc':
          return parseFloat(b.netWorth) - parseFloat(a.netWorth);
        case 'networth-asc':
          return parseFloat(a.netWorth) - parseFloat(b.netWorth);
        default:
          return 0;
      }
    });
  }, [approvedSubmissions, searchQuery, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalApproved = approvedSubmissions.length;
    const totalNetWorth = approvedSubmissions.reduce(
      (sum, s) => sum + parseFloat(s.netWorth || '0'),
      0
    );
    const latestYear = approvedSubmissions.length > 0
      ? Math.max(...approvedSubmissions.map((s) => s.year))
      : new Date().getFullYear();

    return {
      totalApproved,
      totalNetWorth,
      latestYear,
    };
  }, [approvedSubmissions]);

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
        const submission = approvedSubmissions.find((s) => s.id === id);
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
    [approvedSubmissions, transformSALNToData, downloadPDF]
  );

  const handlePrint = useCallback(
    async (id: string) => {
      try {
        const submission = approvedSubmissions.find((s) => s.id === id);
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
    [approvedSubmissions, transformSALNToData, openPDFInNewTab]
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSortBy('year-desc');
  }, []);

  const hasActiveFilters = useMemo(
    () => searchQuery !== '',
    [searchQuery]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen pb-10">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-64" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-96" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"
              />
            ))}
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) return <ErrorState error={error.message || 'Failed to load submissions'} />;

  const isEmpty = filteredSubmissions.length === 0;

  return (
    <EmployeeOnlyGuard>
    <div className="min-h-screen pb-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BlurFade delay={0}>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <AnimatedGradientText className="text-2xl sm:text-3xl font-bold">
                  Approved SALN Submissions
                </AnimatedGradientText>
                <Badge
                  className={cn(
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                    'px-2.5 py-1 text-xs font-medium'
                  )}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View and manage all your approved SALN submissions
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Statistics */}
        {approvedSubmissions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              icon={FileCheck}
              label="Total Approved"
              value={stats.totalApproved}
              delay={0.1}
            />
            <StatsCard
              icon={DollarSign}
              label="Total Net Worth"
              value={Math.round(stats.totalNetWorth)}
              prefix="₱"
              delay={0.15}
            />
            <StatsCard
              icon={Calendar}
              label="Latest Year"
              value={stats.latestYear}
              delay={0.2}
            />
          </div>
        )}

        {/* Filters and Sort */}
        {approvedSubmissions.length > 0 && (
          <BlurFade delay={0.25}>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.22_15)] focus:border-transparent"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year-desc">Year (Newest)</SelectItem>
                    <SelectItem value="year-asc">Year (Oldest)</SelectItem>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="networth-desc">Net Worth (High)</SelectItem>
                    <SelectItem value="networth-asc">Net Worth (Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </BlurFade>
        )}

        {/* Cards Grid or Empty State */}
        {isEmpty ? (
          <BlurFade delay={0.3}>
            <EmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </BlurFade>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubmissions.map((submission, index) => (
              <ApprovedSalnCard
                key={submission.id}
                submission={submission}
                onView={() => handleView(submission.id)}
                onDownload={() => handleDownload(submission.id)}
                onPrint={() => handlePrint(submission.id)}
                delay={0.3 + index * 0.05}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </EmployeeOnlyGuard>
  );
}
