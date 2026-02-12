/**
 * Mark All Notifications as Read API
 * Marks all user's unread notifications as read
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
 * POST /api/notifications/mark-all-read
 * Mark all user's unread notifications as read
 */
export async function POST(_request: NextRequest) {
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
    const now = new Date();

    // Update all unread notifications
    const result = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: now,
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .returning({ id: notifications.id });

    const updatedCount = result.length;

    return NextResponse.json({
      success: true,
      message: `Marked ${updatedCount} notification${updatedCount !== 1 ? 's' : ''} as read`,
      updatedCount,
    });
  } catch (error) {
    console.error('[Mark All Read API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to mark notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
