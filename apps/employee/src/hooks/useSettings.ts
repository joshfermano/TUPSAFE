/**
 * User Settings and Preferences Hooks
 *
 * React Query hooks for managing user preferences including
 * notifications, theme, layout, language, and timezone settings.
 *
 * @module hooks/useSettings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type DashboardLayout = 'default' | 'compact' | 'detailed';
export type Language = 'en' | 'fil';
export type EmailDigestFrequency = 'realtime' | 'daily' | 'weekly' | 'never';

export interface UserPreferences {
  id: string;
  userId: string;
  emailNotificationsEnabled: boolean;
  emailDigestFrequency: EmailDigestFrequency;
  theme: Theme;
  dashboardLayout: DashboardLayout;
  language: Language;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreferencesUpdate {
  emailNotificationsEnabled?: boolean;
  emailDigestFrequency?: EmailDigestFrequency;
  theme?: Theme;
  dashboardLayout?: DashboardLayout;
  language?: Language;
  timezone?: string;
}

// ============================================================================
// Query Key Factory
// ============================================================================

export const settingsKeys = {
  all: ['settings'] as const,
  preferences: () => [...settingsKeys.all, 'preferences'] as const,
};

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch user preferences
 * Auto-creates preferences with defaults if missing
 */
async function fetchUserPreferences(): Promise<UserPreferences> {
  const response = await fetch('/api/settings', {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user preferences');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update user preferences
 * Supports partial updates (only provided fields are updated)
 */
async function updateUserPreferences(
  updates: PreferencesUpdate
): Promise<UserPreferences> {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || 'Failed to update preferences');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Reset preferences to defaults
 */
async function resetUserPreferences(): Promise<UserPreferences> {
  const response = await fetch('/api/settings/reset', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reset preferences');
  }

  const result = await response.json();
  return result.data;
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch user settings and preferences
 *
 * Auto-creates preferences with defaults if they don't exist.
 * Data is cached for 5 minutes (preferences change infrequently).
 *
 * @returns Query result with user preferences
 *
 * @example
 * ```tsx
 * const { data: settings, isLoading } = useUserSettings();
 * ```
 */
export function useUserSettings() {
  return useQuery({
    queryKey: settingsKeys.preferences(),
    queryFn: fetchUserPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to update user settings and preferences
 *
 * Supports optimistic updates for immediate UI feedback.
 * Only updates the fields provided in the update object.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateSettings();
 * updateMutation.mutate({ theme: 'dark', language: 'en' });
 * ```
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserPreferences,
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: settingsKeys.preferences() });

      // Snapshot the previous value
      const previousSettings =
        queryClient.getQueryData<UserPreferences>(settingsKeys.preferences());

      // Optimistically update to the new value
      if (previousSettings) {
        queryClient.setQueryData<UserPreferences>(settingsKeys.preferences(), {
          ...previousSettings,
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousSettings };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          settingsKeys.preferences(),
          context.previousSettings
        );
      }

      toast.error('Failed to update settings', {
        description:
          error.message || 'An error occurred while updating your settings.',
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: settingsKeys.preferences() });

      toast.success('Settings updated', {
        description: 'Your preferences have been saved.',
      });
    },
  });
}

/**
 * Hook to reset settings to default values
 *
 * Resets all user preferences to system defaults.
 * Useful for troubleshooting or starting fresh.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const resetMutation = useResetSettings();
 * resetMutation.mutate();
 * ```
 */
export function useResetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetUserPreferences,
    onSuccess: (data) => {
      // Update cache with new default values
      queryClient.setQueryData(settingsKeys.preferences(), data);

      toast.success('Settings reset', {
        description: 'Your preferences have been reset to defaults.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to reset settings', {
        description:
          error.message || 'An error occurred while resetting your settings.',
      });
    },
  });
}

/**
 * Hook to update theme preference
 *
 * Convenience hook for updating only the theme setting.
 * Useful for theme toggle components.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const { mutate: setTheme } = useUpdateTheme();
 * setTheme('dark');
 * ```
 */
export function useUpdateTheme() {
  const updateSettings = useUpdateSettings();

  return {
    ...updateSettings,
    mutate: (theme: Theme) => updateSettings.mutate({ theme }),
  };
}

/**
 * Hook to update language preference
 *
 * Convenience hook for updating only the language setting.
 * Useful for language selector components.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const { mutate: setLanguage } = useUpdateLanguage();
 * setLanguage('fil');
 * ```
 */
export function useUpdateLanguage() {
  const updateSettings = useUpdateSettings();

  return {
    ...updateSettings,
    mutate: (language: Language) => updateSettings.mutate({ language }),
  };
}

/**
 * Hook to update dashboard layout preference
 *
 * Convenience hook for updating only the layout setting.
 * Useful for layout switcher components.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const { mutate: setLayout } = useUpdateDashboardLayout();
 * setLayout('compact');
 * ```
 */
export function useUpdateDashboardLayout() {
  const updateSettings = useUpdateSettings();

  return {
    ...updateSettings,
    mutate: (dashboardLayout: DashboardLayout) =>
      updateSettings.mutate({ dashboardLayout }),
  };
}

/**
 * Hook to toggle email notifications
 *
 * Convenience hook for toggling email notifications on/off.
 * Useful for notification toggle components.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const { mutate: toggleNotifications } = useToggleEmailNotifications();
 * toggleNotifications(true);
 * ```
 */
export function useToggleEmailNotifications() {
  const updateSettings = useUpdateSettings();

  return {
    ...updateSettings,
    mutate: (enabled: boolean) =>
      updateSettings.mutate({ emailNotificationsEnabled: enabled }),
  };
}

/**
 * Hook to update email digest frequency
 *
 * Convenience hook for updating email digest settings.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const { mutate: setDigestFrequency } = useUpdateEmailDigest();
 * setDigestFrequency('daily');
 * ```
 */
export function useUpdateEmailDigest() {
  const updateSettings = useUpdateSettings();

  return {
    ...updateSettings,
    mutate: (frequency: EmailDigestFrequency) =>
      updateSettings.mutate({ emailDigestFrequency: frequency }),
  };
}
