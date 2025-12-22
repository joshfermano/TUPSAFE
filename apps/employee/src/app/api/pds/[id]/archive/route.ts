/**
 * PDS API Route - Archive Individual PDS
 * POST /api/pds/[id]/archive - Archive a PDS (approved ones only)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPDSSubmissionById,
  archivePDSSubmission,
} from '@tupsafe/database/server';
import { createServerClient } from '@tupsafe/auth/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pds/[id]/archive
 * Archive an approved PDS submission
 * Only approved PDS submissions can be archived
 *
 * Path Parameters:
 * - id: PDS submission UUID
 *
 * Returns:
 * {
 *   success: true,
 *   message: string
 * }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        '[POST /api/pds/[id]/archive] Authentication failed:',
        authError
      );
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

    // Validate PDS exists and belongs to user
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

    // Validate PDS is approved (only approved submissions can be archived)
    if (pds.submission.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot archive PDS with status '${pds.submission.status}'. Only approved submissions can be archived.`,
        },
        { status: 403 }
      );
    }

    // Check if this is the latest PDS (warn but allow archiving)
    if (pds.submission.isLatest) {
      console.warn(
        `[POST /api/pds/[id]/archive] Archiving latest PDS ${id} for user ${user.id}. User will not have a current PDS.`
      );
    }

    // Archive PDS submission
    await archivePDSSubmission(id, user.id);

    console.log(
      `[POST /api/pds/[id]/archive] Archived PDS ${id} for user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message:
        'PDS archived successfully. The submission has been moved to your archive.',
    });
  } catch (error) {
    console.error('[POST /api/pds/[id]/archive] Error archiving PDS:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to archive PDS',
      },
      { status: 500 }
    );
  }
}
