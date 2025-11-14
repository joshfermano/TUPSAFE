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
  email: string;
  employeeId?: string;
  role: string;
} | null> {
  const validation = await validateSession();

  if (!validation.valid || !validation.session) {
    return null;
  }

  const { userId, email, employeeId, role } = validation.session;
  return { userId, email, employeeId, role };
}
