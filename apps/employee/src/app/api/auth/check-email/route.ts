/**
 * Email Availability Check API Route
 *
 * Allows checking if an email is available for registration
 * before the user completes the full registration form.
 *
 * @module api/auth/check-email
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@tupsafe/auth/server';

const emailCheckSchema = z.object({
  email: z.string().email('Invalid email address'),
});

interface EmailCheckResponse {
  available: boolean;
  message: string;
  suggestedAction?: 'login' | 'reset_password' | 'contact_support';
}

/**
 * POST /api/auth/check-email
 *
 * Checks if an email address is available for registration
 *
 * Request body:
 * {
 *   "email": "user@tup.edu.ph"
 * }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<EmailCheckResponse | { error: string }>> {
  try {
    const body = await request.json();
    const validationResult = emailCheckSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const supabase = createAdminClient();

    // Check if user exists in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, account_status, email_verified_at')
      .ilike('email', email)
      .limit(1)
      .single();

    if (profile) {
      // User exists with verified email
      if (profile.email_verified_at) {
        return NextResponse.json(
          {
            available: false,
            message:
              'This email is already registered. Please sign in to your account.',
            suggestedAction: 'login',
          },
          { status: 200 }
        );
      }

      // User exists but email not verified (incomplete registration)
      return NextResponse.json(
        {
          available: false,
          message:
            'Registration in progress. Please check your email for the verification code.',
          suggestedAction: 'contact_support',
        },
        { status: 200 }
      );
    }

    // Check auth.users for incomplete registrations
    const { data: authUsers } = await supabase
      .from('auth.users')
      .select('id, email, created_at, email_confirmed_at')
      .ilike('email', email)
      .limit(1)
      .single();

    if (authUsers && !authUsers.email_confirmed_at) {
      const createdAt = new Date(authUsers.created_at);
      const minutesOld = (Date.now() - createdAt.getTime()) / (1000 * 60);

      // If older than 15 minutes, will be cleaned up automatically
      if (minutesOld > 15) {
        return NextResponse.json(
          {
            available: true,
            message:
              'Email is available (previous incomplete registration will be cleaned up)',
          },
          { status: 200 }
        );
      }

      // Still within OTP window - check email
      const minutesRemaining = Math.ceil(15 - minutesOld);
      return NextResponse.json(
        {
          available: false,
          message: `Registration in progress. Check your email or wait ${minutesRemaining} minute${
            minutesRemaining !== 1 ? 's' : ''
          } to retry.`,
          suggestedAction: 'contact_support',
        },
        { status: 200 }
      );
    }

    // Email is available
    return NextResponse.json(
      {
        available: true,
        message: 'Email is available for registration',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check email availability',
      },
      { status: 500 }
    );
  }
}
