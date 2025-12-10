'use client';

import React, { memo } from 'react';
import { FileText, FileEdit } from 'lucide-react';
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
            <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Text Content */}
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              No Submissions Found
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No submissions match your current filters. Try adjusting your
              search criteria or clear all filters.
            </p>
          </div>

          {/* Action Button */}
          <Button onClick={onClearFilters} variant="outline" className="gap-2">
            Clear Filters
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-5 px-4">
        {/* Icon Container */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.22_15)]/20 to-[oklch(0.55_0.22_15)]/10 dark:from-[oklch(0.55_0.22_15)]/30 dark:to-[oklch(0.55_0.22_15)]/10">
          <FileText className="h-10 w-10 text-[oklch(0.55_0.22_15)]" />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            No Submissions Yet
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You haven&apos;t created any PDS submissions yet. Get started by creating
            your first Personal Data Sheet.
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => router.push('/dashboard/pds/create')}
          className="gap-2 bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)] text-white">
          <FileEdit className="h-4 w-4" />
          Create New PDS
        </Button>
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
