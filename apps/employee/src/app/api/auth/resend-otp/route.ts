/**
 * Resend OTP API Route
 * Resends OTP with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, profiles } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import {
  generateOTP,
  sendOTPEmail,
  createServerClient,
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

    // Check rate limit (5 OTP requests per hour per user)
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';

    // Get user profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get user email from Supabase
    const supabase = await createServerClient();
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user || !userData.user.email) {
      return NextResponse.json(
        { error: 'Failed to retrieve user email' },
        { status: 500 }
      );
    }

    const email = userData.user.email;

    // Generate and send new OTP
    try {
      const otpResult = await generateOTP(userId, type);
      if (otpResult.code) {
        await sendOTPEmail(email, otpResult.code, type);
      }
    } catch (error) {
      console.error('Error generating/sending OTP:', error);
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        userId,
        type,
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
