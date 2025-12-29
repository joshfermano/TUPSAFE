/**
 * Profile Pictures Storage Utilities
 *
 * Provides consistent helpers for profile picture management across
 * both admin and employee portals:
 * - Bucket name constant
 * - Path building
 * - Public URL derivation
 * - File validation
 *
 * Uses Supabase Storage with public bucket URLs.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Supabase Storage bucket name for profile pictures
 */
export const PROFILE_PICTURES_BUCKET = 'profile-pictures';

/**
 * Allowed MIME types for profile pictures
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Maximum file size for profile pictures (5MB)
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 5;

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a profile picture file
 *
 * @param file - File object or object with size and type properties
 * @returns Validation result with error message if invalid
 */
export function validateProfilePictureFile(file: {
  size: number;
  type: string;
}): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension from MIME type
 *
 * @param mimeType - MIME type string
 * @returns File extension without dot
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };

  return mimeToExt[mimeType] || 'jpg';
}

/**
 * Build storage path for a profile picture
 *
 * Path format: {userId}/{uuid}.{ext}
 * This ensures:
 * - Each user's files are in their own folder (for RLS policies)
 * - Unique filenames to prevent overwrites
 *
 * @param userId - User's UUID
 * @param mimeType - MIME type of the file
 * @returns Storage path
 */
export function buildProfilePicturePath(
  userId: string,
  mimeType: string
): string {
  const ext = getExtensionFromMimeType(mimeType);
  const filename = `${uuidv4()}.${ext}`;
  return `${userId}/${filename}`;
}

/**
 * Get the public URL for a profile picture from Supabase Storage
 *
 * @param supabaseUrl - Supabase project URL (e.g., https://xxx.supabase.co)
 * @param avatarPath - Storage path of the avatar
 * @returns Public URL or null if no avatar path
 */
export function getProfilePicturePublicUrl(
  supabaseUrl: string,
  avatarPath: string | null
): string | null {
  if (!avatarPath) {
    return null;
  }

  // Ensure URL doesn't have trailing slash
  const baseUrl = supabaseUrl.replace(/\/$/, '');

  // Build public URL
  // Format: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
  return `${baseUrl}/storage/v1/object/public/${PROFILE_PICTURES_BUCKET}/${avatarPath}`;
}

/**
 * Extract folder path from a full storage path
 * Used to list and delete all files in a user's folder
 *
 * @param avatarPath - Full storage path
 * @returns Folder path (userId)
 */
export function extractFolderFromPath(avatarPath: string): string {
  const parts = avatarPath.split('/');
  return parts[0] || avatarPath;
}

/**
 * Upload result from storage operations
 */
export interface ProfilePictureUploadResult {
  success: boolean;
  avatarPath?: string;
  avatarUrl?: string;
  error?: string;
}

/**
 * Configuration for profile picture operations
 */
export interface ProfilePictureConfig {
  bucket: string;
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
}

/**
 * Get default profile picture configuration
 */
export function getProfilePictureConfig(): ProfilePictureConfig {
  return {
    bucket: PROFILE_PICTURES_BUCKET,
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  };
}

