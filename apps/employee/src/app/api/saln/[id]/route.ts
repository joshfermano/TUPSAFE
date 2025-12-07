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
  type UpdateSalnInput,
} from '@tupsafe/database/server';
import {
  transformSalnFromBackend,
  transformSalnForSubmission,
} from '../../../../lib/utils/saln-transformations';

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
        `[GET /api/saln/[id]] Access denied for user ${user.id}: userType=${profile?.userType || 'null'}`
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
        error:
          error instanceof Error ? error.message : 'Failed to fetch SALN',
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
        `[PATCH /api/saln/[id]] Access denied for user ${user.id}: userType=${profile?.userType || 'null'}`
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
    // STEP 7: Prepare update input
    // ========================================================================
    const updateInput: UpdateSalnInput = {
      ...(transformedData.year !== undefined && {
        year: parseInt(transformedData.year),
      }),
      ...(transformedData.filingType && {
        filingType: transformedData.filingType,
      }),
      ...(transformedData.realProperties !== undefined && {
        realProperties: transformedData.realProperties,
      }),
      ...(transformedData.personalProperties !== undefined && {
        personalProperties: transformedData.personalProperties,
      }),
      ...(transformedData.liabilities !== undefined && {
        liabilities: transformedData.liabilities,
      }),
      ...(transformedData.businessInterests !== undefined && {
        businessInterests: transformedData.businessInterests,
      }),
      ...(transformedData.relativesInGov !== undefined && {
        relativesInGov: transformedData.relativesInGov,
      }),
    };

    // ========================================================================
    // STEP 8: Update SALN submission
    // ========================================================================
    await updateSALNSubmission(id, user.id, updateInput);

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
        error:
          error instanceof Error ? error.message : 'Failed to update SALN',
      },
      { status: 500 }
    );
  }
}
