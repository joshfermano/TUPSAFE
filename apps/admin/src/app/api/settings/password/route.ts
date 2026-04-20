/**
 * Password Change API - POST /api/settings/password
 *
 * Provides secure password change functionality for the admin portal settings page.
 * Validates current password before allowing update to new password.
 *
 * Features:
 * - Validates current password with Supabase Auth
 * - Validates new password meets security requirements
 * - Updates password in Supabase Auth (not direct DB)
 * - Audit logging for password changes (WITHOUT logging passwords)
 * - Rate limiting consideration (commented for implementation)
 *
 * Security:
 * - Requires active session
 * - Verifies current password before change
 * - Password strength validation via Zod schema
 * - NO password logging in audit trail
 * - Consider implementing rate limiting to prevent brute force
 * - All password operations use Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromSupabase,
  createServerClient,
  checkRateLimitAsync,
  formatRateLimitError,
} from '@tupsafe/auth/server';
import { db, auditLogs } from '@tupsafe/database/server';
import {
  changePasswordRequestSchema,
  type ChangePasswordResponse,
} from '@tupsafe/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/settings/password
 * Change user's password
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Password Change API] POST request received');

    // Get current user from Supabase session
    const user = await getUserFromSupabase('admin');
    if (!user) {
      console.log('[Password Change API] No authenticated session');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`[Password Change API] Password change request for user: ${user.userId}`);

    // Rate limiting check - use userId as identifier to prevent brute force attacks
    const rateLimit = await checkRateLimitAsync('password_reset_request', user.userId);

    if (!rateLimit.allowed) {
      console.log('[Password Change API] Rate limit exceeded for user:', user.userId);
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: formatRateLimitError('password_reset_request', rateLimit.resetAt),
        } as ChangePasswordResponse,
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = changePasswordRequestSchema.parse(body);

    // Get Supabase client
    const supabase = await createServerClient('admin');

    // Step 1: Verify current password by attempting to sign in
    // This is the secure way to validate current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: validatedData.currentPassword,
    });

    if (signInError) {
      console.log('[Password Change API] Current password validation failed');
      return NextResponse.json(
        {
          success: false,
          error: 'Current password is incorrect',
        } as ChangePasswordResponse,
        { status: 401 }
      );
    }

    console.log('[Password Change API] Current password validated successfully');

    // Step 2: Update to new password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (updateError) {
      console.error('[Password Change API] Password update failed:', updateError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update password',
          error: updateError.message,
        } as ChangePasswordResponse,
        { status: 500 }
      );
    }

    console.log('[Password Change API] Password updated successfully');

    // Get client IP and user agent for audit log
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Step 3: Create audit log entry
    // IMPORTANT: DO NOT log passwords in audit trail
    await db.insert(auditLogs).values({
      userId: user.userId,
      action: 'change_password',
      entityType: 'auth',
      entityId: user.userId,
      changes: {
        // Only log that password was changed, not the actual passwords
        passwordChanged: true,
        timestamp: new Date().toISOString(),
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    const duration = Date.now() - startTime;
    console.log(`[Password Change API] Password change completed successfully in ${duration}ms`);

    // Note: Consider implementing rate limiting here to prevent brute force attacks
    // Example: Track failed password change attempts per user/IP
    // Limit to 5 attempts per hour per user/IP combination

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      } as ChangePasswordResponse,
      {
        status: 200,
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[Password Change API] Error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          error: error.message,
        } as ChangePasswordResponse,
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to change password',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as ChangePasswordResponse,
      { status: 500 }
    );
  }
}
