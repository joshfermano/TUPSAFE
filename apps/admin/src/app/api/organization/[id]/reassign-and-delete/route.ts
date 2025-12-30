/**
 * Organization Management API - Reassign and Delete Department
 * POST /api/organization/[id]/reassign-and-delete - Reassign employees/positions then soft delete department
 *
 * Features:
 * - Atomic operation combining reassignment and deletion in a single transaction
 * - Optionally reassign employees to target department
 * - Optionally reassign positions to target department
 * - Soft delete source department after reassignments
 * - Comprehensive validation and error handling
 * - Audit logging with before/after state
 *
 * Security:
 * - Requires admin or hr role (critical operation)
 * - RLS enforcement at database level
 * - Full audit trail maintained
 *
 * Use Cases:
 * - Department reorganization/merging
 * - Unit consolidation
 * - Phasing out departments while preserving data
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase } from '@tupsafe/auth/server';
import {
  reassignAndDelete,
  createAuditLogFromRequest,
  getDepartmentWithStats,
} from '@tupsafe/database/server';
import { z } from 'zod';
import { ZodError } from 'zod';

/**
 * Validation schema for reassign and delete request body
 *
 * @example
 * ```typescript
 * {
 *   targetDepartmentId: "550e8400-e29b-41d4-a716-446655440000",
 *   reassignEmployees: true,
 *   reassignPositions: true
 * }
 * ```
 */
const reassignAndDeleteSchema = z.object({
  /**
   * UUID of the target department to receive reassigned employees/positions
   * Must be different from source department and must be active
   */
  targetDepartmentId: z
    .string({ required_error: 'Target department ID is required' })
    .uuid('Invalid target department ID'),

  /**
   * Whether to reassign employees to target department
   * @default true
   */
  reassignEmployees: z.boolean().default(true).optional(),

  /**
   * Whether to reassign positions to target department
   * @default true
   */
  reassignPositions: z.boolean().default(true).optional(),
});

type ReassignAndDeleteInput = z.infer<typeof reassignAndDeleteSchema>;

/**
 * POST /api/organization/[id]/reassign-and-delete
 *
 * Atomic operation that reassigns employees and/or positions to a target department
 * and then soft-deletes the source department. All operations occur in a single
 * database transaction for data consistency.
 *
 * Request Body:
 * - targetDepartmentId: UUID of target department (required)
 * - reassignEmployees: Whether to reassign employees (default: true)
 * - reassignPositions: Whether to reassign positions (default: true)
 *
 * Response:
 * - success: true
 * - employeesReassigned: Number of employees moved
 * - positionsReassigned: Number of positions moved
 * - deleted: true
 *
 * Error Responses:
 * - 400: Invalid input (validation errors, same source/target, etc.)
 * - 403: Unauthorized (requires admin or hr role)
 * - 404: Department not found
 * - 409: Constraint violation (target inactive, etc.)
 * - 500: Server error
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing department ID
 * @returns JSON response with operation results or error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    // Verify admin or HR permissions
    // This is a critical operation that permanently affects organizational structure
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'co_admin', 'hr'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required for this operation.' },
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
    const validatedData: ReassignAndDeleteInput = reassignAndDeleteSchema.parse(body);

    // Prevent reassigning department to itself
    if (id === validatedData.targetDepartmentId) {
      return NextResponse.json(
        { error: 'Source and target departments must be different' },
        { status: 400 }
      );
    }

    // Fetch department before deletion for audit logging
    const departmentBefore = await getDepartmentWithStats(id);

    if (!departmentBefore) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Fetch target department for audit logging
    const targetDepartment = await getDepartmentWithStats(validatedData.targetDepartmentId);

    if (!targetDepartment) {
      return NextResponse.json(
        { error: 'Target department not found' },
        { status: 404 }
      );
    }

    // Perform atomic reassignment and deletion
    const result = await reassignAndDelete(
      id,
      validatedData.targetDepartmentId,
      {
        reassignEmployees: validatedData.reassignEmployees ?? true,
        reassignPositions: validatedData.reassignPositions ?? true,
      }
    );

    // Create comprehensive audit log
    await createAuditLogFromRequest(
      currentUser.id,
      'DELETE',
      'department',
      id,
      {
        before: {
          id: departmentBefore.id,
          name: departmentBefore.name,
          code: departmentBefore.code,
          isActive: departmentBefore.isActive,
          employeeCount: departmentBefore.employeeCount,
          positionCount: departmentBefore.positionCount,
        },
        after: {
          reassignedTo: {
            id: targetDepartment.id,
            name: targetDepartment.name,
            code: targetDepartment.code,
          },
          employeesReassigned: result.employeesReassigned,
          positionsReassigned: result.positionsReassigned,
          deleted: result.deleted,
        },
      },
      request.headers
    );

    // Return success response with reassignment counts
    return NextResponse.json(
      {
        success: true,
        employeesReassigned: result.employeesReassigned,
        positionsReassigned: result.positionsReassigned,
        deleted: result.deleted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reassign and delete error:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return NextResponse.json(
        {
          error: `Invalid input data: ${errorMessage}`,
        },
        { status: 400 }
      );
    }

    // Handle database constraint errors
    if (error instanceof Error) {
      // Target department is inactive
      if (error.message.includes('inactive')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 409 }
        );
      }

      // Source/target departments not found
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 404 }
        );
      }

      // Same department error
      if (error.message.includes('must be different')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 }
        );
      }

      // Remaining active employees/positions error
      if (
        error.message.includes('employee(s) remaining') ||
        error.message.includes('position(s) remaining')
      ) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 409 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to reassign and delete department',
      },
      { status: 500 }
    );
  }
}
