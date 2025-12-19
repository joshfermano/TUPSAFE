/**
 * Public Colleges API Route
 *
 * Unauthenticated endpoint for fetching colleges during registration.
 * Allows applicants and employees to select their college/department
 * before account creation.
 *
 * @module api/public/colleges
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@tupsafe/auth/server';

/**
 * GET /api/public/colleges
 *
 * Get all active colleges (academic departments with no parent).
 * **PUBLIC ENDPOINT** - No authentication required.
 *
 * This endpoint is used during:
 * - Employee registration (college selection)
 * - Applicant registration (college selection)
 * - Any pre-authentication flows
 *
 * @returns {object} JSON response with array of colleges
 *
 * @example
 * // Get all colleges (no auth required)
 * GET /api/public/colleges
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
 *       "isActive": true
 *     }
 *   ]
 * }
 *
 * @throws {500} Internal Server Error - Database or server error
 */
export async function GET() {
  try {
    // Use admin client to bypass RLS for public data access
    const supabase = createAdminClient();

    // Fetch all active colleges (academic departments with no parent)
    const { data: colleges, error: dbError } = await supabase
      .from('departments')
      .select('id, name, code, office_type, is_active')
      .eq('office_type', 'academic')
      .is('parent_college_id', null)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (dbError) {
      console.error('[GET /api/public/colleges] Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to retrieve colleges from database.',
        },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const transformedColleges = colleges?.map((college) => ({
      id: college.id,
      name: college.name,
      code: college.code,
      officeType: college.office_type,
      isActive: college.is_active,
    })) || [];

    // Return successful response with aggressive caching
    // Colleges are very stable data - cache for longer
    return NextResponse.json(
      {
        success: true,
        data: transformedColleges,
      },
      {
        status: 200,
        headers: {
          // Cache for 6 hours (colleges rarely change)
          // Allow stale content for 7 days while revalidating
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=604800',
          // Allow CORS for public endpoint
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error('[GET /api/public/colleges] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your request.',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/public/colleges
 *
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
