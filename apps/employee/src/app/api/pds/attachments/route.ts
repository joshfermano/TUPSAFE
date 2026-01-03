/**
 * PDS Attachments API Route - Upload
 * POST /api/pds/attachments
 *
 * Uploads an attachment for a PDS training or civil service entry.
 * Validates ownership and stores file in Supabase Storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import {
  validateAttachmentFile,
  buildAttachmentPath,
  PDS_ATTACHMENTS_BUCKET,
  SIGNED_URL_EXPIRY_SECONDS,
} from '@tupsafe/auth/server';
import {
  db,
  pdsSubmissions,
  pdsTraining,
  pdsCivilService,
  pdsAttachments,
} from '@tupsafe/database/server';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pdsSubmissionId = formData.get('pdsSubmissionId') as string | null;
    const trainingId = formData.get('trainingId') as string | null;
    const civilServiceId = formData.get('civilServiceId') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!pdsSubmissionId) {
      return NextResponse.json(
        { error: 'PDS submission ID is required' },
        { status: 400 }
      );
    }

    // Exactly one of trainingId or civilServiceId must be provided
    if ((!trainingId && !civilServiceId) || (trainingId && civilServiceId)) {
      return NextResponse.json(
        { error: 'Exactly one of trainingId or civilServiceId must be provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validationResult = validateAttachmentFile({
      size: file.size,
      type: file.type,
    });

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // Verify user owns the PDS submission
    const [submission] = await db
      .select({ id: pdsSubmissions.id, year: pdsSubmissions.year })
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
        { error: 'PDS submission not found or access denied' },
        { status: 404 }
      );
    }

    // Verify the training/civil service entry belongs to this submission
    let itemId: string;
    let kind: 'training' | 'civil_service';

    if (trainingId) {
      const [training] = await db
        .select({ id: pdsTraining.id })
        .from(pdsTraining)
        .where(
          and(
            eq(pdsTraining.id, trainingId),
            eq(pdsTraining.pdsSubmissionId, pdsSubmissionId)
          )
        )
        .limit(1);

      if (!training) {
        return NextResponse.json(
          { error: 'Training entry not found or does not belong to this submission' },
          { status: 404 }
        );
      }

      itemId = trainingId;
      kind = 'training';
    } else {
      const [civilService] = await db
        .select({ id: pdsCivilService.id })
        .from(pdsCivilService)
        .where(
          and(
            eq(pdsCivilService.id, civilServiceId!),
            eq(pdsCivilService.pdsSubmissionId, pdsSubmissionId)
          )
        )
        .limit(1);

      if (!civilService) {
        return NextResponse.json(
          { error: 'Civil service entry not found or does not belong to this submission' },
          { status: 404 }
        );
      }

      itemId = civilServiceId!;
      kind = 'civil_service';
    }

    // Build storage path
    const filePath = buildAttachmentPath({
      userId,
      year: submission.year,
      pdsSubmissionId,
      kind,
      itemId,
      mimeType: file.type,
    });

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(PDS_ATTACHMENTS_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[POST /api/pds/attachments] Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Generate signed URL for private bucket access
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(PDS_ATTACHMENTS_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlError) {
      console.error('[POST /api/pds/attachments] Signed URL error:', signedUrlError);
      // Continue without URL - upload succeeded
    }

    const fileUrl = signedUrlData?.signedUrl || null;

    // Insert attachment record in database
    const [attachment] = await db
      .insert(pdsAttachments)
      .values({
        userId,
        pdsSubmissionId,
        year: submission.year,
        trainingId: trainingId || null,
        civilServiceId: civilServiceId || null,
        filePath,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      })
      .returning();

    console.log(
      `[POST /api/pds/attachments] Uploaded attachment ${attachment.id} for ${kind} ${itemId}`
    );

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        filePath: attachment.filePath,
        fileUrl,
        createdAt: attachment.createdAt,
      },
    });
  } catch (error) {
    console.error('[POST /api/pds/attachments] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to upload attachment',
      },
      { status: 500 }
    );
  }
}

