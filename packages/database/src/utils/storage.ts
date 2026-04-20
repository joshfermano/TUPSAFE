import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _storageClient: SupabaseClient | null = null;

function getStorageClient(): SupabaseClient {
  if (!_storageClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _storageClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _storageClient;
}

/** Lazily initialized storage client — created on first property access */
export const storageClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getStorageClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  PDS_SUBMISSIONS: 'pds-submissions',
  SALN_SUBMISSIONS: 'saln-submissions',
  ARCHIVES: 'archives',
  PROFILE_PICTURES: 'profile-pictures',
  USER_DOCUMENTS: 'user-documents', // Certifications, seminars, etc.
} as const;

export type StorageBucket =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Generate storage path for a file
 * Format: {userId}/{submissionId}/{filename}
 */
export function generateStoragePath(
  userId: string,
  submissionId: string,
  filename: string
): string {
  return `${userId}/${submissionId}/${filename}`;
}

/**
 * Upload PDF file to Supabase Storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param fileBuffer - PDF file as Buffer
 * @param contentType - MIME type (default: application/pdf)
 * @returns Promise with uploaded file path or null on error
 */
export async function uploadPdfToStorage(
  bucket: StorageBucket,
  path: string,
  fileBuffer: Buffer,
  contentType: string = 'application/pdf'
): Promise<{ path: string; error: null } | { path: null; error: Error }> {
  try {
    const { data, error } = await storageClient.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
        cacheControl: '3600', // Cache for 1 hour
      });

    if (error) {
      console.error('Error uploading file to storage:', error);
      return { path: null, error };
    }

    return { path: data.path, error: null };
  } catch (error) {
    console.error('Unexpected error uploading to storage:', error);
    return {
      path: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get signed URL for downloading a file
 * URL expires after specified seconds (default: 1 hour)
 *
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise with signed URL or null on error
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string; error: null } | { url: null; error: Error }> {
  try {
    const { data, error } = await storageClient.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return { url: null, error };
    }

    return { url: data.signedUrl, error: null };
  } catch (error) {
    console.error('Unexpected error creating signed URL:', error);
    return {
      url: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get public URL for a file (only works for public buckets)
 *
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Public URL string
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = storageClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete file from storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Promise with success boolean
 */
export async function deletePdfFromStorage(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await storageClient.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Error deleting file from storage:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error deleting from storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Move file between buckets or rename file
 *
 * @param fromBucket - Source bucket
 * @param fromPath - Source file path
 * @param toBucket - Destination bucket
 * @param toPath - Destination file path
 * @returns Promise with success boolean
 */
export async function moveFile(
  fromBucket: StorageBucket,
  fromPath: string,
  toBucket: StorageBucket,
  toPath: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Move within same bucket
    if (fromBucket === toBucket) {
      const { error } = await storageClient.storage
        .from(fromBucket)
        .move(fromPath, toPath);

      if (error) {
        console.error('Error moving file:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    }

    // Move between buckets: download, upload, delete
    const { data: fileData, error: downloadError } = await storageClient.storage
      .from(fromBucket)
      .download(fromPath);

    if (downloadError || !fileData) {
      console.error('Error downloading file for move:', downloadError);
      return {
        success: false,
        error: downloadError || new Error('File not found'),
      };
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const uploadResult = await uploadPdfToStorage(toBucket, toPath, buffer);

    if (uploadResult.error) {
      return { success: false, error: uploadResult.error };
    }

    // Delete original file
    await deletePdfFromStorage(fromBucket, fromPath);

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error moving file:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Check if file exists in storage
 *
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Promise with exists boolean
 */
export async function fileExists(
  bucket: StorageBucket,
  path: string
): Promise<boolean> {
  try {
    const { data, error } = await storageClient.storage.from(bucket).list(
      path.substring(0, path.lastIndexOf('/')), // Get directory path
      {
        limit: 1,
        search: path.substring(path.lastIndexOf('/') + 1), // Get filename
      }
    );

    if (error) {
      return false;
    }

    return data.length > 0;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}

/**
 * List files in a directory
 *
 * @param bucket - Storage bucket name
 * @param path - Directory path
 * @param options - List options (limit, offset, sortBy)
 * @returns Promise with list of files
 */
export async function listFiles(
  bucket: StorageBucket,
  path: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  }
): Promise<{
  files: Array<{
    name: string;
    id: string;
    created_at: string;
    updated_at: string;
  }>;
  error: Error | null;
}> {
  try {
    const { data, error } = await storageClient.storage
      .from(bucket)
      .list(path, options);

    if (error) {
      console.error('Error listing files:', error);
      return { files: [], error };
    }

    return { files: data, error: null };
  } catch (error) {
    console.error('Unexpected error listing files:', error);
    return {
      files: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get file metadata
 *
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Promise with file metadata
 */
export async function getFileMetadata(
  bucket: StorageBucket,
  path: string
): Promise<{
  metadata: { size: number; mimetype: string; lastModified: Date } | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await storageClient.storage
      .from(bucket)
      .list(path.substring(0, path.lastIndexOf('/')), {
        limit: 1,
        search: path.substring(path.lastIndexOf('/') + 1),
      });

    if (error || !data || data.length === 0) {
      return { metadata: null, error: error || new Error('File not found') };
    }

    const file = data[0];
    return {
      metadata: {
        size: file.metadata?.size || 0,
        mimetype: file.metadata?.mimetype || 'application/pdf',
        lastModified: new Date(file.updated_at || file.created_at),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return {
      metadata: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Download file as Buffer
 *
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Promise with file Buffer or null on error
 */
export async function downloadFile(
  bucket: StorageBucket,
  path: string
): Promise<{ buffer: Buffer | null; error: Error | null }> {
  try {
    const { data, error } = await storageClient.storage
      .from(bucket)
      .download(path);

    if (error || !data) {
      console.error('Error downloading file:', error);
      return { buffer: null, error: error || new Error('File not found') };
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return { buffer, error: null };
  } catch (error) {
    console.error('Unexpected error downloading file:', error);
    return {
      buffer: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Upload image file (profile picture, etc.)
 *
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param fileBuffer - Image file as Buffer
 * @param contentType - MIME type (e.g., image/jpeg, image/png)
 * @returns Promise with uploaded file path or null on error
 */
export async function uploadImageToStorage(
  bucket: StorageBucket,
  path: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ path: string; error: null } | { path: null; error: Error }> {
  try {
    const { data, error } = await storageClient.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      console.error('Error uploading image to storage:', error);
      return { path: null, error };
    }

    return { path: data.path, error: null };
  } catch (error) {
    console.error('Unexpected error uploading image:', error);
    return {
      path: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Upload user document (certification, seminar, etc.)
 *
 * @param userId - User ID
 * @param category - Document category (e.g., 'certifications', 'seminars', 'trainings')
 * @param filename - Original filename
 * @param fileBuffer - File as Buffer
 * @param contentType - MIME type
 * @returns Promise with uploaded file path or null on error
 */
export async function uploadUserDocument(
  userId: string,
  category: string,
  filename: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ path: string; error: null } | { path: null; error: Error }> {
  const path = `${userId}/${category}/${filename}`;

  try {
    const { data, error } = await storageClient.storage
      .from(STORAGE_BUCKETS.USER_DOCUMENTS)
      .upload(path, fileBuffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
        cacheControl: '3600',
      });

    if (error) {
      console.error('Error uploading user document:', error);
      return { path: null, error };
    }

    return { path: data.path, error: null };
  } catch (error) {
    console.error('Unexpected error uploading document:', error);
    return {
      path: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Upload profile picture
 *
 * @param userId - User ID
 * @param fileBuffer - Image file as Buffer
 * @param contentType - MIME type (image/jpeg, image/png, etc.)
 * @returns Promise with uploaded file path or null on error
 */
export async function uploadProfilePicture(
  userId: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ path: string; error: null } | { path: null; error: Error }> {
  const extension = contentType.split('/')[1] || 'jpg';
  const filename = `${userId}/avatar.${extension}`;

  return uploadImageToStorage(
    STORAGE_BUCKETS.PROFILE_PICTURES,
    filename,
    fileBuffer,
    contentType
  );
}

/**
 * Get user's documents by category
 *
 * @param userId - User ID
 * @param category - Document category (optional)
 * @returns Promise with list of documents
 */
export async function getUserDocuments(
  userId: string,
  category?: string
): Promise<{
  files: Array<{
    name: string;
    id: string;
    created_at: string;
    updated_at: string;
  }>;
  error: Error | null;
}> {
  const path = category ? `${userId}/${category}` : userId;
  return listFiles(STORAGE_BUCKETS.USER_DOCUMENTS, path);
}
