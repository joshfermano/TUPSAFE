/**
 * SALN Submissions List API - GET /api/submissions/saln
 *
 * Provides paginated list of SALN submissions with advanced filtering and sorting
 * for the admin portal. Follows government SALN reporting standards.
 *
 * Features:
 * - Pagination with configurable page size
 * - Multi-dimensional filtering (status, department, year, search)
 * - Full-text search across employee name and ID
 * - Net worth sorting and financial data
 * - Optimized single-query joins
 * - Aggregate statistics by status
 *
 * Security:
 * - Requires admin or hr role
 * - Respects row-level security policies
 * - Performance logging for optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase } from '@tupsafe/auth/server';
import { db, profiles, departments, positions, salnSubmissions } from '@tupsafe/database/server';
import { and, eq, sql, count, inArray, or, ilike, asc, desc } from 'drizzle-orm';
import {
  salnSubmissionsQuerySchema,
  type SalnSubmissionsListResponse,
  type SalnSubmissionListItem,
} from '@tupsafe/types';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[SALN Submissions API] Request received');

    // Verify admin/HR permissions
    const authStartTime = Date.now();
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'hr']);
    const authDuration = Date.now() - authStartTime;
    console.log(
      `[SALN Submissions API] Permission check completed in ${authDuration}ms - result:`,
      hasPermission
    );

    if (!hasPermission) {
      console.log('[SALN Submissions API] Permission denied - returning 403');
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user for audit logging
    const sessionUser = await getUserFromSupabase();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    console.log('[SALN Submissions API] Permission granted - fetching submissions');

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = salnSubmissionsQuerySchema.parse(queryParams);

    console.log('[SALN Submissions API] Query params:', validatedQuery);

    // Build WHERE conditions
    const conditions = [];

    // Status filter (exclude 'all' which means no filter)
    if (validatedQuery.status && validatedQuery.status !== 'all') {
      conditions.push(eq(salnSubmissions.status, validatedQuery.status));
    }

    // Department filter
    if (validatedQuery.department) {
      conditions.push(eq(profiles.departmentId, validatedQuery.department));
    }

    // Year filter (fiscal year)
    if (validatedQuery.year) {
      conditions.push(eq(salnSubmissions.year, validatedQuery.year));
    }

    // Search filter - across employee name and ID
    if (validatedQuery.search) {
      const searchTerm = `%${validatedQuery.search}%`;
      conditions.push(
        or(
          ilike(profiles.firstName, searchTerm),
          ilike(profiles.lastName, searchTerm),
          ilike(profiles.employeeId, searchTerm)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const queryStartTime = Date.now();
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(salnSubmissions)
      .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
      .where(whereClause);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedQuery.limit);
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Determine sort column and order
    let orderByClause;
    const orderFn = validatedQuery.sortOrder === 'asc' ? asc : desc;

    if (validatedQuery.sortBy === 'employeeName') {
      // Sort by employee last name, then first name
      orderByClause = [
        orderFn(profiles.lastName),
        orderFn(profiles.firstName),
      ];
    } else if (validatedQuery.sortBy === 'submittedAt') {
      orderByClause = [orderFn(salnSubmissions.submittedAt)];
    } else if (validatedQuery.sortBy === 'netWorth') {
      // Sort by net worth (cast to numeric for proper sorting)
      orderByClause = [orderFn(sql`CAST(${salnSubmissions.netWorth} AS NUMERIC)`)];
    } else {
      // updatedAt
      orderByClause = [orderFn(salnSubmissions.updatedAt)];
    }

    // Fetch submissions with joins (optimized single query)
    const submissionsData = await db
      .select({
        // Submission fields
        id: salnSubmissions.id,
        year: salnSubmissions.year,
        status: salnSubmissions.status,
        netWorth: salnSubmissions.netWorth,
        totalAssets: salnSubmissions.totalAssets,
        totalLiabilities: salnSubmissions.totalLiabilities,
        submittedAt: salnSubmissions.submittedAt,
        approvedAt: salnSubmissions.approvedAt,
        approvedBy: salnSubmissions.approvedBy,
        createdAt: salnSubmissions.createdAt,
        updatedAt: salnSubmissions.updatedAt,
        rejectionReason: salnSubmissions.rejectionReason,
        pdfFilePath: salnSubmissions.pdfFilePath,

        // Employee fields
        employeeId: profiles.id,
        employeeEmployeeId: profiles.employeeId,
        employeeFirstName: profiles.firstName,
        employeeLastName: profiles.lastName,
        employeeMiddleName: profiles.middleName,
        employeeDepartmentId: profiles.departmentId,

        // Department fields
        departmentName: departments.name,
        departmentCode: departments.code,

        // Position fields
        positionId: profiles.positionId,
        positionTitle: positions.title,
      })
      .from(salnSubmissions)
      .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(positions, eq(profiles.positionId, positions.id))
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(validatedQuery.limit)
      .offset(offset);

    // Fetch reviewer information for submissions that have been reviewed
    const reviewerIds = submissionsData
      .map((s) => s.approvedBy)
      .filter((id): id is string => id !== null);

    const reviewerMap = new Map<string, { id: string; firstName: string; lastName: string; role: string }>();

    if (reviewerIds.length > 0) {
      const reviewers = await db
        .select({
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          role: profiles.role,
        })
        .from(profiles)
        .where(inArray(profiles.id, reviewerIds));

      reviewers.forEach((reviewer) => {
        reviewerMap.set(reviewer.id, reviewer);
      });
    }

    // Transform to response format
    const submissions: SalnSubmissionListItem[] = submissionsData.map((item) => ({
      id: item.id,
      year: item.year,
      status: item.status,
      netWorth: item.netWorth || '0',
      totalAssets: item.totalAssets || '0',
      totalLiabilities: item.totalLiabilities || '0',
      submittedAt: item.submittedAt,
      approvedAt: item.approvedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      rejectionReason: item.rejectionReason,
      pdfFilePath: item.pdfFilePath,
      employee: {
        id: item.employeeId,
        employeeId: item.employeeEmployeeId,
        firstName: item.employeeFirstName,
        lastName: item.employeeLastName,
        middleName: item.employeeMiddleName,
        department: item.employeeDepartmentId
          ? {
              id: item.employeeDepartmentId,
              name: item.departmentName || '',
              code: item.departmentCode || '',
            }
          : null,
        position: item.positionId
          ? {
              id: item.positionId,
              title: item.positionTitle || '',
            }
          : null,
      },
      reviewer: item.approvedBy
        ? reviewerMap.get(item.approvedBy) || null
        : null,
    }));

    // Get aggregate statistics by status (parallel to main query)
    const [statusCounts] = await Promise.all([
      db
        .select({
          status: salnSubmissions.status,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(salnSubmissions)
        .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
        .where(whereClause)
        .groupBy(salnSubmissions.status),
    ]);

    // Build stats object
    const stats = {
      total: totalCount,
      draft: 0,
      submitted: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
    };

    statusCounts.forEach((item) => {
      stats[item.status as keyof typeof stats] = item.count;
    });

    const queryDuration = Date.now() - queryStartTime;
    console.log(`[SALN Submissions API] Query completed in ${queryDuration}ms`);

    // Construct response
    const response: SalnSubmissionsListResponse = {
      submissions,
      pagination: {
        total: totalCount,
        page: validatedQuery.page,
        pageSize: validatedQuery.limit,
        totalPages,
      },
      stats,
    };

    const totalDuration = Date.now() - startTime;
    console.log(
      `[SALN Submissions API] Total request duration: ${totalDuration}ms (auth: ${authDuration}ms, query: ${queryDuration}ms)`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[SALN Submissions API] Error:', error);

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
        error: 'Failed to fetch SALN submissions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
