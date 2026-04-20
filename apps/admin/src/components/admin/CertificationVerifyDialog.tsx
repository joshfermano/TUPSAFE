'use client';

/**
 * CertificationVerifyDialog Component
 *
 * A dialog for verifying or rejecting a certification with optional/required notes.
 * Notes are required for rejection (min 10 chars) and optional for verification.
 *
 * Uses shadcn/ui Dialog, Textarea, Button, and Label components.
 */

import * as React from 'react';
import { format } from 'date-fns';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { ProfileCertificationData } from '@tupsafe/types';

interface CertificationVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification: ProfileCertificationData | null;
  action: 'verify' | 'reject';
  onConfirm: (notes: string) => void;
  isPending: boolean;
}

/** Format date for display */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '\u2014';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function CertificationVerifyDialog({
  open,
  onOpenChange,
  certification,
  action,
  onConfirm,
  isPending,
}: CertificationVerifyDialogProps) {
  const [notes, setNotes] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  // Reset notes when dialog opens/closes or certification changes
  React.useEffect(() => {
    if (open) {
      setNotes('');
      setValidationError(null);
    }
  }, [open, certification?.id]);

  const isReject = action === 'reject';
  const notesMinLength = 10;

  const handleConfirm = () => {
    // Validate notes for rejection
    if (isReject && notes.trim().length < notesMinLength) {
      setValidationError(
        `Please provide a reason for rejection (minimum ${notesMinLength} characters).`
      );
      return;
    }
    setValidationError(null);
    onConfirm(notes.trim());
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    if (validationError && e.target.value.trim().length >= notesMinLength) {
      setValidationError(null);
    }
  };

  if (!certification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReject ? (
              <>
                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                Reject Certification
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                Verify Certification
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isReject
              ? 'Provide a reason for rejecting this certification. The employee will be notified.'
              : 'Confirm verification of this certification. You may optionally add notes.'}
          </DialogDescription>
        </DialogHeader>

        {/* Certification Summary */}
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <h4 className="font-semibold text-foreground">
            {certification.title}
          </h4>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider">
                Period
              </span>
              <p className="mt-0.5">
                {formatDate(certification.dateFrom)} -{' '}
                {formatDate(certification.dateTo)}
              </p>
            </div>
            {certification.hours !== null &&
              certification.hours !== undefined && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Hours
                  </span>
                  <p className="mt-0.5">{certification.hours}</p>
                </div>
              )}
            {certification.typeOfLd && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider">
                  Type of L&D
                </span>
                <p className="mt-0.5">{certification.typeOfLd}</p>
              </div>
            )}
            {certification.conductedBy && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider">
                  Conducted By
                </span>
                <p className="mt-0.5">{certification.conductedBy}</p>
              </div>
            )}
          </div>
          {certification.files && certification.files.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {certification.files.length} file
              {certification.files.length !== 1 ? 's' : ''} attached
            </p>
          )}
        </div>

        <Separator />

        {/* Notes Field */}
        <div className="space-y-2">
          <Label htmlFor="verification-notes">
            Notes{' '}
            {isReject ? (
              <span className="text-red-500 dark:text-red-400">*</span>
            ) : (
              <span className="text-muted-foreground">(optional)</span>
            )}
          </Label>
          <Textarea
            id="verification-notes"
            placeholder={
              isReject
                ? 'Provide the reason for rejection...'
                : 'Add any notes about this verification...'
            }
            value={notes}
            onChange={handleNotesChange}
            rows={4}
            className={validationError ? 'border-red-500 dark:border-red-400' : ''}
          />
          {validationError && (
            <p className="flex items-center gap-1 text-sm text-red-500 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {validationError}
            </p>
          )}
          {isReject && !validationError && (
            <p className="text-xs text-muted-foreground">
              Minimum {notesMinLength} characters required.
              {notes.trim().length > 0 &&
                notes.trim().length < notesMinLength &&
                ` (${notes.trim().length}/${notesMinLength})`}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            variant={isReject ? 'destructive' : 'default'}
            className={
              !isReject ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600' : undefined
            }>
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isReject ? 'Rejecting...' : 'Verifying...'}
              </span>
            ) : isReject ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Certification
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Certification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
