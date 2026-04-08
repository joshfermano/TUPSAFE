/**
 * Certification File API Route - Delete Single File
 * DELETE /api/certifications/[id]/files/[fileId]
 *
 * Removes a single file attachment from a certification.
 * Verifies certification ownership and pending status before
 * deleting from both Supabase Storage and the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@tupsafe/auth/server';
import { PDS_ATTACHMENTS_BUCKET } from '@tupsafe/auth/server';
import {
  db,
  profileCertifications,
  profileCertificationFiles,
} from '@tupsafe/database/server';
import { eq, and } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string; fileId: string }>;
}

/**
 * DELETE /api/certifications/[id]/files/[fileId]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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
    const { id: certificationId, fileId } = await context.params;

    // Verify the user owns the parent certification and that it is still pending
    const [cert] = await db
      .select({
        id: profileCertifications.id,
        verificationStatus: profileCertifications.verificationStatus,
      })
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

    if (cert.verificationStatus !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete files from a certification with status '${cert.verificationStatus}'. Only files on pending certifications can be removed.`,
        },
        { status: 403 }
      );
    }

    // Fetch the file record to obtain its storage path
    const [fileRecord] = await db
      .select()
      .from(profileCertificationFiles)
      .where(
        and(
          eq(profileCertificationFiles.id, fileId),
          eq(profileCertificationFiles.certificationId, certificationId)
        )
      )
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete from storage using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    const { error: storageError } = await adminClient.storage
      .from(PDS_ATTACHMENTS_BUCKET)
      .remove([fileRecord.filePath]);

    if (storageError) {
      // Log but continue — the DB record must still be removed
      console.error(
        `[DELETE /api/certifications/[id]/files/[fileId]] Storage delete failed for file ${fileId}:`,
        storageError
      );
    }

    // Remove the database record
    await db
      .delete(profileCertificationFiles)
      .where(eq(profileCertificationFiles.id, fileId));

    console.log(
      `[DELETE /api/certifications/[id]/files/[fileId]] Deleted file ${fileId} from certification ${certificationId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/certifications/[id]/files/[fileId]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete file',
      },
      { status: 500 }
    );
  }
}
