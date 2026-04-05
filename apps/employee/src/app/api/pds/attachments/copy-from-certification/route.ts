/**
 * Copy Certification Files to PDS Attachments
 * POST /api/pds/attachments/copy-from-certification
 *
 * Copies all files from a profile certification to a PDS training entry.
 * This enables the "Import from Profile" workflow where employees pull
 * verified certifications into their PDS Section V (Learning & Development).
 *
 * Flow:
 *  1. Auth check
 *  2. Verify user owns the certification
 *  3. Verify user owns the PDS submission
 *  4. For each cert file: download from storage -> re-upload under PDS path -> insert pds_attachments row
 *  5. Return copied count
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@tupsafe/auth/server';
import {
  getAttachmentExtensionFromMimeType,
  PDS_ATTACHMENTS_BUCKET,
} from '@tupsafe/auth/server';
import {
  db,
  profileCertifications,
  profileCertificationFiles,
  pdsSubmissions,
  pdsAttachments,
} from '@tupsafe/database/server';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface CopyRequestBody {
  certificationId: string;
  pdsSubmissionId: string;
  trainingId: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
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

    // Parse and validate request body
    const body: CopyRequestBody = await request.json();
    const { certificationId, pdsSubmissionId, trainingId } = body;

    if (!certificationId || !pdsSubmissionId || !trainingId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'certificationId, pdsSubmissionId, and trainingId are all required',
        },
        { status: 400 }
      );
    }

    // 2. Verify user owns the certification
    const [cert] = await db
      .select({
        id: profileCertifications.id,
        userId: profileCertifications.userId,
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

    // 3. Verify user owns the PDS submission and get year
    const [submission] = await db
      .select({
        id: pdsSubmissions.id,
        year: pdsSubmissions.year,
      })
      .from(pdsSubmissions)
      .where(
        and(
          eq(pdsSubmissions.id, pdsSubmissionId),
          eq(pdsSubmissions.userId, userId)
        )
      )
      .limit(1);

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'PDS submission not found or access denied' },
        { status: 404 }
      );
    }

    // 4. Get all files for this certification
    const certFiles = await db
      .select()
      .from(profileCertificationFiles)
      .where(eq(profileCertificationFiles.certificationId, certificationId));

    if (certFiles.length === 0) {
      return NextResponse.json({
        success: true,
        copiedCount: 0,
        message: 'No files to copy',
      });
    }

    // 5. Copy each file: download -> re-upload -> insert DB record
    const adminClient = createAdminClient();
    let copiedCount = 0;

    for (const certFile of certFiles) {
      try {
        // Download the source file from storage
        const { data: downloadData, error: downloadError } =
          await adminClient.storage
            .from(PDS_ATTACHMENTS_BUCKET)
            .download(certFile.filePath);

        if (downloadError || !downloadData) {
          console.error(
            `[copy-from-certification] Failed to download file ${certFile.id}:`,
            downloadError
          );
          continue; // Skip this file but continue with others
        }

        // Build the new PDS path
        const ext = getAttachmentExtensionFromMimeType(certFile.mimeType);
        const newFilePath = `${userId}/pds/${submission.year}/${pdsSubmissionId}/training/${trainingId}/${uuidv4()}.${ext}`;

        // Convert Blob to ArrayBuffer for upload
        const arrayBuffer = await downloadData.arrayBuffer();

        // Upload to the new location
        const { error: uploadError } = await adminClient.storage
          .from(PDS_ATTACHMENTS_BUCKET)
          .upload(newFilePath, arrayBuffer, {
            contentType: certFile.mimeType,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(
            `[copy-from-certification] Failed to upload file ${certFile.id} to PDS path:`,
            uploadError
          );
          continue;
        }

        // Insert pds_attachments record
        await db.insert(pdsAttachments).values({
          userId,
          pdsSubmissionId,
          year: submission.year,
          trainingId,
          civilServiceId: null,
          filePath: newFilePath,
          fileName: certFile.fileName,
          mimeType: certFile.mimeType,
          sizeBytes: certFile.sizeBytes,
        });

        copiedCount++;
      } catch (fileError) {
        console.error(
          `[copy-from-certification] Error processing file ${certFile.id}:`,
          fileError
        );
        // Continue with remaining files
      }
    }

    console.log(
      `[copy-from-certification] Copied ${copiedCount}/${certFiles.length} files from certification ${certificationId} to training ${trainingId}`
    );

    return NextResponse.json({
      success: true,
      copiedCount,
    });
  } catch (error) {
    console.error('[copy-from-certification] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to copy certification files',
      },
      { status: 500 }
    );
  }
}
