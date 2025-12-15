/**
 * Organization Reactivation API - Reactivate Soft-Deleted Units
 * POST /api/organization/[id]/reactivate
 *
 * Features:
 * - Reactivates previously soft-deleted organizational units
 * - Validates parent unit is active before reactivation
 * - Creates comprehensive audit log
 * - Role-based authorization
 *
 * Security:
 * - Requires admin or hr role
 * - Audit logging for all operations
 * - RLS enforcement at database level
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  departments,
  reactivateDepartment,
  createAuditLogFromRequest,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

/**
 * POST /api/organization/[id]/reactivate
 * Reactivate a soft-deleted organizational unit
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'hr'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
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

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid organizational unit ID' },
        { status: 400 }
      );
    }

    // Fetch existing department to capture before state
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

    // Check if already active
    if (existing.isActive) {
      return NextResponse.json(
        {
          error: 'Unit already active',
          details: 'This organizational unit is already active',
        },
        { status: 400 }
      );
    }

    // Perform reactivation
    const reactivated = await reactivateDepartment(id);

    // Create audit log
    await createAuditLogFromRequest(
      currentUser.id,
      'UPDATE',
      'department',
      reactivated.id,
      {
        before: existing,
        after: reactivated,
      },
      request.headers
    );

    return NextResponse.json(reactivated, { status: 200 });
  } catch (error) {
    console.error('Organization reactivation error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Organizational unit not found',
            details: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('already active')) {
        return NextResponse.json(
          {
            error: 'Unit already active',
            details: error.message,
          },
          { status: 400 }
        );
      }

      if (error.message.includes('parent') && error.message.includes('inactive')) {
        return NextResponse.json(
          {
            error: 'Parent unit inactive',
            details: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to reactivate organizational unit',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
