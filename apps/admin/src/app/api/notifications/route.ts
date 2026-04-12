/**
 * Admin Notifications API Route
 *
 * GET  /api/notifications  - List notifications with pagination, optional type/isRead filters
 * PATCH /api/notifications - Mark notifications as read (by IDs or mark all)
 *
 * Requires admin, co_admin, or hr role.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkUserRoleFromSupabase,
  getUserFromSupabase,
} from '@tupsafe/auth/server';
import { db, notifications } from '@tupsafe/database/server';
import { eq, and, desc, inArray, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'co_admin', 'hr'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const typeFilter = searchParams.get('type') || undefined;
    const isReadParam = searchParams.get('isRead');
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [eq(notifications.userId, sessionUser.id)];

    if (typeFilter) {
      const validTypes = ['deadline_reminder', 'submission_status', 'approval_required', 'system_update'] as const;
      if (validTypes.includes(typeFilter as typeof validTypes[number])) {
        conditions.push(eq(notifications.type, typeFilter as typeof validTypes[number]));
      }
    }

    if (isReadParam === 'true') {
      conditions.push(eq(notifications.isRead, true));
    } else if (isReadParam === 'false') {
      conditions.push(eq(notifications.isRead, false));
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    // Execute queries in parallel: notifications list, total count, unread count
    const [notificationRows, totalResult, unreadResult] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(notifications)
        .where(whereClause),
      db
        .select({ value: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, sessionUser.id),
            eq(notifications.isRead, false)
          )
        ),
    ]);

    const total = totalResult[0]?.value ?? 0;
    const unreadCount = unreadResult[0]?.value ?? 0;
    const totalPages = Math.ceil(Number(total) / limit);

    // Serialize dates to ISO strings
    const serialized = notificationRows.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt ? n.readAt.toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      notifications: serialized,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages,
      },
      unreadCount: Number(unreadCount),
    });
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch notifications',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'co_admin', 'hr'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAll } = body as {
      notificationIds?: string[];
      markAll?: boolean;
    };

    if (!markAll && (!notificationIds || notificationIds.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Either markAll or notificationIds is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    let updated: { id: string }[] = [];

    if (markAll) {
      // Mark all unread notifications as read for this user
      updated = await db
        .update(notifications)
        .set({ isRead: true, readAt: now })
        .where(
          and(
            eq(notifications.userId, sessionUser.id),
            eq(notifications.isRead, false)
          )
        )
        .returning({ id: notifications.id });
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      updated = await db
        .update(notifications)
        .set({ isRead: true, readAt: now })
        .where(
          and(
            inArray(notifications.id, notificationIds),
            eq(notifications.userId, sessionUser.id)
          )
        )
        .returning({ id: notifications.id });
    }

    const updatedCount = updated.length;

    console.log(
      `[PATCH /api/notifications] Admin ${sessionUser.id} marked ${updatedCount} notification(s) as read`
    );

    return NextResponse.json({
      success: true,
      updatedCount,
    });
  } catch (error) {
    console.error('[PATCH /api/notifications] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update notifications',
      },
      { status: 500 }
    );
  }
}
