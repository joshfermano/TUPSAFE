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
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useDeletePDS } from '@/hooks/usePdsQuery';
import { showDeleteSuccessToast, showDeleteErrorToast } from '@/lib/toast-templates';

interface DraftCardProps {
  submission: {
    id: string;
    year: number; // Calendar year for this PDS
    version: number; // Version within the year
    createdAt: string;
    updatedAt: string;
    completion: number;
  };
  onContinue: () => void;
  onView: () => void;
  delay?: number;
}

export const DraftCard = memo(
  ({
    submission,
    onContinue,
    onView,
    delay = 0,
  }: DraftCardProps) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { deletePDS, isPending } = useDeletePDS();

    // Calculate time since last update
    const lastModified = new Date(submission.updatedAt);
    const timeAgo = formatDistanceToNow(lastModified, { addSuffix: true });

    // Handle delete with optimistic UI
    const handleDelete = async () => {
      try {
        await deletePDS(submission.id);
        showDeleteSuccessToast('pds', { version: submission.version });
        setShowDeleteDialog(false);
      } catch (error) {
        showDeleteErrorToast('pds', error instanceof Error ? error.message : 'Failed to delete draft');
      }
    };

    return (
      <>
        <BlurFade delay={delay}>
          <Card
            className={cn(
              'h-full transition-all duration-200 hover:border-amber-400 hover:shadow-md',
              isPending && 'opacity-60 pointer-events-none'
            )}>
            <CardContent className="p-5 space-y-3.5">
              {/* Header with Year, Version and Status Badge */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Annual PDS - CY {submission.year}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    CY {submission.year} v{submission.version} • Last saved {timeAgo}
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
                    {submission.completion}%
                  </span>
                </div>
                <Progress value={submission.completion} className="h-1.5" />
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  CY {submission.year} v{submission.version}
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
                  disabled={isPending}
                  className="col-span-2 gap-1.5 h-8 text-xs bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
                  {isPending ? (
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
                  disabled={isPending}
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
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isPending}
                  className="w-full gap-1.5 h-8 text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 dark:hover:text-rose-300">
                  {isPending ? (
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
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          version={submission.version}
          year={submission.year}
          isDeleting={isPending}
        />
      </>
    );
  }
);

DraftCard.displayName = 'DraftCard';
