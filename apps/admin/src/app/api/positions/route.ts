/**
 * Positions List API - GET /api/positions
 *
 * Provides a simple list of all active positions for form dropdowns
 * Used by various admin pages for position selection
 *
 * Features:
 * - Returns all active positions
 * - Sorted alphabetically by title
 * - Includes department relationship
 * - Minimal authentication (authenticated users only)
 * - Cached for performance
 *
 * Security:
 * - Requires authenticated user (any role)
 * - No sensitive data exposed
 */

import { NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { db, positions } from '@tupsafe/database/server';
import { eq, asc } from 'drizzle-orm';

/**
 * Position list item for API response
 */
export interface PositionListItem {
  id: string;
  title: string;
  departmentId: string | null;
}

/**
 * Positions list response
 */
export interface PositionsListResponse {
  positions: PositionListItem[];
}

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[Positions API] Request received');

    // Verify user is authenticated (any role)
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'hr', 'supervisor', 'employee'], 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('[Positions API] Fetching positions');

    // Fetch all active positions, sorted by title
    const queryStartTime = Date.now();
    const positionsList = await db
      .select({
        id: positions.id,
        title: positions.title,
        departmentId: positions.departmentId,
      })
      .from(positions)
      .where(eq(positions.isActive, true))
      .orderBy(asc(positions.title));

    const queryDuration = Date.now() - queryStartTime;
    console.log(
      `[Positions API] Query completed in ${queryDuration}ms - ${positionsList.length} positions found`
    );

    // Construct response
    const response: PositionsListResponse = {
      positions: positionsList,
    };

    const totalDuration = Date.now() - startTime;
    console.log(`[Positions API] Total request duration: ${totalDuration}ms`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache for 5 minutes - positions don't change frequently
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[Positions API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch positions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
