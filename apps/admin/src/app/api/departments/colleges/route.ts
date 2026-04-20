/**
 * Colleges List API - GET /api/departments/colleges
 *
 * Provides a list of all active colleges (top-level academic departments)
 * Used by hierarchical department selection dropdowns
 *
 * Features:
 * - Returns all active colleges
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
import { getAllColleges } from '@tupsafe/database/server';

export const dynamic = 'force-dynamic';
/**
 * College list item for API response
 */
export interface CollegeListItem {
  id: string;
  name: string;
  code: string;
}

/**
 * Colleges list response
 */
export interface CollegesListResponse {
  colleges: CollegeListItem[];
}

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[Colleges API] Request received');

    // Verify user is authenticated (any role)
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr', 'employee'], 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('[Colleges API] Fetching colleges');

    // Fetch all active colleges using optimized query
    const queryStartTime = Date.now();
    const colleges = await getAllColleges();

    const queryDuration = Date.now() - queryStartTime;
    console.log(
      `[Colleges API] Query completed in ${queryDuration}ms - ${colleges.length} colleges found`
    );

    // Transform to response format
    const collegesList: CollegeListItem[] = colleges.map((college) => ({
      id: college.id,
      name: college.name,
      code: college.code,
    }));

    // Construct response
    const response: CollegesListResponse = {
      colleges: collegesList,
    };

    const totalDuration = Date.now() - startTime;
    console.log(`[Colleges API] Total request duration: ${totalDuration}ms`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache for 5 minutes - colleges don't change frequently
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[Colleges API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch colleges',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
