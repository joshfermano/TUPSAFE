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
  deletePDSSubmission,
  type UpdatePDSData,
  db,
  pdsAttachments,
} from '@tupsafe/database/server';
import { createServerClient } from '@tupsafe/auth/server';
import { createAuditLog } from '@tupsafe/database/server';
import { getAttachmentPublicUrl } from '@tupsafe/auth/server';
import { eq } from 'drizzle-orm';

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
    const attachmentsList = await db
      .select()
      .from(pdsAttachments)
      .where(eq(pdsAttachments.pdsSubmissionId, id));

    // Get Supabase URL for public URLs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // Transform attachments with public URLs and group by entry ID
    const attachmentsWithUrls = attachmentsList.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      mimeType: att.mimeType,
      sizeBytes: att.sizeBytes,
      filePath: att.filePath,
      fileUrl: getAttachmentPublicUrl(supabaseUrl, att.filePath),
      trainingId: att.trainingId,
      civilServiceId: att.civilServiceId,
      createdAt: att.createdAt,
    }));

    // Group attachments by trainingId and civilServiceId for easy frontend access
    const attachmentsByTraining: Record<string, typeof attachmentsWithUrls> = {};
    const attachmentsByCivilService: Record<string, typeof attachmentsWithUrls> = {};

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

    console.log(
      `[GET /api/pds/[id]] Retrieved PDS ${id} for user ${user.id} with ${attachmentsList.length} attachments`
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
