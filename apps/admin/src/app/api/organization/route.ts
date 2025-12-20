/**
 * Organization Management API - List and Create Organizational Units
 * GET /api/organization - List all organizational units with filtering
 * POST /api/organization - Create a new organizational unit
 *
 * Features:
 * - Type-based filtering (college, department, office, all)
 * - Search by name or code
 * - Include inactive units option
 * - Sorting by name, code, or creation date
 * - Role-based authorization
 * - Comprehensive statistics for each unit
 *
 * Security:
 * - Requires admin, hr, or supervisor role for viewing
 * - Requires admin for creating colleges
 * - Requires admin or hr for creating departments/offices
 * - Audit logging for all create operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  departments,
  profiles,
  positions,
  createCollege,
  createDepartment,
  createOffice,
  createAuditLogFromRequest,
} from '@tupsafe/database/server';
import { and, eq, or, ilike, sql, asc, desc } from 'drizzle-orm';
import {
  organizationQuerySchema,
  createCollegeSchema,
  createDepartmentSchema,
  createOfficeSchema,
  type OrganizationListResponse,
  type DepartmentWithStats,
} from '@tupsafe/types';
import { ZodError } from 'zod';

/**
 * GET /api/organization
 * List all organizational units with filtering, search, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin/HR/supervisor permissions
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'hr', 'supervisor'],
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

    const validatedQuery = organizationQuerySchema.parse(queryParams);

    // Build WHERE conditions
    const conditions = [];

    // Active status filter
    if (!validatedQuery.includeInactive) {
      conditions.push(eq(departments.isActive, true));
    }

    // Search filter - across name and code
    if (validatedQuery.search) {
      const searchTerm = `%${validatedQuery.search}%`;
      conditions.push(
        or(
          ilike(departments.name, searchTerm),
          ilike(departments.code, searchTerm)
        )
      );
    }

    const baseConditions = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column and order (default to name if not specified)
    const sortByKey = validatedQuery.sortBy || 'name';
    const sortColumnMap = {
      name: departments.name,
      code: departments.code,
      createdAt: departments.createdAt,
    };
    const sortColumn = sortColumnMap[sortByKey as keyof typeof sortColumnMap] || departments.name;

    const orderFn = validatedQuery.sortOrder === 'asc' ? asc : desc;

    // Fetch organizational units based on type filter
    const fetchColleges = ['all', 'college'].includes(validatedQuery.type!);
    const fetchDepartments = ['all', 'department'].includes(validatedQuery.type!);
    const fetchOffices = ['all', 'office'].includes(validatedQuery.type!);

    const [collegesData, departmentsData, officesData] = await Promise.all([
      // Fetch colleges (academic, no parent)
      fetchColleges
        ? db
            .select()
            .from(departments)
            .where(
              baseConditions
                ? and(
                    baseConditions,
                    eq(departments.officeType, 'academic'),
                    sql`${departments.parentCollegeId} IS NULL`
                  )
                : and(
                    eq(departments.officeType, 'academic'),
                    sql`${departments.parentCollegeId} IS NULL`
                  )
            )
            .orderBy(orderFn(sortColumn))
        : Promise.resolve([]),

      // Fetch departments (academic, has parent)
      fetchDepartments
        ? db
            .select()
            .from(departments)
            .where(
              baseConditions
                ? and(
                    baseConditions,
                    eq(departments.officeType, 'academic'),
                    sql`${departments.parentCollegeId} IS NOT NULL`
                  )
                : and(
                    eq(departments.officeType, 'academic'),
                    sql`${departments.parentCollegeId} IS NOT NULL`
                  )
            )
            .orderBy(orderFn(sortColumn))
        : Promise.resolve([]),

      // Fetch offices (administrative)
      fetchOffices
        ? db
            .select()
            .from(departments)
            .where(
              baseConditions
                ? and(baseConditions, eq(departments.officeType, 'administrative'))
                : eq(departments.officeType, 'administrative')
            )
            .orderBy(orderFn(sortColumn))
        : Promise.resolve([]),
    ]);

    // Fetch statistics for each unit in parallel
    const collegesWithStats = await Promise.all(
      collegesData.map(async (college) => {
        const [employeesResult, positionsResult, childrenResult] = await Promise.all([
          // Count employees
          db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(profiles)
            .where(and(eq(profiles.departmentId, college.id), eq(profiles.isActive, true))),

          // Count positions
          db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(positions)
            .where(and(eq(positions.departmentId, college.id), eq(positions.isActive, true))),

          // Count child departments
          db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(departments)
            .where(
              and(
                eq(departments.parentCollegeId, college.id),
                eq(departments.isActive, true)
              )
            ),
        ]);

        return {
          ...college,
          employeeCount: employeesResult[0]?.count ?? 0,
          positionCount: positionsResult[0]?.count ?? 0,
          childDepartmentCount: childrenResult[0]?.count ?? 0,
        } as DepartmentWithStats;
      })
    );

    const departmentsWithStats = await Promise.all(
      departmentsData.map(async (dept) => {
        const [employeesResult, positionsResult, parentCollege] = await Promise.all([
          // Count employees
          db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(profiles)
            .where(and(eq(profiles.departmentId, dept.id), eq(profiles.isActive, true))),

          // Count positions
          db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(positions)
            .where(and(eq(positions.departmentId, dept.id), eq(positions.isActive, true))),

          // Fetch parent college
          dept.parentCollegeId
            ? db
                .select()
                .from(departments)
                .where(eq(departments.id, dept.parentCollegeId))
                .limit(1)
            : Promise.resolve([null]),
        ]);

        return {
          ...dept,
          employeeCount: employeesResult[0]?.count ?? 0,
          positionCount: positionsResult[0]?.count ?? 0,
          parentCollege: parentCollege[0] || null,
        } as DepartmentWithStats;
      })
    );

    const officesWithStats = await Promise.all(
      officesData.map(async (office) => {
        const [employeesResult, positionsResult] = await Promise.all([
          // Count employees
          db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(profiles)
            .where(and(eq(profiles.departmentId, office.id), eq(profiles.isActive, true))),

          // Count positions
          db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(positions)
            .where(and(eq(positions.departmentId, office.id), eq(positions.isActive, true))),
        ]);

        return {
          ...office,
          employeeCount: employeesResult[0]?.count ?? 0,
          positionCount: positionsResult[0]?.count ?? 0,
        } as DepartmentWithStats;
      })
    );

    const response: OrganizationListResponse = {
      colleges: collegesWithStats,
      departments: departmentsWithStats,
      offices: officesWithStats,
      total: collegesWithStats.length + departmentsWithStats.length + officesWithStats.length,
    };

    // Set cache headers (5 minutes)
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Organization list error:', error);

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
        error: 'Failed to fetch organizational units',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organization
 * Create a new organizational unit (college, department, or office)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { type, ...data } = body;

    // Validate type field
    if (!type || !['college', 'department', 'office'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type. Must be: college, department, or office' },
        { status: 400 }
      );
    }

    // Check authorization based on type
    const requiredRoles = type === 'college' ? ['admin'] : ['admin', 'hr'];
    const hasPermission = await checkUserRoleFromSupabase(
      requiredRoles,
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: `Unauthorized. ${type === 'college' ? 'Admin' : 'Admin or HR'} role required to create ${type}s.`,
        },
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

    // Create organizational unit based on type
    let created;

    if (type === 'college') {
      // Validate college data
      const validatedData = createCollegeSchema.parse(data);
      created = await createCollege(validatedData);

      // Create audit log
      await createAuditLogFromRequest(
        currentUser.id,
        'CREATE',
        'department',
        created.id,
        { after: created },
        request.headers
      );
    } else if (type === 'department') {
      // Validate department data
      const validatedData = createDepartmentSchema.parse(data);
      created = await createDepartment(validatedData);

      // Create audit log
      await createAuditLogFromRequest(
        currentUser.id,
        'CREATE',
        'department',
        created.id,
        { after: created },
        request.headers
      );
    } else if (type === 'office') {
      // Validate office data
      const validatedData = createOfficeSchema.parse(data);
      created = await createOffice(validatedData);

      // Create audit log
      await createAuditLogFromRequest(
        currentUser.id,
        'CREATE',
        'department',
        created.id,
        { after: created },
        request.headers
      );
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Organization creation error:', error);

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

    // Handle database errors (e.g., duplicate code)
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          {
            error: 'Duplicate code',
            details: error.message,
          },
          { status: 409 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Parent not found',
            details: error.message,
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create organizational unit',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
