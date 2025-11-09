# 🪣 TUPSAFE Storage System Guide

## Overview

TUPSAFE uses Supabase Storage with 5 dedicated buckets for secure file management. All buckets are **private** and enforce Row Level Security (RLS) policies.

## Storage Buckets

### 1. **pds-submissions** (PDF only, 10MB limit)

- **Purpose**: Personal Data Sheet (PDS) submission PDFs
- **File Structure**: `{userId}/{submissionId}/pds_v{version}.pdf`
- **Access**:
  - Users: Own files only
  - Admin/HR: All files

### 2. **saln-submissions** (PDF only, 10MB limit)

- **Purpose**: SALN submission PDFs
- **File Structure**: `{userId}/{submissionId}/saln_{year}.pdf`
- **Access**:
  - Users: Own files only
  - Admin/HR: All files

### 3. **archives** (PDF only, no limit)

- **Purpose**: Archived submissions for compliance and record-keeping
- **File Structure**: `{userId}/{submissionId}/archived_{timestamp}.pdf`
- **Access**:
  - Admin/HR only (read, write, delete)

### 4. **profile-pictures** (Images only, 5MB limit)

- **Purpose**: User profile pictures/avatars
- **File Structure**: `{userId}/avatar.{ext}`
- **Supported Formats**: JPEG, PNG, WebP
- **Access**:
  - Users: Own avatar (upload, update, delete)
  - All authenticated users: View all avatars (for collaboration/identification)

### 5. **user-documents** (PDF & Images, 10MB limit)

- **Purpose**: User-uploaded documents (certifications, seminars, trainings, licenses, awards)
- **File Structure**: `{userId}/{category}/{filename}`
- **Categories**:
  - `certifications` - Professional certifications
  - `seminars` - Seminar certificates
  - `trainings` - Training completion certificates
  - `licenses` - Professional licenses
  - `awards` - Awards and recognitions
- **Supported Formats**: PDF, JPEG, PNG, WebP
- **Access**:
  - Users: Own documents only
  - Admin/HR/Supervisors: View all user documents

## Storage Utilities

The `@tupsafe/database` package provides comprehensive storage utilities:

```typescript
import {
  // Constants
  STORAGE_BUCKETS,

  // PDF Operations
  uploadPdfToStorage,
  downloadFile,
  getSignedUrl,
  deletePdfFromStorage,

  // Image Operations
  uploadImageToStorage,
  uploadProfilePicture,

  // User Documents
  uploadUserDocument,
  getUserDocuments,

  // File Management
  moveFile,
  fileExists,
  listFiles,
  getFileMetadata,
} from '@tupsafe/database';
```

## Usage Examples

### 1. Upload Profile Picture

```typescript
import { uploadProfilePicture } from '@tupsafe/database';

async function updateAvatar(userId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await uploadProfilePicture(
    userId,
    buffer,
    file.type // e.g., 'image/jpeg'
  );

  if (result.error) {
    console.error('Upload failed:', result.error);
    return;
  }

  console.log('Avatar uploaded:', result.path);
  // Update user profile with avatar path
}
```

### 2. Upload User Document (Certification)

```typescript
import { uploadUserDocument } from '@tupsafe/database';

async function uploadCertification(
  userId: string,
  filename: string,
  file: File
) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await uploadUserDocument(
    userId,
    'certifications', // category
    filename,
    buffer,
    file.type
  );

  if (result.error) {
    console.error('Upload failed:', result.error);
    return;
  }

  console.log('Certificate uploaded:', result.path);
}
```

### 3. Upload PDS Submission PDF

```typescript
import {
  uploadPdfToStorage,
  STORAGE_BUCKETS,
  generateStoragePath,
} from '@tupsafe/database';

async function uploadPdsSubmission(
  userId: string,
  submissionId: string,
  pdfBuffer: Buffer
) {
  const path = generateStoragePath(userId, submissionId, `pds_v1.pdf`);

  const result = await uploadPdfToStorage(
    STORAGE_BUCKETS.PDS_SUBMISSIONS,
    path,
    pdfBuffer
  );

  if (result.error) {
    console.error('Upload failed:', result.error);
    return;
  }

  // Save path to database
  await db.insert(pdsSubmissions).values({
    userId,
    pdfFilePath: result.path,
    // ... other fields
  });
}
```

### 4. Get Signed URL for Downloading

```typescript
import { getSignedUrl, STORAGE_BUCKETS } from '@tupsafe/database';

async function downloadPdsSubmission(filePath: string) {
  const result = await getSignedUrl(
    STORAGE_BUCKETS.PDS_SUBMISSIONS,
    filePath,
    3600 // expires in 1 hour
  );

  if (result.error) {
    console.error('Failed to generate URL:', result.error);
    return;
  }

  // Use signed URL to download file
  window.open(result.url, '_blank');
}
```

### 5. List User Documents

```typescript
import { getUserDocuments } from '@tupsafe/database';

async function listUserCertifications(userId: string) {
  const { files, error } = await getUserDocuments(
    userId,
    'certifications' // optional category filter
  );

  if (error) {
    console.error('Failed to list files:', error);
    return;
  }

  console.log('User certifications:', files);
}
```

### 6. Delete File

```typescript
import { deletePdfFromStorage, STORAGE_BUCKETS } from '@tupsafe/database';

async function deleteDraftSubmission(filePath: string) {
  const result = await deletePdfFromStorage(
    STORAGE_BUCKETS.PDS_SUBMISSIONS,
    filePath
  );

  if (result.error) {
    console.error('Delete failed:', result.error);
    return;
  }

  console.log('File deleted successfully');
}
```

### 7. Move File to Archives

```typescript
import { moveFile, STORAGE_BUCKETS } from '@tupsafe/database';

async function archiveSubmission(
  userId: string,
  submissionId: string,
  filename: string
) {
  const fromPath = `${userId}/${submissionId}/${filename}`;
  const toPath = `${userId}/${submissionId}/archived_${Date.now()}.pdf`;

  const result = await moveFile(
    STORAGE_BUCKETS.PDS_SUBMISSIONS,
    fromPath,
    STORAGE_BUCKETS.ARCHIVES,
    toPath
  );

  if (result.error) {
    console.error('Archive failed:', result.error);
    return;
  }

  console.log('File archived successfully');
}
```

## Row Level Security (RLS) Policies

### Apply Policies

All storage RLS policies are defined in `packages/database/sql/storage-policies.sql`.

**To apply policies:**

1. Go to **Supabase Dashboard** → **Storage** → **Policies**
2. Copy and execute the SQL policies from `storage-policies.sql`
3. Verify policies are active

### Key Policy Rules

#### For Users:

- ✅ Upload, view, update, delete **own files** in all buckets (except archives)
- ✅ View **all profile pictures** (for user identification)
- ❌ Cannot access other users' PDS/SALN/documents
- ❌ Cannot access archives

#### For Admin/HR:

- ✅ Full access to **all buckets**
- ✅ Can view, upload, delete any file
- ✅ Exclusive access to archives bucket

#### For Supervisors:

- ✅ View **user-documents** bucket (for verification)
- ❌ Cannot modify user documents

## File Naming Conventions

### Profile Pictures

```
{userId}/avatar.{ext}
Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890/avatar.jpg
```

### PDS Submissions

```
{userId}/{submissionId}/pds_v{version}.pdf
Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890/sub_123/pds_v1.pdf
```

### SALN Submissions

```
{userId}/{submissionId}/saln_{year}.pdf
Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890/sub_456/saln_2024.pdf
```

### User Documents

```
{userId}/{category}/{filename}
Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890/certifications/teacher_cert_2023.pdf
```

### Archives

```
{userId}/{submissionId}/archived_{timestamp}.pdf
Example: a1b2c3d4-e5f6-7890-abcd-ef1234567890/sub_123/archived_1699564800000.pdf
```

## Security Best Practices

### 1. File Validation

Always validate file types and sizes on the **server side**:

```typescript
// Server action example
export async function uploadProfilePicture(formData: FormData) {
  const file = formData.get('avatar') as File;

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  // Proceed with upload
  // ...
}
```

### 2. Authentication Check

Always verify user authentication before file operations:

```typescript
import { auth } from '@tupsafe/auth';

export async function uploadDocument(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  // Proceed with upload using authenticated userId
}
```

### 3. Use Service Role Key Carefully

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Only use it in:

- Server-side code (never expose to client)
- Admin operations that require elevated permissions
- Background jobs and migrations

### 4. Signed URLs

For secure file downloads, always use signed URLs with expiration:

```typescript
// Generate signed URL (expires in 1 hour)
const { url, error } = await getSignedUrl(
  STORAGE_BUCKETS.PDS_SUBMISSIONS,
  filePath,
  3600
);
```

## Error Handling

All storage utilities return consistent error objects:

```typescript
type StorageResult<T> = { data: T; error: null } | { data: null; error: Error };
```

Always check for errors before proceeding:

```typescript
const result = await uploadPdfToStorage(bucket, path, buffer);

if (result.error) {
  // Handle error
  console.error('Upload failed:', result.error.message);
  // Show user-friendly error message
  return;
}

// Success - use result.path
console.log('Uploaded to:', result.path);
```

## Performance Optimization

### 1. Caching

Files are cached for 1 hour by default (`cacheControl: '3600'`):

```typescript
// Upload with custom cache duration
await storageClient.storage.from(bucket).upload(path, buffer, {
  contentType: 'application/pdf',
  cacheControl: '86400', // 24 hours
});
```

### 2. Lazy Loading

For lists with many files, use pagination:

```typescript
const { files, error } = await listFiles(
  STORAGE_BUCKETS.USER_DOCUMENTS,
  userId,
  {
    limit: 20,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  }
);
```

### 3. Image Optimization

Before uploading profile pictures, consider:

- Resizing images to reasonable dimensions (e.g., 500x500px)
- Converting to WebP for better compression
- Using Next.js Image component for display

```typescript
import sharp from 'sharp';

// Resize and optimize image before upload
const optimizedBuffer = await sharp(originalBuffer)
  .resize(500, 500, { fit: 'cover' })
  .webp({ quality: 80 })
  .toBuffer();
```

## Monitoring and Maintenance

### Check Storage Usage

Monitor bucket sizes in Supabase Dashboard:

1. Go to **Storage** → **Usage**
2. Check bucket sizes and bandwidth usage
3. Set up alerts for high usage

### Cleanup Old Files

Implement cleanup jobs for:

- Old draft submissions (never completed)
- Archived files older than retention period
- Orphaned files (no database reference)

```typescript
// Example cleanup job (run via cron)
export async function cleanupOldDrafts() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

  // Find old drafts
  const oldDrafts = await db
    .select()
    .from(pdsSubmissions)
    .where(
      and(
        eq(pdsSubmissions.status, 'draft'),
        lt(pdsSubmissions.updatedAt, cutoffDate)
      )
    );

  // Delete files and database records
  for (const draft of oldDrafts) {
    if (draft.pdfFilePath) {
      await deletePdfFromStorage(
        STORAGE_BUCKETS.PDS_SUBMISSIONS,
        draft.pdfFilePath
      );
    }
    await db.delete(pdsSubmissions).where(eq(pdsSubmissions.id, draft.id));
  }
}
```

## Next Steps

1. ✅ Storage buckets created
2. ⏳ Apply RLS policies in Supabase Dashboard (see `sql/storage-policies.sql`)
3. ⏳ Implement server actions for file uploads
4. ⏳ Create UI components for file upload/management
5. ⏳ Test upload/download flows
6. ⏳ Set up cleanup jobs for old files

## Troubleshooting

### Issue: "Policy violation" error

**Solution**: Verify RLS policies are applied correctly in Supabase Dashboard

### Issue: File upload fails silently

**Solution**: Check browser console for CORS errors. Verify bucket configuration in Supabase Dashboard.

### Issue: Signed URLs not working

**Solution**: Ensure bucket is private. Check if URL has expired (default: 1 hour).

### Issue: "File not found" when downloading

**Solution**: Verify file path exists using `fileExists()` utility. Check if user has permission to access the file.

---

**For more information, see:**

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [TUPSAFE Database Package README](../packages/database/README.md)
- [Storage Policies SQL](../packages/database/sql/storage-policies.sql)
