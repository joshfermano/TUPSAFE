/**
 * Departments API Route
 * Handles fetching of departments, colleges, and administrative offices
 * Used by registration forms to populate organizational dropdowns
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, departments } from '@tupsafe/database/server';
import { eq, isNull, and, asc } from 'drizzle-orm';

/**
 * GET /api/departments
 *
 * Query Parameters:
 * - type=colleges: Returns all colleges (academic departments without parent)
 * - type=offices: Returns all administrative offices
 * - collegeId=<uuid>: Returns departments under a specific college
 * - No params: Returns all active departments
 *
 * Response Format:
 * {
 *   data: Array<{
 *     id: string;
 *     name: string;
 *     code: string;
 *     officeType: 'academic' | 'administrative';
 *     parentCollegeId: string | null;
 *   }>;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const collegeId = searchParams.get('collegeId');

    let results;

    // Handle different query types
    if (type === 'colleges') {
      // Get all colleges (academic departments without parent)
      results = await db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
          officeType: departments.officeType,
          parentCollegeId: departments.parentCollegeId,
        })
        .from(departments)
        .where(
          and(
            eq(departments.officeType, 'academic'),
            isNull(departments.parentCollegeId),
            eq(departments.isActive, true)
          )
        )
        .orderBy(asc(departments.name));
    } else if (type === 'offices') {
      // Get all administrative offices
      results = await db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
          officeType: departments.officeType,
          parentCollegeId: departments.parentCollegeId,
        })
        .from(departments)
        .where(
          and(
            eq(departments.officeType, 'administrative'),
            eq(departments.isActive, true)
          )
        )
        .orderBy(asc(departments.name));
    } else if (collegeId) {
      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(collegeId)) {
        return NextResponse.json(
          { error: 'Invalid college ID format' },
          { status: 400 }
        );
      }

      // Get departments under a specific college
      results = await db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
          officeType: departments.officeType,
          parentCollegeId: departments.parentCollegeId,
        })
        .from(departments)
        .where(
          and(
            eq(departments.parentCollegeId, collegeId),
            eq(departments.isActive, true)
          )
        )
        .orderBy(asc(departments.name));
    } else {
      // Get all active departments
      results = await db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
          officeType: departments.officeType,
          parentCollegeId: departments.parentCollegeId,
        })
        .from(departments)
        .where(eq(departments.isActive, true))
        .orderBy(asc(departments.name));
    }

    // Add cache headers for performance (data is relatively static)
    return NextResponse.json(
      { data: results },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch departments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
