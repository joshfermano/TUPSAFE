'use client';

import React, { memo, useMemo } from 'react';
import { BlurFade, Badge } from '@tupsafe/shared-ui';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Landmark,
  Eye,
  Download,
  FileEdit,
  Clock,
  XCircle,
  User,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

interface PendingCardProps {
  submission: {
    id: string;
    year: number;
    status: 'draft' | 'submitted' | 'reviewing' | 'rejected';
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
  };
  onContinue: () => void;
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
    'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  rejected:
    'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
} as const;

const STATUS_ICONS = {
  draft: FileEdit,
  submitted: Clock,
  reviewing: Clock,
  rejected: XCircle,
} as const;

// Calculate completion based on status
const calculateCompletion = (
  status: 'draft' | 'submitted' | 'reviewing' | 'rejected'
): number => {
  switch (status) {
    case 'draft':
      return Math.floor(Math.random() * 40) + 50; // 50-90%
    case 'submitted':
      return 95;
    case 'reviewing':
      return 98;
    case 'rejected':
      return 100;
    default:
      return 0;
  }
};

export const PendingCard = memo(
  ({
    submission,
    onContinue,
    onView,
    onDownload,
    delay = 0,
  }: PendingCardProps) => {
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
    const isReviewing = submission.status === 'reviewing';

    return (
      <BlurFade delay={delay}>
        <Card className="h-full transition-all duration-200 hover:border-[oklch(0.55_0.22_15)] hover:shadow-md">
          <CardContent className="p-5 space-y-3.5">
            {/* Header with Status Badge */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    SALN {submission.year}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isDraft
                    ? `Last saved ${format(new Date(submission.updatedAt), 'MMM d, yyyy')}`
                    : `Submitted ${format(new Date(submissionDate), 'MMM d, yyyy')}`}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'gap-1.5 px-2 py-0.5 text-xs',
                  STATUS_COLORS[submission.status]
                )}>
                <StatusIcon
                  className={cn(
                    'h-3 w-3',
                    isReviewing && 'animate-spin'
                  )}
                />
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
                <Landmark className="h-3 w-3" />
                Year {submission.year}
              </span>
              {submission.reviewedBy && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {submission.reviewedBy}
                </span>
              )}
              {!isDraft && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {daysPending} {daysPending === 1 ? 'day' : 'days'} pending
                </span>
              )}
            </div>

            {/* Rejection Reason Alert - Show prominently before action buttons */}
            {isRejected && submission.rejectionReason && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-lg p-3">
                <div className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                      Rejection Reason
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                      {submission.rejectionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {isDraft ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onContinue}
                    className="col-span-2 gap-1.5 h-8 text-xs bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
                    <FileEdit className="h-3.5 w-3.5" />
                    Continue Editing
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
              ) : isRejected ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onContinue}
                    className="col-span-2 gap-1.5 h-8 text-xs bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800">
                    <FileEdit className="h-3.5 w-3.5" />
                    Edit & Resubmit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onView}
                    className="gap-1.5 h-8 text-xs border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20">
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
                    className="gap-1.5 h-8 text-xs bg-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.50_0.22_15)]">
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownload}
                    className="gap-1.5 h-8 text-xs col-span-2">
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </Button>
                </>
              )}
            </div>

            {/* Status-specific notices */}
            {isRejected && !submission.rejectionReason && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-lg p-2.5">
                <p className="text-xs text-rose-700 dark:text-rose-500 flex items-start gap-1.5">
                  <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>
                    This submission was rejected. Please review and make the
                    necessary corrections before resubmitting.
                  </span>
                </p>
              </div>
            )}

            {submission.status === 'reviewing' && (
              <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/30 rounded-lg p-2.5">
                <p className="text-xs text-violet-700 dark:text-violet-500 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0 animate-spin" />
                  <span>
                    Your submission is currently under review. You will be
                    notified of any updates.
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

PendingCard.displayName = 'PendingCard';
