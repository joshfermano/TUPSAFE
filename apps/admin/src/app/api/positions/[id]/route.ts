/**
 * Position Detail API - Get, Update, and Delete Individual Position
 * GET /api/positions/[id] - Get position details with related data
 * PATCH /api/positions/[id] - Update position
 * DELETE /api/positions/[id] - Soft delete position
 *
 * Features:
 * - Full position details with department information
 * - Employee assignment check
 * - Employee count for the position
 * - Validation before update/delete
 * - Audit logging for all mutations
 *
 * Security:
 * - Requires admin, hr, or supervisor role for viewing
 * - Requires admin or hr role for updating/deleting
 * - Prevents deletion if employees are assigned
 * - Comprehensive audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  positions,
  departments,
  profiles,
  updatePosition,
  softDeletePosition,
  isPositionAssigned,
  createAuditLogFromRequest,
} from '@tupsafe/database/server';
import { and, eq, sql } from 'drizzle-orm';
import {
  updatePositionSchema,
  type PositionDetailResponse,
  type PositionWithDepartment,
} from '@tupsafe/types';
import { ZodError } from 'zod';

/**
 * GET /api/positions/[id]
 * Get single position with comprehensive details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid position ID format' },
        { status: 400 }
      );
    }

    // Fetch position with department information
    const [positionData] = await db
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
      .where(eq(positions.id, id))
      .limit(1);

    if (!positionData) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Transform to PositionWithDepartment format
    const position: PositionWithDepartment = {
      id: positionData.id,
      title: positionData.title,
      gradeLevel: positionData.gradeLevel,
      departmentId: positionData.departmentId,
      isActive: positionData.isActive,
      createdAt: positionData.createdAt,
      department: positionData.departmentId
        ? {
            id: positionData.departmentId,
            name: positionData.departmentName!,
            code: positionData.departmentCode!,
          }
        : null,
    };

    // Check if position has employees assigned (any status)
    const hasEmployees = await isPositionAssigned(id);

    // Get count of assigned employees (active only)
    const [{ count: activeEmployeeCount }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(profiles)
      .where(and(eq(profiles.positionId, id), eq(profiles.isActive, true)));

    // Get count of all assigned employees (including inactive)
    const [{ count: totalEmployeeCount }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(profiles)
      .where(eq(profiles.positionId, id));

    // Fetch employee list for this position (active employees only, limited to 10 for preview)
    const employees = await db
      .select({
        id: profiles.id,
        employeeId: profiles.employeeId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        departmentId: profiles.departmentId,
        departmentName: departments.name,
        isActive: profiles.isActive,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .where(and(eq(profiles.positionId, id), eq(profiles.isActive, true)))
      .limit(10);

    const response: PositionDetailResponse = {
      position,
      employees: employees.map((emp) => ({
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        departmentId: emp.departmentId,
        departmentName: emp.departmentName,
        isActive: emp.isActive,
      })),
      department: position.department
        ? {
            id: position.department.id,
            name: position.department.name,
            code: position.department.code,
            employeeCount: 0, // Not needed for position detail
            positionCount: 0, // Not needed for position detail
            isActive: true, // Fetched separately if needed
            officeType: 'academic', // Fetched separately if needed
            parentCollegeId: null, // Fetched separately if needed
            parentId: null,
            createdAt: new Date(),
          }
        : null,
    };

    // Add custom metadata to response
    const responseWithMetadata = {
      ...response,
      metadata: {
        hasEmployees,
        activeEmployeeCount: activeEmployeeCount || 0,
        totalEmployeeCount: totalEmployeeCount || 0,
        canDelete: !hasEmployees,
      },
    };

    // Set cache headers (5 minutes)
    return NextResponse.json(responseWithMetadata, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Position detail error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch position details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/positions/[id]
 * Update an existing position
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authorization - admin or hr only
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');

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

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid position ID format' },
        { status: 400 }
      );
    }

    // Get existing position for audit log
    const [existing] = await db
      .select()
      .from(positions)
      .where(eq(positions.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updatePositionSchema.parse(body);

    // Validate new department if changing
    if (validatedData.departmentId !== undefined && validatedData.departmentId !== null) {
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
          { error: 'Invalid department', details: 'Cannot assign position to inactive department' },
          { status: 400 }
        );
      }
    }

    // Update position using mutation
    const updated = await updatePosition(id, validatedData);

    // Create audit log
    await createAuditLogFromRequest(
      currentUser.id,
      'UPDATE',
      'position',
      updated.id,
      { before: existing, after: updated },
      request.headers
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Position update error:', error);

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
            error: 'Position or department not found',
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
        error: 'Failed to update position',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/positions/[id]
 * Soft delete a position (set isActive to false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authorization - admin or hr only
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');

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

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid position ID format' },
        { status: 400 }
      );
    }

    // Get existing position for audit log
    const [existing] = await db
      .select()
      .from(positions)
      .where(eq(positions.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { error: 'Position already inactive' },
        { status: 400 }
      );
    }

    // Attempt soft delete (will fail if employees assigned)
    try {
      await softDeletePosition(id);
    } catch (deleteError) {
      // Handle specific deletion errors
      if (deleteError instanceof Error && deleteError.message.includes('active employee')) {
        const match = deleteError.message.match(/There are (\d+) active employee/);
        const employeeCount = match ? match[1] : 'multiple';

        return NextResponse.json(
          {
            error: 'Cannot delete position',
            details: `This position has ${employeeCount} active employee(s) assigned. Please reassign employees to other positions before deleting.`,
          },
          { status: 409 } // Conflict
        );
      }
      throw deleteError;
    }

    // Create audit log
    await createAuditLogFromRequest(
      currentUser.id,
      'DELETE',
      'position',
      id,
      { before: existing, after: { ...existing, isActive: false } },
      request.headers
    );

    // Return 204 No Content on successful deletion
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Position deletion error:', error);

    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Position not found', details: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('already inactive')) {
        return NextResponse.json(
          { error: 'Position already inactive', details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to delete position',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
