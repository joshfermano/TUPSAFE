'use client';

import React, { memo, useState } from 'react';
import { BlurFade, Badge } from '@tupsafe/shared-ui';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Eye,
  FileEdit,
  Trash2,
  Clock,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import type { SALNSubmission } from '@/hooks/useSALN';

interface SalnDraftCardProps {
  submission: SALNSubmission;
  onContinue: () => void;
  onView: () => void;
  onDelete: (id: string) => Promise<void>;
  delay?: number;
}

/**
 * Get filing type display label
 */
const getFilingTypeLabel = (filingType: string): string => {
  switch (filingType) {
    case 'joint':
      return 'Joint Filing';
    case 'separate':
      return 'Separate Filing';
    case 'not_applicable':
      return 'Not Applicable';
    default:
      return 'Not Set';
  }
};

export const SalnDraftCard = memo(
  ({
    submission,
    onContinue,
    onView,
    onDelete,
    delay = 0,
  }: SalnDraftCardProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Use completion percentage from the API (computed and persisted server-side)
    const completion = submission.completion ?? 0;

    // Calculate time since last update
    const lastModified = new Date(submission.updatedAt);
    const timeAgo = formatDistanceToNow(lastModified, { addSuffix: true });

    // Handle delete with loading state
    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        await onDelete(submission.id);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Delete failed:', error);
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <>
        <BlurFade delay={delay}>
          <Card
            className={cn(
              'h-full transition-all duration-200 hover:border-amber-400 hover:shadow-md',
              isDeleting && 'opacity-60 pointer-events-none'
            )}>
            <CardContent className="p-5 space-y-3.5">
              {/* Header with Year, Filing Type and Status Badge */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      SALN {submission.year}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {getFilingTypeLabel(submission.filingType)} • Last saved {timeAgo}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1.5 px-2 py-0.5 text-xs',
                    'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  )}>
                  <FileEdit className="h-3 w-3" />
                  <span className="capitalize font-medium">Draft</span>
                </Badge>
              </div>

              {/* Completion Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Completion
                  </span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">
                    {completion}%
                  </span>
                </div>
                <Progress value={completion} className="h-1.5" />
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {submission.year}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(submission.createdAt), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(submission.updatedAt), 'h:mm a')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onContinue}
                  disabled={isDeleting}
                  className="col-span-2 gap-1.5 h-8 text-xs bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileEdit className="h-3.5 w-3.5" />
                  )}
                  Continue Editing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onView}
                  disabled={isDeleting}
                  className="gap-1.5 h-8 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
              </div>

              {/* Delete Button - Separate row for emphasis */}
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="w-full gap-1.5 h-8 text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 dark:hover:text-rose-300">
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete Draft
                </Button>
              </div>

              {/* Auto-save indicator */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-2.5">
                <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    Your draft is automatically saved. Continue where you left off anytime.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md mx-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/30 shrink-0">
                  <Trash2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Delete Draft?
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-slate-100">SALN {submission.year}</span>? This action cannot be undone and all progress on this draft will be permanently lost.
                  </p>
                </div>
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-lg p-3">
                <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                  <span className="font-semibold">Warning:</span> This will permanently delete your draft and all unsaved changes. Make sure this is the draft you want to remove.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="h-9">
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-9 bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 text-white">
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Draft'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

SalnDraftCard.displayName = 'SalnDraftCard';
