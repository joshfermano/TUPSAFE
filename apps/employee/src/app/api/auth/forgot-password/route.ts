/**
 * Forgot Password API (OTP-based)
 * Initiates password reset flow by sending an OTP email
 *
 * Security:
 * - Rate limiting via resendOTP (max 5 per hour)
 * - Does not reveal if email/employeeId exists (security best practice)
 * - Creates audit log
 * - Supports email OR employee ID as identifier
 *
 * Features:
 * - Email or Employee ID resolution
 * - OTP generation and email delivery
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, createAuditLog } from '@tupsafe/database/server';
import { auditLogs } from '@tupsafe/database/schema';
import { resendOTP, sendOTPEmail } from '@tupsafe/auth/server';
import { employeeForgotPasswordSchema } from '@tupsafe/types';
import { resolveAndValidateForPasswordReset } from '@/lib/auth/resolve-user-identifier';

/**
 * POST /api/auth/forgot-password
 * Initiate OTP-based password reset flow
 *
 * Request Body:
 * {
 *   identifier: string  // Email address OR Employee ID
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: 'If an account exists with this identifier, you will receive a verification code.'
 * }
 *
 * Note: Always returns success to prevent user enumeration
 */
export async function POST(request: NextRequest) {
  // Get IP address and user agent for audit log
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    null;
  const userAgent = request.headers.get('user-agent') || null;

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = employeeForgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { identifier } = validationResult.data;

    // Resolve identifier (email or employee ID) to user
    const resolvedUser = await resolveAndValidateForPasswordReset(identifier);

    if (resolvedUser) {
      const { userId, email } = resolvedUser;

      // Generate OTP with rate limiting (max 5 per hour)
      const otpResult = await resendOTP(userId, 'password_reset');

      if (otpResult.success && otpResult.code) {
        // Send OTP email
        try {
          await sendOTPEmail(email, otpResult.code, 'password_reset');
          console.log(
            `[Forgot Password] OTP sent to ${email} for user ${userId}`
          );
        } catch (emailError) {
          console.error('[Forgot Password] Failed to send OTP email:', emailError);
          // Continue - don't reveal error to client
        }

        // Create audit log for successful OTP request
        try {
          await createAuditLog({
            userId,
            action: 'PASSWORD_RESET_REQUESTED',
            entityType: 'auth',
            entityId: userId,
            changes: {
              identifier,
              otpSent: true,
              remaining: otpResult.remaining,
              timestamp: new Date().toISOString(),
            },
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
          });
        } catch (auditError) {
          console.error('[Forgot Password] Audit log error:', auditError);
          // Continue - don't fail the request
        }
      } else if (!otpResult.success) {
        // Rate limited - log but don't reveal to client
        console.warn(
          `[Forgot Password] Rate limited for user ${userId}: ${otpResult.error}`
        );

        // Still create audit log for rate-limited attempt
        try {
          await createAuditLog({
            userId,
            action: 'PASSWORD_RESET_RATE_LIMITED',
            entityType: 'auth',
            entityId: userId,
            changes: {
              identifier,
              rateLimited: true,
              error: otpResult.error,
              timestamp: new Date().toISOString(),
            },
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
          });
        } catch (auditError) {
          console.error('[Forgot Password] Audit log error:', auditError);
        }
      }
    } else {
      // User not found or not eligible - log for monitoring
      console.log(
        `[Forgot Password] No eligible user found for identifier: ${identifier.substring(0, 5)}...`
      );

      // Create audit log for failed lookup (anonymous)
      try {
        await db.insert(auditLogs).values({
          userId: '00000000-0000-0000-0000-000000000000', // System user
          action: 'PASSWORD_RESET_REQUESTED',
          entityType: 'auth',
          entityId: null,
          changes: {
            identifierPrefix: identifier.substring(0, 5),
            userFound: false,
            timestamp: new Date().toISOString(),
          },
          ipAddress,
          userAgent,
        });
      } catch (auditError) {
        console.error('[Forgot Password] Audit log error:', auditError);
      }
    }

    // Always return success to prevent user enumeration
    return NextResponse.json({
      success: true,
      message:
        'If an account exists with this identifier, you will receive a verification code via email.',
    });
  } catch (error) {
    console.error('[Forgot Password API] Error:', error);

    // Still return success to avoid revealing information
    return NextResponse.json({
      success: true,
      message:
        'If an account exists with this identifier, you will receive a verification code via email.',
    });
  }
}
