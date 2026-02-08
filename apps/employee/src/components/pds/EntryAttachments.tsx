'use client';

/**
 * EntryAttachments Component
 *
 * Reusable component for displaying and managing attachments for
 * PDS training or civil service entries. Supports:
 * - File upload (images and documents)
 * - Preview for images
 * - Download links for documents
 * - Delete functionality
 *
 * Requires the PDS draft to be saved before allowing uploads.
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Download,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface AttachmentData {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  fileUrl: string | null;
  createdAt: Date | string;
}

interface EntryAttachmentsProps {
  /** PDS submission ID (required for uploads) */
  pdsSubmissionId: string | null;
  /** Training or civil service entry ID */
  entryId: string | null;
  /** Type of entry (training or civil_service) */
  entryType: 'training' | 'civil_service';
  /** Existing attachments for this entry */
  attachments: AttachmentData[];
  /** Whether the form can be edited (draft/rejected status) */
  canEdit: boolean;
  /** Callback when attachments change */
  onAttachmentsChange?: (attachments: AttachmentData[]) => void;
  /** Callback to trigger auto-save before upload (returns IDs after save) */
  onBeforeUpload?: (entryContext: {
    entryType: 'training' | 'civil_service';
    entryId: string | null;
  }) => Promise<{
    success: boolean;
    pdsSubmissionId?: string;
    entryId?: string;
    errorMessage?: string;
  }>;
  /** Additional class names */
  className?: string;
}

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function EntryAttachments({
  pdsSubmissionId,
  entryId,
  entryType,
  attachments = [],
  canEdit,
  onAttachmentsChange,
  onBeforeUpload,
  className,
}: EntryAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if uploads are allowed - Allow upload if we can auto-save
  const hasRequiredIds = Boolean(pdsSubmissionId && entryId);
  const canAutoSave = Boolean(onBeforeUpload);
  const canUpload = canEdit && (hasRequiredIds || canAutoSave);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File too large', {
          description: 'Maximum file size is 10MB',
        });
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Invalid file type', {
          description:
            'Allowed types: Images (JPEG, PNG, GIF, WebP) and Documents (PDF, DOC, DOCX)',
        });
        return;
      }

      setIsUploading(true);

      try {
        // Determine effective IDs - either from props or from auto-save
        let effectivePdsSubmissionId = pdsSubmissionId;
        let effectiveEntryId = entryId;

        // ALWAYS trigger auto-save before upload when onBeforeUpload is available
        // This ensures the entry exists in the database before we try to upload attachments
        // (even if IDs exist in form state, the entry might not yet be persisted)
        if (onBeforeUpload) {
          console.log('[EntryAttachments] Triggering auto-save before upload...', {
            pdsSubmissionId,
            entryId,
            entryType,
          });

          toast.info('Saving draft...', {
            description: 'Ensuring your entry is saved before uploading.',
            duration: 2000,
          });

          const saveResult = await onBeforeUpload({
            entryType,
            entryId,
          });

          if (!saveResult.success) {
            toast.error('Cannot upload attachment', {
              description: saveResult.errorMessage || 'An unexpected error occurred. Please try again.',
              duration: 5000,
            });
            return;
          }

          // Use returned IDs (these come from the actual database after save)
          effectivePdsSubmissionId = saveResult.pdsSubmissionId || pdsSubmissionId;
          effectiveEntryId = saveResult.entryId || entryId;

          console.log('[EntryAttachments] Auto-save completed, using IDs:', {
            effectivePdsSubmissionId,
            effectiveEntryId,
          });
        }

        // Verify we have required IDs after auto-save attempt
        if (!effectivePdsSubmissionId || !effectiveEntryId) {
          toast.error('Cannot upload', {
            description: 'Please save the PDS draft first before uploading attachments.',
          });
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('pdsSubmissionId', effectivePdsSubmissionId);

        if (entryType === 'training') {
          formData.append('trainingId', effectiveEntryId);
        } else {
          formData.append('civilServiceId', effectiveEntryId);
        }

        const response = await fetch('/api/pds/attachments', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload attachment');
        }

        const result = await response.json();
        const newAttachment: AttachmentData = result.attachment;

        onAttachmentsChange?.([...attachments, newAttachment]);

        toast.success('Attachment uploaded', {
          description: `${file.name} has been uploaded successfully.`,
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Upload failed', {
          description:
            error instanceof Error ? error.message : 'Failed to upload attachment',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [pdsSubmissionId, entryId, entryType, attachments, onAttachmentsChange, onBeforeUpload]
  );

  const handleDelete = useCallback(
    async (attachmentId: string) => {
      setDeletingIds((prev) => new Set([...prev, attachmentId]));

      try {
        const response = await fetch(`/api/pds/attachments/${attachmentId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete attachment');
        }

        const updatedAttachments = attachments.filter(
          (att) => att.id !== attachmentId
        );
        onAttachmentsChange?.(updatedAttachments);

        toast.success('Attachment deleted');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Delete failed', {
          description:
            error instanceof Error ? error.message : 'Failed to delete attachment',
        });
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(attachmentId);
          return next;
        });
      }
    },
    [attachments, onAttachmentsChange]
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {isImageFile(attachment.mimeType) ? (
                  <div className="w-10 h-10 rounded overflow-hidden bg-slate-200 dark:bg-slate-700">
                    {attachment.fileUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewUrl(attachment.fileUrl)}
                      />
                    ) : (
                      <ImageIcon className="w-full h-full p-2 text-slate-400" />
                    )}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.sizeBytes)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {isImageFile(attachment.mimeType) && attachment.fileUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPreviewUrl(attachment.fileUrl)}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}

                {attachment.fileUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deletingIds.has(attachment.id)}
                    title="Delete"
                  >
                    {deletingIds.has(attachment.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canEdit && (
        <div>
          {canUpload ? (
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Add Attachment
                  </>
                )}
              </Button>
            </label>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {!pdsSubmissionId
                  ? 'Save draft first to enable attachments'
                  : 'Save this entry first to add attachments'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && !canEdit && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No attachments
        </p>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

