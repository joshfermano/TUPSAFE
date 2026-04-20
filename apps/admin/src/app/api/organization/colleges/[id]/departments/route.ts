/**
 * College Departments API - List Departments Under a College
 * GET /api/organization/colleges/[id]/departments
 *
 * Features:
 * - Lists all departments belonging to a specific college
 * - Includes comprehensive statistics for each department
 * - Returns parent college information
 * - Supports inactive department filtering
 *
 * Security:
 * - Requires admin, hr, or supervisor role
 * - RLS enforcement at database level
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  departments,
  profiles,
  positions,
  getDepartmentsByCollege,
} from '@tupsafe/database/server';
import { and, eq, sql } from 'drizzle-orm';
import type { DepartmentWithStats } from '@tupsafe/types';

export const dynamic = 'force-dynamic';
/**
 * GET /api/organization/colleges/[id]/departments
 * Get all departments under a specific college with statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin/HR/supervisor permissions
    const hasPermission = await checkUserRoleFromSupabase(
      ['superadmin', 'admin', 'hr'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, HR, or Supervisor role required.' },
        { status: 403 }
      );
    }

    // Validate college ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid college ID' },
        { status: 400 }
      );
    }

    // Verify college exists and is actually a college
    const [college] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!college) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    // Verify this is actually a college (academic, no parent)
    if (college.officeType !== 'academic' || college.parentCollegeId) {
      return NextResponse.json(
        {
          error: 'Invalid college ID',
          details: 'The specified ID does not reference a college (must be academic with no parent)',
        },
        { status: 400 }
      );
    }

    // Fetch departments under this college
    const depts = await getDepartmentsByCollege(id);

    // Fetch statistics for each department in parallel
    const departmentsWithStats: DepartmentWithStats[] = await Promise.all(
      depts.map(async (dept) => {
        const [employeesResult, positionsResult] = await Promise.all([
          // Count active employees
          db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(profiles)
            .where(and(eq(profiles.departmentId, dept.id), eq(profiles.isActive, true))),

          // Count active positions
          db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(positions)
            .where(and(eq(positions.departmentId, dept.id), eq(positions.isActive, true))),
        ]);

        return {
          ...dept,
          employeeCount: employeesResult[0]?.count ?? 0,
          positionCount: positionsResult[0]?.count ?? 0,
          parentCollege: college,
        };
      })
    );

    // Set cache headers (5 minutes)
    return NextResponse.json(departmentsWithStats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('College departments fetch error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch college departments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
