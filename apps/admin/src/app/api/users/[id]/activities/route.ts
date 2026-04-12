/**
 * User Activities API - GET /api/users/[id]/activities
 *
 * Fetches audit log entries for a specific user.
 * Returns both actions performed BY the user and actions ON the user.
 *
 * Features:
 * - Returns last 50 activity logs
 * - Includes performer details (firstName, lastName)
 * - Sorted by most recent first
 * - Covers all user-related actions (create, update, delete, etc.)
 *
 * Security:
 * - Requires admin, hr, or supervisor role
 * - Cached for 1 minute (relatively static data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { db, auditLogs, profiles } from '@tupsafe/database/server';
import { eq, or, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
/**
 * Activity log item response type
 */
interface ActivityLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  createdAt: Date;
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * GET /api/users/[id]/activities
 * Fetch activity logs related to a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch audit logs related to this user
    // Include logs where:
    // 1. User performed the action (userId = userId)
    // 2. Action was performed ON this user (entityId = userId)
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        changes: auditLogs.changes,
        createdAt: auditLogs.createdAt,
        performedBy: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
        },
      })
      .from(auditLogs)
      .leftJoin(profiles, eq(auditLogs.userId, profiles.id))
      .where(or(eq(auditLogs.entityId, userId), eq(auditLogs.userId, userId)))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    // Transform to response format (filter out logs with null performer)
    const activities: ActivityLogItem[] = logs
      .filter((log) => log.performedBy !== null)
      .map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        changes: log.changes as Record<string, unknown> | null,
        createdAt: log.createdAt,
        performedBy: {
          id: log.performedBy!.id,
          firstName: log.performedBy!.firstName,
          lastName: log.performedBy!.lastName,
        },
      }));

    return NextResponse.json(
      activities,
      {
        status: 200,
        headers: {
          // Cache for 1 minute with stale-while-revalidate
          'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Get user activities error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user activities',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
