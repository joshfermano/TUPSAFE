/**
 * Reject Submission Dialog
 *
 * Dialog for rejecting PDS/SALN submissions with required reason
 */

'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { XCircle, AlertTriangle } from 'lucide-react';

interface RejectSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    id: string;
    type: 'pds' | 'saln';
    employeeName: string;
    employeeId?: string;
  } | null;
  onConfirm: (reason: string, notes?: string) => void;
  isLoading?: boolean;
}

export function RejectSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onConfirm,
  isLoading,
}: RejectSubmissionDialogProps) {
  const [reason, setReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const canReject = reason.trim().length >= 20;
  const reasonLength = reason.length;

  const handleConfirm = () => {
    if (canReject) {
      onConfirm(reason, internalNotes || undefined);
      // Reset state
      setReason('');
      setInternalNotes('');
    }
  };

  if (!submission) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertDialogTitle>Reject Submission</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            You are about to reject the following submission:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Submission Details */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{submission.employeeName}</div>
                {submission.employeeId && (
                  <div className="text-sm text-muted-foreground">
                    {submission.employeeId}
                  </div>
                )}
              </div>
              <Badge variant={submission.type === 'pds' ? 'default' : 'secondary'}>
                {submission.type.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Rejection Reason - REQUIRED */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason" className="text-red-600">
              Rejection Reason <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Please provide a clear, specific reason for rejecting this submission. This will be sent to the employee. (Minimum 20 characters)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={1000}
              className={
                reason.length > 0 && reason.length < 20
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />
            <div
              className={`text-xs text-right ${
                reasonLength < 20 ? 'text-red-600' : 'text-muted-foreground'
              }`}
            >
              {reasonLength}/1000 {reasonLength < 20 && `(${20 - reasonLength} more required)`}
            </div>
          </div>

          {/* Internal Notes - Optional */}
          <div className="space-y-2">
            <Label htmlFor="internal-notes">
              Internal Notes <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="internal-notes"
              placeholder="Add internal notes (not visible to employee)..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {internalNotes.length}/1000
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Important: Employee Notification
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                The employee will be notified via email with the rejection reason you provide
                above. Please ensure your reason is professional and constructive.
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canReject || isLoading}
            variant="destructive"
          >
            {isLoading ? 'Rejecting...' : 'Reject Submission'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
