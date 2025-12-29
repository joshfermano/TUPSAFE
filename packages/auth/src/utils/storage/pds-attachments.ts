/**
 * PDS Attachments Storage Utilities
 *
 * Provides consistent helpers for PDS attachment management (certificates,
 * seminar proofs, training documents) for civil service eligibility and
 * learning & development sections.
 *
 * Path format: {userId}/{year}/{pdsSubmissionId}/{kind}/{itemId}/{uuid}.{ext}
 * - kind: 'training' | 'civil_service'
 * - itemId: trainingId or civilServiceId
 *
 * Uses Supabase Storage with public bucket URLs.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Supabase Storage bucket name for PDS attachments
 */
export const PDS_ATTACHMENTS_BUCKET = 'pds-attachments';

/**
 * Attachment kind (training or civil service)
 */
export type AttachmentKind = 'training' | 'civil_service';

/**
 * Allowed MIME types for PDS attachments
 * Includes images and common document formats
 */
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
] as const;

export type AllowedAttachmentMimeType =
  (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number];

/**
 * Maximum file size for PDS attachments (10MB)
 */
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENT_SIZE_MB = 10;

/**
 * File validation result
 */
export interface AttachmentValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a PDS attachment file
 *
 * @param file - File object or object with size and type properties
 * @returns Validation result with error message if invalid
 */
export function validateAttachmentFile(file: {
  size: number;
  type: string;
}): AttachmentValidationResult {
  // Check file size
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_ATTACHMENT_SIZE_MB}MB`,
    };
  }

  // Check MIME type
  if (
    !ALLOWED_ATTACHMENT_MIME_TYPES.includes(
      file.type as AllowedAttachmentMimeType
    )
  ) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX)`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension from MIME type for PDS attachments
 *
 * @param mimeType - MIME type string
 * @returns File extension without dot
 */
export function getAttachmentExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
  };

  return mimeToExt[mimeType] || 'pdf';
}

/**
 * Build storage path for a PDS attachment
 *
 * Path format: {userId}/{year}/{pdsSubmissionId}/{kind}/{itemId}/{uuid}.{ext}
 * This ensures:
 * - Each user's files are in their own folder (for RLS policies)
 * - Organized by year and submission
 * - Grouped by attachment type (training/civil_service)
 * - Unique filenames to prevent overwrites
 *
 * @param params - Path building parameters
 * @returns Storage path
 */
export function buildAttachmentPath(params: {
  userId: string;
  year: number;
  pdsSubmissionId: string;
  kind: AttachmentKind;
  itemId: string;
  mimeType: string;
}): string {
  const { userId, year, pdsSubmissionId, kind, itemId, mimeType } = params;
  const ext = getAttachmentExtensionFromMimeType(mimeType);
  const filename = `${uuidv4()}.${ext}`;

  return `${userId}/${year}/${pdsSubmissionId}/${kind}/${itemId}/${filename}`;
}

/**
 * Get the public URL for a PDS attachment from Supabase Storage
 *
 * @param supabaseUrl - Supabase project URL (e.g., https://xxx.supabase.co)
 * @param filePath - Storage path of the attachment
 * @returns Public URL or null if no file path
 */
export function getAttachmentPublicUrl(
  supabaseUrl: string,
  filePath: string | null
): string | null {
  if (!filePath) {
    return null;
  }

  // Ensure URL doesn't have trailing slash
  const baseUrl = supabaseUrl.replace(/\/$/, '');

  // Build public URL
  // Format: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
  return `${baseUrl}/storage/v1/object/public/${PDS_ATTACHMENTS_BUCKET}/${filePath}`;
}

/**
 * Upload result from storage operations
 */
export interface AttachmentUploadResult {
  success: boolean;
  filePath?: string;
  fileUrl?: string;
  error?: string;
}

/**
 * Configuration for PDS attachment operations
 */
export interface AttachmentConfig {
  bucket: string;
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
}

/**
 * Get default PDS attachment configuration
 */
export function getAttachmentConfig(): AttachmentConfig {
  return {
    bucket: PDS_ATTACHMENTS_BUCKET,
    maxSizeBytes: MAX_ATTACHMENT_SIZE_BYTES,
    allowedMimeTypes: ALLOWED_ATTACHMENT_MIME_TYPES,
  };
}

/**
 * Check if a MIME type is an image
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if a MIME type is a document (PDF, DOC, DOCX)
 */
export function isDocumentMimeType(mimeType: string): boolean {
  return (
    mimeType === 'application/pdf' ||
    mimeType === 'application/msword' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

