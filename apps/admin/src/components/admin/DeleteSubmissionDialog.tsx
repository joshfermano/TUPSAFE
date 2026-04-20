'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface DeleteSubmissionDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** Kind of submission being deleted - drives title/label text */
  submissionType: 'pds' | 'saln';
  /** Owner's full name (for context/confirmation in the dialog) */
  ownerName: string;
  /** Submission year (PDS) or fiscal year (SALN); null when unknown */
  year: number | null;
  /** Current submission status, displayed in the context line */
  status: string;
  /** External loading indicator (mutation pending) */
  isLoading?: boolean;
  /** Callback invoked with the trimmed reason once all confirmations pass */
  onConfirm: (reason: string) => Promise<void> | void;
}

const CONFIRM_KEYWORD = 'DELETE';
const REASON_MIN = 10;
const REASON_MAX = 500;

/**
 * DeleteSubmissionDialog Component
 *
 * Admin-only destructive dialog for permanently deleting a PDS or SALN
 * submission. Requires both:
 *   1. A reason (10-500 chars, trimmed) - sent to the API for audit logging
 *   2. Typing the literal keyword "DELETE" to confirm intent
 *
 * Features:
 * - Destructive (red) AlertDialog variant
 * - Explicit approved-status warning callout when applicable
 * - Context line summarising what is being deleted
 * - Reason validation with character counter and blur/submit-triggered errors
 * - Type-to-confirm keyword input with Enter-to-submit
 * - Disabled submit until all validations pass
 * - State is reset whenever the dialog opens or closes
 *
 * @example
 * ```tsx
 * <DeleteSubmissionDialog
 *   open={!!target}
 *   onOpenChange={(o) => !o && setTarget(null)}
 *   submissionType="pds"
 *   ownerName="Juan Dela Cruz"
 *   year={2025}
 *   status="submitted"
 *   isLoading={mutation.isPending}
 *   onConfirm={async (reason) => {
 *     await mutation.mutateAsync({ id: target.id, data: { reason } });
 *   }}
 * />
 * ```
 */
export function DeleteSubmissionDialog({
  open,
  onOpenChange,
  submissionType,
  ownerName,
  year,
  status,
  isLoading = false,
  onConfirm,
}: DeleteSubmissionDialogProps) {
  const [reason, setReason] = React.useState('');
  const [confirmInput, setConfirmInput] = React.useState('');
  const [reasonTouched, setReasonTouched] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Reset all local state whenever the dialog is opened or closed
  React.useEffect(() => {
    setReason('');
    setConfirmInput('');
    setReasonTouched(false);
    setSubmitAttempted(false);
    setIsProcessing(false);
  }, [open]);

  const trimmedLength = reason.trim().length;
  const reasonValid = trimmedLength >= REASON_MIN && trimmedLength <= REASON_MAX;
  const keywordValid = confirmInput === CONFIRM_KEYWORD;
  const loading = isLoading || isProcessing;
  const canSubmit = reasonValid && keywordValid && !loading;

  const showReasonError =
    (reasonTouched || submitAttempted) && !reasonValid && trimmedLength > 0
      ? `Reason must be between ${REASON_MIN} and ${REASON_MAX} characters.`
      : (submitAttempted && trimmedLength === 0)
        ? `Please provide a reason (at least ${REASON_MIN} characters).`
        : null;

  const typeLabel = submissionType.toUpperCase();
  const wasApproved = status === 'approved';

  const handleConfirm = async () => {
    setSubmitAttempted(true);
    if (!canSubmit) return;

    setIsProcessing(true);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } catch (error) {
      // Parent is responsible for toast/error UX; swallow here so dialog stays open
      console.error('Delete submission failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canSubmit) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[520px] border-destructive/50">
        <AlertDialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-destructive">
            Delete {typeLabel} Submission?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This will permanently delete this submission and all related records.
            A snapshot is archived for compliance. This cannot be easily undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Approved-status callout */}
          {wasApproved && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <p className="font-semibold">
                ⚠ This submission was already APPROVED.
              </p>
              <p className="mt-1">
                Deletion will remove it from the employee&apos;s approved record.
              </p>
            </div>
          )}

          {/* Context line */}
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground border">
            <p>
              <span className="font-medium text-foreground">Submission:</span>{' '}
              {typeLabel} · {year ?? '—'} ·{' '}
              <span className="font-medium text-foreground">Owner:</span>{' '}
              {ownerName || '—'} ·{' '}
              <span className="font-medium text-foreground">Status:</span>{' '}
              {status || '—'}
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="delete-reason" className="text-sm font-medium">
              Reason for deletion
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Textarea
              id="delete-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setReasonTouched(true)}
              maxLength={REASON_MAX}
              rows={4}
              placeholder="Explain why this submission is being deleted (recorded in the audit log)"
              disabled={loading}
              className={
                showReasonError
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
            />
            <div className="flex items-center justify-between text-xs">
              <span className={showReasonError ? 'text-destructive' : 'text-muted-foreground'}>
                {showReasonError ?? `Minimum ${REASON_MIN} characters.`}
              </span>
              <span
                className={
                  trimmedLength > REASON_MAX
                    ? 'text-destructive tabular-nums'
                    : 'text-muted-foreground tabular-nums'
                }
              >
                {reason.length}/{REASON_MAX}
              </span>
            </div>
          </div>

          {/* Type-to-confirm keyword */}
          <div className="space-y-2">
            <Label htmlFor="delete-keyword" className="text-sm font-medium">
              Type <span className="font-mono font-semibold">{CONFIRM_KEYWORD}</span> to confirm
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Input
              id="delete-keyword"
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              placeholder={CONFIRM_KEYWORD}
              disabled={loading}
              autoComplete="off"
              className={`font-mono ${
                confirmInput.length > 0 && !keywordValid
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }`}
            />
            {confirmInput.length > 0 && !keywordValid && (
              <p className="text-xs text-destructive">
                Please type exactly:{' '}
                <span className="font-mono font-semibold">{CONFIRM_KEYWORD}</span>
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Deleting...
              </>
            ) : (
              `Delete ${typeLabel}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
