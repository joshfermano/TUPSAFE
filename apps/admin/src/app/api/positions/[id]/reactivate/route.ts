/**
 * Position Reactivation API
 * POST /api/positions/[id]/reactivate - Reactivate a soft-deleted position
 *
 * Features:
 * - Reactivates previously soft-deleted positions
 * - Validates department is still active before reactivation
 * - Creates audit log for reactivation
 * - Returns reactivated position with full details
 *
 * Security:
 * - Requires admin or hr role
 * - Comprehensive audit trail
 * - Validates department status
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  positions,
  reactivatePosition,
  createAuditLogFromRequest,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
/**
 * POST /api/positions/[id]/reactivate
 * Reactivate a soft-deleted position
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (existing.isActive) {
      return NextResponse.json(
        { error: 'Position is already active' },
        { status: 400 }
      );
    }

    // Reactivate position (validates department status internally)
    let reactivated;
    try {
      reactivated = await reactivatePosition(id);
    } catch (reactivateError) {
      // Handle specific reactivation errors
      if (reactivateError instanceof Error) {
        if (reactivateError.message.includes('department is inactive')) {
          return NextResponse.json(
            {
              error: 'Cannot reactivate position',
              details:
                'The associated department is inactive. Please reactivate the department first or remove the department association.',
            },
            { status: 400 }
          );
        }

        if (reactivateError.message.includes('department with ID') && reactivateError.message.includes('not found')) {
          return NextResponse.json(
            {
              error: 'Cannot reactivate position',
              details:
                'The associated department no longer exists. Please update the department association before reactivating.',
            },
            { status: 400 }
          );
        }
      }
      throw reactivateError;
    }

    // Create audit log
    await createAuditLogFromRequest(
      currentUser.id,
      'RESTORE',
      'position',
      reactivated.id,
      { before: existing, after: reactivated },
      request.headers
    );

    return NextResponse.json(reactivated, { status: 200 });
  } catch (error) {
    console.error('Position reactivation error:', error);

    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Position not found', details: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('already active')) {
        return NextResponse.json(
          { error: 'Position already active', details: error.message },
          { status: 400 }
        );
      }

      if (error.message.includes('department')) {
        return NextResponse.json(
          { error: 'Department validation failed', details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to reactivate position',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
