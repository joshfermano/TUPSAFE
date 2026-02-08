/**
 * SALN API Route - Individual SALN Operations
 * GET /api/saln/[id] - Get complete SALN with all sections
 * PATCH /api/saln/[id] - Update existing SALN (draft/rejected only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { profiles } from '@tupsafe/database/schema';
import { eq } from 'drizzle-orm';
import {
  getSALNSubmissionById,
  updateSALNSubmission,
  updateSALNCompletion,
  deleteSALNSubmission,
  type UpdateSalnInput,
} from '@tupsafe/database/server';
import {
  transformSalnFromBackend,
  transformSalnForSubmission,
} from '../../../../lib/utils/saln-transformations';
import { getSalnReadinessProgress } from '../../../../lib/validations/saln-schema';

/**
 * Helper function to compute and persist SALN completion
 * Fetches the full submission, transforms to frontend format, computes readiness, and stores it
 */
async function computeAndPersistCompletion(salnId: string, userId: string): Promise<void> {
  try {
    // Fetch the complete SALN submission
    const saln = await getSALNSubmissionById(salnId, userId);
    if (!saln) {
      console.warn(`[computeAndPersistCompletion] SALN ${salnId} not found`);
      return;
    }

    // Transform to frontend format for progress calculation
    const frontendData = transformSalnFromBackend(saln);

    // Compute readiness-based completion (declarant info + has assets)
    const completion = getSalnReadinessProgress(frontendData);

    // Persist the completion value
    await updateSALNCompletion(salnId, completion);

    console.log(`[computeAndPersistCompletion] Updated SALN ${salnId} completion to ${completion}%`);
  } catch (error) {
    // Log but don't fail the main operation
    console.error(`[computeAndPersistCompletion] Failed for SALN ${salnId}:`, error);
  }
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/saln/[id]
 * Retrieve a complete SALN submission with all related sections
 *
 * Path Parameters:
 * - id: SALN submission UUID
 *
 * Returns:
 * {
 *   success: true,
 *   data: CompleteSaln
 * }
 */
export async function GET(request: NextRequest, context: RouteContext) {
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
      console.error('[GET /api/saln/[id]] Authentication failed:', authError);
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
        `[GET /api/saln/[id]] Access denied for user ${user.id}: userType=${
          profile?.userType || 'null'
        }`
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
    // STEP 4: Fetch complete SALN with ownership validation
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

    // ========================================================================
    // STEP 5: Transform backend data to frontend format
    // ========================================================================
    const transformedSaln = transformSalnFromBackend(saln);

    console.log(
      `[GET /api/saln/[id]] Retrieved SALN ${id} for user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      data: transformedSaln,
    });
  } catch (error) {
    console.error('[GET /api/saln/[id]] Error fetching SALN:', error);

    // Handle ownership error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch SALN',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/saln/[id]
 * Update an existing SALN submission
 * Only draft and rejected submissions can be updated
 *
 * Path Parameters:
 * - id: SALN submission UUID
 *
 * Body: Partial CompleteSalnData
 * {
 *   submission?: { year?, filingType?, ... },
 *   realProperties?: [...],
 *   personalProperties?: [...],
 *   liabilities?: [...],
 *   businessInterests?: [...],
 *   relativesInGov?: [...]
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
    // ========================================================================
    // STEP 1: Authenticate user
    // ========================================================================
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[PATCH /api/saln/[id]] Authentication failed:', authError);
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
        `[PATCH /api/saln/[id]] Access denied for user ${user.id}: userType=${
          profile?.userType || 'null'
        }`
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
    // STEP 4: Parse request body
    // ========================================================================
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[PATCH /api/saln/[id]] Invalid JSON body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected valid JSON.' },
        { status: 400 }
      );
    }

    // Validate that at least one section is being updated
    const sections = [
      'submission',
      'realProperties',
      'personalProperties',
      'liabilities',
      'businessInterests',
      'relativesInGov',
    ];
    const hasUpdates = sections.some((section) => body[section] !== undefined);

    if (!hasUpdates) {
      return NextResponse.json(
        {
          success: false,
          error: 'No updates provided. At least one section must be included.',
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // STEP 5: Check if SALN exists and get current status
    // ========================================================================
    const existingSALN = await getSALNSubmissionById(id, user.id);

    if (!existingSALN) {
      return NextResponse.json(
        {
          success: false,
          error: 'SALN submission not found or access denied.',
        },
        { status: 404 }
      );
    }

    // Validate that SALN can be updated (only draft or rejected)
    const allowedStatuses = ['draft', 'rejected'];
    if (!allowedStatuses.includes(existingSALN.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot update SALN with status '${existingSALN.status}'. Only draft or rejected submissions can be updated.`,
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // STEP 6: Transform frontend data to backend format
    // ========================================================================
    const transformedData = transformSalnForSubmission(body);

    // Validate year if provided
    if (transformedData.year !== undefined) {
      const year = parseInt(transformedData.year);
      const currentYear = new Date().getFullYear();
      if (year < 2000 || year > currentYear + 1) {
        return NextResponse.json(
          {
            success: false,
            error: `Year must be between 2000 and ${currentYear + 1}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate filing type if provided
    if (
      transformedData.filingType &&
      !['joint', 'separate', 'not_applicable'].includes(
        transformedData.filingType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Valid filing type is required (joint, separate, or not_applicable)',
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // STEP 7: Prepare update input (only include explicitly provided sections)
    // IMPORTANT: undefined sections are preserved in DB, empty arrays clear them
    // This prevents accidental data loss during partial updates
    // ========================================================================
    const updateInput: UpdateSalnInput = {
      year:
        transformedData.year !== undefined
          ? parseInt(transformedData.year)
          : undefined,
      filingType: transformedData.filingType,
      spouseName: transformedData.spouseName,
      position: transformedData.position,
      agency: transformedData.agency,
      officeAddress: transformedData.officeAddress,
      // 2025 SALN Format fields
      salnFormatVersion: transformedData.salnFormatVersion,
      complianceType: transformedData.complianceType,
      complianceDate: transformedData.complianceDate,
      hasMultipleMarriages: transformedData.hasMultipleMarriages,
      previousSpouseNames: transformedData.previousSpouseNames,
      spouseIsPublicOfficial: transformedData.spouseIsPublicOfficial,
      spousePosition: transformedData.spousePosition,
      spouseAgency: transformedData.spouseAgency,
      spouseOfficeAddress: transformedData.spouseOfficeAddress,
      unmarriedChildren: transformedData.unmarriedChildren,
      hasNoBusinessInterests: transformedData.hasNoBusinessInterests,
      hasNoRelativesInGov: transformedData.hasNoRelativesInGov,
      governmentIdType: transformedData.governmentIdType,
      governmentIdNumber: transformedData.governmentIdNumber,
      governmentIdDateIssued: transformedData.governmentIdDateIssued,
      governmentIdType2: transformedData.governmentIdType2,
      governmentIdNumber2: transformedData.governmentIdNumber2,
      governmentIdDateIssued2: transformedData.governmentIdDateIssued2,
      declarantTin: transformedData.declarantTin,
      spouseTin: transformedData.spouseTin,
      spouseDateOfBirth: transformedData.spouseDateOfBirth,
      // Only include sections that were explicitly provided in the request
      // undefined = preserve existing data, [] = clear the section
      realProperties: transformedData.realProperties,
      personalProperties: transformedData.personalProperties,
      liabilities: transformedData.liabilities,
      businessInterests: transformedData.businessInterests,
      relativesInGov: transformedData.relativesInGov,
    };

    // ========================================================================
    // STEP 8: Update SALN submission
    // ========================================================================
    await updateSALNSubmission(id, user.id, updateInput);

    // Compute and persist the completion percentage
    await computeAndPersistCompletion(id, user.id);

    console.log(
      `[PATCH /api/saln/[id]] Updated SALN ${id} for user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message: 'SALN submission updated successfully',
    });
  } catch (error) {
    console.error('[PATCH /api/saln/[id]] Error updating SALN:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Cannot update')
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
        error: error instanceof Error ? error.message : 'Failed to update SALN',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/saln/[id]
 * Delete a SALN draft
 *
 * Only draft SALNs can be deleted.
 * All related records are deleted in a transaction.
 *
 * Returns:
 * {
 *   success: true,
 *   message: "SALN draft deleted successfully"
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        '[DELETE /api/saln/[id]] Authentication failed:',
        authError
      );
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // ========================================================================
    // STEP 2: RBAC CHECK - EMPLOYEE ONLY
    // ========================================================================
    const [profile] = await db
      .select({ userType: profiles.userType })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile || profile.userType !== 'employee') {
      console.error(
        `[DELETE /api/saln/[id]] Access denied for user ${user.id}: userType=${
          profile?.userType || 'null'
        }`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Access Denied',
          message: 'SALN deletion is only available to employees.',
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // STEP 3: Get ID from params
    // ========================================================================
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'SALN ID is required' },
        { status: 400 }
      );
    }

    // ========================================================================
    // STEP 4: Delete SALN (validation happens in query function)
    // ========================================================================
    await deleteSALNSubmission(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'SALN draft deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/saln/[id]] Error:', error);

    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Only draft')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete SALN draft',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
