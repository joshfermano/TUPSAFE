/**
 * Colleges API Route
 *
 * Dedicated endpoint for fetching colleges (top-level academic departments).
 * Optimized for dropdown selections, organizational charts, and navigation menus.
 *
 * @module api/colleges
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { getAllColleges } from '@tupsafe/database/server';

/**
 * GET /api/colleges
 *
 * Get all active colleges (academic departments with no parent).
 * Colleges are top-level academic units (e.g., College of Engineering, College of Science).
 *
 * This endpoint is optimized for:
 * - Registration forms (department selection)
 * - Organizational hierarchy displays
 * - Navigation menus
 * - Department filtering dropdowns
 *
 * @authentication Required - Employee or Applicant
 *
 * @returns {object} JSON response with array of colleges
 *
 * @example
 * // Get all colleges
 * GET /api/colleges
 *
 * // Response format:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "College of Engineering",
 *       "code": "COE",
 *       "officeType": "academic",
 *       "parentCollegeId": null,
 *       "isActive": true,
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "updatedAt": "2024-01-01T00:00:00.000Z"
 *     }
 *   ],
 *   "meta": {
 *     "total": 5,
 *     "cached": true
 *   }
 * }
 *
 * @throws {401} Unauthorized - Missing or invalid authentication
 * @throws {403} Forbidden - User account is inactive
 * @throws {500} Internal Server Error - Database or server error
 */
export async function GET(_request: NextRequest) {
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

    // 3. Fetch colleges from database
    let colleges;
    try {
      colleges = await getAllColleges();
    } catch (dbError) {
      console.error('[GET /api/colleges] Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to retrieve colleges from database.',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // 4. Return successful response with aggressive caching
    // Colleges are very stable data - cache for longer
    return NextResponse.json(
      {
        success: true,
        data: colleges,
        meta: {
          total: colleges.length,
          cached: true,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 6 hours (colleges rarely change)
          // Allow stale content for 7 days while revalidating
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error) {
    // 5. Handle unexpected errors
    console.error('[GET /api/colleges] Unexpected error:', error);
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
