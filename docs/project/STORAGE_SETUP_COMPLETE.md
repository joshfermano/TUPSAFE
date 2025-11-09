# ✅ Storage Setup Complete

## Summary

Successfully set up **5 Supabase Storage buckets** with comprehensive utilities for file management in the TUPSAFE system.

## 🪣 Created Buckets

| Bucket Name          | Purpose                        | File Types     | Size Limit | Access                      |
| -------------------- | ------------------------------ | -------------- | ---------- | --------------------------- |
| **pds-submissions**  | PDS submission PDFs            | PDF            | 10MB       | Users (own), Admin/HR (all) |
| **saln-submissions** | SALN submission PDFs           | PDF            | 10MB       | Users (own), Admin/HR (all) |
| **archives**         | Archived submissions           | PDF            | No limit   | Admin/HR only               |
| **profile-pictures** | User avatars                   | JPG, PNG, WebP | 5MB        | Users (own), All (view)     |
| **user-documents**   | Certifications, seminars, etc. | PDF, Images    | 10MB       | Users (own), Admin/HR (all) |

## 🔧 Storage Utilities

All utilities are available from `@tupsafe/database`:

### PDF Operations

- ✅ `uploadPdfToStorage()` - Upload PDF files
- ✅ `downloadFile()` - Download files as Buffer
- ✅ `deletePdfFromStorage()` - Delete files
- ✅ `getSignedUrl()` - Generate signed URLs for secure downloads

### Image Operations

- ✅ `uploadImageToStorage()` - Upload images
- ✅ `uploadProfilePicture()` - Simplified profile picture upload

### User Documents

- ✅ `uploadUserDocument()` - Upload user documents with categories
- ✅ `getUserDocuments()` - List user documents by category

### File Management

- ✅ `moveFile()` - Move files between buckets
- ✅ `fileExists()` - Check file existence
- ✅ `listFiles()` - List files with pagination
- ✅ `getFileMetadata()` - Get file metadata
- ✅ `generateStoragePath()` - Generate standard file paths

## 📁 File Structure

### Profile Pictures

```
{userId}/avatar.{ext}
```

### PDS/SALN Submissions

```
{userId}/{submissionId}/pds_v{version}.pdf
{userId}/{submissionId}/saln_{year}.pdf
```

### User Documents

```
{userId}/{category}/{filename}
```

Categories: `certifications`, `seminars`, `trainings`, `licenses`, `awards`

### Archives

```
{userId}/{submissionId}/archived_{timestamp}.pdf
```

## 🔐 Security

All buckets are **private** with Row Level Security (RLS) policies:

### User Permissions

- ✅ Upload, view, update, delete **own files**
- ✅ View **all profile pictures** (for identification)
- ❌ Cannot access other users' submissions
- ❌ Cannot access archives

### Admin/HR Permissions

- ✅ Full access to **all buckets**
- ✅ Exclusive access to **archives**

### Supervisor Permissions

- ✅ View **user-documents** (for verification)

## 📝 Next Steps: Apply RLS Policies

**Important:** Storage RLS policies must be applied manually in Supabase Dashboard.

### Step 1: Navigate to Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** → **Policies**

### Step 2: Apply Policies

Execute the SQL from `packages/database/sql/storage-policies.sql`:

```bash
# View the policies file
cat packages/database/sql/storage-policies.sql
```

The file contains 9 comprehensive policies:

1. Users can view own files (PDS/SALN/Documents)
2. Users can view own profile picture
3. All authenticated users can view others' profile pictures
4. Users can upload their own documents
5. Users can update their own files
6. Users can delete their own files
7. Admins and HR have full access
8. Supervisors can view user documents
9. Archives are admin/HR only

### Step 3: Verify Policies

Run the verification queries included in `storage-policies.sql` to ensure policies are working correctly.

## 💡 Usage Examples

### Upload Profile Picture

```typescript
import { uploadProfilePicture } from '@tupsafe/database';

const buffer = Buffer.from(await file.arrayBuffer());
const result = await uploadProfilePicture(userId, buffer, file.type);
```

### Upload User Certification

```typescript
import { uploadUserDocument } from '@tupsafe/database';

const result = await uploadUserDocument(
  userId,
  'certifications', // category
  filename,
  buffer,
  contentType
);
```

### Upload PDS Submission

```typescript
import {
  uploadPdfToStorage,
  STORAGE_BUCKETS,
  generateStoragePath,
} from '@tupsafe/database';

const path = generateStoragePath(userId, submissionId, 'pds_v1.pdf');
const result = await uploadPdfToStorage(
  STORAGE_BUCKETS.PDS_SUBMISSIONS,
  path,
  pdfBuffer
);
```

### Get Signed URL for Download

```typescript
import { getSignedUrl, STORAGE_BUCKETS } from '@tupsafe/database';

const { url, error } = await getSignedUrl(
  STORAGE_BUCKETS.PDS_SUBMISSIONS,
  filePath,
  3600 // expires in 1 hour
);
```

## 📚 Documentation

Comprehensive guides available:

- **[Storage Guide](./STORAGE_GUIDE.md)** - Complete usage guide with examples
- **[Storage Policies SQL](../packages/database/sql/storage-policies.sql)** - RLS policy definitions
- **[Storage Setup Script](../packages/database/src/storage-setup.ts)** - Bucket creation script
- **[Storage Utilities](../packages/database/src/utils/storage.ts)** - Utility functions

## ✨ Key Features

### 1. Type-Safe

All functions are fully typed with TypeScript:

```typescript
type StorageResult<T> = { data: T; error: null } | { data: null; error: Error };
```

### 2. Error Handling

Consistent error handling across all utilities with detailed error messages.

### 3. Security First

- Private buckets (not publicly accessible)
- RLS policies enforce user-level isolation
- Service role key used only in server-side code
- Signed URLs for secure downloads

### 4. Performance Optimized

- File caching (1 hour default)
- Pagination support for large file lists
- Efficient file operations

### 5. Easy Integration

Simple imports from `@tupsafe/database`:

```typescript
import {
  uploadProfilePicture,
  uploadUserDocument,
  getSignedUrl,
} from '@tupsafe/database';
```

## 🔄 File Upload Flow

### Client → Server Action → Storage

```
1. User selects file in UI
   ↓
2. Form submission to server action
   ↓
3. Server validates file (type, size, auth)
   ↓
4. Convert to Buffer and upload to storage
   ↓
5. Save file path to database
   ↓
6. Return success/error to client
```

## 📊 Storage Monitoring

### Check Usage in Supabase Dashboard

1. Navigate to **Storage** → **Usage**
2. Monitor bucket sizes and bandwidth
3. Set up alerts for high usage

### Recommended Cleanup Jobs

Implement cron jobs to clean up:

- Old draft submissions (30+ days)
- Orphaned files (no database reference)
- Files older than retention period (archives only)

## 🧪 Testing Checklist

Before moving to production:

- [ ] Apply RLS policies in Supabase Dashboard
- [ ] Test profile picture upload/view/delete
- [ ] Test PDS submission upload/download
- [ ] Test SALN submission upload/download
- [ ] Test user document upload (certifications, etc.)
- [ ] Verify users can only access their own files
- [ ] Verify all users can view profile pictures
- [ ] Verify admins can access all files
- [ ] Verify supervisors can view user documents
- [ ] Test signed URL generation and expiration
- [ ] Test file deletion and cleanup
- [ ] Test file size limits (reject oversized files)
- [ ] Test file type validation (reject invalid types)

## 🎯 Integration with Backend

### Next Steps for Backend Development

1. **Email OTP Authentication** ✅ Ready

   - Supabase Auth already configured
   - Storage utilities support authenticated requests

2. **Server Actions** ⏳ Next

   - Create PDS server actions (upload, submit, get)
   - Create SALN server actions (upload, submit, get)
   - Create profile management actions (avatar upload)
   - Create user document actions (certification upload)

3. **PDF Generation** ⏳ Next

   - Install `@react-pdf/renderer`
   - Generate PDF from PDS form data
   - Generate PDF from SALN form data
   - Upload generated PDFs to storage

4. **Real-time Updates** ⏳ Next
   - Trigger notifications on file uploads
   - Real-time status updates for submissions

## 🚀 Ready for Backend Integration

Storage infrastructure is **fully set up** and ready for:

- ✅ Server actions implementation
- ✅ PDF generation integration
- ✅ Real-time file upload notifications
- ✅ Admin file management features
- ✅ User profile picture updates
- ✅ User document management (certifications, etc.)

---

**Status:** ✅ Storage Setup Complete  
**Type Check:** ✅ All packages passing  
**Ready for:** Backend integration (server actions, PDF generation)

For detailed usage examples and best practices, see [STORAGE_GUIDE.md](./STORAGE_GUIDE.md)
