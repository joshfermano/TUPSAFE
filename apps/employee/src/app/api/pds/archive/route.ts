/**
 * PDS API Route - Archive Operations
 * GET /api/pds/archive - Get archived PDS submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getArchivedPDS,
  type PaginationOptions,
} from '@tupsafe/database/server';
import { createServerClient } from '@tupsafe/auth/server';

/**
 * GET /api/pds/archive
 * Retrieve all archived PDS submissions for the authenticated user
 *
 * Query Parameters:
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 *
 * Returns:
 * {
 *   success: true,
 *   data: Array<{
 *     id: string,
 *     archivedAt: Date,
 *     data: CompletePDSSubmission
 *   }>,
 *   pagination: { page, limit, total }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[GET /api/pds/archive] Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
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
          error: 'Invalid pagination parameters. Page and limit must be positive integers.',
        },
        { status: 400 }
      );
    }

    // Build pagination options
    const options: PaginationOptions = {
      limit,
      offset: (page - 1) * limit,
    };

    // Fetch archived PDS submissions
    const archivedSubmissions = await getArchivedPDS(session.user.id, options);

    console.log(
      `[GET /api/pds/archive] Retrieved ${archivedSubmissions.length} archived PDS submissions for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      data: archivedSubmissions,
      pagination: {
        page,
        limit,
        total: archivedSubmissions.length,
        hasMore: archivedSubmissions.length === limit,
      },
    });
  } catch (error) {
    console.error(
      '[GET /api/pds/archive] Error fetching archived PDS:',
      error
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch archived PDS submissions',
      },
      { status: 500 }
    );
  }
}
