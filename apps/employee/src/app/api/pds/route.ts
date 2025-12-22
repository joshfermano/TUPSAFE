/**
 * PDS API Route - List and Create
 * GET /api/pds - List all PDS submissions for current user
 * POST /api/pds - Create new PDS submission
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPDSSubmissions,
  createPDSSubmission,
  updatePDSSubmission,
  getActivePDSDraft,
  type PDSFilterOptions,
  type CreatePDSData,
} from '@tupsafe/database/server';
import { createServerClient } from '@tupsafe/auth/server';

/**
 * GET /api/pds
 * Retrieve all PDS submissions for the authenticated user
 *
 * Query Parameters:
 * - status: Filter by submission status (draft | submitted | reviewing | approved | rejected)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 *
 * Returns:
 * {
 *   success: true,
 *   data: PdsSubmission[],
 *   pagination: { page, limit, total }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[GET /api/pds] Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as
      | 'draft'
      | 'submitted'
      | 'reviewing'
      | 'approved'
      | 'rejected'
      | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10', 10),
      100
    );

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

    // Build filter options
    const filters: PDSFilterOptions = {
      limit,
      offset: (page - 1) * limit,
    };

    if (status) {
      // Validate status
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
            error: `Invalid status. Must be one of: ${validStatuses.join(
              ', '
            )}`,
          },
          { status: 400 }
        );
      }
      filters.status = status;
    }

    // Fetch PDS submissions
    const submissions = await getPDSSubmissions(user.id, filters);

    console.log(
      `[GET /api/pds] Retrieved ${submissions.length} PDS submissions for user ${user.id}`
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
    console.error('[GET /api/pds] Error fetching PDS submissions:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch PDS submissions',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pds
 * Create a new PDS submission
 *
 * Body: CreatePDSData
 * {
 *   version?: number,
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
 *   data: { id: string }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[POST /api/pds] Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Parse request body
    let body: CreatePDSData;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[POST /api/pds] Invalid JSON body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected valid JSON.' },
        { status: 400 }
      );
    }

    // For drafts, allow partial data
    // Only validate if personal info is provided (optional for initial draft creation)
    if (body.personalInfo) {
      const { personalInfo } = body;

      // Only validate required fields if they exist
      // This allows for partial drafts during auto-save
      const providedFields = Object.keys(personalInfo).filter(
        (key) => personalInfo[key as keyof typeof personalInfo] !== null &&
                personalInfo[key as keyof typeof personalInfo] !== undefined &&
                personalInfo[key as keyof typeof personalInfo] !== ''
      );

      // If at least some personal info is provided, that's good enough for a draft
      if (providedFields.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Please provide at least some personal information to save a draft.',
          },
          { status: 400 }
        );
      }
    }

    // Check for existing draft within 24 hours (deduplication)
    const existingDraftId = await getActivePDSDraft(user.id);

    if (existingDraftId) {
      // Update existing draft instead of creating new one
      console.log(
        `[POST /api/pds] Found existing draft ${existingDraftId}, updating instead of creating new`
      );

      await updatePDSSubmission(existingDraftId, user.id, body);

      return NextResponse.json(
        {
          success: true,
          data: { id: existingDraftId },
          message: 'Draft updated successfully',
        },
        { status: 200 }
      );
    }

    // No recent draft exists - create new one
    const pdsId = await createPDSSubmission(user.id, body);

    console.log(
      `[POST /api/pds] Created new PDS submission ${pdsId} for user ${user.id}`
    );

    return NextResponse.json(
      {
        success: true,
        data: { id: pdsId },
        message: 'PDS submission created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/pds] Error creating PDS submission:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create PDS submission',
      },
      { status: 500 }
    );
  }
}
