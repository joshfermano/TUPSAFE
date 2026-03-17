/**
 * PDS API Route - Individual PDS Operations
 * GET /api/pds/[id] - Get complete PDS with all sections
 * PATCH /api/pds/[id] - Update existing PDS (draft/rejected only)
 * DELETE /api/pds/[id] - Delete PDS (draft/rejected only)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPDSSubmissionById,
  updatePDSSubmission,
  updatePDSCompletion,
  deletePDSSubmission,
  type UpdatePDSData,
  db,
  pdsAttachments,
} from '@tupsafe/database/server';
import { createServerClient, createAdminClient } from '@tupsafe/auth/server';
import { createAuditLog } from '@tupsafe/database/server';
import { PDS_ATTACHMENTS_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from '@tupsafe/auth/server';
import { eq } from 'drizzle-orm';
import { transformPdsFromBackend } from '../../../../lib/utils/pds-transformations';
import { getPdsReadinessProgress } from '../../../../lib/validations/pds-schema';

/**
 * Helper function to compute and persist PDS completion
 * Fetches the full submission, transforms to frontend format, computes readiness, and stores it
 */
async function computeAndPersistCompletion(pdsId: string, userId: string): Promise<void> {
  try {
    // Fetch the complete PDS submission
    const pds = await getPDSSubmissionById(pdsId, userId);
    if (!pds) {
      console.warn(`[computeAndPersistCompletion] PDS ${pdsId} not found`);
      return;
    }

    // Transform to frontend format for progress calculation
    const frontendData = transformPdsFromBackend(pds);

    // Compute readiness-based completion (personal info + other info with references)
    const completion = getPdsReadinessProgress(frontendData);

    // Persist the completion value
    await updatePDSCompletion(pdsId, completion);

    console.log(`[computeAndPersistCompletion] Updated PDS ${pdsId} completion to ${completion}%`);
  } catch (error) {
    // Log but don't fail the main operation
    console.error(`[computeAndPersistCompletion] Failed for PDS ${pdsId}:`, error);
  }
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pds/[id]
 * Retrieve a complete PDS submission with all related sections
 *
 * Path Parameters:
 * - id: PDS submission UUID
 *
 * Returns:
 * {
 *   success: true,
 *   data: CompletePDSSubmission
 * }
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[GET /api/pds/[id]] Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get PDS ID from route params
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'PDS submission ID is required.' },
        { status: 400 }
      );
    }

    // Fetch complete PDS with ownership validation
    const pds = await getPDSSubmissionById(id, user.id);

    if (!pds) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDS submission not found or access denied.',
        },
        { status: 404 }
      );
    }

    // Fetch attachments for this submission
    let attachmentsWithUrls: {
      id: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      filePath: string;
      fileUrl: string | null;
      trainingId: string | null;
      civilServiceId: string | null;
      createdAt: Date;
    }[] = [];
    const attachmentsByTraining: Record<string, typeof attachmentsWithUrls> = {};
    const attachmentsByCivilService: Record<string, typeof attachmentsWithUrls> = {};

    try {
      const attachmentsList = await db
        .select()
        .from(pdsAttachments)
        .where(eq(pdsAttachments.pdsSubmissionId, id));

      // Only create admin client and generate signed URLs if there are attachments
      if (attachmentsList.length > 0) {
        const adminClient = createAdminClient();

        attachmentsWithUrls = await Promise.all(
          attachmentsList.map(async (att) => {
            let fileUrl: string | null = null;

            if (att.filePath) {
              const { data: signedUrlData } = await adminClient.storage
                .from(PDS_ATTACHMENTS_BUCKET)
                .createSignedUrl(att.filePath, SIGNED_URL_EXPIRY_SECONDS);
              fileUrl = signedUrlData?.signedUrl || null;
            }

            return {
              id: att.id,
              fileName: att.fileName,
              mimeType: att.mimeType,
              sizeBytes: att.sizeBytes,
              filePath: att.filePath,
              fileUrl,
              trainingId: att.trainingId,
              civilServiceId: att.civilServiceId,
              createdAt: att.createdAt,
            };
          })
        );

        // Group attachments by trainingId and civilServiceId
        attachmentsWithUrls.forEach((att) => {
          if (att.trainingId) {
            if (!attachmentsByTraining[att.trainingId]) {
              attachmentsByTraining[att.trainingId] = [];
            }
            attachmentsByTraining[att.trainingId].push(att);
          }
          if (att.civilServiceId) {
            if (!attachmentsByCivilService[att.civilServiceId]) {
              attachmentsByCivilService[att.civilServiceId] = [];
            }
            attachmentsByCivilService[att.civilServiceId].push(att);
          }
        });
      }
    } catch (attachmentError) {
      // Log but don't fail the request — PDS data is more important than attachments
      console.error('[GET /api/pds/[id]] Attachment processing failed:', attachmentError);
    }

    console.log(
      `[GET /api/pds/[id]] Retrieved PDS ${id} for user ${user.id} with ${attachmentsWithUrls.length} attachments`
    );

    return NextResponse.json({
      success: true,
      data: {
        ...pds,
        attachments: {
          all: attachmentsWithUrls,
          byTraining: attachmentsByTraining,
          byCivilService: attachmentsByCivilService,
        },
      },
    });
  } catch (error) {
    console.error('[GET /api/pds/[id]] Error fetching PDS:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch PDS',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pds/[id]
 * Update an existing PDS submission
 * Only draft and rejected submissions can be updated
 *
 * Path Parameters:
 * - id: PDS submission UUID
 *
 * Body: UpdatePDSData (partial)
 * {
 *   personalInfo?: {...},
 *   familyBackground?: {...},
 *   children?: [...],
 *   education?: [...],
 *   civilService?: [...],
 *   workExperience?: [...],
 *   voluntaryWork?: [...],
 *   training?: [...],
 *   otherInfo?: {...}
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   message: string
 * }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[PATCH /api/pds/[id]] Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get PDS ID from route params
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'PDS submission ID is required.' },
        { status: 400 }
      );
    }

    // Parse request body
    let body: UpdatePDSData;
    try {
      body = await request.json();

      // DEBUG: Log what data is received in the PATCH request
      console.log('[PATCH /api/pds/[id]] Received update data:', {
        id,
        hasCivilService: !!body.civilService,
        civilServiceCount: body.civilService?.length || 0,
        civilServiceWithIds: body.civilService?.filter((cs) => cs.id).length || 0,
        hasTraining: !!body.training,
        trainingCount: body.training?.length || 0,
        trainingWithIds: body.training?.filter((tr) => tr.id).length || 0,
        trainingEntries: body.training?.map((tr) => ({
          id: tr.id,
          title: tr.title,
          dateFrom: tr.dateFrom,
          dateTo: tr.dateTo,
        })) || [],
      });
    } catch (parseError) {
      console.error('[PATCH /api/pds/[id]] Invalid JSON body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected valid JSON.' },
        { status: 400 }
      );
    }

    // Validate that at least one section is being updated
    const sections = [
      'personalInfo',
      'familyBackground',
      'children',
      'education',
      'civilService',
      'workExperience',
      'voluntaryWork',
      'training',
      'otherInfo',
    ];
    const hasUpdates = sections.some((section) => body[section as keyof UpdatePDSData] !== undefined);

    if (!hasUpdates) {
      return NextResponse.json(
        {
          success: false,
          error: 'No updates provided. At least one section must be included.',
        },
        { status: 400 }
      );
    }

    // Check if PDS exists and get current status
    const existingPDS = await getPDSSubmissionById(id, user.id);

    if (!existingPDS) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDS submission not found or access denied.',
        },
        { status: 404 }
      );
    }

    // Validate that PDS can be updated (only draft or rejected)
    const allowedStatuses = ['draft', 'rejected'];
    if (!allowedStatuses.includes(existingPDS.submission.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot update PDS with status '${existingPDS.submission.status}'. Only draft or rejected submissions can be updated.`,
        },
        { status: 403 }
      );
    }

    // Update PDS submission
    await updatePDSSubmission(id, user.id, body);

    // Compute and persist the completion percentage
    await computeAndPersistCompletion(id, user.id);

    console.log(
      `[PATCH /api/pds/[id]] Updated PDS ${id} for user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message: 'PDS submission updated successfully',
    });
  } catch (error) {
    console.error('[PATCH /api/pds/[id]] Error updating PDS:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update PDS',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pds/[id]
 * Delete a PDS submission (draft or rejected only)
 *
 * Path Parameters:
 * - id: PDS submission UUID
 *
 * Returns:
 * {
 *   success: true,
 *   message: string
 * }
 *
 * Security:
 * - Only draft and rejected submissions can be deleted
 * - Validates user ownership
 * - Permanent deletion (cannot be undone)
 * - Audit logged for compliance
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[DELETE /api/pds/[id]] Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get PDS ID from route params
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'PDS submission ID is required.' },
        { status: 400 }
      );
    }

    // Check if PDS exists and get current status
    const existingPDS = await getPDSSubmissionById(id, user.id);

    if (!existingPDS) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDS submission not found or access denied.',
        },
        { status: 404 }
      );
    }

    // Validate that PDS can be deleted (only drafts or rejected)
    const allowedDeleteStatuses = ['draft', 'rejected'];
    if (!allowedDeleteStatuses.includes(existingPDS.submission.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete PDS with status '${existingPDS.submission.status}'. Only draft or rejected submissions can be deleted. Please archive submitted or approved submissions instead.`,
        },
        { status: 403 }
      );
    }

    // Delete PDS submission
    await deletePDSSubmission(id, user.id);

    // Create audit log for the deletion
    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'pds_submission',
      entityId: id,
      changes: {
        deletedStatus: existingPDS.submission.status,
        version: existingPDS.submission.version,
        year: existingPDS.submission.year,
        wasRejected: existingPDS.submission.status === 'rejected',
        rejectionReason: existingPDS.submission.rejectionReason,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    console.log(
      `[DELETE /api/pds/[id]] Deleted ${existingPDS.submission.status} PDS ${id} for user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message: `PDS deleted successfully`,
    });
  } catch (error) {
    console.error('[DELETE /api/pds/[id]] Error deleting PDS:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete PDS',
      },
      { status: 500 }
    );
  }
}
