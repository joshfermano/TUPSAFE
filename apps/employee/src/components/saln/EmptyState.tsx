'use client';

import React, { memo } from 'react';
import { CheckCircle2, Landmark } from 'lucide-react';
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
            <Landmark className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Text Content */}
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              No Submissions Found
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No pending submissions match your current filters. Try adjusting
              your search criteria or clear all filters.
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
        {/* Icon Container */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/30 dark:to-emerald-900/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-500" />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            All Caught Up!
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You have no pending SALN submissions at the moment. All your
            submissions have been completed or approved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/dashboard/saln/create')}
            className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white">
            <Landmark className="h-4 w-4" />
            Create New SALN
          </Button>
          <Button
            onClick={() => router.push('/dashboard/saln/archive')}
            variant="outline"
            className="gap-2">
            View Archive
          </Button>
        </div>
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
