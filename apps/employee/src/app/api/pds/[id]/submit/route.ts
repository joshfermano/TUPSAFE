/**
 * PDS API Route - Submit for Approval
 * POST /api/pds/[id]/submit - Submit PDS for approval
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPDSSubmissionById,
  submitPDSForApproval,
} from '@tupsafe/database/server';
import {
  validatePersonalInfo,
  formatValidationError,
} from '@tupsafe/database/utils/validation';
import { createServerClient } from '@tupsafe/auth/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pds/[id]/submit
 * Submit a PDS for approval
 * Changes status from 'draft' to 'submitted'
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
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error(
        '[POST /api/pds/[id]/submit] Authentication failed:',
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
    const pds = await getPDSSubmissionById(id, session.user.id);

    if (!pds) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDS submission not found or access denied.',
        },
        { status: 404 }
      );
    }

    // Validate PDS is in draft or rejected status (rejected can be resubmitted)
    const allowedStatuses = ['draft', 'rejected'];
    if (!allowedStatuses.includes(pds.submission.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot submit PDS with status '${pds.submission.status}'. Only draft or rejected submissions can be submitted.`,
        },
        { status: 403 }
      );
    }

    // Validate required sections are present
    const requiredSections = {
      personalInfo: pds.personalInfo,
      familyBackground: pds.familyBackground,
      education: pds.education.length > 0,
    };

    const missingSections = Object.entries(requiredSections)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingSections.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot submit incomplete PDS. Missing required sections: ${missingSections.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate personal info completeness using type-safe validation
    if (pds.personalInfo) {
      const validationResult = validatePersonalInfo(pds.personalInfo);

      if (!validationResult.isValid) {
        const errorMessage = formatValidationError(
          validationResult,
          'personal information'
        );

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
          },
          { status: 400 }
        );
      }
    }

    // Submit PDS for approval
    await submitPDSForApproval(id, session.user.id);

    console.log(
      `[POST /api/pds/[id]/submit] Submitted PDS ${id} for approval by user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      message:
        'PDS submitted for approval successfully. You will be notified once it has been reviewed.',
    });
  } catch (error) {
    console.error('[POST /api/pds/[id]/submit] Error submitting PDS:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to submit PDS',
      },
      { status: 500 }
    );
  }
}
