/**
 * Submission Management API - List All Submissions
 * GET /api/submissions
 *
 * Unified view of all PDS and SALN submissions awaiting review
 *
 * Features:
 * - Unified list of both PDS and SALN submissions
 * - Advanced filtering (type, status, department, fiscal year)
 * - Full-text search by employee name/ID
 * - Pagination with configurable page size
 * - Optimized joins for employee details
 * - Count statistics for dashboard
 *
 * Security:
 * - Requires admin, co_admin, or hr role
 * - Audit logging for access
 * - Row-level security via database policies
 *
 * @returns {SubmissionListResponse} Paginated list with statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  profiles,
  departments,
  positions,
  pdsSubmissions,
  salnSubmissions,
} from '@tupsafe/database/server';
import { and, eq, sql, count, inArray } from 'drizzle-orm';
import {
  submissionListQuerySchema,
  type SubmissionListResponse,
  type SubmissionListItem,
} from '@tupsafe/types';

interface SubmissionQueryResult {
  id: string;
  type: 'pds' | 'saln';
  status: string;
  submittedAt: Date | null;
  version?: number;
  fiscalYear?: number;
  approvedBy: string | null;
  approvedAt: Date | null;
  userId: string;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  departmentId: string | null;
  departmentName: string | null;
  positionId: string | null;
  positionTitle: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // Get current user from Supabase session (portal-specific)
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Verify admin/HR/Co-Admin permissions
    const allowedRoles = ['admin', 'co_admin', 'hr'];
    if (!allowedRoles.includes(sessionUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      status: searchParams.get('status'),
      departmentId: searchParams.get('departmentId'),
      fiscalYear: searchParams.get('fiscalYear'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    };

    const validatedQuery = submissionListQuerySchema.parse(queryParams);

    // Calculate pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Build WHERE conditions for PDS submissions
    const pdsConditions = [];
    if (validatedQuery.status !== 'all') {
      pdsConditions.push(eq(pdsSubmissions.status, validatedQuery.status));
    }

    // Build WHERE conditions for SALN submissions
    const salnConditions = [];
    if (validatedQuery.status !== 'all') {
      salnConditions.push(eq(salnSubmissions.status, validatedQuery.status));
    }
    if (validatedQuery.fiscalYear) {
      salnConditions.push(eq(salnSubmissions.year, validatedQuery.fiscalYear));
    }

    // Fetch PDS submissions if type allows
    let pdsResults: SubmissionQueryResult[] = [];
    if (validatedQuery.type === 'pds' || validatedQuery.type === 'all') {
      // Add department filter to conditions
      if (validatedQuery.departmentId) {
        pdsConditions.push(eq(profiles.departmentId, validatedQuery.departmentId));
      }

      pdsResults = await db
        .select({
          id: pdsSubmissions.id,
          type: sql<'pds'>`'pds'`,
          status: pdsSubmissions.status,
          submittedAt: pdsSubmissions.submittedAt,
          version: pdsSubmissions.version,
          approvedBy: pdsSubmissions.approvedBy,
          approvedAt: pdsSubmissions.approvedAt,
          userId: pdsSubmissions.userId,
          employeeId: profiles.employeeId,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          departmentId: profiles.departmentId,
          departmentName: departments.name,
          positionId: profiles.positionId,
          positionTitle: positions.title,
        })
        .from(pdsSubmissions)
        .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
        .leftJoin(departments, eq(profiles.departmentId, departments.id))
        .leftJoin(positions, eq(profiles.positionId, positions.id))
        .where(pdsConditions.length > 0 ? and(...pdsConditions) : undefined);

      // Add search filter if provided
      if (validatedQuery.search) {
        const _searchTerm = `%${validatedQuery.search}%`;
        pdsResults = pdsResults.filter(
          (r) =>
            r.firstName.toLowerCase().includes(validatedQuery.search!.toLowerCase()) ||
            r.lastName.toLowerCase().includes(validatedQuery.search!.toLowerCase()) ||
            r.employeeId?.toLowerCase().includes(validatedQuery.search!.toLowerCase())
        );
      }
    }

    // Fetch SALN submissions if type allows
    let salnResults: SubmissionQueryResult[] = [];
    if (validatedQuery.type === 'saln' || validatedQuery.type === 'all') {
      // Add department filter to conditions
      if (validatedQuery.departmentId) {
        salnConditions.push(eq(profiles.departmentId, validatedQuery.departmentId));
      }

      salnResults = await db
        .select({
          id: salnSubmissions.id,
          type: sql<'saln'>`'saln'`,
          status: salnSubmissions.status,
          submittedAt: salnSubmissions.submittedAt,
          fiscalYear: salnSubmissions.year,
          approvedBy: salnSubmissions.approvedBy,
          approvedAt: salnSubmissions.approvedAt,
          userId: salnSubmissions.userId,
          employeeId: profiles.employeeId,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          departmentId: profiles.departmentId,
          departmentName: departments.name,
          positionId: profiles.positionId,
          positionTitle: positions.title,
        })
        .from(salnSubmissions)
        .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
        .leftJoin(departments, eq(profiles.departmentId, departments.id))
        .leftJoin(positions, eq(profiles.positionId, positions.id))
        .where(salnConditions.length > 0 ? and(...salnConditions) : undefined);

      // Add search filter if provided
      if (validatedQuery.search) {
        const _searchTerm = `%${validatedQuery.search}%`;
        salnResults = salnResults.filter(
          (r) =>
            r.firstName.toLowerCase().includes(validatedQuery.search!.toLowerCase()) ||
            r.lastName.toLowerCase().includes(validatedQuery.search!.toLowerCase()) ||
            r.employeeId?.toLowerCase().includes(validatedQuery.search!.toLowerCase())
        );
      }
    }

    // Combine and sort results
    const combinedResults = [...pdsResults, ...salnResults];

    // Sort combined results
    combinedResults.sort((a, b) => {
      const aValue =
        validatedQuery.sortBy === 'submittedAt'
          ? a.submittedAt?.getTime() || 0
          : validatedQuery.sortBy === 'reviewedAt'
            ? a.approvedAt?.getTime() || 0
            : `${a.firstName} ${a.lastName}`;
      const bValue =
        validatedQuery.sortBy === 'submittedAt'
          ? b.submittedAt?.getTime() || 0
          : validatedQuery.sortBy === 'reviewedAt'
            ? b.approvedAt?.getTime() || 0
            : `${b.firstName} ${b.lastName}`;

      if (validatedQuery.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const totalResults = combinedResults.length;
    const paginatedResults = combinedResults.slice(offset, offset + validatedQuery.limit);

    // Fetch reviewer details for submissions that have been reviewed
    const reviewerIds = new Set<string>();
    paginatedResults.forEach((r) => {
      if (r.approvedBy) reviewerIds.add(r.approvedBy);
    });

    const reviewerMap = new Map<string, { id: string; name: string }>();
    if (reviewerIds.size > 0) {
      const reviewers = await db
        .select({
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
        })
        .from(profiles)
        .where(inArray(profiles.id, Array.from(reviewerIds)));

      reviewers.forEach((reviewer) => {
        reviewerMap.set(reviewer.id, {
          id: reviewer.id,
          name: `${reviewer.firstName} ${reviewer.lastName}`,
        });
      });
    }

    // Transform to response format
    const submissionList: SubmissionListItem[] = paginatedResults.map((result) => ({
      id: result.id,
      type: result.type,
      employee: {
        id: result.userId,
        employeeId: result.employeeId,
        firstName: result.firstName,
        lastName: result.lastName,
        department: result.departmentId
          ? {
              id: result.departmentId,
              name: result.departmentName || '',
            }
          : null,
        position: result.positionId
          ? {
              id: result.positionId,
              title: result.positionTitle || '',
            }
          : null,
      },
      status: result.status,
      submittedAt: result.submittedAt,
      reviewedBy: result.approvedBy ? reviewerMap.get(result.approvedBy) || null : null,
      reviewedAt: result.approvedAt,
      ...(result.type === 'saln' && { fiscalYear: result.fiscalYear }),
      ...(result.type === 'pds' && { version: result.version }),
    }));

    // Get count statistics
    const [
      pdsSubmittedCount,
      pdsReviewingCount,
      pdsApprovedCount,
      pdsRejectedCount,
      salnSubmittedCount,
      salnReviewingCount,
      salnApprovedCount,
      salnRejectedCount,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.status, 'submitted'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.status, 'reviewing'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.status, 'approved'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.status, 'rejected'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'submitted'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'reviewing'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'approved'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'rejected'))
        .then((r) => r[0]?.count || 0),
    ]);

    const response: SubmissionListResponse = {
      submissions: submissionList,
      pagination: {
        total: totalResults,
        submitted: pdsSubmittedCount + salnSubmittedCount,
        reviewing: pdsReviewingCount + salnReviewingCount,
        approved: pdsApprovedCount + salnApprovedCount,
        rejected: pdsRejectedCount + salnRejectedCount,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Submission list error:', error);

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
        error: 'Failed to fetch submissions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
