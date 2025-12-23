'use client';

import React, { useMemo, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useSALNSubmissions, type SALNSubmission } from '@/hooks/useSALN';
import { BlurFade, Badge } from '@tupsafe/shared-ui';
import { FileEdit, Inbox, FolderOpen, Sparkles, SortAsc, Search } from 'lucide-react';
import { SalnDraftCard } from '@/components/saln/SalnDraftCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { EmployeeOnlyGuard } from '@/components/guards/EmployeeOnlyGuard';
import { toast } from 'sonner';

// Sort options for SALN drafts
type SortOption = 'date-desc' | 'date-asc' | 'year-desc' | 'year-asc' | 'completion-desc' | 'completion-asc';

// Loading State Component
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3.5">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800" />
      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-[oklch(0.55_0.22_15)] border-t-transparent animate-spin" />
    </div>
    <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
      Loading drafts...
    </p>
  </div>
));

LoadingState.displayName = 'LoadingState';

// Error State Component
const ErrorState = memo(({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3.5">
    <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-100 dark:bg-rose-900/20">
      <FileEdit className="h-10 w-10 text-rose-500" />
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

// Filter Bar Component
const FilterBar = memo(
  ({
    sortBy,
    searchQuery,
    yearFilter,
    availableYears,
    onSortChange,
    onSearchChange,
    onYearFilterChange,
  }: {
    sortBy: SortOption;
    searchQuery: string;
    yearFilter: string;
    availableYears: number[];
    onSortChange: (sort: SortOption) => void;
    onSearchChange: (query: string) => void;
    onYearFilterChange: (year: string) => void;
  }) => {
    return (
      <BlurFade delay={0.35}>
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

          {/* Year Filter */}
          <Select value={yearFilter} onValueChange={onYearFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <SelectValue placeholder="Filter by year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-slate-600 dark:text-slate-400 shrink-0" />
            <Select
              value={sortBy}
              onValueChange={(v) => onSortChange(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="year-desc">Year (High to Low)</SelectItem>
                <SelectItem value="year-asc">Year (Low to High)</SelectItem>
                <SelectItem value="completion-desc">Completion (High to Low)</SelectItem>
                <SelectItem value="completion-asc">Completion (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </BlurFade>
    );
  }
);

FilterBar.displayName = 'FilterBar';

// Empty State Component
const EmptyState = memo(
  ({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) => {
    const router = useRouter();

    if (hasFilters) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-5 px-4">
          {/* Icon Container */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <FolderOpen className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Text Content */}
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              No Drafts Found
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No draft submissions match your current search criteria. Try adjusting
              your search or clear filters to see all drafts.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="gap-2">
            Clear Filters
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-5 px-4">
        {/* Icon Container with Gradient */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/30 dark:to-blue-900/20">
          <FileEdit className="h-10 w-10 text-blue-600 dark:text-blue-500" />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            No Drafts Yet
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You don&apos;t have any draft SALN submissions. Start a new submission
            and it will be automatically saved as a draft.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => router.push('/dashboard/saln/create')}
            className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white">
            <Sparkles className="h-4 w-4" />
            Create New SALN
          </Button>
          <Button
            onClick={() => router.push('/dashboard/saln')}
            variant="outline"
            className="gap-2">
            View All Submissions
          </Button>
        </div>

        {/* Helpful Info Card */}
        <div className="mt-6 max-w-lg">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
                <FileEdit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                  Auto-Save Feature
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  Your SALN submissions are automatically saved as drafts every 30 seconds while you&apos;re editing.
                  You can continue where you left off anytime without losing progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// Calculate completion percentage for a draft
const calculateDraftCompletion = (submission: SALNSubmission): number => {
  let completion = 0;

  if (submission.filingType && submission.filingType !== 'not_applicable') {
    completion += 14;
  }

  if (Array.isArray(submission.realProperties) && submission.realProperties.length > 0) {
    completion += 14;
  }

  if (Array.isArray(submission.personalProperties) && submission.personalProperties.length > 0) {
    completion += 14;
  }

  if (Array.isArray(submission.liabilities) && submission.liabilities.length > 0) {
    completion += 14;
  }

  if (Array.isArray(submission.businessInterests) && submission.businessInterests.length > 0) {
    completion += 14;
  }

  if (Array.isArray(submission.relativesInGov) && submission.relativesInGov.length > 0) {
    completion += 15;
  }

  if (
    (Array.isArray(submission.realProperties) && submission.realProperties.length > 0) ||
    (Array.isArray(submission.personalProperties) && submission.personalProperties.length > 0) ||
    (Array.isArray(submission.liabilities) && submission.liabilities.length > 0)
  ) {
    completion += 15;
  }

  return Math.min(completion, 100);
};

// Main SALN Drafts Page
export default function SALNDraftsPage() {
  const router = useRouter();
  const { data: response, isLoading, error } = useSALNSubmissions({ status: 'draft' });

  // Filter and sort state
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Extract submissions from response
  const submissions = useMemo(() => response?.data || [], [response]);

  // Filter and sort draft submissions (already filtered by API with status: 'draft')
  const draftSubmissions = useMemo(() => {
    let filtered = submissions; // API already filters by status: 'draft'

    // Apply search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter((s: SALNSubmission) =>
        String(s.year).includes(debouncedSearchQuery)
      );
    }

    // Apply year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter((s: SALNSubmission) => String(s.year) === yearFilter);
    }

    // Apply sorting
    return filtered.sort((a: SALNSubmission, b: SALNSubmission) => {
      switch (sortBy) {
        case 'date-desc':
          return (
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.updatedAt || a.createdAt).getTime() -
            new Date(b.updatedAt || b.createdAt).getTime()
          );
        case 'year-desc':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        case 'completion-desc':
          return calculateDraftCompletion(b) - calculateDraftCompletion(a);
        case 'completion-asc':
          return calculateDraftCompletion(a) - calculateDraftCompletion(b);
        default:
          return 0;
      }
    });
  }, [submissions, debouncedSearchQuery, yearFilter, sortBy]);

  // Get available years for filter (submissions already filtered by API)
  const availableYears = useMemo(() => {
    const years = new Set<number>(
      submissions.map((s: SALNSubmission) => s.year)
    );
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [submissions]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: draftSubmissions.length,
    };
  }, [draftSubmissions]);

  // Handlers
  const handleContinue = useCallback(
    (id: string) => {
      // Navigate to create page with draftId parameter to load the draft
      router.push(`/dashboard/saln/create?draftId=${id}`);
    },
    [router]
  );

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/saln/view/${id}`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/saln/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to delete draft');
        }

        toast.success('Draft deleted successfully', {
          description: 'Your SALN draft has been permanently deleted.',
        });

        // Refresh the page
        window.location.reload();
      } catch (error) {
        toast.error('Failed to delete draft', {
          description:
            error instanceof Error ? error.message : 'An unexpected error occurred',
        });
        throw error;
      }
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setYearFilter('all');
    setSortBy('date-desc');
  }, []);

  const hasActiveFilters = useMemo(
    () => debouncedSearchQuery !== '' || yearFilter !== 'all',
    [debouncedSearchQuery, yearFilter]
  );

  if (isLoading) {
    return (
      <EmployeeOnlyGuard>
        <div className="min-h-screen pb-10">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2 animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-96" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 gap-3.5">
              <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>

            {/* Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} delay={i * 0.05} />
              ))}
            </div>
          </div>
        </div>
      </EmployeeOnlyGuard>
    );
  }

  if (error) {
    return (
      <EmployeeOnlyGuard>
        <ErrorState error={error.message || 'Failed to load drafts'} />
      </EmployeeOnlyGuard>
    );
  }

  const isEmpty = draftSubmissions.length === 0;

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
                    SALN Drafts
                  </h1>
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-700 dark:border-amber-600 dark:text-amber-500 px-2 py-0.5 text-xs">
                    <Inbox className="h-3 w-3 mr-1" />
                    {stats.total} {stats.total === 1 ? 'Draft' : 'Drafts'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Continue editing or manage your unsubmitted SALN drafts
                </p>
              </div>
            </BlurFade>
          </div>

          {/* Filters and Sort */}
          {!isEmpty && (
            <FilterBar
              sortBy={sortBy}
              searchQuery={searchQuery}
              yearFilter={yearFilter}
              availableYears={availableYears}
              onSortChange={setSortBy}
              onSearchChange={setSearchQuery}
              onYearFilterChange={setYearFilter}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {draftSubmissions.map((submission: SALNSubmission, index: number) => (
                <SalnDraftCard
                  key={submission.id}
                  submission={submission}
                  onContinue={() => handleContinue(submission.id)}
                  onView={() => handleView(submission.id)}
                  onDelete={handleDelete}
                  delay={0.4 + index * 0.05}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </EmployeeOnlyGuard>
  );
}
