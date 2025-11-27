/**
 * Job Applications List API - GET /api/jobs/[id]/applications
 *
 * Retrieves all applications for a specific position with pagination and filtering.
 * Provides comprehensive applicant information including profile and PDS data.
 *
 * Features:
 * - Pagination with configurable page size
 * - Filter by application status
 * - Sort by application date (default: desc)
 * - Include applicant profile info (name, email)
 * - Include PDS submission info if linked
 * - Optimized single-query joins
 *
 * Security:
 * - Requires admin or hr role
 * - Position validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  jobApplications,
  profiles,
  openPositions,
  departments,
} from '@tupsafe/database/server';
import {
  and,
  eq,
  desc,
  asc,
  count,
  sql,
  ilike,
  or,
} from 'drizzle-orm';
import {
  applicationsQuerySchema,
  type JobApplicationListResponse,
  type JobApplicationListItem,
} from '@tupsafe/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    console.log('[Job Applications API] Request received');

    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'hr'], 'admin');

    if (!hasPermission) {
      console.log('[Job Applications API] Permission denied - returning 403');
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get position ID from params
    const { id: positionId } = await params;

    if (!positionId) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    // Validate position exists
    const position = await db
      .select({ id: openPositions.id })
      .from(openPositions)
      .where(eq(openPositions.id, positionId))
      .limit(1);

    if (!position.length) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    console.log('[Job Applications API] Permission granted - fetching applications');

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = applicationsQuerySchema.parse(queryParams);

    console.log('[Job Applications API] Query params:', validatedQuery);

    // Build WHERE conditions
    const conditions = [eq(jobApplications.positionId, positionId)];

    // Status filter
    if (validatedQuery.status !== 'all') {
      conditions.push(eq(jobApplications.status, validatedQuery.status));
    }

    // Search filter - search in applicant name or application number
    if (validatedQuery.search) {
      const searchTerm = `%${validatedQuery.search}%`;
      conditions.push(
        or(
          ilike(jobApplications.applicationNumber, searchTerm),
          ilike(
            sql`CONCAT(${profiles.firstName}, ' ', ${profiles.lastName})`,
            searchTerm
          )
        )!
      );
    }

    const whereClause = and(...conditions);

    // Query 1: Get total count for pagination
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(jobApplications)
      .innerJoin(profiles, eq(jobApplications.applicantId, profiles.id))
      .where(whereClause);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedQuery.limit);
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Determine sort order
    let orderByClause;
    const orderFn = validatedQuery.sortOrder === 'asc' ? asc : desc;

    if (validatedQuery.sortBy === 'applicantName') {
      orderByClause = [orderFn(profiles.lastName), orderFn(profiles.firstName)];
    } else if (validatedQuery.sortBy === 'status') {
      orderByClause = [orderFn(jobApplications.status)];
    } else if (validatedQuery.sortBy === 'reviewedAt') {
      orderByClause = [orderFn(jobApplications.reviewedAt)];
    } else {
      // applicationDate (default)
      orderByClause = [orderFn(jobApplications.applicationDate)];
    }

    // Query 2: Fetch applications with all related data
    const applicationsData = await db
      .select({
        // Application fields
        id: jobApplications.id,
        applicationNumber: jobApplications.applicationNumber,
        status: jobApplications.status,
        applicationDate: jobApplications.applicationDate,
        reviewedAt: jobApplications.reviewedAt,
        interviewDate: jobApplications.interviewDate,

        // Applicant fields
        applicantId: profiles.id,
        applicantApplicantId: profiles.applicantId,
        applicantFirstName: profiles.firstName,
        applicantLastName: profiles.lastName,
        applicantEmail: sql<string>`(SELECT email FROM auth.users WHERE id = ${profiles.id})`,
        applicantPhone: profiles.phoneNumber,

        // Position fields
        positionId: openPositions.id,
        positionTitle: openPositions.positionTitle,
        positionCode: openPositions.positionCode,

        // Department fields
        departmentId: departments.id,
        departmentName: departments.name,

        // Reviewer fields
        reviewerId: sql<string | null>`reviewer.id`,
        reviewerFirstName: sql<string | null>`reviewer.first_name`,
        reviewerLastName: sql<string | null>`reviewer.last_name`,
      })
      .from(jobApplications)
      .innerJoin(profiles, eq(jobApplications.applicantId, profiles.id))
      .innerJoin(openPositions, eq(jobApplications.positionId, openPositions.id))
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .leftJoin(
        sql`profiles AS reviewer`,
        sql`reviewer.id = ${jobApplications.reviewedBy}`
      )
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(validatedQuery.limit)
      .offset(offset);

    // Query 3: Get status counts for pagination metadata
    const statusCounts = await db
      .select({
        status: jobApplications.status,
        count: count(),
      })
      .from(jobApplications)
      .where(eq(jobApplications.positionId, positionId))
      .groupBy(jobApplications.status);

    // Transform to response format
    const applications: JobApplicationListItem[] = applicationsData.map((item) => ({
      id: item.id,
      applicationNumber: item.applicationNumber,
      applicant: {
        id: item.applicantId,
        applicantId: item.applicantApplicantId,
        firstName: item.applicantFirstName,
        lastName: item.applicantLastName,
        email: item.applicantEmail || '',
        phoneNumber: item.applicantPhone,
      },
      position: {
        id: item.positionId,
        positionTitle: item.positionTitle,
        positionCode: item.positionCode,
        department: item.departmentId
          ? {
              id: item.departmentId,
              name: item.departmentName!,
            }
          : null,
      },
      status: item.status!,
      applicationDate: item.applicationDate!,
      reviewedBy: item.reviewerId
        ? {
            id: item.reviewerId,
            firstName: item.reviewerFirstName!,
            lastName: item.reviewerLastName!,
          }
        : null,
      reviewedAt: item.reviewedAt,
      interviewDate: item.interviewDate,
    }));

    // Build status count object
    const statusCountsObj = statusCounts.reduce(
      (acc, { status, count }) => {
        if (status) {
          acc[status] = count;
        }
        return acc;
      },
      {
        pending: 0,
        under_review: 0,
        shortlisted: 0,
        for_interview: 0,
        interviewed: 0,
        for_final_review: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
        hired: 0,
      } as Record<string, number>
    );

    // Construct response
    const response: JobApplicationListResponse = {
      applications,
      pagination: {
        total: totalCount,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalPages,
        pending: statusCountsObj.pending,
        underReview: statusCountsObj.under_review,
        shortlisted: statusCountsObj.shortlisted,
        forInterview: statusCountsObj.for_interview,
        interviewed: statusCountsObj.interviewed,
        forFinalReview: statusCountsObj.for_final_review,
        accepted: statusCountsObj.accepted,
        rejected: statusCountsObj.rejected,
        withdrawn: statusCountsObj.withdrawn,
        hired: statusCountsObj.hired,
      },
    };

    const totalDuration = Date.now() - startTime;
    console.log(
      `[Job Applications API] Total request duration: ${totalDuration}ms`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[Job Applications API] Error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch applications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
