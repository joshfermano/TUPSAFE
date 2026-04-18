/**
 * Position Management API - List and Create Positions
 * GET /api/positions - List positions with pagination, filtering, and search
 * POST /api/positions - Create a new position
 *
 * Features:
 * - Department-based filtering
 * - Search by title (case-insensitive)
 * - Include inactive positions option
 * - Sorting by title, gradeLevel, or createdAt
 * - Pagination support
 * - Full department information in response
 * - Role-based authorization
 *
 * Security:
 * - Requires admin, hr, or supervisor role for viewing
 * - Requires admin or hr role for creating
 * - Audit logging for all create operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  positions,
  departments,
  createPosition,
  createAuditLogFromRequest,
} from '@tupsafe/database/server';
import { and, eq, ilike, sql, asc, desc } from 'drizzle-orm';
import {
  positionQuerySchema,
  createPositionSchema,
  type PositionListResponse,
  type PositionWithDepartment,
} from '@tupsafe/types';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';
/**
 * GET /api/positions
 * List positions with filtering, search, and sorting
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    const query = positionQuerySchema.parse(queryParams);

    // Build WHERE conditions
    const conditions = [];

    // Active status filter
    if (!query.includeInactive) {
      conditions.push(eq(positions.isActive, true));
    }

    // Department filter
    if (query.departmentId) {
      conditions.push(eq(positions.departmentId, query.departmentId));
    }

    // Search filter - title only (case-insensitive)
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(ilike(positions.title, searchTerm));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(positions)
      .where(whereClause);

    // Determine sort column and order with defensive fallbacks
    const sortBy = query.sortBy ?? 'title';
    const sortOrder = query.sortOrder ?? 'asc';
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const sortColumnMap = {
      title: positions.title,
      gradeLevel: positions.gradeLevel,
      createdAt: positions.createdAt,
    } as const;

    const sortColumn = sortColumnMap[sortBy] ?? positions.title;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Fetch positions with department information
    const results = await db
      .select({
        id: positions.id,
        title: positions.title,
        gradeLevel: positions.gradeLevel,
        departmentId: positions.departmentId,
        isActive: positions.isActive,
        createdAt: positions.createdAt,
        departmentName: departments.name,
        departmentCode: departments.code,
      })
      .from(positions)
      .leftJoin(departments, eq(positions.departmentId, departments.id))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset((page - 1) * limit);

    // Transform to PositionWithDepartment format
    const positionsWithDepartment: PositionWithDepartment[] = results.map((row) => ({
      id: row.id,
      title: row.title,
      gradeLevel: row.gradeLevel,
      departmentId: row.departmentId,
      isActive: row.isActive,
      createdAt: row.createdAt,
      department: row.departmentId
        ? {
            id: row.departmentId,
            name: row.departmentName!,
            code: row.departmentCode!,
          }
        : null,
    }));

    const response: PositionListResponse = {
      positions: positionsWithDepartment,
      pagination: {
        total: total || 0,
        page,
        pageSize: limit,
        totalPages: Math.ceil((total || 0) / limit),
      },
    };

    // Set cache headers (5 minutes)
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Position list error:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch positions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/positions
 * Create a new position
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization - admin or hr only
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user for audit logging
    const currentUser = await getUserFromSupabase('admin');

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Failed to retrieve user information' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPositionSchema.parse(body);

    // Validate department exists and is active if provided
    if (validatedData.departmentId) {
      const [department] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, validatedData.departmentId))
        .limit(1);

      if (!department) {
        return NextResponse.json(
          { error: 'Department not found', details: `Department with ID '${validatedData.departmentId}' does not exist` },
          { status: 404 }
        );
      }

      if (!department.isActive) {
        return NextResponse.json(
          { error: 'Invalid department', details: 'Cannot create position in inactive department' },
          { status: 400 }
        );
      }
    }

    // Create position using mutation
    const created = await createPosition({
      title: validatedData.title,
      gradeLevel: validatedData.gradeLevel,
      departmentId: validatedData.departmentId,
    });

    // Create audit log
    await createAuditLogFromRequest(
      currentUser.id,
      'CREATE',
      'position',
      created.id,
      { after: created },
      request.headers
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Position creation error:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    // Handle specific error messages from mutations
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Department not found',
            details: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('inactive department')) {
        return NextResponse.json(
          {
            error: 'Invalid department',
            details: error.message,
          },
          { status: 400 }
        );
      }

      if (error.message.includes('Grade level must be')) {
        return NextResponse.json(
          {
            error: 'Invalid grade level',
            details: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create position',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
