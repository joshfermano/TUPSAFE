'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Validation schema
const reviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes'], {
    required_error: 'Please select an action',
  }),
  notes: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

// Action type definition
type ReviewAction = 'approve' | 'reject' | 'request_changes';

export interface ReviewDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** ID of the submission being reviewed */
  submissionId: string;
  /** Type of submission */
  submissionType: 'pds' | 'saln';
  /** Current status of the submission */
  currentStatus: string;
  /** Name of the employee who submitted */
  employeeName: string;
  /** Default action to pre-select when dialog opens */
  defaultAction?: 'approve' | 'reject' | 'request_changes';
  /** Callback for approval action */
  onApprove: (notes?: string) => Promise<void>;
  /** Callback for rejection action */
  onReject: (notes: string) => Promise<void>;
  /** Callback for request changes action */
  onRequestChanges: (notes: string) => Promise<void>;
  /** Loading state during submission */
  isSubmitting?: boolean;
}

/**
 * ReviewDialog Component
 *
 * Reusable dialog for admin to approve, reject, or request changes on submissions (PDS/SALN).
 *
 * Features:
 * - Three action options: Approve, Reject, Request Changes
 * - Required review notes for reject/request changes
 * - Optional notes for approve
 * - Form validation with Zod
 * - Loading state during mutation
 * - Toast notification on success
 * - Professional shadcn/ui styling with TUP Crimson accents
 * - Dark mode support
 * - Keyboard shortcuts and accessibility
 *
 * @example
 * ```tsx
 * <ReviewDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   submissionId="123"
 *   submissionType="pds"
 *   currentStatus="pending"
 *   employeeName="John Doe"
 *   onApprove={async (notes) => { await approveSubmission(notes); }}
 *   onReject={async (notes) => { await rejectSubmission(notes); }}
 *   onRequestChanges={async (notes) => { await requestChanges(notes); }}
 *   isSubmitting={isLoading}
 * />
 * ```
 */
export function ReviewDialog({
  open,
  onOpenChange,
  submissionType,
  currentStatus,
  employeeName,
  defaultAction = 'approve',
  onApprove,
  onReject,
  onRequestChanges,
  isSubmitting = false,
}: ReviewDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      action: defaultAction,
      notes: '',
    },
  });

  const selectedAction = watch('action');
  const notes = watch('notes');

  // Determine if notes are required based on action
  const notesRequired = selectedAction === 'reject' || selectedAction === 'request_changes';

  // Validate notes requirement
  const isNotesValid = !notesRequired || (notes && notes.trim().length > 0);

  // Reset form when dialog opens/closes or defaultAction changes
  React.useEffect(() => {
    if (open) {
      // When dialog opens, set to the defaultAction
      reset({ action: defaultAction, notes: '' });
    }
  }, [open, defaultAction, reset]);

  const onSubmit = async (data: ReviewFormData) => {
    // Validate notes if required
    if (notesRequired && (!data.notes || data.notes.trim().length === 0)) {
      toast.error('Review notes are required for this action');
      return;
    }

    try {
      switch (data.action) {
        case 'approve':
          await onApprove(data.notes);
          toast.success(`${submissionType.toUpperCase()} Approved`, {
            description: `${employeeName}'s submission has been approved`,
          });
          break;
        case 'reject':
          await onReject(data.notes!);
          toast.success(`${submissionType.toUpperCase()} Rejected`, {
            description: `${employeeName}'s submission has been rejected`,
          });
          break;
        case 'request_changes':
          await onRequestChanges(data.notes!);
          toast.success('Changes Requested', {
            description: `${employeeName} will be notified to revise their submission`,
          });
          break;
      }

      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      toast.error('Review Failed', {
        description: error instanceof Error ? error.message : 'An error occurred during review',
      });
    }
  };

  // Action configurations for styling and labels
  const actionConfig = {
    approve: {
      icon: CheckCircle2,
      label: 'Approve',
      description: 'Accept this submission as complete and compliant',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    reject: {
      icon: XCircle,
      label: 'Reject',
      description: 'Reject this submission due to non-compliance or errors',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    request_changes: {
      icon: AlertCircle,
      label: 'Request Changes',
      description: 'Ask employee to revise and resubmit',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Review {submissionType.toUpperCase()} Submission
          </DialogTitle>
          <DialogDescription>
            Reviewing submission from <span className="font-medium text-foreground">{employeeName}</span> (
            <span className="capitalize">{currentStatus}</span>)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Action Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Action</Label>
            <RadioGroup
              value={selectedAction}
              onValueChange={(value) => setValue('action', value as ReviewAction)}
              className="grid gap-3"
            >
              {Object.entries(actionConfig).map(([action, config]) => {
                const Icon = config.icon;
                const isSelected = selectedAction === action;

                return (
                  <label
                    key={action}
                    className={`
                      relative flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4
                      transition-all duration-200
                      ${isSelected
                        ? `${config.borderColor} ${config.bgColor}`
                        : 'border-border hover:border-muted-foreground/20'
                      }
                    `}
                  >
                    <RadioGroupItem value={action} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${isSelected ? config.color : 'text-muted-foreground'}`} />
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
            {errors.action && (
              <p className="text-sm text-destructive">{errors.action.message}</p>
            )}
          </div>

          {/* Review Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes" className="text-sm font-medium">
                Review Notes {notesRequired && <span className="text-destructive">*</span>}
              </Label>
              {notesRequired && (
                <span className="text-xs text-muted-foreground">Required</span>
              )}
            </div>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={
                selectedAction === 'approve'
                  ? 'Optional: Add any comments or feedback...'
                  : 'Provide detailed feedback for the employee...'
              }
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
            />
            {notesRequired && !isNotesValid && (
              <p className="text-sm text-destructive">
                Please provide notes explaining your decision
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedAction === 'approve'
                ? 'Optional feedback that will be shared with the employee'
                : 'This feedback will help the employee understand what needs to be corrected'}
            </p>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isNotesValid}
              className={
                selectedAction === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800'
                  : selectedAction === 'reject'
                  ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                  : 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800'
              }
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  {selectedAction === 'approve' && 'Approve Submission'}
                  {selectedAction === 'reject' && 'Reject Submission'}
                  {selectedAction === 'request_changes' && 'Request Changes'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
