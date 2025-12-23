/**
 * Resend OTP API Route
 * Resends OTP with rate limiting
 *
 * Supports two modes:
 * 1. By userId (for login_challenge, email_verification) - requires userId
 * 2. By identifier (for password_reset) - accepts email OR employee ID
 *
 * This allows password reset OTP to be requested without requiring
 * the client to know the userId (which they wouldn't have when logged out).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  resendOTP,
  sendOTPEmail,
  createAdminClient,
} from '@tupsafe/auth/server';
import { resolveAndValidateForPasswordReset } from '@/lib/auth/resolve-user-identifier';

// Resend OTP validation schema - supports both userId and identifier modes
const resendOTPByUserIdSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  type: z.enum(['email_verification', 'login_challenge']),
});

const resendOTPByIdentifierSchema = z.object({
  identifier: z.string().min(1, 'Email or Employee ID is required'),
  type: z.literal('password_reset'),
});

// Union schema to accept either format
const resendOTPSchema = z.union([
  resendOTPByUserIdSchema,
  resendOTPByIdentifierSchema,
]);

type ResendOTPRequest = z.infer<typeof resendOTPSchema>;

/**
 * Check if request is identifier-based (password_reset)
 */
function isIdentifierBased(
  data: ResendOTPRequest
): data is z.infer<typeof resendOTPByIdentifierSchema> {
  return 'identifier' in data;
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resendOTPSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    let userId: string;
    let email: string;
    let type: 'email_verification' | 'login_challenge' | 'password_reset';

    // Resolve user based on request type
    if (isIdentifierBased(data)) {
      // Password reset mode - resolve identifier to userId
      type = data.type;

      const resolvedUser = await resolveAndValidateForPasswordReset(
        data.identifier
      );

      if (!resolvedUser) {
        // Don't reveal if user exists - return generic success
        // The forgot-password page will handle this appropriately
        return NextResponse.json({
          success: true,
          message:
            'If an account exists with this identifier, a verification code will be sent.',
        });
      }

      userId = resolvedUser.userId;
      email = resolvedUser.email;
    } else {
      // UserId-based mode (login_challenge, email_verification)
      userId = data.userId;
      type = data.type;

      // Get user email from Supabase
      const supabase = createAdminClient();
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(userId);

      if (userError || !userData.user || !userData.user.email) {
        return NextResponse.json(
          { error: 'Failed to retrieve user email' },
          { status: 500 }
        );
      }

      email = userData.user.email;
    }

    // Resend OTP with built-in rate limiting (max 5 per hour)
    const otpResult = await resendOTP(userId, type);

    if (!otpResult.success) {
      // For password_reset, don't reveal rate limiting to prevent enumeration
      if (type === 'password_reset') {
        return NextResponse.json({
          success: true,
          message:
            'If an account exists with this identifier, a verification code will be sent.',
        });
      }

      return NextResponse.json(
        {
          error: otpResult.error || 'Failed to send verification code',
          remaining: otpResult.remaining,
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Send OTP email
    if (otpResult.code) {
      try {
        await sendOTPEmail(email, otpResult.code, type);
        console.log(`[Resend OTP] Sent ${type} OTP to ${email}`);
      } catch (error) {
        console.error('Error sending OTP email:', error);

        // For password_reset, don't reveal email errors
        if (type === 'password_reset') {
          return NextResponse.json({
            success: true,
            message:
              'If an account exists with this identifier, a verification code will be sent.',
          });
        }

        return NextResponse.json(
          { error: 'Failed to send verification code' },
          { status: 500 }
        );
      }
    }

    // For password_reset, return generic success
    if (type === 'password_reset') {
      return NextResponse.json({
        success: true,
        message:
          'If an account exists with this identifier, a verification code will be sent.',
      });
    }

    // For other types, return detailed success
    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        userId,
        type,
        remaining: otpResult.remaining,
      },
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while resending OTP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
