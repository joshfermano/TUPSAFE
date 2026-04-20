/**
 * Organization Management API - Single Unit Operations
 * GET /api/organization/[id] - Get single organizational unit with stats
 * PATCH /api/organization/[id] - Update organizational unit
 * DELETE /api/organization/[id] - Delete organizational unit (soft or hard)
 *
 * Features:
 * - Retrieve comprehensive unit details with statistics
 * - Partial updates with validation
 * - Soft delete (default) or hard delete (admin only)
 * - Role-based authorization
 * - Audit logging for all mutations
 *
 * Security:
 * - Requires admin, hr, or supervisor role for viewing
 * - Requires admin for college updates/hard deletes
 * - Requires admin or hr for department/office updates/soft deletes
 * - RLS enforcement at database level
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  departments,
  getDepartmentWithStats,
  updateDepartment,
  softDeleteDepartment,
  hardDeleteDepartment,
  createAuditLogFromRequest,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { updateDepartmentSchema } from '@tupsafe/types';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';
/**
 * GET /api/organization/[id]
 * Get single organizational unit with comprehensive statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid organizational unit ID' },
        { status: 400 }
      );
    }

    // Fetch department with statistics
    const departmentWithStats = await getDepartmentWithStats(id);

    if (!departmentWithStats) {
      return NextResponse.json(
        { error: 'Organizational unit not found' },
        { status: 404 }
      );
    }

    // Set cache headers (5 minutes)
    return NextResponse.json(departmentWithStats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Organization fetch error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch organizational unit',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organization/[id]
 * Update an organizational unit with partial data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid organizational unit ID' },
        { status: 400 }
      );
    }

    // Fetch existing department to determine authorization requirements
    const [existing] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Organizational unit not found' },
        { status: 404 }
      );
    }

    // Determine required roles based on unit type
    // Colleges require admin, departments/offices allow admin or hr
    const isCollege = existing.officeType === 'academic' && !existing.parentCollegeId;
    const requiredRoles = isCollege ? ['superadmin'] : ['superadmin', 'admin', 'hr'];

    const hasPermission = await checkUserRoleFromSupabase(
      requiredRoles,
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: `Unauthorized. ${isCollege ? 'Admin' : 'Admin or HR'} role required to update ${isCollege ? 'colleges' : 'this unit'}.`,
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateDepartmentSchema.parse(body);

    // Check if any fields are actually being updated
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'No fields provided for update' },
        { status: 400 }
      );
    }

    // Perform update
    const updated = await updateDepartment(id, validatedData);

    // Create audit log
    await createAuditLogFromRequest(
      currentUser.id,
      'UPDATE',
      'department',
      updated.id,
      {
        before: existing,
        after: updated,
      },
      request.headers
    );

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error('Organization update error:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json(
        {
          error: `Invalid input data: ${errorMessage}`,
        },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 409 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('circular reference') || error.message.includes('cannot be its own parent')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 }
        );
      }

      if (error.message.includes('inactive') || error.message.includes('children')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update organizational unit',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organization/[id]
 * Delete an organizational unit (soft delete by default, hard delete with ?hard=true)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid organizational unit ID' },
        { status: 400 }
      );
    }

    // Check for hard delete parameter
    const searchParams = request.nextUrl.searchParams;
    const isHardDelete = searchParams.get('hard') === 'true';

    // Fetch existing department to determine authorization requirements
    const [existing] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Organizational unit not found' },
        { status: 404 }
      );
    }

    // Determine required roles based on operation type
    const isCollege = existing.officeType === 'academic' && !existing.parentCollegeId;
    let requiredRoles: string[];

    if (isHardDelete || isCollege) {
      // Hard delete or college operations require superadmin only
      requiredRoles = ['superadmin'];
    } else {
      // Soft delete of departments/offices allows admin or hr
      requiredRoles = ['superadmin', 'admin', 'hr'];
    }

    const hasPermission = await checkUserRoleFromSupabase(
      requiredRoles,
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: `Unauthorized. ${requiredRoles.length === 1 ? 'Admin' : 'Admin or HR'} role required for this operation.`,
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

    // Perform deletion
    if (isHardDelete) {
      await hardDeleteDepartment(id);

      // Create audit log for hard delete
      await createAuditLogFromRequest(
        currentUser.id,
        'DELETE',
        'department',
        id,
        { before: existing },
        request.headers
      );
    } else {
      await softDeleteDepartment(id);

      // Create audit log for soft delete
      await createAuditLogFromRequest(
        currentUser.id,
        'UPDATE',
        'department',
        id,
        {
          before: existing,
          after: { ...existing, isActive: false },
        },
        request.headers
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Organization delete error:', error);

    // Handle constraint violation errors
    if (error instanceof Error) {
      if (
        error.message.includes('employee') ||
        error.message.includes('position') ||
        error.message.includes('children') ||
        error.message.includes('child')
      ) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 409 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('already inactive')) {
        return NextResponse.json(
          {
            error: error.message,
            code: 'ALREADY_INACTIVE',
            suggestion: 'Use the reactivate endpoint to restore this organization.'
          },
          { status: 409 }  // Changed from 400 to 409 Conflict
        );
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete organizational unit',
      },
      { status: 500 }
    );
  }
}
