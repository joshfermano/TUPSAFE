/**
 * Admin Logout API Route
 * Destroys session and logs admin user out
 *
 * Security:
 * - Audit logging for admin logout
 * - Complete session cleanup
 * - Supabase session termination
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  destroySession,
  getSessionUser,
  createServerClient,
} from '@tupsafe/auth/server';
import { createAuditLog } from '@tupsafe/database/server';

export async function POST(request: NextRequest) {
  try {
    // Get current session user for audit logging
    const sessionUser = await getSessionUser();

    if (sessionUser) {
      // Log audit event for admin logout
      try {
        await createAuditLog({
          userId: sessionUser.userId,
          action: 'LOGOUT',
          entityType: 'auth',
          entityId: sessionUser.userId,
          metadata: {
            role: sessionUser.role,
            portalAccess: 'admin',
          },
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });
      } catch (error) {
        console.error('Error logging audit event:', error);
        // Non-critical, continue
      }
    }

    // Sign out from Supabase with portal-specific cookie isolation
    const supabase = await createServerClient('admin');
    await supabase.auth.signOut();

    // Destroy session cookie
    await destroySession();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, try to destroy session
    try {
      await destroySession();
    } catch (destroyError) {
      console.error('Error destroying session:', destroyError);
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred during logout',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
