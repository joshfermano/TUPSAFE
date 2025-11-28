/**
 * Delete Deadline Dialog Component
 *
 * Confirmation dialog for deleting a submission deadline.
 * Shows deadline details and warns about the impact of deletion.
 */

'use client';

import { useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, CalendarDays, Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

import { useDeleteDeadline } from '@/hooks/useDeadlines';
import type { DeadlineDetailResponse, Deadline } from '@/lib/api/deadlines';

interface DeleteDeadlineDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** The deadline to delete */
  deadline: DeadlineDetailResponse | Deadline | null;
  /** Optional callback after successful deletion */
  onDeleted?: () => void;
}

export function DeleteDeadlineDialog({
  open,
  onOpenChange,
  deadline,
  onDeleted,
}: DeleteDeadlineDialogProps) {
  const deleteDeadline = useDeleteDeadline();
  const isDeleting = deleteDeadline.isPending;

  const handleDelete = useCallback(async () => {
    if (!deadline) return;

    try {
      await deleteDeadline.mutateAsync(deadline.id);
      onOpenChange(false);
      onDeleted?.();
    } catch {
      // Error handling is done in the mutation hook
    }
  }, [deadline, deleteDeadline, onOpenChange, onDeleted]);

  const handleClose = useCallback(() => {
    if (!isDeleting) {
      onOpenChange(false);
    }
  }, [isDeleting, onOpenChange]);

  if (!deadline) return null;

  const formTypeLabel = deadline.formType.toUpperCase();
  const deadlineDate = parseISO(deadline.deadlineDate);

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[450px] border-destructive/50">
        <AlertDialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-destructive">
            Delete {formTypeLabel} Deadline?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This action cannot be undone. The deadline will be permanently removed
            from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Deadline Details */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Form Type</span>
            <Badge variant="secondary">{formTypeLabel}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Year</span>
            <span className="text-sm">{deadline.year}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Deadline Date</span>
            <div className="flex items-center gap-1.5 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {format(deadlineDate, 'MMMM d, yyyy')}
            </div>
          </div>
          {deadline.reminderDaysBefore && deadline.reminderDaysBefore.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Reminders</span>
              <div className="flex gap-1">
                {deadline.reminderDaysBefore
                  .sort((a, b) => b - a)
                  .map((days) => (
                    <Badge key={days} variant="outline" className="text-xs px-1.5 py-0">
                      {days}d
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Warning Message */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Impact Warning</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Deleting this deadline will stop all automated reminders for {formTypeLabel} {deadline.year}.
                Existing submissions will not be affected.
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Deadline'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
