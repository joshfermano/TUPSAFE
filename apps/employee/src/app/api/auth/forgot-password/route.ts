/**
 * Forgot Password API
 * Initiates password reset flow via Supabase
 *
 * Security:
 * - Rate limiting recommended
 * - Does not reveal if email exists (security best practice)
 * - Creates audit log
 *
 * Features:
 * - Email validation
 * - Supabase password reset email
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { auditLogs } from '@tupsafe/database/schema';
import { z } from 'zod';

/**
 * Request validation schema
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/auth/forgot-password
 * Initiate password reset flow
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Get IP address for audit log
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null;
    const userAgent = request.headers.get('user-agent') || null;

    // Create Supabase client
    const supabase = await createServerClient('employee');

    // Send password reset email via Supabase
    // This will work even if email doesn't exist (Supabase handles this securely)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      }
    );

    // Create audit log (even for failed attempts)
    try {
      await db.insert(auditLogs).values({
        userId: '00000000-0000-0000-0000-000000000000', // System user for anonymous actions
        action: 'auth.forgot_password_requested',
        entityType: 'user',
        entityId: null,
        changes: {
          email,
          success: !resetError,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
      });
    } catch (auditError) {
      console.error('[Forgot Password] Audit log error:', auditError);
      // Continue - don't fail the request if audit logging fails
    }

    if (resetError) {
      console.error('[Forgot Password] Supabase error:', resetError);
      // Don't reveal error to client for security
    }

    // Always return success (security best practice - don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message:
        'If an account exists with this email, you will receive password reset instructions.',
    });
  } catch (error) {
    console.error('[Forgot Password API] Error:', error);

    // Still return success to avoid revealing information
    return NextResponse.json({
      success: true,
      message:
        'If an account exists with this email, you will receive password reset instructions.',
    });
  }
}
