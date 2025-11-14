/**
 * Approve Submission Dialog
 *
 * Confirmation dialog for approving PDS/SALN submissions
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface ApproveSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    id: string;
    type: 'pds' | 'saln';
    employeeName: string;
    employeeId?: string;
  } | null;
  onConfirm: (notes?: string) => void;
  isLoading?: boolean;
}

export function ApproveSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onConfirm,
  isLoading,
}: ApproveSubmissionDialogProps) {
  const [notes, setNotes] = useState('');
  const [reviewedAll, setReviewedAll] = useState(false);
  const [accurateInfo, setAccurateInfo] = useState(false);

  const canApprove = reviewedAll && accurateInfo;

  const handleConfirm = () => {
    onConfirm(notes || undefined);
    // Reset state
    setNotes('');
    setReviewedAll(false);
    setAccurateInfo(false);
  };

  if (!submission) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDialogTitle>Approve Submission</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            You are about to approve the following submission:
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

          {/* Approval Notes */}
          <div className="space-y-2">
            <Label htmlFor="approval-notes">
              Approval Notes <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="approval-notes"
              placeholder="Add any comments or notes about this approval..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {notes.length}/1000
            </div>
          </div>

          {/* Confirmation Checkboxes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="reviewed-all"
                checked={reviewedAll}
                onCheckedChange={(checked) => setReviewedAll(checked === true)}
              />
              <Label
                htmlFor="reviewed-all"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I have reviewed all information in this submission
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="accurate-info"
                checked={accurateInfo}
                onCheckedChange={(checked) => setAccurateInfo(checked === true)}
              />
              <Label
                htmlFor="accurate-info"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                The information is complete and appears accurate
              </Label>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-300">
              The employee will be notified via email that their submission has been approved.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canApprove || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Approving...' : 'Approve Submission'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
