/**
 * Session Management
 * Handles cookie configuration and session validation
 */

import { cookies } from 'next/headers';

/**
 * Session configuration constants
 */
export const SESSION_CONFIG = {
  cookieName: 'tupsafe-session',
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
  refreshThreshold: 15 * 60 * 1000, // Refresh if last activity > 15 minutes ago
};

/**
 * Cookie options for session management
 */
export function getSessionCookieOptions(
  isProduction: boolean = process.env.NODE_ENV === 'production'
) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: SESSION_CONFIG.maxAge,
    path: '/',
  };
}

/**
 * Session data interface
 */
export interface SessionData {
  userId: string;
  id: string; // Alias for userId for convenience
  email: string;
  employeeId?: string;
  role: string;
  lastActivity: number;
  deviceFingerprint?: string;
}

/**
 * Create a session cookie
 */
export async function createSession(sessionData: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const sessionString = JSON.stringify({
    ...sessionData,
    id: sessionData.userId, // Ensure id is set to userId
    lastActivity: Date.now(),
  });

  cookieStore.set(
    SESSION_CONFIG.cookieName,
    sessionString,
    getSessionCookieOptions()
  );
}

/**
 * Get current session data
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_CONFIG.cookieName);

    if (!sessionCookie) {
      return null;
    }

    const sessionData: SessionData = JSON.parse(sessionCookie.value);
    return sessionData;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Update last activity timestamp
 */
export async function updateSessionActivity(): Promise<boolean> {
  try {
    const session = await getSession();

    if (!session) {
      return false;
    }

    // Update last activity
    session.lastActivity = Date.now();

    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_CONFIG.cookieName,
      JSON.stringify(session),
      getSessionCookieOptions()
    );

    return true;
  } catch (error) {
    console.error('Error updating session activity:', error);
    return false;
  }
}

/**
 * Check if session has expired due to inactivity
 */
export function isSessionExpired(session: SessionData): boolean {
  const now = Date.now();
  const timeSinceLastActivity = now - session.lastActivity;

  return timeSinceLastActivity > SESSION_CONFIG.inactivityTimeout;
}

/**
 * Check if session needs to be refreshed
 */
export function shouldRefreshSession(session: SessionData): boolean {
  const now = Date.now();
  const timeSinceLastActivity = now - session.lastActivity;

  return timeSinceLastActivity > SESSION_CONFIG.refreshThreshold;
}

/**
 * Validate session and check expiry
 */
export async function validateSession(): Promise<{
  valid: boolean;
  session?: SessionData;
  reason?: string;
}> {
  const session = await getSession();

  if (!session) {
    return {
      valid: false,
      reason: 'No session found',
    };
  }

  // Check if session has expired
  if (isSessionExpired(session)) {
    await destroySession();
    return {
      valid: false,
      reason: 'Session expired due to inactivity',
    };
  }

  // Update activity if needed
  if (shouldRefreshSession(session)) {
    await updateSessionActivity();
  }

  return {
    valid: true,
    session,
  };
}

/**
 * Destroy session (logout)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_CONFIG.cookieName);
}

/**
 * Get remaining session time in milliseconds
 */
export function getRemainingSessionTime(session: SessionData): number {
  const now = Date.now();
  const timeSinceLastActivity = now - session.lastActivity;
  const remaining = SESSION_CONFIG.inactivityTimeout - timeSinceLastActivity;

  return Math.max(0, remaining);
}

/**
 * Format remaining time as human-readable string
 */
export function formatRemainingTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Check if user has required role
 */
export async function checkUserRole(allowedRoles: string[]): Promise<boolean> {
  const validation = await validateSession();

  if (!validation.valid || !validation.session) {
    return false;
  }

  return allowedRoles.includes(validation.session.role);
}

/**
 * Get user from session
 */
export async function getSessionUser(): Promise<{
  userId: string;
  id: string;
  email: string;
  employeeId?: string;
  role: string;
} | null> {
  const validation = await validateSession();

  if (!validation.valid || !validation.session) {
    return null;
  }

  const { userId, email, employeeId, role } = validation.session;
  return { userId, id: userId, email, employeeId, role };
}

/**
 * Check if user has required role using Supabase session directly
 * This is the recommended approach for API routes
 */
export async function checkUserRoleFromSupabase(allowedRoles: string[]): Promise<boolean> {
  try {
    // Use static imports for better performance and reliability
    const { createClient } = require('../supabase/server');
    const { db, profiles } = require('@tupsafe/database/server');
    const { eq } = require('drizzle-orm');

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('[checkUserRoleFromSupabase] Session error or no session:', sessionError?.message || 'No session');
      return false;
    }

    const userId = session.user.id;

    // Fetch user profile to get role
    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      console.error('[checkUserRoleFromSupabase] No profile found for user:', userId);
      return false;
    }

    const hasRole = allowedRoles.includes(profile.role);
    if (!hasRole) {
      console.error('[checkUserRoleFromSupabase] User role not in allowed roles:', {
        userRole: profile.role,
        allowedRoles,
      });
    }

    return hasRole;
  } catch (error) {
    console.error('[checkUserRoleFromSupabase] Error checking user role:', error);
    return false;
  }
}

/**
 * Get user from Supabase session directly
 * This is the recommended approach for API routes
 */
export async function getUserFromSupabase(): Promise<{
  userId: string;
  id: string;
  email: string;
  role: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  departmentId?: string;
  positionId?: string;
  accountStatus?: string;
  isActive?: boolean;
} | null> {
  try {
    // Use static imports for better performance and reliability
    const { createClient } = require('../supabase/server');
    const { db, profiles } = require('@tupsafe/database/server');
    const { eq } = require('drizzle-orm');

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return null;
    }

    const userId = session.user.id;
    const email = session.user.email || '';

    // Fetch full user profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return null;
    }

    return {
      userId,
      id: userId,
      email,
      role: profile.role,
      employeeId: profile.employeeId || undefined,
      firstName: profile.firstName || undefined,
      lastName: profile.lastName || undefined,
      middleName: profile.middleName || undefined,
      departmentId: profile.departmentId || undefined,
      positionId: profile.positionId || undefined,
      accountStatus: profile.accountStatus || undefined,
      isActive: profile.isActive || undefined,
    };
  } catch (error) {
    console.error('[getUserFromSupabase] Error getting user:', error);
    return null;
  }
}
