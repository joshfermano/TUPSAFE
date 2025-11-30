'use client';

import React, { memo } from 'react';
import { FileEdit, FolderOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface EmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export const EmptyState = memo(
  ({ hasFilters = false, onClearFilters }: EmptyStateProps) => {
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
            You don&apos;t have any draft PDS submissions. Start a new submission
            and it will be automatically saved as a draft.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => router.push('/dashboard/pds/create')}
            className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white">
            <Sparkles className="h-4 w-4" />
            Create New PDS
          </Button>
          <Button
            onClick={() => router.push('/dashboard/pds')}
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
                  Your PDS submissions are automatically saved as drafts every 30 seconds while you&apos;re editing.
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
