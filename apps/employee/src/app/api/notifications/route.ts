/**
 * Employee Portal Notifications API
 * Manages user notifications with pagination and filtering
 *
 * Security:
 * - Requires active session
 * - Users can only access their own notifications
 *
 * Features:
 * - Pagination support
 * - Filter by read/unread status
 * - Filter by notification type
 * - Filter by date range
 * - Mark all as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { notifications } from '@tupsafe/database/schema';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Query parameters validation schema
 */
const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  isRead: z.enum(['true', 'false']).optional(),
  type: z
    .enum([
      'deadline_reminder',
      'submission_status',
      'approval_required',
      'system_update',
    ])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

/**
 * GET /api/notifications
 * Fetch user's notifications with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient('employee');
    const {
      data: { user }, error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      isRead: searchParams.get('isRead'),
      type: searchParams.get('type'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
    };

    const validationResult = notificationsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { page, limit, isRead, type, dateFrom, dateTo } =
      validationResult.data;

    // Build query conditions
    const conditions = [eq(notifications.userId, userId)];

    if (isRead !== undefined) {
      conditions.push(eq(notifications.isRead, isRead === 'true'));
    }

    if (type) {
      conditions.push(eq(notifications.type, type));
    }

    if (dateFrom) {
      conditions.push(gte(notifications.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(notifications.createdAt, new Date(dateTo)));
    }

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(...conditions));

    const totalCount = Number(totalCountResult?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    // Fetch notifications
    const notificationsList = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
      })
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      notifications: notificationsList,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[Notifications API] GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
