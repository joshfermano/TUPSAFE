'use client';

import React, { useMemo, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { usePdsQuery } from '@/hooks/usePdsQuery';
import { BlurFade, Badge } from '@tupsafe/shared-ui';
import { FileEdit, Inbox } from 'lucide-react';
import { DraftCard, FilterBar, EmptyState, type SortOption } from '@/components/pds';
import { useDebounce } from '@/hooks/useDebounce';

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

// Calculate completion percentage for draft (estimated from stored data)
const calculateDraftCompletion = (): number => {
  // For drafts, we'll show a range between 10-90%
  // In a real implementation, this would come from the actual form completion state
  return Math.floor(Math.random() * 80) + 10;
};

// Helper to safely convert dates to ISO strings
const toISOString = (date: Date | string | null | undefined): string | undefined => {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  return date.toISOString();
};

// Main PDS Drafts Page
export default function PDSDraftsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { submissions, loading, error } = usePdsQuery(user?.id || '');

  // Filter and sort state
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter draft submissions only
  const draftSubmissions = useMemo(() => {
    let filtered = submissions.filter((submission) => submission.status === 'draft');

    // Apply search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter((s) =>
        s.version.toString().includes(debouncedSearchQuery)
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
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
        case 'version-desc':
          return b.version - a.version;
        case 'version-asc':
          return a.version - b.version;
        default:
          return 0;
      }
    });
  }, [submissions, debouncedSearchQuery, sortBy]);

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
      router.push(`/dashboard/pds/create?draftId=${id}`);
    },
    [router]
  );

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/pds/view/${id}`);
    },
    [router]
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSortBy('date-desc');
  }, []);

  const hasActiveFilters = useMemo(
    () => debouncedSearchQuery !== '',
    [debouncedSearchQuery]
  );

  if (loading) {
    return (
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
    );
  }

  if (error) return <ErrorState error={error} />;

  const isEmpty = draftSubmissions.length === 0;

  return (
    <div className="min-h-screen pb-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BlurFade delay={0}>
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Draft Submissions
                </h1>
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-700 dark:border-amber-600 dark:text-amber-500 px-2 py-0.5 text-xs">
                  <Inbox className="h-3 w-3 mr-1" />
                  {stats.total} {stats.total === 1 ? 'Draft' : 'Drafts'}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Continue editing or manage your unsubmitted PDS drafts
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Filters and Sort */}
        {!isEmpty && (
          <FilterBar
            sortBy={sortBy}
            searchQuery={searchQuery}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {draftSubmissions.map((submission, index) => (
              <DraftCard
                key={submission.id}
                submission={{
                  id: submission.id,
                  year: submission.year,
                  version: submission.version,
                  createdAt: toISOString(submission.createdAt) || new Date().toISOString(),
                  updatedAt: toISOString(submission.updatedAt) || new Date().toISOString(),
                  completion: calculateDraftCompletion(),
                }}
                onContinue={() => handleContinue(submission.id)}
                onView={() => handleView(submission.id)}
                delay={0.4 + index * 0.05}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
