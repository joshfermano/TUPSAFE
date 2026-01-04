'use client';

/**
 * PDS Attachments List Component
 *
 * Read-only display of PDS attachments (certificates, licenses, documents)
 * Used in admin PDS submission view page for reviewing employee uploads
 */

import { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  FileType2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PdsAttachment } from '@tupsafe/types';

interface PdsAttachmentsListProps {
  attachments: PdsAttachment[];
  className?: string;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file is an image based on MIME type
 */
function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Get file type label for badge display
 */
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

/**
 * Individual attachment card component
 */
function AttachmentCard({ attachment }: { attachment: PdsAttachment }) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isImage = isImageFile(attachment.mimeType || '');
  const fileTypeLabel = getFileTypeLabel(attachment.mimeType || '');
  const hasValidUrl = attachment.fileUrl && attachment.fileUrl.trim() !== '';

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
        {/* File Icon/Thumbnail */}
        <div className="flex-shrink-0">
          {isImage && hasValidUrl && !imageError ? (
            <img
              src={attachment.fileUrl!}
              alt={attachment.fileName}
              className="h-12 w-12 rounded object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
              {isImage ? (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              ) : (
                <FileText className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium truncate"
                title={attachment.fileName}
              >
                {attachment.fileName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {fileTypeLabel}
                </Badge>
                {attachment.sizeBytes !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.sizeBytes)}
                  </span>
                )}
              </div>
              {attachment.createdAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(attachment.createdAt), 'MMM d, yyyy')}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {isImage && hasValidUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowPreview(true)}
                  disabled={!hasValidUrl}
                  title="Preview image"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (hasValidUrl && attachment.fileUrl) {
                    window.open(attachment.fileUrl, '_blank');
                  }
                }}
                disabled={!hasValidUrl}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* File Unavailable Badge */}
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
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{attachment.fileName}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center overflow-auto">
              <img
                src={attachment.fileUrl!}
                alt={attachment.fileName}
                className="max-w-full h-auto rounded-lg"
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

/**
 * Main component - List of attachments
 */
export function PdsAttachmentsList({
  attachments,
  className = '',
}: PdsAttachmentsListProps) {
  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No attachments
      </div>
    );
  }

  return (
    <div className={`grid gap-3 grid-cols-1 md:grid-cols-2 ${className}`}>
      {attachments.map((attachment) => (
        <AttachmentCard key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}
