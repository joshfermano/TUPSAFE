'use client';

import * as React from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import type { UserRole } from '@tupsafe/types';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface RoleChangeConfirmationDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** Full name of the user whose role is being changed (displayed for context) */
  userFullName: string;
  /** Role currently stored in the database */
  fromRole: UserRole;
  /** Role the user is being moved to */
  toRole: UserRole;
  /** True when the transition increases privilege (per ROLE_HIERARCHY) */
  isElevation: boolean;
  /** External loading indicator (mutation pending) */
  isLoading?: boolean;
  /** Invoked with the trimmed reason once all validations pass */
  onConfirm: (reason: string) => Promise<void> | void;
}

const CONFIRM_KEYWORD = 'CONFIRM';
const REASON_MIN = 20;
const REASON_MAX = 500;

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrator',
  hr: 'HR Personnel',
  employee: 'Employee',
};

function RoleBadge({
  role,
  highlighted = false,
}: {
  role: UserRole;
  highlighted?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
        highlighted
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-muted text-muted-foreground'
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      {ROLE_LABELS[role]}
    </span>
  );
}

/**
 * RoleChangeConfirmationDialog
 *
 * Destructive-style confirmation for role changes. Requires a written
 * justification (20–500 chars) and, for elevations (transitions that increase
 * privilege per ROLE_HIERARCHY), an additional type-to-confirm keyword input.
 *
 * Patterns match {@link DeleteSubmissionDialog} for consistency.
 */
export function RoleChangeConfirmationDialog({
  open,
  onOpenChange,
  userFullName,
  fromRole,
  toRole,
  isElevation,
  isLoading = false,
  onConfirm,
}: RoleChangeConfirmationDialogProps) {
  const [reason, setReason] = React.useState('');
  const [confirmInput, setConfirmInput] = React.useState('');
  const [reasonTouched, setReasonTouched] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Reset on open/close
  React.useEffect(() => {
    setReason('');
    setConfirmInput('');
    setReasonTouched(false);
    setSubmitAttempted(false);
    setIsProcessing(false);
  }, [open]);

  const trimmedLength = reason.trim().length;
  const reasonValid = trimmedLength >= REASON_MIN && trimmedLength <= REASON_MAX;
  const keywordValid = !isElevation || confirmInput === CONFIRM_KEYWORD;
  const loading = isLoading || isProcessing;
  const canSubmit = reasonValid && keywordValid && !loading;

  const showReasonError =
    (reasonTouched || submitAttempted) && !reasonValid && trimmedLength > 0
      ? `Reason must be between ${REASON_MIN} and ${REASON_MAX} characters.`
      : submitAttempted && trimmedLength === 0
        ? `Please provide a reason (at least ${REASON_MIN} characters).`
        : null;

  const handleConfirm = async () => {
    setSubmitAttempted(true);
    if (!canSubmit) return;

    setIsProcessing(true);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } catch (error) {
      console.error('Role change failed:', error);
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

  const toLabel = ROLE_LABELS[toRole];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          'sm:max-w-[540px]',
          isElevation && 'border-destructive/50'
        )}
      >
        <AlertDialogHeader>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              isElevation
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-foreground'
            )}
          >
            {isElevation ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <ShieldCheck className="h-6 w-6" />
            )}
          </div>
          <AlertDialogTitle className={isElevation ? 'text-destructive' : ''}>
            Change role to {toLabel}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {isElevation
              ? 'This user will gain additional permissions. Please review carefully.'
              : 'Review the role transition below and record a reason for the audit log.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Role transition */}
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {userFullName || 'User'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge role={fromRole} />
              <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              <RoleBadge role={toRole} highlighted />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="role-change-reason" className="text-sm font-medium">
              Reason for role change
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Textarea
              id="role-change-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setReasonTouched(true)}
              maxLength={REASON_MAX}
              rows={4}
              placeholder="e.g. Promoted to HR lead following approval from HR Director (recorded in audit log)"
              disabled={loading}
              className={
                showReasonError
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
              aria-describedby="role-change-reason-help"
            />
            <div
              id="role-change-reason-help"
              className="flex items-center justify-between text-xs"
            >
              <span
                className={
                  showReasonError ? 'text-destructive' : 'text-muted-foreground'
                }
              >
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

          {/* Type-to-confirm keyword (elevation only) */}
          {isElevation && (
            <div className="space-y-2">
              <Label htmlFor="role-change-keyword" className="text-sm font-medium">
                Type{' '}
                <span className="font-mono font-semibold">{CONFIRM_KEYWORD}</span>{' '}
                to proceed
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="role-change-keyword"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder={CONFIRM_KEYWORD}
                disabled={loading}
                autoComplete="off"
                className={cn(
                  'font-mono',
                  confirmInput.length > 0 && !keywordValid &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
              {confirmInput.length > 0 && !keywordValid && (
                <p className="text-xs text-destructive">
                  Please type exactly:{' '}
                  <span className="font-mono font-semibold">{CONFIRM_KEYWORD}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canSubmit}
            className={
              isElevation
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive'
                : ''
            }
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Applying...
              </>
            ) : (
              'Apply role change'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
