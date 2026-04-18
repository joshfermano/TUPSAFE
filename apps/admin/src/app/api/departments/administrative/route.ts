/**
 * Administrative Offices API - GET /api/departments/administrative
 *
 * Provides a list of all active administrative offices (non-academic departments)
 * Used by hierarchical department selection dropdowns
 *
 * Features:
 * - Returns all active administrative offices
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
import { getAdministrativeOffices } from '@tupsafe/database/server';

export const dynamic = 'force-dynamic';
/**
 * Administrative office list item for API response
 */
export interface AdministrativeOfficeListItem {
  id: string;
  name: string;
  code: string;
}

/**
 * Administrative offices list response
 */
export interface AdministrativeOfficesResponse {
  offices: AdministrativeOfficeListItem[];
}

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[Administrative Offices API] Request received');

    // Verify user is authenticated (any role)
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr', 'employee'], 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('[Administrative Offices API] Fetching administrative offices');

    // Fetch all active administrative offices using optimized query
    const queryStartTime = Date.now();
    const offices = await getAdministrativeOffices();

    const queryDuration = Date.now() - queryStartTime;
    console.log(
      `[Administrative Offices API] Query completed in ${queryDuration}ms - ${offices.length} offices found`
    );

    // Transform to response format
    const officesList: AdministrativeOfficeListItem[] = offices.map((office) => ({
      id: office.id,
      name: office.name,
      code: office.code,
    }));

    // Construct response
    const response: AdministrativeOfficesResponse = {
      offices: officesList,
    };

    const totalDuration = Date.now() - startTime;
    console.log(`[Administrative Offices API] Total request duration: ${totalDuration}ms`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache for 5 minutes - administrative offices don't change frequently
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[Administrative Offices API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch administrative offices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
