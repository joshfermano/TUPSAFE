/**
 * Resend OTP API Route
 * Resends OTP with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, profiles } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import {
  resendOTP,
  sendOTPEmail,
  createAdminClient,
} from '@tupsafe/auth/server';

// Resend OTP validation schema
const resendOTPSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  type: z.enum(['email_verification', 'login_challenge', 'password_reset']),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resendOTPSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, type } = validationResult.data;

    // Get user email from Supabase
    // Note: During registration, user may not have a profile yet
    const supabase = createAdminClient();
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user || !userData.user.email) {
      return NextResponse.json(
        { error: 'Failed to retrieve user email' },
        { status: 500 }
      );
    }

    const email = userData.user.email;

    // Resend OTP with built-in rate limiting (max 5 per hour)
    const otpResult = await resendOTP(userId, type);

    if (!otpResult.success) {
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
      } catch (error) {
        console.error('Error sending OTP email:', error);
        return NextResponse.json(
          { error: 'Failed to send verification code' },
          { status: 500 }
        );
      }
    }

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
