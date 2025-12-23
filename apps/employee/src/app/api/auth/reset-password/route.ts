/**
 * Reset Password API (OTP-based)
 * Completes password reset flow with OTP verification and new password
 *
 * Security:
 * - Verifies OTP code
 * - Strong password validation
 * - Invalidates all sessions after reset
 * - Creates audit log
 * - Uses admin client for password update (no session required)
 *
 * Features:
 * - OTP verification
 * - Password strength requirements
 * - Session invalidation
 * - Audit logging
 * - Clears temporaryPassword flag
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminClient,
  verifyOTP,
} from '@tupsafe/auth/server';
import { db, profiles, createAuditLog, sessionLogs } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { employeeResetPasswordSchema } from '@tupsafe/types';
import { resolveAndValidateForPasswordReset } from '@/lib/auth/resolve-user-identifier';

/**
 * POST /api/auth/reset-password
 * Complete OTP-based password reset with new password
 *
 * Request Body:
 * {
 *   identifier: string,      // Email or Employee ID
 *   code: string,           // 6-digit OTP code
 *   password: string,       // New password
 *   confirmPassword: string // Password confirmation
 * }
 *
 * Response (success):
 * {
 *   success: true,
 *   message: 'Password reset successfully. Please log in with your new password.'
 * }
 *
 * Response (error):
 * {
 *   error: string,
 *   details?: string | object
 * }
 */
export async function POST(request: NextRequest) {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    null;
  const userAgent = request.headers.get('user-agent') || null;

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = employeeResetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { identifier, code, password } = validationResult.data;

    // Resolve identifier to user
    const resolvedUser = await resolveAndValidateForPasswordReset(identifier);

    if (!resolvedUser) {
      return NextResponse.json(
        {
          error: 'Invalid identifier',
          details: 'No account found with this email or employee ID.',
        },
        { status: 404 }
      );
    }

    const { userId, email } = resolvedUser;

    // Verify OTP code
    const otpVerification = await verifyOTP(userId, code, 'password_reset');

    if (!otpVerification.success) {
      console.warn(`[Reset Password] OTP verification failed for user ${userId}`);

      // Audit log for failed OTP
      try {
        await createAuditLog({
          userId,
          action: 'PASSWORD_RESET_OTP_FAILED',
          entityType: 'auth',
          entityId: userId,
          changes: {
            identifier,
            error: otpVerification.error,
            timestamp: new Date().toISOString(),
          },
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
        });
      } catch (auditError) {
        console.error('[Reset Password] Audit log error:', auditError);
      }

      return NextResponse.json(
        {
          error: 'Invalid or expired verification code',
          details: 'Please check your code or request a new one.',
        },
        { status: 401 }
      );
    }

    // Update password via Supabase admin client (no session needed)
    const supabase = createAdminClient();
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (updateError) {
      console.error('[Reset Password] Update error:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update password',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Update profile: clear temporaryPassword flag
    try {
      await db
        .update(profiles)
        .set({
          temporaryPassword: false,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      console.log(`[Reset Password] Cleared temporaryPassword for user ${userId}`);
    } catch (profileError) {
      console.error('[Reset Password] Failed to update profile:', profileError);
      // Continue - password was already updated
    }

    // Terminate all active sessions for this user (force fresh login)
    try {
      const now = new Date();
      await db
        .update(sessionLogs)
        .set({
          isActive: false,
          logoutAt: now,
        })
        .where(eq(sessionLogs.userId, userId));

      console.log(`[Reset Password] Terminated all sessions for user ${userId}`);
    } catch (sessionError) {
      console.error('[Reset Password] Failed to terminate sessions:', sessionError);
      // Continue - password was already updated
    }

    // Create audit log
    try {
      await createAuditLog({
        userId,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'auth',
        entityId: userId,
        changes: {
          method: 'otp_verification',
          sessionsTerminated: true,
          temporaryPasswordCleared: true,
          timestamp: new Date().toISOString(),
        },
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      });
    } catch (auditError) {
      console.error('[Reset Password] Audit log error:', auditError);
    }

    console.log(`[Reset Password] Password reset completed for user ${userId}`);

    return NextResponse.json({
      success: true,
      message:
        'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('[Reset Password API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
