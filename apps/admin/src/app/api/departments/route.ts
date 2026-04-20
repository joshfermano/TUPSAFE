/**
 * Departments List API - GET /api/departments
 *
 * Provides a simple list of all active departments for filtering purposes
 * Used by various admin pages for department selection dropdowns
 *
 * Features:
 * - Returns all active departments
 * - Sorted alphabetically by name
 * - Includes department code for display
 * - Minimal authentication (authenticated users only)
 * - Cached for performance
 *
 * Security:
 * - Requires authenticated user (any role)
 * - No sensitive data exposed
 */

import { NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { db, departments } from '@tupsafe/database/server';
import { eq, asc } from 'drizzle-orm';

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
 * Departments list response
 */
export interface DepartmentsListResponse {
  departments: DepartmentListItem[];
}

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[Departments API] Request received');

    // Verify user is authenticated (any role)
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr', 'employee'], 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('[Departments API] Fetching departments');

    // Fetch all active departments, sorted by name
    const queryStartTime = Date.now();
    const departmentsList = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
      })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(asc(departments.name));

    const queryDuration = Date.now() - queryStartTime;
    console.log(
      `[Departments API] Query completed in ${queryDuration}ms - ${departmentsList.length} departments found`
    );

    // Construct response
    const response: DepartmentsListResponse = {
      departments: departmentsList,
    };

    const totalDuration = Date.now() - startTime;
    console.log(`[Departments API] Total request duration: ${totalDuration}ms`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache for 5 minutes - departments don't change frequently
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[Departments API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch departments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
