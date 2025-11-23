/**
 * Reset User Preferences API
 * Resets user preferences to system defaults
 *
 * Security:
 * - Requires active session
 * - Users can only reset their own preferences
 *
 * Features:
 * - Resets all preferences to default values
 * - Auto-creates preferences if missing before reset
 * - Useful for troubleshooting or fresh start
 *
 * Default Values:
 * - emailNotificationsEnabled: true
 * - emailDigestFrequency: 'daily'
 * - theme: 'system'
 * - dashboardLayout: 'default'
 * - language: 'en'
 * - timezone: 'Asia/Manila'
 *
 * Route:
 * - POST /api/settings/reset - Reset all preferences to defaults
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { resetUserPreferences } from '@tupsafe/database/server';

/**
 * POST /api/settings/reset
 * Reset user preferences to system defaults
 *
 * Request Body: None required
 *
 * Response:
 * {
 *   success: true,
 *   message: 'Preferences reset to defaults successfully',
 *   data: {
 *     id: string,
 *     userId: string,
 *     emailNotificationsEnabled: true,
 *     emailDigestFrequency: 'daily',
 *     theme: 'system',
 *     dashboardLayout: 'default',
 *     language: 'en',
 *     timezone: 'Asia/Manila',
 *     createdAt: string,
 *     updatedAt: string
 *   }
 * }
 *
 * Errors:
 * - 401: Not authenticated
 * - 500: Database error
 */
export async function POST(_request: NextRequest) {
  try {
    // Get Supabase session
    const supabase = await createServerClient('employee');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Reset preferences to defaults
    const reset = await resetUserPreferences(userId);

    console.log(
      `[Settings Reset API] User ${userId} reset preferences to defaults`
    );

    return NextResponse.json({
      success: true,
      message: 'Preferences reset to defaults successfully',
      data: reset,
    });
  } catch (error) {
    console.error('[Settings Reset API] POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset user preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
