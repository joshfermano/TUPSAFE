/**
 * Session Management Queries
 *
 * Production-ready Drizzle ORM queries for managing user session logs including
 * session creation, termination, and activity tracking. All queries support
 * device fingerprinting and detailed session metadata.
 *
 * @module queries/sessions
 */

import { db } from '../db';
import { sessionLogs, profiles } from '../schema';
import { eq, and, desc } from 'drizzle-orm';
import type { SessionLog } from '../types';

/**
 * Parsed user agent information
 */
export interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
  full: string;
}

/**
 * Session creation parameters
 */
export interface CreateSessionParams {
  userId: string;
  ipAddress: string;
  userAgent: string;
  parsed: ParsedUserAgent;
  deviceFingerprint: string;
}

/**
 * Last login update parameters
 */
export interface UpdateLastLoginParams {
  userId: string;
  ipAddress: string;
  device: string;
}

/**
 * Get the most recent active session for a user
 *
 * Returns the current active session with all metadata. Useful for displaying
 * current session information in user settings.
 *
 * Uses indexes: session_logs_user_active_idx, session_logs_login_at_idx
 *
 * @param userId - UUID of the user
 * @returns Promise<SessionLog | null> Current active session or null if none found
 * @throws Error if userId is invalid or database operation fails
 *
 * @example
 * const session = await getCurrentSession('550e8400-e29b-41d4-a716-446655440000');
 * if (session) {
 *   console.log(`Logged in at ${session.loginAt} from ${session.ipAddress}`);
 * }
 */
export async function getCurrentSession(
  userId: string
): Promise<SessionLog | null> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    const session = await db.query.sessionLogs.findFirst({
      where: and(eq(sessionLogs.userId, userId), eq(sessionLogs.isActive, true)),
      orderBy: [desc(sessionLogs.loginAt)],
    });

    return session || null;
  } catch (error) {
    console.error('[getCurrentSession] Database error:', error);
    throw new Error('Failed to fetch current session');
  }
}

/**
 * Create a new session log entry
 *
 * Records a new login session with complete device and network metadata.
 * This is called after successful authentication to track user sessions.
 *
 * Uses indexes: session_logs_user_id_idx, session_logs_is_active_idx
 *
 * @param params - Session creation parameters
 * @returns Promise<SessionLog> Newly created session log entry
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * const session = await createSessionLog({
 *   userId: '550e8400-e29b-41d4-a716-446655440000',
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 *   parsed: { browser: 'Chrome', os: 'Windows 10', device: 'Desktop', full: 'Mozilla/5.0...' },
 *   deviceFingerprint: 'hash123abc'
 * });
 * console.log(`Session created: ${session.id}`);
 */
export async function createSessionLog(
  params: CreateSessionParams
): Promise<SessionLog> {
  try {
    const { userId, ipAddress, userAgent, parsed, deviceFingerprint } = params;

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    if (!ipAddress || typeof ipAddress !== 'string') {
      throw new Error('Valid IP address is required');
    }

    if (!userAgent || typeof userAgent !== 'string') {
      throw new Error('Valid user agent is required');
    }

    if (!deviceFingerprint || typeof deviceFingerprint !== 'string') {
      throw new Error('Valid device fingerprint is required');
    }

    const [newSession] = await db
      .insert(sessionLogs)
      .values({
        userId,
        ipAddress,
        userAgent,
        deviceFingerprint,
        browser: parsed.browser,
        os: parsed.os,
        deviceType: parsed.device,
        isActive: true,
        loginAt: new Date(),
        lastActivity: new Date(),
      })
      .returning();

    if (!newSession) {
      throw new Error('Failed to create session log');
    }

    console.log(`[createSessionLog] Created session ${newSession.id} for user: ${userId}`);
    return newSession;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[createSessionLog] Error:', error.message);
      throw error;
    }
    console.error('[createSessionLog] Database error:', error);
    throw new Error('Failed to create session log');
  }
}

/**
 * Terminate all other active sessions except the current one
 *
 * Sets isActive to false and records logout time for all other sessions.
 * This is used when a user explicitly logs out from all devices or wants
 * to invalidate other sessions for security reasons.
 *
 * Uses indexes: session_logs_user_active_idx
 *
 * @param userId - UUID of the user
 * @param currentSessionId - UUID of the current session to keep active
 * @returns Promise<number> Number of sessions terminated
 * @throws Error if userId is invalid or database operation fails
 *
 * @example
 * const terminated = await terminateOtherSessions(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   'session-uuid-123'
 * );
 * console.log(`Terminated ${terminated} other sessions`);
 */
export async function terminateOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<number> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    if (!currentSessionId || typeof currentSessionId !== 'string') {
      throw new Error('Valid current session ID is required');
    }

    // Get all active sessions except current
    const activeSessions = await db.query.sessionLogs.findMany({
      where: and(
        eq(sessionLogs.userId, userId),
        eq(sessionLogs.isActive, true)
      ),
    });

    // Filter out current session
    const sessionsToTerminate = activeSessions.filter(
      (session) => session.id !== currentSessionId
    );

    if (sessionsToTerminate.length === 0) {
      console.log(`[terminateOtherSessions] No other active sessions for user: ${userId}`);
      return 0;
    }

    // Terminate each session
    const now = new Date();
    let terminatedCount = 0;

    for (const session of sessionsToTerminate) {
      await db
        .update(sessionLogs)
        .set({
          isActive: false,
          logoutAt: now,
        })
        .where(eq(sessionLogs.id, session.id));

      terminatedCount++;
    }

    console.log(
      `[terminateOtherSessions] Terminated ${terminatedCount} sessions for user: ${userId}`
    );
    return terminatedCount;
  } catch (error) {
    console.error('[terminateOtherSessions] Database error:', error);
    throw new Error('Failed to terminate other sessions');
  }
}

/**
 * Update last login information in user profile
 *
 * Updates the profile's lastLoginAt, lastLoginIp, and lastLoginDevice fields.
 * This is called after successful authentication to keep profile metadata current.
 *
 * Uses indexes: profiles primary key
 *
 * @param params - Last login update parameters
 * @returns Promise<void>
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * await updateLastLogin({
 *   userId: '550e8400-e29b-41d4-a716-446655440000',
 *   ipAddress: '192.168.1.1',
 *   device: 'Chrome on Windows 10'
 * });
 */
export async function updateLastLogin(
  params: UpdateLastLoginParams
): Promise<void> {
  try {
    const { userId, ipAddress, device } = params;

    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    if (!ipAddress || typeof ipAddress !== 'string') {
      throw new Error('Valid IP address is required');
    }

    if (!device || typeof device !== 'string') {
      throw new Error('Valid device description is required');
    }

    const [updated] = await db
      .update(profiles)
      .set({
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        lastLoginDevice: device,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update last login information');
    }

    console.log(`[updateLastLogin] Updated last login for user: ${userId}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('[updateLastLogin] Error:', error.message);
      throw error;
    }
    console.error('[updateLastLogin] Database error:', error);
    throw new Error('Failed to update last login information');
  }
}

/**
 * Get all active sessions for a user
 *
 * Returns all currently active sessions for security monitoring and management.
 * Useful for displaying active sessions in user settings.
 *
 * Uses indexes: session_logs_user_active_idx, session_logs_login_at_idx
 *
 * @param userId - UUID of the user
 * @returns Promise<SessionLog[]> Array of active sessions
 * @throws Error if userId is invalid or database operation fails
 *
 * @example
 * const sessions = await getActiveSessions('550e8400-e29b-41d4-a716-446655440000');
 * console.log(`User has ${sessions.length} active sessions`);
 */
export async function getActiveSessions(
  userId: string
): Promise<SessionLog[]> {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }

    const sessions = await db.query.sessionLogs.findMany({
      where: and(eq(sessionLogs.userId, userId), eq(sessionLogs.isActive, true)),
      orderBy: [desc(sessionLogs.loginAt)],
    });

    return sessions;
  } catch (error) {
    console.error('[getActiveSessions] Database error:', error);
    throw new Error('Failed to fetch active sessions');
  }
}

/**
 * Terminate a specific session
 *
 * Sets isActive to false and records logout time for a specific session.
 * Used when logging out from a specific device or invalidating a session.
 *
 * @param sessionId - UUID of the session to terminate
 * @returns Promise<void>
 * @throws Error if sessionId is invalid or database operation fails
 *
 * @example
 * await terminateSession('session-uuid-123');
 * console.log('Session terminated');
 */
export async function terminateSession(sessionId: string): Promise<void> {
  try {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Valid session ID is required');
    }

    const [updated] = await db
      .update(sessionLogs)
      .set({
        isActive: false,
        logoutAt: new Date(),
      })
      .where(eq(sessionLogs.id, sessionId))
      .returning();

    if (!updated) {
      throw new Error('Session not found or already terminated');
    }

    console.log(`[terminateSession] Terminated session: ${sessionId}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('[terminateSession] Error:', error.message);
      throw error;
    }
    console.error('[terminateSession] Database error:', error);
    throw new Error('Failed to terminate session');
  }
}
