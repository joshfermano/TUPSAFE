/**
 * Password Change API
 * Allows authenticated users to change their password with validation
 *
 * Security:
 * - Requires active session
 * - Validates current password by attempting sign in
 * - Updates password via Supabase Auth
 * - Creates audit log entry for security tracking
 * - Enforces strong password requirements
 *
 * Routes:
 * - POST /api/auth/change-password - Change user password
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { createAuditLog } from '@tupsafe/database/server';
import { z } from 'zod';

/**
 * Password change validation schema
 * Enforces strong password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
});

/**
 * POST /api/auth/change-password
 * Change authenticated user's password
 *
 * Request Body:
 * {
 *   currentPassword: string,
 *   newPassword: string,
 *   confirmPassword: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: 'Password changed successfully'
 * }
 *
 * Validation:
 * - Current password must be correct
 * - New password must meet strength requirements
 * - New password and confirmation must match
 * - New password must be different from current password
 *
 * Errors:
 * - 400: Invalid request body, validation error, or passwords don't match
 * - 401: Not authenticated or current password incorrect
 * - 500: Database or authentication error
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
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
    const userEmail = user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (_parseError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Validate with Zod schema
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = validation.data;

    // Check that new password and confirmation match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          error: 'Passwords do not match',
          details: 'New password and confirmation must match',
        },
        { status: 400 }
      );
    }

    // Check that new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          error: 'Invalid new password',
          details: 'New password must be different from current password',
        },
        { status: 400 }
      );
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      console.error('[Change Password] Current password verification failed:', signInError);
      return NextResponse.json(
        {
          error: 'Current password is incorrect',
          details: 'Please check your current password and try again',
        },
        { status: 401 }
      );
    }

    // Update password via Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('[Change Password] Password update failed:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update password',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Create audit log entry
    try {
      await createAuditLog({
        userId,
        action: 'PASSWORD_CHANGED',
        entityType: 'USER',
        entityId: userId,
        changes: {
          action: 'password_change',
          timestamp: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (auditError) {
      console.error('[Change Password] Audit log creation failed:', auditError);
      // Don't fail the password change if audit log fails
    }

    console.log(`[Change Password] Password changed successfully for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[Change Password] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to change password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
