/**
 * Admin Portal Settings API Types and Validation Schemas
 *
 * Provides type-safe validation schemas for admin settings management
 * including user profile, preferences, password changes, and active sessions.
 */

import { z } from 'zod';

// ========================================
// User Profile Types
// ========================================

/**
 * User profile data from profiles table
 * Used for displaying and editing user profile information
 */
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string; // From Supabase auth.users
  employeeId: string | null;
  departmentId: string | null;
  positionId: string | null;
  phoneNumber: string | null;
  avatarPath: string | null; // Supabase Storage path
  avatarUrl: string | null; // Public URL for the avatar
  role: 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor';
  accountStatus: 'pending' | 'active' | 'suspended' | 'rejected';
  createdAt: Date;
  updatedAt: Date;

  // Department and position details (joined data)
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  position?: {
    id: string;
    title: string;
  } | null;
}

/**
 * Update profile request validation schema
 * Validates user profile update data
 */
export const updateProfileRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  middleName: z.string().max(100).optional().nullable(),
  phoneNumber: z
    .string()
    .regex(/^(\+63|0)?[0-9]{10}$/, 'Invalid Philippine phone number')
    .optional()
    .nullable(),
  // Email update is handled separately via Supabase Auth
  // employeeId, departmentId, positionId, role are admin-only fields
});

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

/**
 * Update profile response
 */
export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  profile?: UserProfile;
  error?: string;
}

// ========================================
// User Preferences Types
// ========================================

/**
 * User preferences data from user_preferences table
 * Stores admin portal UI and notification preferences
 */
export interface UserPreferences {
  id: string;
  userId: string;

  // Notification preferences
  emailNotificationsEnabled: boolean;
  emailDigestFrequency: 'realtime' | 'daily' | 'weekly' | 'never';

  // UI preferences
  theme: 'light' | 'dark' | 'system';
  dashboardLayout: 'default' | 'compact' | 'detailed';
  language: 'en' | 'fil';
  timezone: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update preferences request validation schema
 */
export const updatePreferencesRequestSchema = z.object({
  emailNotificationsEnabled: z.boolean().optional(),
  emailDigestFrequency: z
    .enum(['realtime', 'daily', 'weekly', 'never'])
    .optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  dashboardLayout: z.enum(['default', 'compact', 'detailed']).optional(),
  language: z.enum(['en', 'fil']).optional(),
  timezone: z
    .string()
    .max(50)
    .refine((tz) => {
      // Basic validation - check if timezone is in IANA format
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'Invalid timezone')
    .optional(),
});

export type UpdatePreferencesRequest = z.infer<
  typeof updatePreferencesRequestSchema
>;

/**
 * Update preferences response
 */
export interface UpdatePreferencesResponse {
  success: boolean;
  message: string;
  preferences?: UserPreferences;
  error?: string;
}

// ========================================
// Password Change Types
// ========================================

/**
 * Password strength validation
 * Requires: min 8 chars, uppercase, lowercase, number, special char
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must not exceed 72 characters') // bcrypt limit
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  );

/**
 * Change password request validation schema
 */
export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

/**
 * Change password response
 */
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

// ========================================
// Active Sessions Types
// ========================================

/**
 * Active session information
 * Represents a logged-in session across devices
 */
export interface ActiveSession {
  id: string;
  deviceName: string; // Browser + OS (parsed from user agent)
  browser: string; // e.g., "Chrome 120.0"
  os: string; // e.g., "Windows 10"
  location: string; // Approximate location from IP (city, country)
  ipAddress: string; // Masked IP (e.g., "192.168.1.xxx")
  lastActive: Date;
  createdAt: Date;
  isCurrent: boolean; // Is this the current session?
}

/**
 * Active sessions list response
 */
export interface ActiveSessionsResponse {
  success: boolean;
  sessions: ActiveSession[];
  currentSessionId: string;
  error?: string;
}

/**
 * Revoke session request validation schema
 */
export const revokeSessionRequestSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

export type RevokeSessionRequest = z.infer<typeof revokeSessionRequestSchema>;

/**
 * Revoke session response
 */
export interface RevokeSessionResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Revoke all sessions request validation schema
 * Used when user wants to log out from all devices
 */
export const revokeAllSessionsRequestSchema = z.object({
  keepCurrent: z.boolean().default(true),
});

export type RevokeAllSessionsRequest = z.infer<
  typeof revokeAllSessionsRequestSchema
>;

/**
 * Revoke all sessions response
 */
export interface RevokeAllSessionsResponse {
  success: boolean;
  message: string;
  sessionsRevoked: number;
  error?: string;
}

// ========================================
// Combined Settings Types
// ========================================

/**
 * Complete user settings data
 * Combines profile and preferences
 */
export interface UserSettings {
  profile: UserProfile;
  preferences: UserPreferences;
}

/**
 * User settings response
 */
export interface UserSettingsResponse {
  success: boolean;
  data?: UserSettings;
  error?: string;
}
