/**
 * Certification Files API Route - Upload
 * POST /api/certifications/[id]/files
 *
 * Uploads a file attachment to an existing certification record.
 * Validates ownership, checks file constraints, stores in Supabase Storage,
 * and inserts a row in profile_certification_files.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@tupsafe/auth/server';
import {
  validateAttachmentFile,
  getAttachmentExtensionFromMimeType,
  SIGNED_URL_EXPIRY_SECONDS,
  PDS_ATTACHMENTS_BUCKET,
} from '@tupsafe/auth/server';
import {
  db,
  profileCertifications,
  profileCertificationFiles,
} from '@tupsafe/database/server';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CertificationFileData } from '@tupsafe/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/certifications/[id]/files
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { id: certificationId } = await context.params;

    // Verify ownership of the certification
    const [cert] = await db
      .select({ id: profileCertifications.id, userId: profileCertifications.userId })
      .from(profileCertifications)
      .where(
        and(
          eq(profileCertifications.id, certificationId),
          eq(profileCertifications.userId, userId)
        )
      )
      .limit(1);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Certification not found or access denied' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size using shared utility
    const validation = validateAttachmentFile({ size: file.size, type: file.type });
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Build storage path: {userId}/certifications/{certificationId}/{uuid}.{ext}
    const ext = getAttachmentExtensionFromMimeType(file.type);
    const filePath = `${userId}/certifications/${certificationId}/${uuidv4()}.${ext}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();

    // Use admin client for storage to bypass RLS
    const adminClient = createAdminClient();

    const { error: uploadError } = await adminClient.storage
      .from(PDS_ATTACHMENTS_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error(
        '[POST /api/certifications/[id]/files] Storage upload error:',
        uploadError
      );
      return NextResponse.json(
        { success: false, error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Generate signed URL for immediate use in the response
    const { data: signedUrlData, error: signedUrlError } =
      await adminClient.storage
        .from(PDS_ATTACHMENTS_BUCKET)
        .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlError) {
      // Non-fatal — upload already succeeded
      console.error(
        '[POST /api/certifications/[id]/files] Signed URL generation failed:',
        signedUrlError
      );
    }

    const fileUrl = signedUrlData?.signedUrl ?? null;

    // Persist the file record
    const [fileRecord] = await db
      .insert(profileCertificationFiles)
      .values({
        certificationId,
        filePath,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      })
      .returning();

    console.log(
      `[POST /api/certifications/[id]/files] Uploaded file ${fileRecord.id} for certification ${certificationId}`
    );

    const fileData: CertificationFileData = {
      id: fileRecord.id,
      certificationId: fileRecord.certificationId,
      filePath: fileRecord.filePath,
      fileName: fileRecord.fileName,
      mimeType: fileRecord.mimeType,
      sizeBytes: fileRecord.sizeBytes,
      fileUrl,
      createdAt: fileRecord.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, file: fileData }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/certifications/[id]/files] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to upload file',
      },
      { status: 500 }
    );
  }
}
