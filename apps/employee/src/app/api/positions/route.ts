/**
 * Open Positions API Route
 * GET /api/positions
 *
 * Fetches open job positions for applicants with filtering and sorting.
 * This endpoint returns job openings (from openPositions table), not organizational positions.
 *
 * @module api/positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { openPositions, departments, jobApplications, profiles } from '@tupsafe/database/server';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';

/**
 * GET /api/positions
 *
 * Get open job positions with optional filtering and sorting.
 * Returns positions that are actively recruiting (status='open').
 *
 * @authentication Required - Employee or Applicant
 *
 * @queryparam {string} status - Filter by status (default: 'open')
 * @queryparam {string} orgId - Filter by department/organization ID
 * @queryparam {string} employmentCategory - Filter by employment category (faculty, administrative, contractual)
 * @queryparam {string} sort - Sort order: deadline, salary, posted (default: deadline)
 *
 * @returns {object} JSON response with open positions
 *
 * @example
 * // Get all open positions
 * GET /api/positions?status=open
 *
 * @example
 * // Get open faculty positions sorted by deadline
 * GET /api/positions?status=open&employmentCategory=faculty&sort=deadline
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

    // 3. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = (searchParams.get('status') || 'open') as 'open' | 'closed' | 'filled' | 'cancelled';
    const orgId = searchParams.get('orgId');
    const employmentCategory = searchParams.get('employmentCategory') as 'faculty' | 'administrative' | 'contractual' | 'not_applicable' | null;
    const sortBy = searchParams.get('sort') || 'deadline';

    // 4. Build WHERE conditions
    const conditions = [eq(openPositions.status, statusFilter)];

    if (orgId) {
      conditions.push(eq(openPositions.departmentId, orgId));
    }

    if (employmentCategory && ['faculty', 'administrative', 'contractual', 'not_applicable'].includes(employmentCategory)) {
      conditions.push(eq(openPositions.employmentCategory, employmentCategory));
    }

    // 5. Determine sort order
    let orderByClause;
    switch (sortBy) {
      case 'salary':
        orderByClause = desc(openPositions.salaryRangeMax);
        break;
      case 'posted':
        orderByClause = desc(openPositions.postedAt);
        break;
      case 'deadline':
      default:
        orderByClause = asc(openPositions.applicationDeadline);
        break;
    }

    // 6. Fetch positions with department details
    const positionsQuery = await db
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
        updatedAt: openPositions.updatedAt,
        // Department fields
        departmentName: departments.name,
        departmentCode: departments.code,
      })
      .from(openPositions)
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .where(and(...conditions))
      .orderBy(orderByClause);

    // 7. Optimized: Fetch all user's applications for these positions in ONE query (no N+1)
    const positionIds = positionsQuery.map((p) => p.id);
    
    // Create a map of positionId -> application status
    const applicationStatusMap = new Map<string, { id: string; status: string | null }>();
    
    if (positionIds.length > 0) {
      const userApplications = await db
        .select({
          id: jobApplications.id,
          positionId: jobApplications.positionId,
          status: jobApplications.status,
        })
        .from(jobApplications)
        .where(
          and(
            eq(jobApplications.applicantId, user.id),
            inArray(jobApplications.positionId, positionIds)
          )
        );
      
      // Map applications by position ID
      for (const app of userApplications) {
        applicationStatusMap.set(app.positionId, {
          id: app.id,
          status: app.status,
        });
      }
    }

    // 8. Merge positions with application status (in-memory, no additional queries)
    // Also parse decimal fields to numbers for consistent frontend handling
    const positionsWithStatus = positionsQuery.map((position) => {
      const application = applicationStatusMap.get(position.id);
      return {
        ...position,
        // Parse decimal strings to numbers for consistent frontend handling
        salaryRangeMin: position.salaryRangeMin ? parseFloat(position.salaryRangeMin) : null,
        salaryRangeMax: position.salaryRangeMax ? parseFloat(position.salaryRangeMax) : null,
        hasApplied: !!application,
        applicationStatus: application?.status || null,
      };
    });

    // 9. Return successful response
    return NextResponse.json(
      {
        success: true,
        data: positionsWithStatus,
        total: positionsWithStatus.length,
        filters: {
          status: statusFilter,
          orgId: orgId || null,
          employmentCategory: employmentCategory || null,
          sort: sortBy,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 3 minutes (positions change frequently during recruitment)
          'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/positions] Unexpected error:', error);
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
