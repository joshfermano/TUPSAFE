'use client';

import React, { memo, useMemo } from 'react';
import { BlurFade, Badge } from '@tupsafe/shared-ui';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Eye,
  Download,
  FileEdit,
  Clock,
  XCircle,
  CheckCircle2,
  User,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

interface SubmissionCardProps {
  submission: {
    id: string;
    version: number;
    status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
    approvedAt?: string;
    reviewedBy?: string;
  };
  onEdit: () => void;
  onView: () => void;
  onDownload: () => void;
  delay?: number;
}

// Status configuration
const STATUS_COLORS = {
  draft:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  submitted:
    'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  reviewing:
    'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  approved:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  rejected:
    'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
} as const;

const STATUS_ICONS = {
  draft: FileEdit,
  submitted: Clock,
  reviewing: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
} as const;

// Calculate completion based on status
const calculateCompletion = (
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected'
): number => {
  switch (status) {
    case 'draft':
      return Math.floor(Math.random() * 40) + 50; // 50-90%
    case 'submitted':
      return 95;
    case 'reviewing':
      return 98;
    case 'approved':
      return 100;
    case 'rejected':
      return 100;
    default:
      return 0;
  }
};

export const SubmissionCard = memo(
  ({
    submission,
    onEdit,
    onView,
    onDownload,
    delay = 0,
  }: SubmissionCardProps) => {
    const completion = useMemo(
      () => calculateCompletion(submission.status),
      [submission.status]
    );

    const StatusIcon = STATUS_ICONS[submission.status];
    const submissionDate =
      submission.submittedAt || submission.updatedAt || submission.createdAt;
    const daysPending = differenceInDays(new Date(), new Date(submissionDate));

    const isDraft = submission.status === 'draft';
    const isRejected = submission.status === 'rejected';
    const isApproved = submission.status === 'approved';
    const canEdit = isDraft || isRejected;

    return (
      <BlurFade delay={delay}>
        <Card className="h-full transition-all duration-200 hover:border-[oklch(0.55_0.22_15)] hover:shadow-md">
          <CardContent className="p-5 space-y-3.5">
            {/* Header with Status Badge */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    PDS Version {submission.version}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isDraft
                    ? `Last saved ${format(new Date(submission.updatedAt), 'MMM d, yyyy')}`
                    : isApproved
                    ? `Approved ${format(new Date(submission.approvedAt || submissionDate), 'MMM d, yyyy')}`
                    : `Submitted ${format(new Date(submissionDate), 'MMM d, yyyy')}`}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'gap-1.5 px-2 py-0.5 text-xs',
                  STATUS_COLORS[submission.status]
                )}>
                <StatusIcon className="h-3 w-3" />
                <span className="capitalize font-medium">
                  {submission.status}
                </span>
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
                Version {submission.version}
              </span>
              {submission.reviewedBy && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {submission.reviewedBy}
                </span>
              )}
              {!isDraft && !isApproved && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {daysPending} {daysPending === 1 ? 'day' : 'days'} pending
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {canEdit ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onEdit}
                    className="col-span-2 gap-1.5 h-8 text-xs bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
                    <FileEdit className="h-3.5 w-3.5" />
                    {isDraft ? 'Continue Editing' : 'Edit & Resubmit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onView}
                    className="gap-1.5 h-8 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onView}
                    className="col-span-2 gap-1.5 h-8 text-xs bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Button>
                  {isApproved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDownload}
                      className="gap-1.5 h-8 text-xs">
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Status-specific notices */}
            {isRejected && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-lg p-2.5">
                <p className="text-xs text-rose-700 dark:text-rose-500 flex items-center gap-1.5">
                  <XCircle className="h-3 w-3 shrink-0" />
                  <span>
                    This submission was rejected. Please review feedback and
                    resubmit.
                  </span>
                </p>
              </div>
            )}

            {submission.status === 'reviewing' && (
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30 rounded-lg p-2.5">
                <p className="text-xs text-purple-700 dark:text-purple-500 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    Your submission is currently under review. You will be
                    notified of any updates.
                  </span>
                </p>
              </div>
            )}

            {isApproved && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg p-2.5">
                <p className="text-xs text-emerald-700 dark:text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>
                    This submission has been approved and is now part of your
                    official record.
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </BlurFade>
    );
  }
);

SubmissionCard.displayName = 'SubmissionCard';
