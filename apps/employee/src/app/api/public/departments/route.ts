/**
 * Public Departments API Route
 *
 * Unauthenticated endpoint for fetching departments and administrative offices
 * during registration. Allows applicants and employees to select their
 * department/office before account creation.
 *
 * @module api/public/departments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@tupsafe/auth/server';

/**
 * GET /api/public/departments
 *
 * Get departments and offices without authentication.
 * **PUBLIC ENDPOINT** - No authentication required.
 *
 * This endpoint is used during:
 * - Employee registration (department/office selection)
 * - Applicant registration (department selection)
 * - Any pre-authentication flows
 *
 * @queryparam {string} type - Filter type: 'academic' | 'administrative' | 'all' (default: 'all')
 * @queryparam {string} collegeId - UUID of parent college to filter departments
 *
 * @returns {object} JSON response with departments
 *
 * @example
 * // Get administrative offices (no auth required)
 * GET /api/public/departments?type=administrative
 *
 * @example
 * // Get departments under specific college
 * GET /api/public/departments?collegeId=550e8400-e29b-41d4-a716-446655440000
 *
 * @throws {400} Bad Request - Invalid query parameters
 * @throws {500} Internal Server Error - Database or server error
 */
export async function GET(request: NextRequest) {
  try {
    // Use admin client to bypass RLS for public data access
    const supabase = createAdminClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';
    const collegeId = searchParams.get('collegeId');

    // Validate type parameter
    const validTypes = ['academic', 'administrative', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: `Invalid type parameter. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate collegeId format if provided
    if (collegeId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(collegeId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Bad Request',
            message: 'Invalid college ID format. Must be a valid UUID.',
          },
          { status: 400 }
        );
      }
    }

    // Build query based on parameters
    let query = supabase
      .from('departments')
      .select('id, name, code, office_type, parent_college_id, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Apply filters
    if (collegeId) {
      // Get departments under specific college
      query = query.eq('parent_college_id', collegeId);
    } else if (type === 'academic') {
      // Get colleges only (academic departments with no parent)
      query = query.eq('office_type', 'academic').is('parent_college_id', null);
    } else if (type === 'administrative') {
      // Get administrative offices only
      query = query.eq('office_type', 'administrative');
    }
    // If type === 'all', no additional filters needed

    const { data: departments, error: dbError } = await query;

    if (dbError) {
      console.error('[GET /api/public/departments] Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to retrieve departments from database.',
        },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const transformedDepartments = departments?.map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      officeType: dept.office_type,
      parentCollegeId: dept.parent_college_id,
      isActive: dept.is_active,
    })) || [];

    // Return successful response with caching
    return NextResponse.json(
      {
        success: true,
        data: transformedDepartments,
      },
      {
        status: 200,
        headers: {
          // Cache for 1 hour (departments are relatively static)
          // Allow stale content for 24 hours while revalidating
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          // Allow CORS for public endpoint
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error('[GET /api/public/departments] Unexpected error:', error);
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
 * OPTIONS /api/public/departments
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
