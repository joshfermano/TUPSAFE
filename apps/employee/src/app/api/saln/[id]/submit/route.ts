/**
 * SALN API Route - Submit for Approval
 * POST /api/saln/[id]/submit - Submit SALN for approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { profiles } from '@tupsafe/database/schema';
import { eq } from 'drizzle-orm';
import {
  getSALNSubmissionById,
  submitSALNForApproval,
} from '@tupsafe/database/server';
import { completeSalnSchema } from '../../../../../lib/validations/saln-schema';
import { transformSalnFromBackend } from '../../../../../lib/utils/saln-transformations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/saln/[id]/submit
 * Submit a SALN for approval
 * Changes status from 'draft' or 'rejected' to 'submitted'
 *
 * Path Parameters:
 * - id: SALN submission UUID
 *
 * Returns:
 * {
 *   success: true,
 *   message: string
 * }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // ========================================================================
    // STEP 1: Authenticate user
    // ========================================================================
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        '[POST /api/saln/[id]/submit] Authentication failed:',
        authError
      );
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // ========================================================================
    // STEP 2: RBAC CHECK - EMPLOYEE ONLY (Source of Truth: profiles table)
    // ========================================================================
    const [profile] = await db
      .select({ userType: profiles.userType })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    // ENFORCE EMPLOYEE-ONLY ACCESS
    if (!profile || profile.userType !== 'employee') {
      console.error(
        `[POST /api/saln/[id]/submit] Access denied for user ${
          user.id
        }: userType=${profile?.userType || 'null'}`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Access Denied',
          message: 'SALN is only available to employees.',
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // STEP 3: Get SALN ID from route params
    // ========================================================================
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'SALN submission ID is required.' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid SALN ID format' },
        { status: 400 }
      );
    }

    // ========================================================================
    // STEP 4: Validate SALN exists and belongs to user
    // ========================================================================
    const saln = await getSALNSubmissionById(id, user.id);

    if (!saln) {
      return NextResponse.json(
        {
          success: false,
          error: 'SALN submission not found or access denied.',
        },
        { status: 404 }
      );
    }

    // Validate SALN is in draft or rejected status (rejected can be resubmitted)
    const allowedStatuses = ['draft', 'rejected'];
    if (!allowedStatuses.includes(saln.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot submit SALN with status '${saln.status}'. Only draft or rejected submissions can be submitted.`,
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // STEP 5: Validate SALN completeness
    // ========================================================================
    // Transform to frontend format for validation
    const frontendSaln = transformSalnFromBackend(saln);

    // Debug logging for SALN data structure (non-PII)
    console.log('[POST /api/saln/[id]/submit] SALN data check:', {
      hasSubmission: !!frontendSaln.submission,
      realPropertiesCount: frontendSaln.realProperties?.length ?? 0,
      personalPropertiesCount: frontendSaln.personalProperties?.length ?? 0,
      liabilitiesCount: frontendSaln.liabilities?.length ?? 0,
      businessInterestsCount: frontendSaln.businessInterests?.length ?? 0,
      relativesInGovCount: frontendSaln.relativesInGov?.length ?? 0,
    });

    // Validate required sections are present
    const realPropertiesCount = frontendSaln.realProperties?.length ?? 0;
    const personalPropertiesCount =
      frontendSaln.personalProperties?.length ?? 0;
    const hasAssets = realPropertiesCount > 0 || personalPropertiesCount > 0;

    if (!hasAssets) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot submit incomplete SALN. At least one asset (real property or personal property) is required.',
          details: {
            realPropertiesCount,
            personalPropertiesCount,
            hint: 'Please add at least one real property (land, house, etc.) or personal property (vehicle, cash, investments, etc.) before submitting.',
          },
        },
        { status: 400 }
      );
    }

    // Validate against complete schema
    try {
      completeSalnSchema.parse(frontendSaln);
    } catch (validationError: any) {
      console.error(
        '[POST /api/saln/[id]/submit] Validation failed:',
        validationError
      );

      // Extract validation errors with clear path information
      const errors =
        validationError.errors?.map((err: any) => ({
          path: err.path.join('.'),
          field: err.path[err.path.length - 1] || 'unknown',
          message: err.message,
        })) || [];

      // Get the first error for a clearer message
      const firstError = errors[0];
      const errorSummary = firstError
        ? `${firstError.path}: ${firstError.message}`
        : validationError.message;

      return NextResponse.json(
        {
          success: false,
          error: `SALN validation failed: ${errorSummary}`,
          details: errors.length > 0 ? errors : validationError.message,
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // STEP 6: Submit SALN for approval
    // ========================================================================
    await submitSALNForApproval(id, user.id);

    console.log(
      `[POST /api/saln/[id]/submit] Submitted SALN ${id} for approval by user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message:
        'SALN submitted for approval successfully. You will be notified once it has been reviewed.',
    });
  } catch (error) {
    console.error('[POST /api/saln/[id]/submit] Error submitting SALN:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'SALN submission not found' },
          { status: 404 }
        );
      }
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Only draft')
      ) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit SALN',
      },
      { status: 500 }
    );
  }
}
