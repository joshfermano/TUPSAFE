/**
 * SALN API Route - List and Create
 * GET /api/saln - List all SALN submissions for current user
 * POST /api/saln - Create new SALN submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { profiles } from '@tupsafe/database/schema';
import { eq } from 'drizzle-orm';
import {
  getSALNSubmissions,
  createSALNSubmission,
  type CreateSalnInput,
} from '@tupsafe/database/server';
import { transformSalnForSubmission } from '../../../lib/utils/saln-transformations';

/**
 * GET /api/saln
 * List all SALN submissions for current user
 *
 * Query Parameters:
 * - year: Filter by year (optional)
 * - status: Filter by submission status (draft | submitted | reviewing | approved | rejected)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 *
 * Returns:
 * {
 *   success: true,
 *   data: SalnSubmission[],
 *   pagination: { page, limit, total }
 * }
 */
export async function GET(request: NextRequest) {
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
      console.error('[GET /api/saln] Authentication failed:', authError);
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
        `[GET /api/saln] Access denied for user ${user.id}: userType=${profile?.userType || 'null'}`
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
    // STEP 3: Parse and validate query parameters
    // ========================================================================
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : undefined;
    const status = searchParams.get('status') as
      | 'draft'
      | 'submitted'
      | 'reviewing'
      | 'approved'
      | 'rejected'
      | undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid pagination parameters. Page and limit must be positive integers.',
        },
        { status: 400 }
      );
    }

    // Validate year if provided
    if (year !== undefined && (year < 2000 || year > new Date().getFullYear() + 1)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid year. Must be between 2000 and ${new Date().getFullYear() + 1}`,
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = [
        'draft',
        'submitted',
        'reviewing',
        'approved',
        'rejected',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // ========================================================================
    // STEP 4: Fetch SALN submissions
    // ========================================================================
    const submissions = await getSALNSubmissions(user.id, {
      year,
      status,
      page,
      pageSize: limit,
    });

    console.log(
      `[GET /api/saln] Retrieved ${submissions.length} SALN submissions for user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: {
        page,
        limit,
        total: submissions.length,
        hasMore: submissions.length === limit,
      },
    });
  } catch (error) {
    console.error('[GET /api/saln] Error fetching SALN submissions:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch SALN submissions',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saln
 * Create a new SALN submission
 *
 * Body: CompleteSalnData (transformed from frontend format)
 * {
 *   submission: { year, filingType, ... },
 *   realProperties: [...],
 *   personalProperties: [...],
 *   liabilities: [...],
 *   businessInterests: [...],
 *   relativesInGov: [...]
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   data: { id: string },
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
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
      console.error('[POST /api/saln] Authentication failed:', authError);
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
        `[POST /api/saln] Access denied for user ${user.id}: userType=${profile?.userType || 'null'}`
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
    // STEP 3: Parse and validate request body
    // ========================================================================
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[POST /api/saln] Invalid JSON body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected valid JSON.' },
        { status: 400 }
      );
    }

    // ========================================================================
    // STEP 4: Transform frontend data to backend format
    // ========================================================================
    const transformedData = transformSalnForSubmission(body);

    // Validate required fields
    if (!transformedData.year) {
      return NextResponse.json(
        { success: false, error: 'Year is required' },
        { status: 400 }
      );
    }

    if (
      !transformedData.filingType ||
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

    // Validate year
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

    // ========================================================================
    // STEP 5: Create SALN submission
    // ========================================================================
    const salnInput: CreateSalnInput = {
      year,
      filingType: transformedData.filingType,
      realProperties: transformedData.realProperties || [],
      personalProperties: transformedData.personalProperties || [],
      liabilities: transformedData.liabilities || [],
      businessInterests: transformedData.businessInterests || [],
      relativesInGov: transformedData.relativesInGov || [],
    };

    const newSaln = await createSALNSubmission(user.id, salnInput);

    console.log(
      `[POST /api/saln] Created new SALN submission ${newSaln.id} for user ${user.id}, year ${year}`
    );

    return NextResponse.json(
      {
        success: true,
        data: { id: newSaln.id },
        message: `SALN for year ${year} created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/saln] Error creating SALN submission:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 } // Conflict
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create SALN submission',
      },
      { status: 500 }
    );
  }
}
