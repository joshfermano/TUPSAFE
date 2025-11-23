/**
 * Departments API Route
 *
 * Comprehensive endpoint for fetching departments, colleges, and administrative offices
 * with authentication, filtering, pagination, and search capabilities.
 *
 * @module api/departments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import {
  getAllDepartments,
  getAllColleges,
  getAdministrativeOffices,
  getDepartmentsByCollege,
  searchDepartments,
  type PaginationOptions,
} from '@tupsafe/database/server';

/**
 * GET /api/departments
 *
 * Get all departments with optional filtering and pagination.
 * Supports multiple query modes for different use cases.
 *
 * @authentication Required - Employee or Applicant
 *
 * @queryparam {string} type - Filter type: 'academic' | 'administrative' | 'all' (default: 'all')
 * @queryparam {string} collegeId - UUID of parent college to filter departments
 * @queryparam {string} search - Search query for department name or code (case-insensitive)
 * @queryparam {number} page - Page number for pagination (default: 1, min: 1)
 * @queryparam {number} limit - Items per page (default: 20, min: 1, max: 100)
 *
 * @returns {object} JSON response with departments and pagination metadata
 *
 * @example
 * // Get all departments
 * GET /api/departments
 *
 * @example
 * // Get colleges only
 * GET /api/departments?type=academic&page=1&limit=50
 *
 * @example
 * // Get departments under specific college
 * GET /api/departments?collegeId=550e8400-e29b-41d4-a716-446655440000
 *
 * @example
 * // Search departments
 * GET /api/departments?search=computer&limit=10
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

    // 2. Verify user has valid profile (employee or applicant)
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
    const type = searchParams.get('type') || 'all';
    const collegeId = searchParams.get('collegeId');
    const searchQuery = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // Validate type parameter
    const validTypes = ['academic', 'administrative', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: `Invalid type parameter. Must be one of: ${validTypes.join(', ')}`
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
            message: 'Invalid college ID format. Must be a valid UUID.'
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

    // 5. Fetch departments based on query parameters
    let departments;
    let totalCount = 0;

    try {
      if (searchQuery && searchQuery.trim().length > 0) {
        // Search mode - searches name and code fields
        departments = await searchDepartments(searchQuery, paginationOptions);
        totalCount = departments.length; // Approximate - search doesn't return total
      } else if (collegeId) {
        // College filter mode - get departments under specific college
        const collegeDepts = await getDepartmentsByCollege(collegeId);
        // Apply manual pagination for college filter
        totalCount = collegeDepts.length;
        const offset = paginationOptions.offset ?? 0;
        const limit = paginationOptions.limit ?? 50;
        departments = collegeDepts.slice(offset, offset + limit);
      } else if (type === 'academic') {
        // Academic departments only (colleges)
        departments = await getAllColleges();
        totalCount = departments.length;
      } else if (type === 'administrative') {
        // Administrative offices only
        departments = await getAdministrativeOffices(paginationOptions);
        totalCount = departments.length; // Approximate
      } else {
        // All departments
        departments = await getAllDepartments(paginationOptions);
        totalCount = departments.length; // Approximate
      }
    } catch (dbError) {
      console.error('[GET /api/departments] Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database Error',
          message: 'Failed to retrieve departments from database.',
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
        data: departments,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        meta: {
          type,
          collegeId: collegeId || null,
          search: searchQuery || null,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 1 hour (departments are relatively static)
          // Allow stale content for 24 hours while revalidating
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    // 8. Handle unexpected errors
    console.error('[GET /api/departments] Unexpected error:', error);
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
