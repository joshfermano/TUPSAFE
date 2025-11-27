/**
 * Position Details API Route
 * GET /api/positions/[id]
 *
 * Fetches detailed information about a specific open position including:
 * - Position details (title, code, description, requirements)
 * - Department information
 * - Employment details (category, salary range, openings)
 * - Application status for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { openPositions, departments, jobApplications } from '@tupsafe/database/server';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/positions/[id]
 * Get detailed information about a specific open position
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
          message: 'Authentication required. Please log in to access this resource.',
        },
        { status: 401 }
      );
    }

    // 2. Verify user has valid profile
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
          message: 'User profile not found or invalid.',
        },
        { status: 403 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Account is not active. Please contact support.',
        },
        { status: 403 }
      );
    }

    // 3. Fetch position with department details
    const positionQuery = await db
      .select({
        // Position fields
        id: openPositions.id,
        positionTitle: openPositions.positionTitle,
        positionCode: openPositions.positionCode,
        departmentId: openPositions.departmentId,
        employmentCategory: openPositions.employmentCategory,
        salaryGrade: openPositions.salaryGrade,
        salaryRangeMin: openPositions.salaryRangeMin,
        salaryRangeMax: openPositions.salaryRangeMax,
        employmentType: openPositions.employmentType,
        description: openPositions.description,
        qualifications: openPositions.qualifications,
        responsibilities: openPositions.responsibilities,
        requirements: openPositions.requirements,
        numberOfOpenings: openPositions.numberOfOpenings,
        applicationsReceived: openPositions.applicationsReceived,
        applicationDeadline: openPositions.applicationDeadline,
        isFeatured: openPositions.isFeatured,
        status: openPositions.status,
        postedAt: openPositions.postedAt,
        // Department fields
        departmentName: departments.name,
        departmentCode: departments.code,
      })
      .from(openPositions)
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .where(and(eq(openPositions.id, id), eq(openPositions.status, 'open')))
      .limit(1);

    if (positionQuery.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Position not found or no longer accepting applications.',
        },
        { status: 404 }
      );
    }

    const position = positionQuery[0];

    // 4. Check if user has already applied
    const applicationQuery = await db
      .select({
        id: jobApplications.id,
        status: jobApplications.status,
        applicationDate: jobApplications.applicationDate,
      })
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.applicantId, user.id),
          eq(jobApplications.positionId, id)
        )
      )
      .limit(1);

    const hasApplied = applicationQuery.length > 0;
    const applicationStatus = hasApplied ? applicationQuery[0].status : null;

    // 5. Calculate days until deadline
    const daysUntilDeadline = Math.ceil(
      (new Date(position.applicationDeadline).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // 6. Return position details with application status
    return NextResponse.json(
      {
        success: true,
        data: {
          ...position,
          hasApplied,
          applicationStatus,
          daysUntilDeadline,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 5 minutes (positions change frequently during recruitment)
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/positions/[id]] Unexpected error:', error);
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
