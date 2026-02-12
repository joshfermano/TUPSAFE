'use client';

import React, { useMemo, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../providers/AuthProvider';
import { useSALNSubmissions, type SALNSubmission } from '../../../../hooks/useSALN';
import { BlurFade, Badge } from '@tupsafe/shared-ui';
import { Clock, Landmark } from 'lucide-react';
import { EmployeeOnlyGuard } from '../../../../components/guards/EmployeeOnlyGuard';
import { StatsSection } from '@/components/saln/StatsSection';
import {
  FilterBar,
  type StatusFilter,
  type SortOption,
} from '@/components/saln/FilterBar';
import { EmptyState } from '@/components/saln/EmptyState';
import { PendingCard } from '@/components/saln/PendingCard';
import { useDebounce } from '../../../../hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { CardGridPagination } from '@/components/ui/card-grid-pagination';

// Loading State Component
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3.5">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
      Loading pending submissions...
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

// Skeleton Loading Cards
const SkeletonCard = memo(({ delay = 0 }: { delay?: number }) => (
  <BlurFade delay={delay}>
    <div className="h-full border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3.5 animate-pulse">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
        </div>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-10" />
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
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

// Calculate completion for sorting
const calculateCompletion = (
  status: 'submitted' | 'reviewing'
): number => {
  switch (status) {
    case 'submitted':
      return 95;
    case 'reviewing':
      return 98;
    default:
      return 0;
  }
};

// Helper to safely handle date fields (API returns strings already)
const safeDate = (date: string | null | undefined): string | undefined => {
  return date || undefined;
};

// Main SALN Pending Page
function SALNPendingPageContent() {
  const router = useRouter();
  useAuth();

  // Fetch submissions using real API hook
  const {
    data: submissionsResponse,
    isLoading: loading,
    error: queryError,
  } = useSALNSubmissions();

  const error = queryError ? { message: queryError.message } : null;

  // Extract submissions from response
  const allSubmissions = useMemo(
    () => submissionsResponse?.data || [],
    [submissionsResponse]
  );

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Pagination state
  const { page, pageSize, setPage, setPageSize } = usePagination();

  // Filter pending submissions (only submitted and reviewing)
  const pendingSubmissions = useMemo(() => {
    if (!allSubmissions || allSubmissions.length === 0) return [];

    const pendingStatuses = ['submitted', 'reviewing'];

    let filtered = allSubmissions.filter((submission: SALNSubmission) =>
      pendingStatuses.includes(submission.status)
    );

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s: SALNSubmission) => s.status === statusFilter);
    }

    // Apply search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter((s: SALNSubmission) =>
        s.year.toString().includes(debouncedSearchQuery)
      );
    }

    // Apply sorting
    return filtered.sort((a: SALNSubmission, b: SALNSubmission) => {
      switch (sortBy) {
        case 'date-desc':
          return (
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.updatedAt).getTime() -
            new Date(a.updatedAt).getTime()
          );
        case 'status':
          return a.status.localeCompare(b.status);
        case 'progress': {
          const progressA = calculateCompletion(
            a.status as 'submitted' | 'reviewing'
          );
          const progressB = calculateCompletion(
            b.status as 'submitted' | 'reviewing'
          );
          return progressB - progressA;
        }
        default:
          return 0;
      }
    });
  }, [allSubmissions, statusFilter, debouncedSearchQuery, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const submitted = pendingSubmissions.filter(
      (s: SALNSubmission) => s.status === 'submitted'
    ).length;
    const reviewing = pendingSubmissions.filter(
      (s: SALNSubmission) => s.status === 'reviewing'
    ).length;

    return {
      total: pendingSubmissions.length,
      submitted,
      reviewing,
    };
  }, [pendingSubmissions]);

  // Pagination calculations
  const totalPages = Math.ceil(pendingSubmissions.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSubmissions = pendingSubmissions.slice(startIndex, endIndex);

  // Handlers
  const handleContinue = useCallback(
    (id: string) => {
      router.push(`/dashboard/saln/edit/${id}`);
    },
    [router]
  );

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/saln/view/${id}`);
    },
    [router]
  );

  const handleDownload = useCallback(
    (id: string) => {
      // Navigate to the detailed view where PDF download is implemented
      router.push(`/dashboard/saln/view/${id}`);
    },
    [router]
  );

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchQuery('');
    setSortBy('date-desc');
  }, []);

  const hasActiveFilters = useMemo(
    () => statusFilter !== 'all' || debouncedSearchQuery !== '',
    [statusFilter, debouncedSearchQuery]
  );

  if (loading) {
    return (
      <div className="min-h-screen pb-12">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-96" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
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

  if (error) return <ErrorState error={error.message || 'An error occurred'} />;

  const isEmpty = pendingSubmissions.length === 0;

  return (
    <div className="min-h-screen pb-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BlurFade delay={0}>
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Pending SALN Submissions
                </h1>
                <Badge
                  variant="outline"
                  className="border-blue-500 text-blue-700 dark:border-blue-600 dark:text-blue-500 px-2 py-0.5 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  In Progress
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage your draft, submitted, and in-review SALN submissions
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Statistics */}
        {!isEmpty && (
          <StatsSection
            totalPending={stats.total}
            submittedCount={stats.submitted}
            reviewingCount={stats.reviewing}
          />
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

        {/* Cards Grid or Empty State */}
        {isEmpty ? (
          <BlurFade delay={0.4}>
            <EmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </BlurFade>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedSubmissions.map((submission: SALNSubmission, index: number) => (
                <PendingCard
                  key={submission.id}
                  submission={{
                    id: submission.id,
                    year: submission.year,
                    status: submission.status as
                      | 'submitted'
                      | 'reviewing',
                    createdAt: submission.createdAt,
                    updatedAt: submission.updatedAt,
                    submittedAt: safeDate(submission.submittedAt),
                    reviewedBy: undefined, // Not available for pending submissions
                  }}
                  onContinue={() => handleContinue(submission.id)}
                  onView={() => handleView(submission.id)}
                  onDownload={() => handleDownload(submission.id)}
                  delay={0.4 + index * 0.05}
                />
              ))}
            </div>

            <CardGridPagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              total={pendingSubmissions.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemName="submissions"
            />
          </>
        )}
      </div>
    </div>
  );
}

// Main export with guard
export default function SALNPendingPage() {
  return (
    <EmployeeOnlyGuard>
      <SALNPendingPageContent />
    </EmployeeOnlyGuard>
  );
}
