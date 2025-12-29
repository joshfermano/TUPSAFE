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
import { openPositions, departments, jobApplications, profiles } from '@tupsafe/database/server';
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

    // 2. Verify user has valid profile using Drizzle (source of truth)
    // Avoids PostgREST/RLS edge cases that can return 0 rows even when profile exists
    const [profile] = await db
      .select({
        userType: profiles.userType,
        isActive: profiles.isActive,
        accountStatus: profiles.accountStatus,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      console.error('[Positions API] Profile not found for user:', user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'User profile not found or invalid.',
        },
        { status: 403 }
      );
    }

    console.log('[Positions API] User profile:', {
      userId: user.id,
      userType: profile.userType,
      isActive: profile.isActive,
      accountStatus: profile.accountStatus,
    });

    // Check if account is active (account_status should be 'active' for applicants and employees)
    if (profile.accountStatus !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: `Account status is ${profile.accountStatus}. ${
            profile.accountStatus === 'pending'
              ? 'Your account is pending approval.'
              : 'Please contact support.'
          }`,
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
    // Parse decimal fields to numbers for consistent frontend handling
    return NextResponse.json(
      {
        success: true,
        data: {
          ...position,
          salaryRangeMin: position.salaryRangeMin ? parseFloat(position.salaryRangeMin) : null,
          salaryRangeMax: position.salaryRangeMax ? parseFloat(position.salaryRangeMax) : null,
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
