/**
 * Reject Registration Dialog
 *
 * Dialog for rejecting a pending registration with required reason field.
 * Sends rejection notification email to the applicant.
 */

'use client';

import { useState } from 'react';
import { XCircle, Loader2, AlertTriangle, Mail } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useRejectRegistration } from '@/hooks/useRegistrations';
import type { Registration } from '@/lib/api/registrations';

interface RejectRegistrationDialogProps {
  registration: Registration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RejectRegistrationDialog({
  registration,
  open,
  onOpenChange,
}: RejectRegistrationDialogProps) {
  const rejectMutation = useRejectRegistration();

  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  const handleReject = async () => {
    if (!registration || reason.trim().length < 10) return;

    rejectMutation.mutate(
      {
        id: registration.id,
        data: {
          reason: reason.trim(),
          notes: notes.trim() || undefined,
          sendEmail,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          // Reset form
          setReason('');
          setNotes('');
          setSendEmail(true);
        },
      }
    );
  };

  if (!registration) return null;

  const fullName = [registration.firstName, registration.middleName, registration.lastName]
    .filter(Boolean)
    .join(' ');

  const isReasonValid = reason.trim().length >= 10;
  const isFormValid = isReasonValid;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Reject Registration
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to reject the registration request for{' '}
            <strong>{fullName}</strong>. Please provide a clear reason for this
            decision.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* User Details */}
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Applicant Name:</span>
              <span className="text-sm">{fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{registration.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Type:</span>
              <Badge
                variant={
                  registration.userType === 'employee' ? 'default' : 'secondary'
                }
                className={
                  registration.userType === 'employee'
                    ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300 border-blue-500/30'
                    : 'bg-orange-500/15 text-orange-700 dark:bg-orange-500/25 dark:text-orange-300 border-orange-500/30'
                }
              >
                {registration.userType === 'employee' ? 'Employee' : 'Applicant'}
              </Badge>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 p-3 rounded-md flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <strong>Warning:</strong> Rejecting this registration will permanently
              deny access. The applicant will be notified via email with the reason
              you provide below.
            </div>
          </div>

          {/* Rejection Reason (Required) */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="flex items-center gap-2">
              Rejection Reason
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Provide a clear, professional reason for rejection (minimum 10 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={1000}
              className={!isReasonValid && reason.length > 0 ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-xs">
              <span
                className={
                  !isReasonValid && reason.length > 0
                    ? 'text-red-600'
                    : 'text-muted-foreground'
                }
              >
                {isReasonValid ? '✓ Valid' : 'Minimum 10 characters required'}
              </span>
              <span className="text-muted-foreground">{reason.length}/1000</span>
            </div>
          </div>

          {/* Internal Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Internal Notes{' '}
              <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add internal notes (not visible to applicant)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {notes.length}/500 characters
            </div>
          </div>

          {/* Send Email Checkbox */}
          <div className="flex items-center space-x-2 bg-muted p-3 rounded-md">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <label
              htmlFor="sendEmail"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              Send rejection notification email to {registration.email}
            </label>
          </div>

          {/* Email Preview */}
          {sendEmail && (
            <div className="bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 p-3 rounded-md text-sm">
              <strong>Email Preview:</strong>
              <p className="mt-2 text-muted-foreground">
                The applicant will receive an email notification with the rejection
                reason you provided. The internal notes will NOT be included in the
                email.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={rejectMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReject}
            disabled={!isFormValid || rejectMutation.isPending}
            variant="destructive"
          >
            {rejectMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Registration
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
