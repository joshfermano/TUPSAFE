/**
 * Organization Dependencies API
 * GET /api/organization/[id]/dependencies - Get department dependencies
 *
 * Features:
 * - Retrieves all dependencies (employees, positions, child departments)
 * - Provides deletion safety analysis (can soft/hard delete)
 * - Returns blocking reasons if deletion not possible
 * - Role-based authorization
 *
 * Security:
 * - Requires admin, hr, or supervisor role
 * - RLS enforcement at database level
 *
 * Use Cases:
 * - Pre-deletion validation
 * - Department reorganization planning
 * - Impact analysis before changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { getDepartmentDependencies } from '@tupsafe/database/server';

export const dynamic = 'force-dynamic';
/**
 * GET /api/organization/[id]/dependencies
 * Get comprehensive dependency information for a department
 *
 * Returns:
 * - employees: List of employees in the department
 * - positions: List of positions in the department
 * - childDepartments: List of departments under this department (if college)
 * - canSoftDelete: Whether the department can be soft deleted (no active employees/positions)
 * - canHardDelete: Whether the department can be hard deleted (no employees/positions/children)
 * - blockingReasons: Array of human-readable reasons why deletion is blocked
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing the department ID
 * @returns JSON response with dependency information
 */
export async function GET(
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

    // Fetch department dependencies
    const dependencies = await getDepartmentDependencies(id);

    if (!dependencies) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Set cache headers (shorter cache since dependencies change frequently)
    // Cache for 1 minute, allow stale for 2 minutes
    return NextResponse.json(dependencies, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Dependencies fetch error:', error);

    // Handle validation errors
    if (error instanceof Error) {
      if (error.message.includes('Valid department ID is required')) {
        return NextResponse.json(
          { error: 'Invalid department ID format' },
          { status: 400 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch department dependencies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
