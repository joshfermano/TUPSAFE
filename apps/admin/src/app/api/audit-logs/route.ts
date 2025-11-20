/**
 * Audit Logs List API - GET /api/audit-logs
 *
 * Provides paginated list of audit logs with advanced filtering and sorting
 * for the admin portal. Tracks all system activities for compliance and security.
 *
 * Features:
 * - Pagination with configurable page size
 * - Multi-dimensional filtering (user, action, resource, date range)
 * - Full-text search in JSONB changes field
 * - Optimized single-query joins with profiles
 * - Aggregate statistics (total logs, unique users, actions, resources)
 *
 * Security:
 * - Requires admin or hr role
 * - Respects row-level security policies
 * - Performance logging for optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkUserRoleFromSupabase,
  getUserFromSupabase,
} from '@tupsafe/auth/server';
import { db, auditLogs, profiles } from '@tupsafe/database/server';
import {
  and,
  eq,
  ilike,
  desc,
  asc,
  sql,
  count,
  gte,
  lte,
  isNotNull,
} from 'drizzle-orm';
import {
  auditLogsQuerySchema,
  type AuditLogsListResponse,
  type AuditLogListItem,
} from '@tupsafe/types';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Audit Logs API] Request received');

    // Verify admin/HR permissions
    const authStartTime = Date.now();
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'hr'], 'admin');
    const authDuration = Date.now() - authStartTime;
    console.log(
      `[Audit Logs API] Permission check completed in ${authDuration}ms - result:`,
      hasPermission
    );

    if (!hasPermission) {
      console.log('[Audit Logs API] Permission denied - returning 403');
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user for audit logging
    const sessionUser = await getUserFromSupabase();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    console.log('[Audit Logs API] Permission granted - fetching audit logs');

    // Parse and validate query parameters
    // Use Object.fromEntries to get undefined for missing params (not null)
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = auditLogsQuerySchema.parse(queryParams);

    console.log('[Audit Logs API] Query params:', validatedQuery);

    // Build WHERE conditions
    const conditions = [];

    // User filter
    if (validatedQuery.user) {
      conditions.push(eq(auditLogs.userId, validatedQuery.user));
    }

    // Action filter
    if (validatedQuery.action) {
      conditions.push(eq(auditLogs.action, validatedQuery.action));
    }

    // Resource (entityType) filter
    if (validatedQuery.resource) {
      conditions.push(eq(auditLogs.entityType, validatedQuery.resource));
    }

    // Date range filtering
    if (validatedQuery.startDate) {
      conditions.push(gte(auditLogs.createdAt, validatedQuery.startDate));
    }
    if (validatedQuery.endDate) {
      conditions.push(lte(auditLogs.createdAt, validatedQuery.endDate));
    }

    // Search filter - search in changes JSONB field (cast to text for ILIKE)
    if (validatedQuery.search) {
      const searchTerm = `%${validatedQuery.search}%`;
      conditions.push(
        ilike(sql`${auditLogs.changes}::text`, searchTerm)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Start parallel queries for better performance
    const queryStartTime = Date.now();

    // Query 1: Get total count for pagination
    const countQuery = db
      .select({ totalCount: count() })
      .from(auditLogs)
      .where(whereClause);

    // Query 2: Calculate aggregate statistics
    const statsQuery = Promise.all([
      // Total logs (same as count)
      db
        .select({ count: count() })
        .from(auditLogs)
        .where(whereClause),

      // Unique users
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${auditLogs.userId})` })
        .from(auditLogs)
        .where(whereClause),

      // Total distinct actions
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${auditLogs.action})` })
        .from(auditLogs)
        .where(whereClause),

      // Resources affected (non-null entityId)
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${auditLogs.entityId})` })
        .from(auditLogs)
        .where(
          conditions.length > 0
            ? and(...conditions, isNotNull(auditLogs.entityId))
            : isNotNull(auditLogs.entityId)
        ),
    ]);

    // Execute count query
    const [{ totalCount }] = await countQuery;

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedQuery.limit);
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Determine sort column and order
    let orderByClause;
    const orderFn = validatedQuery.sortOrder === 'asc' ? asc : desc;

    if (validatedQuery.sortBy === 'user') {
      // Sort by user last name, then first name
      orderByClause = [orderFn(profiles.lastName), orderFn(profiles.firstName)];
    } else if (validatedQuery.sortBy === 'action') {
      orderByClause = [orderFn(auditLogs.action)];
    } else {
      // createdAt (default)
      orderByClause = [orderFn(auditLogs.createdAt)];
    }

    // Query 3: Fetch audit logs with user details (optimized single query with join)
    const logsData = await db
      .select({
        // Audit log fields
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        changes: auditLogs.changes,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,

        // User fields (joined from profiles)
        userId: profiles.id,
        userFirstName: profiles.firstName,
        userLastName: profiles.lastName,
        userEmployeeId: profiles.employeeId,
      })
      .from(auditLogs)
      .innerJoin(profiles, eq(auditLogs.userId, profiles.id))
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(validatedQuery.limit)
      .offset(offset);

    // Execute stats queries in parallel
    const [[{ count: totalLogs }], [{ count: uniqueUsers }], [{ count: totalActions }], [{ count: resourcesAffected }]] = await statsQuery;

    // Transform to response format
    const logs: AuditLogListItem[] = logsData.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      changes: item.changes as Record<string, unknown> | null,
      ipAddress: item.ipAddress,
      userAgent: item.userAgent,
      createdAt: item.createdAt,
      user: {
        id: item.userId,
        firstName: item.userFirstName,
        lastName: item.userLastName,
        employeeId: item.userEmployeeId,
      },
    }));

    const queryDuration = Date.now() - queryStartTime;
    console.log(`[Audit Logs API] Query completed in ${queryDuration}ms`);

    // Construct response
    const response: AuditLogsListResponse = {
      logs,
      pagination: {
        total: totalCount,
        page: validatedQuery.page,
        pageSize: validatedQuery.limit,
        totalPages,
      },
      stats: {
        totalLogs,
        uniqueUsers,
        totalActions,
        resourcesAffected,
      },
    };

    const totalDuration = Date.now() - startTime;
    console.log(
      `[Audit Logs API] Total request duration: ${totalDuration}ms (auth: ${authDuration}ms, query: ${queryDuration}ms)`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache for 5 minutes with stale-while-revalidate
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[Audit Logs API] Error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch audit logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
