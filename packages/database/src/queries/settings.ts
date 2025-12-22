/**
 * User Settings and Preferences Queries
 *
 * Production-ready Drizzle ORM queries for user preferences management including
 * notification settings, UI preferences, and bulk operations. All queries implement
 * upsert patterns to ensure preferences exist before access.
 *
 * @module queries/settings
 */

import { db } from '../db';
import { userPreferences } from '../schema';
import { eq } from 'drizzle-orm';
import type { UserPreference, NewUserPreference } from '../types';

/**
 * Default user preferences applied when creating new preference records
 */
const DEFAULT_PREFERENCES = {
  emailNotificationsEnabled: true,
  emailDigestFrequency: 'daily' as const,
  theme: 'system' as const,
  dashboardLayout: 'default' as const,
  language: 'en' as const,
  timezone: 'Asia/Manila',
  profileVisibility: 'colleagues' as const,
  dataSharingEnabled: false,
  activityTrackingEnabled: true,
  pushNotificationsEnabled: true,
  smsNotificationsEnabled: false,
  soundEnabled: true,
} satisfies Partial<NewUserPreference>;

/**
 * Notification-specific settings subset
 */
export type NotificationSettings = Pick<
  UserPreference,
  'emailNotificationsEnabled' | 'emailDigestFrequency'
>;

/**
 * UI-specific settings subset
 */
export type UIPreferences = Pick<
  UserPreference,
  'theme' | 'dashboardLayout' | 'language' | 'timezone'
>;

/**
 * Partial update type for user preferences
 */
export type PreferencesUpdate = Partial<
  Omit<UserPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

/**
 * Bulk update operation type
 */
export interface BulkPreferenceUpdate {
  userId: string;
  preferences: PreferencesUpdate;
}

/**
 * Valid timezone values (IANA timezone database)
 * This is a subset of commonly used timezones in the Philippines and Asia-Pacific
 */
const VALID_TIMEZONES = [
  'Asia/Manila',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'UTC',
] as const;

/**
 * Validates if a timezone string is valid
 *
 * @param timezone - Timezone string to validate
 * @returns boolean indicating if timezone is valid
 */
function isValidTimezone(timezone: string): boolean {
  // Check against common timezones list
  if (VALID_TIMEZONES.includes(timezone as (typeof VALID_TIMEZONES)[number])) {
    return true;
  }

  // Fallback: try to validate using Intl API
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates preferences update object
 *
 * @param preferences - Preferences object to validate
 * @throws Error if validation fails
 */
function validatePreferences(preferences: PreferencesUpdate): void {
  // Validate timezone if provided
  if (preferences.timezone && !isValidTimezone(preferences.timezone)) {
    throw new Error(
      `Invalid timezone: ${preferences.timezone}. Must be a valid IANA timezone identifier.`
    );
  }

  // Validate enum values
  const validThemes = ['light', 'dark', 'system'] as const;
  if (preferences.theme && !validThemes.includes(preferences.theme)) {
    throw new Error(
      `Invalid theme: ${preferences.theme}. Must be one of: ${validThemes.join(
        ', '
      )}`
    );
  }

  const validLayouts = ['default', 'compact', 'detailed'] as const;
  if (
    preferences.dashboardLayout &&
    !validLayouts.includes(preferences.dashboardLayout)
  ) {
    throw new Error(
      `Invalid dashboard layout: ${
        preferences.dashboardLayout
      }. Must be one of: ${validLayouts.join(', ')}`
    );
  }

  const validLanguages = ['en', 'fil'] as const;
  if (preferences.language && !validLanguages.includes(preferences.language)) {
    throw new Error(
      `Invalid language: ${
        preferences.language
      }. Must be one of: ${validLanguages.join(', ')}`
    );
  }

  const validDigestFrequencies = [
    'realtime',
    'daily',
    'weekly',
    'never',
  ] as const;
  if (
    preferences.emailDigestFrequency &&
    !validDigestFrequencies.includes(preferences.emailDigestFrequency)
  ) {
    throw new Error(
      `Invalid email digest frequency: ${
        preferences.emailDigestFrequency
      }. Must be one of: ${validDigestFrequencies.join(', ')}`
    );
  }

  const validProfileVisibility = ['public', 'private', 'colleagues'] as const;
  if (
    preferences.profileVisibility &&
    !validProfileVisibility.includes(preferences.profileVisibility)
  ) {
    throw new Error(
      `Invalid profile visibility: ${
        preferences.profileVisibility
      }. Must be one of: ${validProfileVisibility.join(', ')}`
    );
  }
}

/**
 * Get user preferences by userId, creating default preferences if none exist
 *
 * This function implements an upsert pattern - it will automatically create
 * a preferences record with default values if the user doesn't have one yet.
 * This ensures all users always have preferences available.
 *
 * Uses index: user_preferences_user_id_idx
 *
 * @param userId - UUID of the user
 * @returns Promise<UserPreference> User's preference settings
 * @throws Error if userId is invalid or database operation fails
 *
 * @example
 * const preferences = await getUserPreferences('550e8400-e29b-41d4-a716-446655440000');
 * console.log(`Theme: ${preferences.theme}, Language: ${preferences.language}`);
 */
export async function getUserPreferences(
  userId: string
): Promise<UserPreference> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    // Attempt to find existing preferences
    let prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });

    // Create default preferences if none exist
    if (!prefs) {
      console.log(
        `[getUserPreferences] Creating default preferences for user: ${userId}`
      );

      const [newPrefs] = await db
        .insert(userPreferences)
        .values({
          userId,
          ...DEFAULT_PREFERENCES,
        })
        .returning();

      prefs = newPrefs;
    }

    return prefs;
  } catch (error) {
    console.error('[getUserPreferences] Database error:', error);
    throw new Error('Failed to fetch user preferences');
  }
}

/**
 * Update user preferences with partial update support
 *
 * Only updates the fields provided in the preferences object. Automatically
 * updates the updatedAt timestamp. If the user has no preferences, they will
 * be created first with defaults, then updated.
 *
 * @param userId - UUID of the user
 * @param preferences - Partial preferences object with fields to update
 * @returns Promise<UserPreference> Updated user preferences
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * const updated = await updateUserPreferences(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   { theme: 'dark', emailNotificationsEnabled: false }
 * );
 * console.log(`Updated theme to ${updated.theme}`);
 */
export async function updateUserPreferences(
  userId: string,
  preferences: PreferencesUpdate
): Promise<UserPreference> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    if (!preferences || typeof preferences !== 'object') {
      throw new Error('Valid preferences object is required');
    }

    // Validate preferences
    validatePreferences(preferences);

    // Ensure user has preferences (will create if not exists)
    await getUserPreferences(userId);

    // Update preferences
    const [updated] = await db
      .update(userPreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update preferences');
    }

    console.log(
      `[updateUserPreferences] Updated preferences for user: ${userId}`
    );
    return updated;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[updateUserPreferences] Error:', error.message);
      throw error;
    }
    console.error('[updateUserPreferences] Database error:', error);
    throw new Error('Failed to update user preferences');
  }
}

/**
 * Get notification-specific settings for a user
 *
 * Returns only notification-related preferences (email notifications and digest frequency).
 * Creates default preferences if user has none.
 *
 * @param userId - UUID of the user
 * @returns Promise<NotificationSettings> Notification settings
 * @throws Error if userId is invalid or database operation fails
 *
 * @example
 * const notifSettings = await getNotificationSettings('550e8400-e29b-41d4-a716-446655440000');
 * if (notifSettings.emailNotificationsEnabled) {
 *   console.log(`Email digest: ${notifSettings.emailDigestFrequency}`);
 * }
 */
export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings> {
  try {
    const prefs = await getUserPreferences(userId);

    return {
      emailNotificationsEnabled: prefs.emailNotificationsEnabled,
      emailDigestFrequency: prefs.emailDigestFrequency,
    };
  } catch (error) {
    console.error('[getNotificationSettings] Database error:', error);
    throw new Error('Failed to fetch notification settings');
  }
}

/**
 * Update notification-specific settings for a user
 *
 * Updates only notification-related preferences. Other preferences remain unchanged.
 * Creates default preferences if user has none.
 *
 * @param userId - UUID of the user
 * @param settings - Partial notification settings to update
 * @returns Promise<NotificationSettings> Updated notification settings
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * const updated = await updateNotificationSettings(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   { emailDigestFrequency: 'weekly' }
 * );
 * console.log(`Digest frequency set to ${updated.emailDigestFrequency}`);
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  try {
    const updated = await updateUserPreferences(userId, settings);

    return {
      emailNotificationsEnabled: updated.emailNotificationsEnabled,
      emailDigestFrequency: updated.emailDigestFrequency,
    };
  } catch (error) {
    console.error('[updateNotificationSettings] Database error:', error);
    throw new Error('Failed to update notification settings');
  }
}

/**
 * Get UI-specific preferences for a user
 *
 * Returns only UI-related preferences (theme, layout, language, timezone).
 * Creates default preferences if user has none.
 *
 * @param userId - UUID of the user
 * @returns Promise<UIPreferences> UI preferences
 * @throws Error if userId is invalid or database operation fails
 *
 * @example
 * const uiPrefs = await getUIPreferences('550e8400-e29b-41d4-a716-446655440000');
 * console.log(`Theme: ${uiPrefs.theme}, Language: ${uiPrefs.language}`);
 */
export async function getUIPreferences(userId: string): Promise<UIPreferences> {
  try {
    const prefs = await getUserPreferences(userId);

    return {
      theme: prefs.theme,
      dashboardLayout: prefs.dashboardLayout,
      language: prefs.language,
      timezone: prefs.timezone,
    };
  } catch (error) {
    console.error('[getUIPreferences] Database error:', error);
    throw new Error('Failed to fetch UI preferences');
  }
}

/**
 * Update UI-specific preferences for a user
 *
 * Updates only UI-related preferences. Other preferences remain unchanged.
 * Creates default preferences if user has none.
 *
 * @param userId - UUID of the user
 * @param preferences - Partial UI preferences to update
 * @returns Promise<UIPreferences> Updated UI preferences
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * const updated = await updateUIPreferences(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   { theme: 'dark', language: 'fil' }
 * );
 * console.log(`Theme: ${updated.theme}, Language: ${updated.language}`);
 */
export async function updateUIPreferences(
  userId: string,
  preferences: Partial<UIPreferences>
): Promise<UIPreferences> {
  try {
    const updated = await updateUserPreferences(userId, preferences);

    return {
      theme: updated.theme,
      dashboardLayout: updated.dashboardLayout,
      language: updated.language,
      timezone: updated.timezone,
    };
  } catch (error) {
    console.error('[updateUIPreferences] Database error:', error);
    throw new Error('Failed to update UI preferences');
  }
}

/**
 * Reset user preferences to default values
 *
 * Resets all user preferences back to system defaults. This is useful for
 * troubleshooting or when a user wants to start fresh.
 *
 * @param userId - UUID of the user
 * @returns Promise<UserPreference> Reset preferences with default values
 * @throws Error if userId is invalid or database operation fails
 *
 * @example
 * const reset = await resetUserPreferences('550e8400-e29b-41d4-a716-446655440000');
 * console.log('Preferences reset to defaults');
 */
export async function resetUserPreferences(
  userId: string
): Promise<UserPreference> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    // Ensure user has preferences (will create if not exists)
    await getUserPreferences(userId);

    // Reset to defaults
    const [reset] = await db
      .update(userPreferences)
      .set({
        ...DEFAULT_PREFERENCES,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    if (!reset) {
      throw new Error('Failed to reset preferences');
    }

    console.log(`[resetUserPreferences] Reset preferences for user: ${userId}`);
    return reset;
  } catch (error) {
    console.error('[resetUserPreferences] Database error:', error);
    throw new Error('Failed to reset user preferences');
  }
}

/**
 * Bulk update preferences for multiple users
 *
 * Admin function to update preferences for multiple users in a single transaction.
 * This is useful for system-wide preference updates or migrations. Each update
 * is validated independently, and the entire operation is atomic - if any update
 * fails, all changes are rolled back.
 *
 * @param updates - Array of user IDs and their preference updates
 * @returns Promise<UserPreference[]> Array of updated user preferences
 * @throws Error if any validation fails or database operation fails
 *
 * @example
 * const updates = [
 *   {
 *     userId: '550e8400-e29b-41d4-a716-446655440000',
 *     preferences: { emailDigestFrequency: 'weekly' }
 *   },
 *   {
 *     userId: '550e8400-e29b-41d4-a716-446655440001',
 *     preferences: { theme: 'dark' }
 *   }
 * ];
 * const results = await bulkUpdatePreferences(updates);
 * console.log(`Updated ${results.length} user preferences`);
 */
export async function bulkUpdatePreferences(
  updates: BulkPreferenceUpdate[]
): Promise<UserPreference[]> {
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Valid updates array is required');
    }

    // Validate all updates first
    for (const update of updates) {
      if (!update.userId || typeof update.userId !== 'string') {
        throw new Error('All updates must have a valid user ID');
      }
      if (!update.preferences || typeof update.preferences !== 'object') {
        throw new Error('All updates must have a valid preferences object');
      }
      validatePreferences(update.preferences);
    }

    console.log(
      `[bulkUpdatePreferences] Processing ${updates.length} preference updates`
    );

    // Execute updates in a transaction
    const results = await db.transaction(async (tx) => {
      const updatedPreferences: UserPreference[] = [];

      for (const update of updates) {
        // Ensure user has preferences (create if not exists)
        let existingPrefs = await tx.query.userPreferences.findFirst({
          where: eq(userPreferences.userId, update.userId),
        });

        if (!existingPrefs) {
          // Create default preferences
          const [newPrefs] = await tx
            .insert(userPreferences)
            .values({
              userId: update.userId,
              ...DEFAULT_PREFERENCES,
            })
            .returning();

          existingPrefs = newPrefs;
        }

        // Update preferences
        const [updated] = await tx
          .update(userPreferences)
          .set({
            ...update.preferences,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, update.userId))
          .returning();

        if (!updated) {
          throw new Error(
            `Failed to update preferences for user: ${update.userId}`
          );
        }

        updatedPreferences.push(updated);
      }

      return updatedPreferences;
    });

    console.log(
      `[bulkUpdatePreferences] Successfully updated ${results.length} user preferences`
    );
    return results;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[bulkUpdatePreferences] Error:', error.message);
      throw error;
    }
    console.error('[bulkUpdatePreferences] Database error:', error);
    throw new Error('Failed to bulk update user preferences');
  }
}
