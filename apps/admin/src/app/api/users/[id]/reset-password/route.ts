/**
 * User Management API - Password Reset
 * POST /api/users/[id]/reset-password
 *
 * Allows admins to reset user passwords and optionally send reset email
 *
 * Features:
 * - Generate secure temporary password
 * - Send password reset email via Supabase
 * - Set temporary password flag (requires change on next login)
 * - Comprehensive audit logging
 *
 * Security:
 * - Requires admin or hr role
 * - Cannot reset passwords of higher privilege users
 * - Rate limiting recommended for production
 * - Audit logging of all password reset actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase, sendPasswordResetEmail } from '@tupsafe/auth/server';
import { db, profiles, createAuditLogFromRequest } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { passwordResetSchema, ROLE_HIERARCHY } from '@tupsafe/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
/**
 * Generate a secure random password
 * @param length - Password length (default: 16)
 * @returns Secure random password
 */
function generateSecurePassword(length: number = 16): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  // Ensure password contains at least one of each required type
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  // If password doesn't meet requirements, regenerate
  if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
    return generateSecurePassword(length);
  }

  return password;
}

/**
 * POST /api/users/[id]/reset-password
 * Reset user password and optionally send reset email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify permissions using Supabase auth
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = passwordResetSchema.parse(body);

    // Fetch target user profile
    const [targetUser] = await db
      .select({
        id: profiles.id,
        role: profiles.role,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        isActive: profiles.isActive,
        accountStatus: profiles.accountStatus,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent resetting password of inactive users
    if (!targetUser.isActive || targetUser.accountStatus !== 'active') {
      return NextResponse.json(
        {
          error: 'Cannot reset password for inactive or non-active users',
        },
        { status: 400 }
      );
    }

    // Role hierarchy validation - prevent resetting passwords of higher privilege users
    const currentUserRole = sessionUser.role;
    const targetRole = targetUser.role;

    if (
      ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY] >=
      ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY]
    ) {
      return NextResponse.json(
        {
          error: 'Cannot reset password for users with equal or higher role privilege',
        },
        { status: 403 }
      );
    }

    // Generate secure temporary password
    const temporaryPassword =
      validatedData.temporaryPassword || generateSecurePassword(16);

    // Update user password via Supabase Admin API
    const { createAdminClient } = await import('@tupsafe/auth/server');
    const adminClient = await createAdminClient();

    try {
      // Update password
      const { data: _updateData, error: updateError } =
        await adminClient.auth.admin.updateUserById(userId, {
          password: temporaryPassword,
        });

      if (updateError) {
        throw new Error(`Supabase password update failed: ${updateError.message}`);
      }

      // Get user email for notification
      const { data: userData } = await adminClient.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email;

      // Mark password as temporary in profile
      await db
        .update(profiles)
        .set({
          temporaryPassword: true,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      // Send password reset email if requested
      if (validatedData.sendEmail && userEmail) {
        try {
          // Get user's first name for the email
          const firstName = targetUser.firstName || 'User';

          const emailResult = await sendPasswordResetEmail(
            userEmail,
            temporaryPassword,
            firstName
          );

          if (!emailResult.success) {
            console.error('Error sending password reset email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Error sending password reset email:', emailError);
          // Don't fail the entire operation if email fails
        }
      }

      // Create audit log
      await createAuditLogFromRequest(
        sessionUser.userId,
        'UPDATE',
        'profile',
        userId,
        {
          before: { temporaryPassword: false },
          after: { temporaryPassword: true },
        },
        request.headers
      );

      // Return response with temporary password only if email wasn't sent
      const response: {
        success: true;
        message: string;
        temporaryPassword?: string;
      } = {
        success: true,
        message: validatedData.sendEmail
          ? 'Password reset email sent successfully'
          : 'Password reset successfully',
      };

      // Only include temporary password in response if email wasn't sent
      if (!validatedData.sendEmail) {
        response.temporaryPassword = temporaryPassword;
      }

      return NextResponse.json(response, { status: 200 });
    } catch (supabaseError) {
      console.error('Supabase password reset error:', supabaseError);
      return NextResponse.json(
        {
          error: 'Failed to reset password',
          details:
            supabaseError instanceof Error
              ? supabaseError.message
              : 'Unknown Supabase error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Password reset error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
