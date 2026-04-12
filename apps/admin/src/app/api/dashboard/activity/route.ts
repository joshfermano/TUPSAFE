import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tupsafe/database/server';
import { auditLogs, profiles } from '@tupsafe/database/schema';
import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import {
  activityQuerySchema,
  type DashboardActivityResponse,
} from '@tupsafe/types';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';

export const dynamic = 'force-dynamic';
/**
 * GET /api/dashboard/activity
 *
 * System activity log for audit and monitoring
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - type: Filter by event type (optional)
 * - userId: Filter by user ID (optional)
 * - startDate: Filter by start date (optional)
 * - endDate: Filter by end date (optional)
 *
 * Features:
 * - Paginated activity feed
 * - Filter by type, user, date range
 * - Admin actions log
 * - User authentication events
 * - Submission workflow events
 *
 * Caching: No cache (real-time activity)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = activityQuerySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      type: searchParams.get('type') || undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    });

    const { page, limit, type, userId, startDate, endDate } = params;

    // Build where conditions
    const conditions = [];

    if (type) {
      conditions.push(sql`${auditLogs.action} LIKE ${`%${type}%`}`);
    }

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(whereClause);

    const total = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get activity logs with user information
    const activityLogs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        userId: auditLogs.userId,
        changes: auditLogs.changes,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        userFirstName: profiles.firstName,
        userLastName: profiles.lastName,
        userRole: profiles.role,
      })
      .from(auditLogs)
      .leftJoin(profiles, eq(auditLogs.userId, profiles.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Map to response format
    const activities = activityLogs.map((log) => ({
      id: log.id,
      type: log.action,
      action: log.action,
      description: generateActivityDescription(log),
      userId: log.userId,
      userName: log.userFirstName && log.userLastName
        ? `${log.userFirstName} ${log.userLastName}`
        : 'Unknown User',
      userRole: log.userRole || 'unknown',
      entityType: log.entityType || undefined,
      entityId: log.entityId || undefined,
      changes: log.changes || undefined,
      ipAddress: log.ipAddress || undefined,
      timestamp: log.createdAt,
    }));

    // Construct response
    const response: DashboardActivityResponse = {
      activities,
      pagination: {
        total,
        page,
        pageSize: limit,
        totalPages,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Dashboard Activity] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    );
  }
}

/**
 * Generate human-readable activity description
 */
interface ActivityLogRecord {
  action: string;
  metadata?: Record<string, string | number | boolean>;
  resourceType?: string;
  userFirstName?: string | null;
  userLastName?: string | null;
}

function generateActivityDescription(log: ActivityLogRecord): string {
  const action = log.action;
  const metadata = log.metadata || {};
  const resourceType = log.resourceType;
  const userName = log.userFirstName && log.userLastName
    ? `${log.userFirstName} ${log.userLastName}`
    : (metadata.userName as string) || 'User';

  // User management actions
  if (action.includes('user.created') || action.includes('user_created')) {
    return `${userName} created a new ${metadata.userType || 'user'} account`;
  }

  if (action.includes('user.updated') || action.includes('user_updated')) {
    return `${userName} updated user profile`;
  }

  if (action.includes('user.deleted') || action.includes('user_deleted')) {
    return `${userName} deleted user account`;
  }

  // Registration actions
  if (action.includes('registration.approved') || action.includes('registration_approved')) {
    return `${userName} approved registration for ${metadata.email || 'user'}`;
  }

  if (action.includes('registration.rejected') || action.includes('registration_rejected')) {
    return `${userName} rejected registration for ${metadata.email || 'user'}`;
  }

  if (action.includes('registration.submitted') || action.includes('registration_submitted')) {
    return `New registration submitted: ${metadata.email || 'user'}`;
  }

  // Submission actions
  if (action.includes('submission.approved') || action.includes('submission_approved')) {
    const type = String(metadata.submissionType || resourceType || 'submission');
    return `${userName} approved ${type.toUpperCase()} submission`;
  }

  if (action.includes('submission.rejected') || action.includes('submission_rejected')) {
    const type = String(metadata.submissionType || resourceType || 'submission');
    return `${userName} rejected ${type.toUpperCase()} submission`;
  }

  if (action.includes('submission.submitted') || action.includes('submission_submitted')) {
    const type = String(metadata.submissionType || resourceType || 'submission');
    return `${userName} submitted ${type.toUpperCase()} form`;
  }

  // Authentication actions
  if (action.includes('auth.login') || action.includes('login')) {
    return `${userName} logged in`;
  }

  if (action.includes('auth.logout') || action.includes('logout')) {
    return `${userName} logged out`;
  }

  if (action.includes('auth.failed') || action.includes('login_failed')) {
    return `Failed login attempt for ${metadata.email || 'user'}`;
  }

  // Department actions
  if (action.includes('department.created') || action.includes('department_created')) {
    return `${userName} created department: ${metadata.departmentName || 'Unknown'}`;
  }

  if (action.includes('department.updated') || action.includes('department_updated')) {
    return `${userName} updated department: ${metadata.departmentName || 'Unknown'}`;
  }

  // Position actions
  if (action.includes('position.created') || action.includes('position_created')) {
    return `${userName} created position: ${metadata.positionTitle || 'Unknown'}`;
  }

  if (action.includes('position.updated') || action.includes('position_updated')) {
    return `${userName} updated position: ${metadata.positionTitle || 'Unknown'}`;
  }

  // Deadline actions
  if (action.includes('deadline.created') || action.includes('deadline_created')) {
    const type = String(metadata.submissionType || 'submission');
    return `${userName} set ${type.toUpperCase()} deadline`;
  }

  if (action.includes('deadline.updated') || action.includes('deadline_updated')) {
    const type = String(metadata.submissionType || 'submission');
    return `${userName} updated ${type.toUpperCase()} deadline`;
  }

  // System actions
  if (action.includes('system.config') || action.includes('config')) {
    return `${userName} modified system configuration`;
  }

  if (action.includes('data.export') || action.includes('export')) {
    return `${userName} exported ${metadata.exportType || 'data'}`;
  }

  if (action.includes('bulk.operation') || action.includes('bulk')) {
    return `${userName} performed bulk operation: ${metadata.operationType || 'unknown'}`;
  }

  // Default fallback
  return `${userName} performed action: ${action}`;
}
