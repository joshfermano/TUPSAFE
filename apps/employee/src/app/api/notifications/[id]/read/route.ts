/**
 * Mark Single Notification as Read API
 * Marks a specific notification as read
 *
 * Security:
 * - Requires active session
 * - Users can only mark their own notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { notifications } from '@tupsafe/database/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/notifications/[id]/read
 * Mark a specific notification as read
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Verify notification belongs to user
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // If already read, return success without updating
    if (notification.isRead) {
      return NextResponse.json({
        success: true,
        message: 'Notification already marked as read',
        notification: {
          id: notification.id,
          isRead: notification.isRead,
          readAt: notification.readAt,
        },
      });
    }

    // Mark as read
    const now = new Date();
    const [updatedNotification] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: now,
      })
      .where(eq(notifications.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notification: {
        id: updatedNotification.id,
        isRead: updatedNotification.isRead,
        readAt: updatedNotification.readAt,
      },
    });
  } catch (error) {
    console.error('[Mark Notification Read API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to mark notification as read',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
