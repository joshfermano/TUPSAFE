/**
 * Positions API Route
 *
 * Comprehensive endpoint for fetching organizational positions (not job openings).
 * These are the official positions within departments (e.g., Professor, Department Head).
 *
 * @module api/positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import {
  getPositionsByDepartment,
  type PaginationOptions,
} from '@tupsafe/database/server';
import { db, positions } from '@tupsafe/database/server';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/positions
 *
 * Get organizational positions with optional filtering and pagination.
 * Returns positions within the organizational structure, not job openings.
 *
 * Note: For job openings/vacancies, use the /api/open-positions endpoint instead.
 *
 * @authentication Required - Employee or Applicant
 *
 * @queryparam {string} departmentId - UUID of department to filter positions
 * @queryparam {string} organizationId - Alias for departmentId (for compatibility)
 * @queryparam {number} page - Page number for pagination (default: 1, min: 1)
 * @queryparam {number} limit - Items per page (default: 20, min: 1, max: 100)
 *
 * @returns {object} JSON response with positions and pagination metadata
 *
 * @example
 * // Get all positions (paginated)
 * GET /api/positions?page=1&limit=20
 *
 * @example
 * // Get positions for specific department
 * GET /api/positions?departmentId=550e8400-e29b-41d4-a716-446655440000
 *
 * @example
 * // Using organizationId alias
 * GET /api/positions?organizationId=550e8400-e29b-41d4-a716-446655440000&limit=50
 *
 * @throws {401} Unauthorized - Missing or invalid authentication
 * @throws {400} Bad Request - Invalid query parameters
 * @throws {500} Internal Server Error - Database or server error
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication - Verify user is authenticated
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required. Please log in to access this resource.'
        },
        { status: 401 }
      );
    }

    // 2. Verify user has valid profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'User profile not found or invalid.'
        },
        { status: 403 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Account is not active. Please contact support.'
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;

    // Support both departmentId and organizationId for compatibility
    const departmentId = searchParams.get('departmentId') || searchParams.get('organizationId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // Validate departmentId format if provided
    if (departmentId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(departmentId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Bad Request',
            message: 'Invalid department ID format. Must be a valid UUID.'
          },
          { status: 400 }
        );
      }
    }

    // 4. Prepare pagination options
    const paginationOptions: PaginationOptions = {
      limit,
      offset: (page - 1) * limit,
    };

    // 5. Fetch positions based on query parameters
    let positionsList;
    let totalCount = 0;

    try {
      if (departmentId) {
        // Fetch positions for specific department
        positionsList = await getPositionsByDepartment(departmentId, paginationOptions);

        // Get total count for this department
        const countResult = await db
          .select({ count: positions.id })
          .from(positions)
          .where(
            and(
              eq(positions.departmentId, departmentId),
              eq(positions.isActive, true)
            )
          );
        totalCount = countResult.length;
      } else {
        // Fetch all active positions (paginated)
        positionsList = await db
          .select()
          .from(positions)
          .where(eq(positions.isActive, true))
          .orderBy(positions.title)
          .limit(paginationOptions.limit || 20)
          .offset(paginationOptions.offset || 0);

        // Get total count of all active positions
        const countResult = await db
          .select({ count: positions.id })
          .from(positions)
          .where(eq(positions.isActive, true));
        totalCount = countResult.length;
      }
    } catch (dbError) {
      console.error('[GET /api/positions] Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to retrieve positions from database.',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // 6. Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // 7. Return successful response with cache headers
    return NextResponse.json(
      {
        success: true,
        data: positionsList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        meta: {
          departmentId: departmentId || null,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 1 hour (positions are relatively static)
          // Allow stale content for 1 day while revalidating
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    // 8. Handle unexpected errors
    console.error('[GET /api/positions] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your request.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
