/**
 * Open Positions API Route
 * Handles fetching of available job positions
 * Used by registration forms and job application flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db, openPositions, departments, jobApplications } from '@tupsafe/database/server';
import { eq, and, desc, gte } from 'drizzle-orm';

/**
 * GET /api/positions
 *
 * Query Parameters:
 * - orgId=<uuid>: Filter positions by department/office ID
 * - status=open: Only return active positions (default)
 * - employmentCategory: Filter by employment category
 * - sort: Sort by deadline, salary, or posted date
 * - No params: Returns all open positions
 *
 * Response Format:
 * {
 *   data: Array<{
 *     id: string;
 *     positionTitle: string;
 *     positionCode: string;
 *     departmentId: string;
 *     departmentName: string;
 *     employmentCategory: string;
 *     salaryGrade: string | null;
 *     employmentType: string;
 *     description: string;
 *     qualifications: string[];
 *     responsibilities: string[];
 *     numberOfOpenings: number;
 *     applicationDeadline: string | null;
 *     isFeatured: boolean;
 *     status: 'open' | 'closed' | 'filled' | 'cancelled';
 *     hasApplied?: boolean;
 *     applicationStatus?: string | null;
 *   }>;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status') || 'open';
    const employmentCategoryFilter = searchParams.get('employmentCategory');
    const sortBy = searchParams.get('sort') || 'deadline';

    // Validate UUID format if orgId provided
    if (orgId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orgId)) {
        return NextResponse.json(
          { error: 'Invalid organization ID format' },
          { status: 400 }
        );
      }
    }

    // Validate status enum
    const validStatuses = ['open', 'closed', 'filled', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter. Must be: open, closed, filled, or cancelled' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional for positions endpoint)
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If user is authenticated and an applicant, fetch their applications
    let appliedPositionMap = new Map<string, string>();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profile && profile.user_type === 'applicant') {
        const userApplications = await db
          .select({
            positionId: jobApplications.positionId,
            status: jobApplications.status,
          })
          .from(jobApplications)
          .where(eq(jobApplications.applicantId, user.id));

        appliedPositionMap = new Map(
          userApplications.map((app) => [app.positionId, app.status || ''])
        );
      }
    }

    // Build query conditions
    const conditions = [];
    conditions.push(eq(openPositions.status, status as 'open' | 'closed' | 'filled' | 'cancelled'));
    conditions.push(eq(openPositions.isActive, true));

    // Only show positions with future deadlines for 'open' status
    if (status === 'open') {
      conditions.push(gte(openPositions.applicationDeadline, new Date()));
    }

    if (orgId) {
      conditions.push(eq(openPositions.departmentId, orgId));
    }

    if (employmentCategoryFilter) {
      conditions.push(eq(openPositions.employmentCategory, employmentCategoryFilter as 'faculty' | 'administrative' | 'contractual' | 'not_applicable'));
    }

    // Fetch positions with department information using a join
    const results = await db
      .select({
        id: openPositions.id,
        positionTitle: openPositions.positionTitle,
        positionCode: openPositions.positionCode,
        departmentId: openPositions.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
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
      })
      .from(openPositions)
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .where(and(...conditions))
      .orderBy(
        // Featured positions first
        desc(openPositions.isFeatured),
        // Then apply sorting
        ...(sortBy === 'salary'
          ? [desc(openPositions.salaryRangeMax)]
          : sortBy === 'posted'
          ? [desc(openPositions.postedAt)]
          : [openPositions.applicationDeadline])
      );

    // Transform the response to match expected format
    const transformedResults = results.map((position) => ({
      id: position.id,
      positionTitle: position.positionTitle,
      positionCode: position.positionCode,
      departmentId: position.departmentId || '',
      departmentName: position.departmentName || 'N/A',
      departmentCode: position.departmentCode || '',
      employmentCategory: position.employmentCategory,
      salaryGrade: position.salaryGrade,
      salaryRangeMin: position.salaryRangeMin
        ? parseFloat(position.salaryRangeMin)
        : null,
      salaryRangeMax: position.salaryRangeMax
        ? parseFloat(position.salaryRangeMax)
        : null,
      employmentType: position.employmentType || 'N/A',
      description: position.description,
      qualifications: Array.isArray(position.qualifications)
        ? position.qualifications
        : [],
      responsibilities: Array.isArray(position.responsibilities)
        ? position.responsibilities
        : [],
      requirements: position.requirements || {
        education: [],
        experience: [],
        skills: [],
      },
      numberOfOpenings: position.numberOfOpenings || 1,
      applicationsReceived: position.applicationsReceived || 0,
      applicationDeadline: position.applicationDeadline
        ? position.applicationDeadline.toISOString()
        : null,
      isFeatured: position.isFeatured || false,
      status: position.status,
      postedAt: position.postedAt ? position.postedAt.toISOString() : null,
      updatedAt: position.updatedAt ? position.updatedAt.toISOString() : null,
      // Application status for authenticated applicant
      hasApplied: appliedPositionMap.has(position.id),
      applicationStatus: appliedPositionMap.get(position.id) || null,
    }));

    // Add cache headers for performance
    // Shorter cache time for 'open' positions as deadlines may pass
    const cacheMaxAge = status === 'open' ? 300 : 3600; // 5 min for open, 1 hour for others

    return NextResponse.json(
      { data: transformedResults },
      {
        status: 200,
        headers: {
          'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=600`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch positions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
