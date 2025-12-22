/**
 * Reset Password API
 * Completes password reset flow with new password
 *
 * Security:
 * - Verifies reset token from Supabase
 * - Strong password validation
 * - Invalidates all sessions after reset
 * - Creates audit log
 *
 * Features:
 * - Password strength requirements
 * - Token verification
 * - Session invalidation
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { auditLogs } from '@tupsafe/database/schema';
import { z } from 'zod';

/**
 * Strong password validation schema
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * POST /api/auth/reset-password
 * Complete password reset with new password
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    // Get IP address for audit log
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null;
    const userAgent = request.headers.get('user-agent') || null;

    // Create Supabase client
    const supabase = await createServerClient('employee');

    // Verify authenticated user (password reset link sets up authentication)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Invalid or expired reset token',
          details: 'Please request a new password reset link',
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

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

    // Create audit log
    await db.insert(auditLogs).values({
      userId,
      action: 'auth.password_reset_completed',
      entityType: 'user',
      entityId: userId,
      changes: {
        timestamp: new Date().toISOString(),
        method: 'password_reset_link',
      },
      ipAddress,
      userAgent,
    });

    // Sign out all other sessions (security best practice)
    await supabase.auth.signOut({ scope: 'others' });

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
