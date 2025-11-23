/**
 * Single Department API Route
 *
 * Endpoint for fetching detailed information about a specific department
 * including parent college, positions count, and employees count.
 *
 * @module api/departments/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { getDepartmentById } from '@tupsafe/database/server';

/**
 * GET /api/departments/[id]
 *
 * Get comprehensive details for a specific department by ID.
 * Returns department information along with:
 * - Parent college (if applicable)
 * - Count of active positions
 * - Count of active employees
 *
 * This endpoint is useful for:
 * - Department detail pages
 * - Organizational dashboards
 * - Employee directory displays
 * - Administrative oversight views
 *
 * @authentication Required - Employee or Applicant
 *
 * @param {string} id - Department UUID (from URL path)
 *
 * @returns {object} JSON response with department details and related data
 *
 * @example
 * // Get department details
 * GET /api/departments/550e8400-e29b-41d4-a716-446655440000
 *
 * // Response format:
 * {
 *   "success": true,
 *   "data": {
 *     "department": {
 *       "id": "uuid",
 *       "name": "Computer Science Department",
 *       "code": "CS",
 *       "officeType": "academic",
 *       "parentCollegeId": "college-uuid",
 *       "isActive": true,
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "updatedAt": "2024-01-01T00:00:00.000Z"
 *     },
 *     "parentCollege": {
 *       "id": "college-uuid",
 *       "name": "College of Science",
 *       "code": "COS",
 *       ...
 *     },
 *     "positionsCount": 15,
 *     "employeesCount": 42
 *   }
 * }
 *
 * @throws {401} Unauthorized - Missing or invalid authentication
 * @throws {400} Bad Request - Invalid department ID format
 * @throws {404} Not Found - Department does not exist
 * @throws {500} Internal Server Error - Database or server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract and validate department ID from URL
    const { id: departmentId } = await params;

    // Validate UUID format
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

    // 2. Authentication - Verify user is authenticated
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

    // 3. Verify user has valid profile
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

    // 4. Fetch department details from database
    let departmentDetail;
    try {
      departmentDetail = await getDepartmentById(departmentId);
    } catch (dbError) {
      console.error('[GET /api/departments/[id]] Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to retrieve department from database.',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // 5. Handle department not found
    if (!departmentDetail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: `Department with ID ${departmentId} not found.`
        },
        { status: 404 }
      );
    }

    // 6. Return successful response with moderate caching
    return NextResponse.json(
      {
        success: true,
        data: departmentDetail,
      },
      {
        status: 200,
        headers: {
          // Cache for 30 minutes (employee/position counts may change)
          // Allow stale content for 1 day while revalidating
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    // 7. Handle unexpected errors
    console.error('[GET /api/departments/[id]] Unexpected error:', error);
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
