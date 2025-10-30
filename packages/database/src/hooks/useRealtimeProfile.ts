'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRealtimeBase, getUserChannelName } from './useRealtimeBase';
import type { ProfileChangePayload, RealtimePayload } from '../types/realtime';
import type { Profile } from '../types';

/**
 * Query keys for profiles
 */
export const profileKeys = {
  all: ['profile'] as const,
  user: (userId: string) => [...profileKeys.all, userId] as const,
  details: (userId: string) => [...profileKeys.user(userId), 'details'] as const,
};

/**
 * Fields that trigger notifications when changed
 */
type NotifiableField = keyof Pick<
  Profile,
  'role' | 'departmentId' | 'positionId' | 'isActive'
>;

/**
 * Configuration options for useRealtimeProfile
 */
export interface UseRealtimeProfileOptions {
  /** Whether to show toast notifications for profile changes (default: true) */
  showToast?: boolean;
  /** Specific fields to notify on (default: ['role', 'departmentId', 'positionId', 'isActive']) */
  notifyOnFields?: NotifiableField[];
  /** Custom callback when profile is updated */
  onProfileUpdate?: (
    oldProfile: Partial<Profile>,
    newProfile: Partial<Profile>,
    changedFields: string[]
  ) => void;
  /** Custom callback for role changes */
  onRoleChange?: (oldRole: string, newRole: string) => void;
  /** Custom callback when account is deactivated */
  onDeactivate?: () => void;
}

/**
 * Profile field change detector
 */
interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  isSignificant: boolean;
}

/**
 * Default fields that trigger notifications
 */
const DEFAULT_NOTIFY_FIELDS: NotifiableField[] = [
  'role',
  'departmentId',
  'positionId',
  'isActive',
];

/**
 * Detect which fields changed between old and new profile
 */
function detectChangedFields(
  oldProfile: Partial<Profile>,
  newProfile: Partial<Profile>,
  notifyOnFields: NotifiableField[]
): FieldChange[] {
  const changes: FieldChange[] = [];

  // Check all keys in the new profile
  for (const key of Object.keys(newProfile) as Array<keyof Profile>) {
    const oldValue = oldProfile[key];
    const newValue = newProfile[key];

    // Skip if values are the same
    if (oldValue === newValue) continue;

    // Determine if this is a significant change
    const isSignificant = notifyOnFields.includes(key as NotifiableField);

    changes.push({
      field: key,
      oldValue,
      newValue,
      isSignificant,
    });
  }

  return changes;
}

/**
 * Get user-friendly notification message for profile changes
 */
function getProfileChangeMessage(
  change: FieldChange,
  profile: Partial<Profile>
): {
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
} | null {
  const { field, oldValue, newValue } = change;

  switch (field) {
    case 'role':
      return {
        title: 'Role Updated',
        description: `Your role has been updated to ${newValue}.`,
        type: 'info',
      };

    case 'departmentId':
      // In a real implementation, you'd fetch department names
      return {
        title: 'Department Changed',
        description: 'You have been assigned to a new department.',
        type: 'info',
      };

    case 'positionId':
      // In a real implementation, you'd fetch position titles
      return {
        title: 'Position Updated',
        description: 'Your position has been updated.',
        type: 'info',
      };

    case 'isActive':
      if (newValue === false) {
        return {
          title: 'Account Deactivated',
          description: 'Your account has been deactivated. Please contact HR for assistance.',
          type: 'error',
        };
      } else if (oldValue === false && newValue === true) {
        return {
          title: 'Account Activated',
          description: 'Your account has been reactivated. Welcome back!',
          type: 'success',
        };
      }
      break;

    // Add more cases for other significant fields as needed
    default:
      return null;
  }

  return null;
}

/**
 * Real-time hook for profile changes with React Query integration
 *
 * Subscribes to the profiles table and automatically updates the React Query
 * cache when the user's profile changes. Shows contextual toast notifications
 * for significant field changes.
 *
 * This hook intelligently detects profile changes and provides appropriate
 * feedback to the user:
 * - Role changes: Notification of new role assignment
 * - Department changes: Notification of department reassignment
 * - Position changes: Notification of position update
 * - Account deactivation: Critical alert with contact information
 * - Minor changes (name, contact): Silent updates without spam
 *
 * @param userId - User ID to subscribe to profile changes for
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * function ProfilePage() {
 *   const { user } = useAuth();
 *   const { status, isConnected } = useRealtimeProfile(user?.id || '', {
 *     showToast: true,
 *     notifyOnFields: ['role', 'departmentId', 'isActive'],
 *     onRoleChange: (oldRole, newRole) => {
 *       console.log(`Role changed from ${oldRole} to ${newRole}`);
 *       // Refresh permissions or redirect
 *     },
 *     onDeactivate: () => {
 *       console.log('Account deactivated');
 *       // Force logout
 *       signOut();
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <ConnectionIndicator connected={isConnected} />
 *       <ProfileDetails />
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeProfile(
  userId: string,
  options: UseRealtimeProfileOptions = {}
) {
  const {
    showToast = true,
    notifyOnFields = DEFAULT_NOTIFY_FIELDS,
    onProfileUpdate,
    onRoleChange,
    onDeactivate,
  } = options;

  const queryClient = useQueryClient();
  const channelName = getUserChannelName('profile', userId);
  const { supabase, subscribe, status, isConnected, error } = useRealtimeBase(channelName);

  useEffect(() => {
    // Don't subscribe if no user ID
    if (!userId) {
      console.warn('[Realtime] No userId provided for profile subscription');
      return;
    }

    subscribe(() =>
      supabase
        .channel(channelName)
        // Listen for profile updates
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload: RealtimePayload<ProfileChangePayload['new']>) => {
            const oldProfile = payload.old;
            const newProfile = payload.new;

            // Detect changed fields
            const changes = detectChangedFields(oldProfile, newProfile, notifyOnFields);

            if (changes.length === 0) {
              console.debug('[Realtime] Profile updated but no significant changes detected');
              return;
            }

            console.log('[Realtime] Profile updated:', {
              userId,
              changedFields: changes.map((c) => c.field),
              significantChanges: changes.filter((c) => c.isSignificant).length,
            });

            // Show toast notifications for significant changes only
            if (showToast) {
              const significantChanges = changes.filter((c) => c.isSignificant);

              significantChanges.forEach((change) => {
                const message = getProfileChangeMessage(change, newProfile);

                if (message) {
                  const toastFn = toast[message.type] || toast;

                  toastFn(message.title, {
                    description: message.description,
                    duration: message.type === 'error' ? 10000 : 5000, // Longer for errors
                  });
                }
              });
            }

            // Update React Query cache - directly update the profile data
            queryClient.setQueryData<Profile>(
              profileKeys.user(userId),
              (oldData) => {
                if (!oldData) return newProfile;
                return { ...oldData, ...newProfile };
              }
            );

            // Also invalidate to ensure consistency
            queryClient.invalidateQueries({
              queryKey: profileKeys.user(userId),
            });

            // Call custom callback with change details
            onProfileUpdate?.(
              oldProfile,
              newProfile,
              changes.map((c) => c.field)
            );

            // Handle specific change callbacks
            const roleChange = changes.find((c) => c.field === 'role');
            if (roleChange && onRoleChange) {
              onRoleChange(
                String(roleChange.oldValue),
                String(roleChange.newValue)
              );
            }

            const activeChange = changes.find((c) => c.field === 'isActive');
            if (activeChange && activeChange.newValue === false && onDeactivate) {
              onDeactivate();
            }
          }
        )
        // Listen for profile creation (rare, but handles edge cases)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload: RealtimePayload<ProfileChangePayload['new']>) => {
            const newProfile = payload.new;

            console.log('[Realtime] New profile created:', { userId });

            // Update React Query cache
            queryClient.setQueryData<Profile>(
              profileKeys.user(userId),
              newProfile
            );

            // Show welcome toast if enabled
            if (showToast) {
              toast.success('Profile Created', {
                description: 'Your profile has been created successfully.',
              });
            }
          }
        )
        // Listen for profile deletion (critical event)
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          () => {
            console.warn('[Realtime] Profile deleted:', { userId });

            // Clear cache
            queryClient.removeQueries({
              queryKey: profileKeys.user(userId),
            });

            // Show critical notification
            if (showToast) {
              toast.error('Profile Deleted', {
                description: 'Your profile has been deleted. Please contact support.',
                duration: 10000,
              });
            }

            // Trigger deactivation callback (profile deletion implies deactivation)
            onDeactivate?.();
          }
        )
    );
  }, [
    userId,
    channelName,
    showToast,
    notifyOnFields,
    onProfileUpdate,
    onRoleChange,
    onDeactivate,
    queryClient,
    subscribe,
    supabase,
  ]);

  return {
    /** Current subscription status */
    status,
    /** Whether the subscription is connected */
    isConnected,
    /** Error if subscription failed */
    error,
    /** Query keys for use with React Query */
    queryKeys: profileKeys,
  };
}

/**
 * Utility function to get profile by user ID (for use in queries)
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 *
 * @example
 * ```typescript
 * const { data: profile } = useQuery({
 *   queryKey: profileKeys.user(userId),
 *   queryFn: () => getProfileByUserId(createClient(), userId),
 * });
 * ```
 */
export async function getProfileByUserId(
  supabase: any,
  userId: string
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

/**
 * Utility function to update profile (for use in mutations)
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param updates - Profile fields to update
 *
 * @example
 * ```typescript
 * const updateProfileMutation = useMutation({
 *   mutationFn: (updates: Partial<Profile>) =>
 *     updateProfile(createClient(), userId, updates),
 *   // Real-time will automatically update the cache!
 * });
 * ```
 */
export async function updateProfile(
  supabase: any,
  userId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  // Remove fields that shouldn't be updated via this method
  const { id, createdAt, ...safeUpdates } = updates as any;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
