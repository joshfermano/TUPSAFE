'use client';

/**
 * CertificationCard Component
 *
 * Displays a single profile certification with verification actions.
 * Follows the same responsive card pattern as TrainingCard.
 *
 * Features:
 * - Title, date range, hours, type of L&D, conducted by
 * - Verification status badge (pending/verified/rejected)
 * - File attachments with download links
 * - Verify/Reject action buttons (only for pending certifications)
 * - Responsive mobile/desktop layout
 */

import * as React from 'react';
import { format } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Calendar,
  Building2,
  Timer,
  ChevronDown,
  Paperclip,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataField } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { ProfileCertificationData, CertificationFileData } from '@tupsafe/types';

interface CertificationCardProps {
  certification: ProfileCertificationData;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
}

/** Format a date string for display */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '\u2014';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/** Format a date range for display */
function formatDateRange(from?: string, to?: string): string {
  if (!from && !to) return '\u2014';
  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return `${formatDate(from)} - Present`;
  return to ? formatDate(to) : '\u2014';
}

/** Check if file is an image */
function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/** Format file size */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** File type label for badge */
function getFileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType === 'application/pdf') return 'PDF';
  if (
    mimeType === 'application/msword' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'Word';
  return 'Document';
}

/** Verification status badge with appropriate colors and icons */
function VerificationBadge({
  status,
}: {
  status: ProfileCertificationData['verificationStatus'];
}) {
  switch (status) {
    case 'verified':
      return (
        <Badge
          variant="default"
          className="bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-600 border-0">
          <CheckCircle className="mr-1 h-3 w-3" />
          Verified
        </Badge>
      );
    case 'rejected':
      return (
        <Badge
          variant="destructive"
          className="bg-red-600 text-white hover:bg-red-600 dark:bg-red-600 dark:text-white dark:hover:bg-red-600 border-0">
          <XCircle className="mr-1 h-3 w-3" />
          Rejected
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge
          variant="secondary"
          className="bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-500 dark:text-white dark:hover:bg-amber-500 border-0">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

/** Individual file attachment display */
function FileAttachment({ file }: { file: CertificationFileData }) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const isImage = isImageFile(file.mimeType || '');
  const fileTypeLabel = getFileTypeLabel(file.mimeType || '');
  const hasValidUrl = file.fileUrl && file.fileUrl.trim() !== '';

  return (
    <>
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
        {/* File Icon/Thumbnail */}
        <div className="flex-shrink-0">
          {isImage && hasValidUrl && !imageError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={file.fileUrl!}
              alt={file.fileName}
              className="h-12 w-12 rounded object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
              {isImage ? (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              ) : (
                <FileText className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground" title={file.fileName}>
                {file.fileName}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {fileTypeLabel}
                </Badge>
                {file.sizeBytes !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.sizeBytes)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {isImage && hasValidUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowPreview(true)}
                  title="Preview image">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (hasValidUrl && file.fileUrl) {
                    window.open(file.fileUrl, '_blank');
                  }
                }}
                disabled={!hasValidUrl}
                title="Download file">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!hasValidUrl && (
            <Badge variant="destructive" className="mt-2 text-xs">
              File unavailable
            </Badge>
          )}
        </div>
      </div>

      {/* Image Preview Dialog */}
      {isImage && hasValidUrl && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-h-[90vh] max-w-4xl">
            <DialogHeader>
              <DialogTitle>{file.fileName}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.fileUrl!}
                alt={file.fileName}
                className="h-auto max-w-full rounded-lg"
                onError={() => {
                  setImageError(true);
                  setShowPreview(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function CertificationCard({
  certification,
  onVerify,
  onReject,
}: CertificationCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const isPending = certification.verificationStatus === 'pending';
  const hasFiles = certification.files && certification.files.length > 0;

  return (
    <Card className={cn('overflow-hidden')}>
      <CardContent className="p-0">
        {/* Mobile Layout */}
        <div className="md:hidden">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {/* Mobile Summary */}
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-foreground">
                  {certification.title}
                </h4>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDateRange(certification.dateFrom, certification.dateTo)}
                </p>
                <div className="mt-2">
                  <VerificationBadge status={certification.verificationStatus} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {certification.hours !== null &&
                  certification.hours !== undefined && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Hours</p>
                      <p className="font-semibold tabular-nums text-foreground">
                        {certification.hours}
                      </p>
                    </div>
                  )}
                {hasFiles && (
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Mobile Expand Button */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full rounded-none border-t border-border/50 text-muted-foreground hover:text-foreground">
                <span className="text-xs">
                  {isOpen ? 'Hide Details' : 'View Details'}
                </span>
                <ChevronDown
                  className={cn(
                    'ml-1.5 h-3 w-3 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            {/* Mobile Expanded Content */}
            <CollapsibleContent>
              <div className="border-t border-border/50 bg-muted/50 p-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <DataField
                    label="Certification Title"
                    value={certification.title}
                    className="col-span-2"
                  />
                  <DataField
                    label="From"
                    value={formatDate(certification.dateFrom)}
                  />
                  <DataField
                    label="To"
                    value={formatDate(certification.dateTo)}
                  />
                  <DataField
                    label="Number of Hours"
                    value={
                      certification.hours !== null &&
                      certification.hours !== undefined
                        ? certification.hours.toString()
                        : null
                    }
                  />
                  <DataField
                    label="Type of L&D"
                    value={certification.typeOfLd}
                  />
                  <DataField
                    label="Conducted/Sponsored By"
                    value={certification.conductedBy}
                    className="col-span-2"
                  />
                </dl>

                {/* Verification Notes */}
                {certification.verificationNotes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Verification Notes
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {certification.verificationNotes}
                      </p>
                    </div>
                  </>
                )}

                {/* Files */}
                {hasFiles && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Paperclip className="h-4 w-4" />
                        Attachments ({certification.files.length})
                      </h5>
                      <div className="grid grid-cols-1 gap-3">
                        {certification.files.map((file) => (
                          <FileAttachment key={file.id} file={file} />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                {isPending && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                        onClick={() => onVerify(certification.id)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => onReject(certification.id)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Desktop Layout */}
        <div className="hidden p-4 md:block">
          {/* Header row with title + status */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-semibold text-foreground">
                {certification.title}
              </h4>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateRange(
                    certification.dateFrom,
                    certification.dateTo
                  )}
                </span>
                {certification.hours !== null &&
                  certification.hours !== undefined && (
                    <span className="flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5" />
                      {certification.hours} hours
                    </span>
                  )}
                {certification.conductedBy && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {certification.conductedBy}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <VerificationBadge status={certification.verificationStatus} />
            </div>
          </div>

          {/* Detail fields */}
          <div className="mt-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DataField
                label="Certification Title"
                value={certification.title}
                className="col-span-2"
              />
              <DataField
                label="From"
                value={formatDate(certification.dateFrom)}
              />
              <DataField
                label="To"
                value={formatDate(certification.dateTo)}
              />
              <DataField
                label="Number of Hours"
                value={
                  certification.hours !== null &&
                  certification.hours !== undefined
                    ? certification.hours.toString()
                    : null
                }
              />
              <DataField
                label="Type of L&D"
                value={certification.typeOfLd}
              />
              <DataField
                label="Conducted/Sponsored By"
                value={certification.conductedBy}
                className="col-span-2"
              />
            </dl>
          </div>

          {/* Verification Notes */}
          {certification.verificationNotes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verification Notes
                </p>
                <p className="mt-1 text-sm text-foreground">{certification.verificationNotes}</p>
                {certification.verifiedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reviewed on {formatDate(certification.verifiedAt)}
                  </p>
                )}
              </div>
            </>
          )}

          {/* File Attachments */}
          {hasFiles && (
            <>
              <Separator className="my-4" />
              <div>
                <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({certification.files.length})
                </h5>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {certification.files.map((file) => (
                    <FileAttachment key={file.id} file={file} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          {isPending && (
            <>
              <Separator className="my-4" />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(certification.id)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  onClick={() => onVerify(certification.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
