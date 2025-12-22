/**
 * User Settings and Preferences API
 * Manages user-specific preferences including notifications, UI, and language settings
 *
 * Security:
 * - Requires active session
 * - Users can only access/modify their own preferences
 * - All updates are validated against schema constraints
 *
 * Features:
 * - Auto-creates preferences with defaults if missing
 * - Supports partial updates (only updates provided fields)
 * - Validates enum values (theme, layout, language, digest frequency)
 * - Validates timezone (IANA format)
 * - Aggressive caching for GET requests (5 minutes)
 *
 * Routes:
 * - GET  /api/settings - Retrieve user preferences
 * - PATCH /api/settings - Update user preferences (partial updates supported)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import {
  getUserPreferences,
  updateUserPreferences,
  type PreferencesUpdate,
} from '@tupsafe/database/server';

/**
 * GET /api/settings
 * Retrieve user preferences with auto-creation of defaults if missing
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: string,
 *     userId: string,
 *     emailNotificationsEnabled: boolean,
 *     emailDigestFrequency: 'realtime' | 'daily' | 'weekly' | 'never',
 *     theme: 'light' | 'dark' | 'system',
 *     dashboardLayout: 'default' | 'compact' | 'detailed',
 *     language: 'en' | 'fil',
 *     timezone: string,
 *     createdAt: string,
 *     updatedAt: string
 *   }
 * }
 *
 * Errors:
 * - 401: Not authenticated
 * - 500: Database error
 */
export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get preferences (auto-creates if missing)
    const preferences = await getUserPreferences(userId);

    // Return with cache headers (preferences change infrequently)
    return NextResponse.json(
      {
        success: true,
        data: preferences,
      },
      {
        headers: {
          // Cache privately for 5 minutes
          'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[Settings API] GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings
 * Update user preferences with partial update support
 *
 * Request Body (all fields optional):
 * {
 *   emailNotificationsEnabled?: boolean,
 *   emailDigestFrequency?: 'realtime' | 'daily' | 'weekly' | 'never',
 *   theme?: 'light' | 'dark' | 'system',
 *   dashboardLayout?: 'default' | 'compact' | 'detailed',
 *   language?: 'en' | 'fil',
 *   timezone?: string // IANA timezone (e.g., 'Asia/Manila')
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: 'Preferences updated successfully',
 *   data: {
 *     // Updated preferences object
 *   }
 * }
 *
 * Validation:
 * - theme: Must be 'light', 'dark', or 'system'
 * - dashboardLayout: Must be 'default', 'compact', or 'detailed'
 * - language: Must be 'en' or 'fil'
 * - emailDigestFrequency: Must be 'realtime', 'daily', 'weekly', or 'never'
 * - timezone: Must be a valid IANA timezone identifier
 *
 * Errors:
 * - 400: Invalid request body or validation error
 * - 401: Not authenticated
 * - 500: Database error
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Parse request body
    let body: PreferencesUpdate;
    try {
      body = await request.json();
    } catch (_parseError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Validate that body is an object
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: 'Request body must be a preferences object',
        },
        { status: 400 }
      );
    }

    // Check that at least one field is provided
    const allowedFields = [
      'emailNotificationsEnabled',
      'emailDigestFrequency',
      'theme',
      'dashboardLayout',
      'language',
      'timezone',
      'profileVisibility',
      'dataSharingEnabled',
      'activityTrackingEnabled',
      'pushNotificationsEnabled',
      'smsNotificationsEnabled',
      'soundEnabled',
    ];

    const providedFields = Object.keys(body).filter((key) =>
      allowedFields.includes(key)
    );

    if (providedFields.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid fields to update',
          details: `At least one of the following fields must be provided: ${allowedFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update preferences (validation happens in the query function)
    try {
      const updated = await updateUserPreferences(userId, body);

      console.log(
        `[Settings API] User ${userId} updated preferences:`,
        providedFields.join(', ')
      );

      return NextResponse.json({
        success: true,
        message: 'Preferences updated successfully',
        data: updated,
      });
    } catch (updateError) {
      // Handle validation errors from the query function
      if (updateError instanceof Error) {
        // Check if it's a validation error
        if (
          updateError.message.includes('Invalid') ||
          updateError.message.includes('Must be')
        ) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: updateError.message,
            },
            { status: 400 }
          );
        }
      }
      throw updateError;
    }
  } catch (error) {
    console.error('[Settings API] PATCH error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update user preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
