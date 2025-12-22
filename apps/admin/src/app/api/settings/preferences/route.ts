/**
 * User Preferences Settings API - GET/PUT /api/settings/preferences
 *
 * Provides user preferences management for the admin portal settings page.
 * Manages notification settings, UI preferences, and localization options.
 *
 * Features:
 * - GET: Fetch current user's preferences (creates defaults if not exists)
 * - PUT: Update user preferences (upsert operation)
 * - Default preferences creation on first access
 * - Audit logging for preference updates
 * - Validation using Zod schemas from @tupsafe/types
 *
 * Security:
 * - Requires active session
 * - Users can only access/update their own preferences
 * - Performance logging for optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, createServerClient } from '@tupsafe/auth/server';
import { db, auditLogs } from '@tupsafe/database/server';
import { userPreferences } from '@tupsafe/database/schema';
import { eq } from 'drizzle-orm';
import {
  updatePreferencesRequestSchema,
  type UpdatePreferencesResponse,
  type UserPreferences,
} from '@tupsafe/types';

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES = {
  emailNotificationsEnabled: true,
  emailDigestFrequency: 'daily' as const,
  theme: 'system' as const,
  dashboardLayout: 'default' as const,
  language: 'en' as const,
  timezone: 'Asia/Manila',
};

/**
 * GET /api/settings/preferences
 * Fetch current user's preferences (creates defaults if not exists)
 */
export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[Preferences Settings API] GET request received');

    // Verify authentication using portal-specific session
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'hr', 'supervisor', 'employee'],
      'admin'
    );
    if (!hasPermission) {
      console.log('[Preferences Settings API] No authenticated session');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get Supabase client for user details
    const supabase = await createServerClient('admin');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;
    console.log(`[Preferences Settings API] Fetching preferences for user: ${userId}`);

    // Fetch existing preferences
    const [existingPrefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    let preferences: UserPreferences;

    // If no preferences exist, create default ones
    if (!existingPrefs) {
      console.log('[Preferences Settings API] No preferences found, creating defaults');

      const [newPrefs] = await db
        .insert(userPreferences)
        .values({
          userId: userId,
          ...DEFAULT_PREFERENCES,
        })
        .returning();

      if (!newPrefs) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create default preferences',
          } as UpdatePreferencesResponse,
          { status: 500 }
        );
      }

      preferences = {
        id: newPrefs.id,
        userId: newPrefs.userId,
        emailNotificationsEnabled: newPrefs.emailNotificationsEnabled || true,
        emailDigestFrequency: newPrefs.emailDigestFrequency,
        theme: newPrefs.theme,
        dashboardLayout: newPrefs.dashboardLayout,
        language: newPrefs.language,
        timezone: newPrefs.timezone,
        createdAt: newPrefs.createdAt,
        updatedAt: newPrefs.updatedAt,
      };
    } else {
      preferences = {
        id: existingPrefs.id,
        userId: existingPrefs.userId,
        emailNotificationsEnabled: existingPrefs.emailNotificationsEnabled || true,
        emailDigestFrequency: existingPrefs.emailDigestFrequency,
        theme: existingPrefs.theme,
        dashboardLayout: existingPrefs.dashboardLayout,
        language: existingPrefs.language,
        timezone: existingPrefs.timezone,
        createdAt: existingPrefs.createdAt,
        updatedAt: existingPrefs.updatedAt,
      };
    }

    const duration = Date.now() - startTime;
    console.log(`[Preferences Settings API] Preferences fetched successfully in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        message: 'Preferences fetched successfully',
        preferences,
      },
      {
        status: 200,
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[Preferences Settings API] GET error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch preferences',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as UpdatePreferencesResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/preferences
 * Update current user's preferences (upsert operation)
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Preferences Settings API] PUT request received');

    // Verify authentication using portal-specific session
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'hr', 'supervisor', 'employee'],
      'admin'
    );
    if (!hasPermission) {
      console.log('[Preferences Settings API] No authenticated session');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get Supabase client for user details
    const supabase = await createServerClient('admin');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;
    console.log(`[Preferences Settings API] Updating preferences for user: ${userId}`);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updatePreferencesRequestSchema.parse(body);

    // Get current preferences for audit logging
    const [currentPrefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    // Prepare update data (only include fields that were provided)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.emailNotificationsEnabled !== undefined) {
      updateData.emailNotificationsEnabled = validatedData.emailNotificationsEnabled;
    }
    if (validatedData.emailDigestFrequency !== undefined) {
      updateData.emailDigestFrequency = validatedData.emailDigestFrequency;
    }
    if (validatedData.theme !== undefined) {
      updateData.theme = validatedData.theme;
    }
    if (validatedData.dashboardLayout !== undefined) {
      updateData.dashboardLayout = validatedData.dashboardLayout;
    }
    if (validatedData.language !== undefined) {
      updateData.language = validatedData.language;
    }
    if (validatedData.timezone !== undefined) {
      updateData.timezone = validatedData.timezone;
    }

    let updatedPrefs;

    // Upsert: Update if exists, insert if not
    if (currentPrefs) {
      // Update existing preferences
      [updatedPrefs] = await db
        .update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, userId))
        .returning();
    } else {
      // Insert new preferences with defaults for fields not provided
      [updatedPrefs] = await db
        .insert(userPreferences)
        .values({
          userId: userId,
          ...DEFAULT_PREFERENCES,
          ...updateData,
        })
        .returning();
    }

    if (!updatedPrefs) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update preferences',
        } as UpdatePreferencesResponse,
        { status: 500 }
      );
    }

    // Get client IP and user agent for audit log
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit log entry
    await db.insert(auditLogs).values({
      userId: userId,
      action: currentPrefs ? 'update_preferences' : 'create_preferences',
      entityType: 'user_preferences',
      entityId: updatedPrefs.id,
      changes: currentPrefs
        ? {
            before: {
              emailNotificationsEnabled: currentPrefs.emailNotificationsEnabled,
              emailDigestFrequency: currentPrefs.emailDigestFrequency,
              theme: currentPrefs.theme,
              dashboardLayout: currentPrefs.dashboardLayout,
              language: currentPrefs.language,
              timezone: currentPrefs.timezone,
            },
            after: validatedData,
          }
        : {
            after: validatedData,
          },
      ipAddress: ip,
      userAgent: userAgent,
    });

    const preferences: UserPreferences = {
      id: updatedPrefs.id,
      userId: updatedPrefs.userId,
      emailNotificationsEnabled: updatedPrefs.emailNotificationsEnabled || true,
      emailDigestFrequency: updatedPrefs.emailDigestFrequency,
      theme: updatedPrefs.theme,
      dashboardLayout: updatedPrefs.dashboardLayout,
      language: updatedPrefs.language,
      timezone: updatedPrefs.timezone,
      createdAt: updatedPrefs.createdAt,
      updatedAt: updatedPrefs.updatedAt,
    };

    const duration = Date.now() - startTime;
    console.log(`[Preferences Settings API] Preferences updated successfully in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        message: 'Preferences updated successfully',
        preferences,
      } as UpdatePreferencesResponse,
      {
        status: 200,
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[Preferences Settings API] PUT error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          error: error.message,
        } as UpdatePreferencesResponse,
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update preferences',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as UpdatePreferencesResponse,
      { status: 500 }
    );
  }
}
