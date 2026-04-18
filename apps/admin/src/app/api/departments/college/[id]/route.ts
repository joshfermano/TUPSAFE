/**
 * College Departments API - GET /api/departments/college/[id]
 *
 * Provides a list of all active departments under a specific college
 * Used by hierarchical department selection dropdowns
 *
 * Features:
 * - Returns all active departments for a given college
 * - Sorted alphabetically by name
 * - Includes department code for display
 * - Minimal authentication (authenticated users only)
 * - Cached for performance
 *
 * Security:
 * - Requires authenticated user with admin/hr/supervisor/employee role
 * - No sensitive data exposed
 */

import { NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { getDepartmentsByCollege } from '@tupsafe/database/server';

export const dynamic = 'force-dynamic';
/**
 * Department list item for API response
 */
export interface DepartmentListItem {
  id: string;
  name: string;
  code: string;
}

/**
 * College departments list response
 */
export interface CollegeDepartmentsResponse {
  departments: DepartmentListItem[];
  collegeId: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    // Await params as per Next.js 15 requirements
    const { id: collegeId } = await params;

    console.log(`[College Departments API] Request received for college: ${collegeId}`);

    // Verify user is authenticated (any role)
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr', 'employee'], 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Validate college ID format
    if (!collegeId || typeof collegeId !== 'string') {
      return NextResponse.json(
        { error: 'Valid college ID is required' },
        { status: 400 }
      );
    }

    console.log(`[College Departments API] Fetching departments for college: ${collegeId}`);

    // Fetch all active departments under this college using optimized query
    const queryStartTime = Date.now();
    const departments = await getDepartmentsByCollege(collegeId);

    const queryDuration = Date.now() - queryStartTime;
    console.log(
      `[College Departments API] Query completed in ${queryDuration}ms - ${departments.length} departments found`
    );

    // Transform to response format
    const departmentsList: DepartmentListItem[] = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
    }));

    // Construct response
    const response: CollegeDepartmentsResponse = {
      departments: departmentsList,
      collegeId,
    };

    const totalDuration = Date.now() - startTime;
    console.log(`[College Departments API] Total request duration: ${totalDuration}ms`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache for 5 minutes - departments don't change frequently
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[College Departments API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch departments for college',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
