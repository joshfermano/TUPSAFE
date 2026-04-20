/**
 * Jobs Management API - List and Create Job Positions
 * GET /api/jobs
 * POST /api/jobs
 *
 * Provides comprehensive job position management for HR/Admin users
 *
 * GET Features:
 * - Pagination with configurable page size
 * - Advanced filtering (status, department, employment category, search, featured)
 * - Flexible sorting (title, deadline, posted date, applications count)
 * - Department name resolution with optimized joins
 * - Aggregate statistics by position status
 *
 * POST Features:
 * - Create new job positions with full validation
 * - Auto-generate unique position codes
 * - Set poster information automatically
 * - Comprehensive audit logging
 *
 * Security:
 * - Requires admin or hr role
 * - Respects row-level security policies
 * - Complete audit trail for sensitive operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db, openPositions, departments, profiles, auditLogs } from '@tupsafe/database/server';
import { and, eq, sql, count, or, ilike, asc, desc } from 'drizzle-orm';
import {
  jobsQuerySchema,
  createOpenPositionSchema,
  type OpenPositionListResponse,
  type OpenPositionListItem,
  type CreateOpenPositionData,
} from '@tupsafe/types/admin/jobs';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs
 * List all job positions with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = jobsQuerySchema.parse(queryParams);

    // Build WHERE conditions
    const conditions = [];

    // Status filter
    // When 'all' is selected, exclude cancelled positions by default
    // Cancelled positions should only appear when explicitly filtered
    if (validatedQuery.status === 'all') {
      // Exclude cancelled positions from "All Status" view
      conditions.push(sql`${openPositions.status} != 'cancelled'`);
    } else {
      conditions.push(eq(openPositions.status, validatedQuery.status));
    }

    // Department filter
    if (validatedQuery.departmentId) {
      conditions.push(eq(openPositions.departmentId, validatedQuery.departmentId));
    }

    // Employment category filter
    if (validatedQuery.employmentCategory !== 'all') {
      conditions.push(eq(openPositions.employmentCategory, validatedQuery.employmentCategory));
    }

    // Featured filter
    if (validatedQuery.isFeatured !== undefined) {
      conditions.push(eq(openPositions.isFeatured, validatedQuery.isFeatured));
    }

    // Search filter - position title or code
    if (validatedQuery.search) {
      const searchTerm = `%${validatedQuery.search}%`;
      conditions.push(
        or(
          ilike(openPositions.positionTitle, searchTerm),
          ilike(openPositions.positionCode, searchTerm)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(openPositions)
      .where(whereClause);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedQuery.limit);
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Determine sort column and order
    const sortColumn = {
      positionTitle: openPositions.positionTitle,
      applicationDeadline: openPositions.applicationDeadline,
      postedAt: openPositions.postedAt,
      applicationsReceived: openPositions.applicationsReceived,
    }[validatedQuery.sortBy];

    const orderFn = validatedQuery.sortOrder === 'asc' ? asc : desc;

    // Fetch positions with joins (optimized single query)
    const positions = await db
      .select({
        id: openPositions.id,
        positionTitle: openPositions.positionTitle,
        positionCode: openPositions.positionCode,
        departmentId: openPositions.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        employmentCategory: openPositions.employmentCategory,
        status: openPositions.status,
        applicationDeadline: openPositions.applicationDeadline,
        numberOfOpenings: openPositions.numberOfOpenings,
        applicationsReceived: openPositions.applicationsReceived,
        isFeatured: openPositions.isFeatured,
        postedAt: openPositions.postedAt,
        postedBy: openPositions.postedBy,
        postedByFirstName: profiles.firstName,
        postedByLastName: profiles.lastName,
      })
      .from(openPositions)
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .leftJoin(profiles, eq(openPositions.postedBy, profiles.id))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(validatedQuery.limit)
      .offset(offset);

    // Transform to response format
    const positionList: OpenPositionListItem[] = positions.map((position) => ({
      id: position.id,
      positionTitle: position.positionTitle,
      positionCode: position.positionCode,
      department: position.departmentId
        ? {
            id: position.departmentId,
            name: position.departmentName || '',
            code: position.departmentCode || '',
          }
        : null,
      employmentCategory: position.employmentCategory,
      status: position.status || 'open',
      applicationDeadline: position.applicationDeadline,
      numberOfOpenings: position.numberOfOpenings || 1,
      applicationsReceived: position.applicationsReceived || 0,
      isFeatured: position.isFeatured || false,
      postedAt: position.postedAt,
      postedBy: position.postedBy
        ? {
            id: position.postedBy,
            firstName: position.postedByFirstName || '',
            lastName: position.postedByLastName || '',
          }
        : null,
    }));

    // Get aggregate counts by status (for filter statistics)
    const statusCounts = await db
      .select({
        status: openPositions.status,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(openPositions)
      .groupBy(openPositions.status);

    // Build status count map with defaults
    const statusCountMap = {
      open: 0,
      closed: 0,
      filled: 0,
      cancelled: 0,
    };

    statusCounts.forEach((sc) => {
      if (sc.status && sc.status in statusCountMap) {
        statusCountMap[sc.status as keyof typeof statusCountMap] = sc.count;
      }
    });

    const response: OpenPositionListResponse = {
      positions: positionList,
      pagination: {
        total: totalCount,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalPages,
        ...statusCountMap,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Jobs list error:', error);

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
        error: 'Failed to fetch job positions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Create a new job position
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user from Supabase session
    const supabase = await createServerClient('admin');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData: CreateOpenPositionData = createOpenPositionSchema.parse(body);

    // Generate unique position code if not provided or ensure uniqueness
    const positionCode = validatedData.positionCode;

    // Check if position code already exists
    const existingPosition = await db
      .select({ id: openPositions.id })
      .from(openPositions)
      .where(eq(openPositions.positionCode, positionCode))
      .limit(1);

    if (existingPosition.length > 0) {
      return NextResponse.json(
        { error: 'Position code already exists. Please use a unique code.' },
        { status: 409 }
      );
    }

    // Verify department exists
    const [department] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, validatedData.departmentId))
      .limit(1);

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Create the job position
    const [newPosition] = await db
      .insert(openPositions)
      .values({
        positionTitle: validatedData.positionTitle,
        positionCode: positionCode,
        departmentId: validatedData.departmentId,
        employmentCategory: validatedData.employmentCategory,
        description: validatedData.description,
        qualifications: validatedData.qualifications,
        responsibilities: validatedData.responsibilities,
        requirements: validatedData.requirements,
        salaryGrade: validatedData.salaryGrade || null,
        salaryRangeMin: validatedData.salaryRangeMin?.toString() || null,
        salaryRangeMax: validatedData.salaryRangeMax?.toString() || null,
        employmentType: validatedData.employmentType || null,
        status: 'open',
        applicationDeadline: validatedData.applicationDeadline,
        numberOfOpenings: validatedData.numberOfOpenings,
        applicationsReceived: 0,
        isActive: true,
        isFeatured: validatedData.isFeatured,
        postedBy: user.id,
        postedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Get client IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit log entry
    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'create_position',
      entityType: 'open_positions',
      entityId: newPosition.id,
      changes: {
        positionTitle: validatedData.positionTitle,
        positionCode: positionCode,
        departmentId: validatedData.departmentId,
        employmentCategory: validatedData.employmentCategory,
        status: 'open',
        applicationDeadline: validatedData.applicationDeadline.toISOString(),
        numberOfOpenings: validatedData.numberOfOpenings,
        isFeatured: validatedData.isFeatured,
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Fetch the created position with department details
    const [createdPosition] = await db
      .select({
        id: openPositions.id,
        positionTitle: openPositions.positionTitle,
        positionCode: openPositions.positionCode,
        departmentId: openPositions.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        employmentCategory: openPositions.employmentCategory,
        description: openPositions.description,
        qualifications: openPositions.qualifications,
        responsibilities: openPositions.responsibilities,
        requirements: openPositions.requirements,
        salaryGrade: openPositions.salaryGrade,
        salaryRangeMin: openPositions.salaryRangeMin,
        salaryRangeMax: openPositions.salaryRangeMax,
        employmentType: openPositions.employmentType,
        status: openPositions.status,
        applicationDeadline: openPositions.applicationDeadline,
        numberOfOpenings: openPositions.numberOfOpenings,
        applicationsReceived: openPositions.applicationsReceived,
        isActive: openPositions.isActive,
        isFeatured: openPositions.isFeatured,
        postedAt: openPositions.postedAt,
        updatedAt: openPositions.updatedAt,
      })
      .from(openPositions)
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .where(eq(openPositions.id, newPosition.id))
      .limit(1);

    return NextResponse.json(
      {
        message: 'Job position created successfully',
        position: {
          ...createdPosition,
          department: createdPosition.departmentId
            ? {
                id: createdPosition.departmentId,
                name: createdPosition.departmentName || '',
                code: createdPosition.departmentCode || '',
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create job position error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Position code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create job position',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
