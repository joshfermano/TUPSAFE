/**
 * Session Management API - Employee Portal
 * Manages user session logs and device tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import {
  getCurrentSession,
  terminateOtherSessions,
  createAuditLog,
} from '@tupsafe/database/server';
import { parseUserAgent, formatUserAgent } from '@/lib/user-agent-parser';

/**
 * GET /api/auth/sessions
 * Retrieve current session details
 */
export async function GET(_request: NextRequest) {
  console.log('[Sessions API] GET request received');
  
  try {
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[Sessions API] Not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log('[Sessions API] Fetching session for user:', userId);

    const currentSession = await getCurrentSession(userId);

    if (!currentSession) {
      console.log('[Sessions API] No active session found');
      return NextResponse.json(
        {
          success: false,
          error: 'No active session found',
          data: null,
        },
        { status: 200 }
      );
    }

    const parsed = parseUserAgent(currentSession.userAgent || '');
    const deviceDescription = formatUserAgent(parsed);

    console.log('[Sessions API] Session fetched successfully');
    return NextResponse.json({
      success: true,
      data: {
        sessionId: currentSession.id,
        loginAt: currentSession.loginAt?.toISOString(),
        ipAddress: currentSession.ipAddress,
        browser: currentSession.browser,
        os: currentSession.os,
        deviceType: currentSession.deviceType,
        deviceDescription,
        isActive: currentSession.isActive,
      },
    });
  } catch (error) {
    console.error('[Sessions API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch session details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/sessions
 * Terminate all other active sessions
 */
export async function DELETE(request: NextRequest) {
  console.log('[Sessions API] DELETE request received');
  
  try {
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
    const currentSession = await getCurrentSession(userId);

    if (!currentSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active session found',
        },
        { status: 200 }
      );
    }

    const terminatedCount = await terminateOtherSessions(
      userId,
      currentSession.id
    );

    try {
      await createAuditLog({
        userId,
        action: 'SESSIONS_TERMINATED',
        entityType: 'SESSION',
        entityId: currentSession.id,
        changes: {
          action: 'terminate_other_sessions',
          terminatedCount,
          timestamp: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (auditError) {
      console.error('[Sessions API] Audit log failed:', auditError);
    }

    console.log(`[Sessions API] Terminated ${terminatedCount} sessions`);
    return NextResponse.json({
      success: true,
      message: terminatedCount > 0
        ? `Successfully terminated ${terminatedCount} other session${terminatedCount === 1 ? '' : 's'}`
        : 'No other active sessions to terminate',
      terminatedCount,
    });
  } catch (error) {
    console.error('[Sessions API] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to terminate sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
