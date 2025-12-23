/**
 * Registration Resume API Route
 *
 * Allows users to resume an incomplete registration (unverified email)
 * by providing only their email address. This is useful when:
 * - User refreshed the page during OTP verification
 * - User switched devices (desktop <-> mobile)
 * - User closed the browser before completing OTP
 *
 * @module api/auth/register/resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@tupsafe/auth/server';
import {
  db,
  profiles,
  otpVerifications,
  pendingRegistrations,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

/**
 * Request schema - email only
 */
const resumeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Success response structure
 */
interface ResumeSuccessResponse {
  success: true;
  message: string;
  data: {
    userId: string;
    email: string;
    userType: 'employee' | 'applicant';
    employmentCategory?: 'faculty' | 'administrative' | null;
  };
}

/**
 * Error response structure
 */
interface ResumeErrorResponse {
  success: false;
  error: string;
  code?: 'NOT_FOUND' | 'ALREADY_REGISTERED' | 'EXPIRED' | 'VALIDATION_ERROR';
  details?: Record<string, string[] | undefined>;
}

/**
 * OTP window in minutes - matches the OTP expiry time
 */
const OTP_WINDOW_MINUTES = 15;

/**
 * POST /api/auth/register/resume
 *
 * Resume an incomplete registration by email lookup
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ResumeSuccessResponse | ResumeErrorResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resumeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR' as const,
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const supabase = createAdminClient();

    // Find user by email using admin API
    let existingUser = null;

    try {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error('Error listing users:', listError);
        throw new Error('Failed to lookup user');
      }

      if (users && users.users) {
        // Find user with matching email (case-insensitive)
        existingUser = users.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
      }
    } catch (error) {
      console.error('Error checking for existing user:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to process request. Please try again.',
        },
        { status: 500 }
      );
    }

    // User not found - they need to start fresh
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'No registration found for this email. Please start a new registration.',
          code: 'NOT_FOUND' as const,
        },
        { status: 404 }
      );
    }

    // User exists with confirmed email - they're already registered
    if (existingUser.email_confirmed_at) {
      // Check if they have an active profile
      const [dbUser] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, existingUser.id))
        .limit(1);

      if (dbUser && dbUser.accountStatus !== 'rejected' && dbUser.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: 'This email is already registered. Please sign in to your account.',
            code: 'ALREADY_REGISTERED' as const,
          },
          { status: 409 }
        );
      }

      // User was rejected/inactive - they need to start fresh
      return NextResponse.json(
        {
          success: false,
          error: 'Your previous registration was not approved. Please start a new registration.',
          code: 'NOT_FOUND' as const,
        },
        { status: 404 }
      );
    }

    // User exists with unconfirmed email - check if within OTP window
    const createdAt = new Date(existingUser.created_at);
    const minutesOld = (Date.now() - createdAt.getTime()) / (1000 * 60);

    console.log(
      `Found incomplete registration for ${email}, age: ${minutesOld.toFixed(1)} minutes`
    );

    // If older than OTP window, it's expired
    if (minutesOld > OTP_WINDOW_MINUTES) {
      // Clean up the expired registration
      console.log('Cleaning up expired incomplete registration...');

      try {
        // Delete in proper order to avoid foreign key violations
        await db
          .delete(otpVerifications)
          .where(eq(otpVerifications.userId, existingUser.id));

        await db
          .delete(pendingRegistrations)
          .where(eq(pendingRegistrations.userId, existingUser.id));

        await db
          .delete(profiles)
          .where(eq(profiles.id, existingUser.id));

        await supabase.auth.admin.deleteUser(existingUser.id);

        console.log('✅ Cleanup successful for expired registration:', email);
      } catch (cleanupError) {
        console.error('Failed to cleanup expired registration:', cleanupError);
        // Continue anyway - we'll tell user to start fresh
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Your registration has expired. Please start a new registration.',
          code: 'EXPIRED' as const,
        },
        { status: 410 } // 410 Gone
      );
    }

    // Within OTP window - return success with user data
    const metadata = existingUser.user_metadata || {};
    const userType = (metadata.user_type || 'employee') as 'employee' | 'applicant';
    const employmentCategory = (metadata.employment_category || null) as
      | 'faculty'
      | 'administrative'
      | null;

    console.log(
      `Resuming registration for ${email}, userType: ${userType}, employmentCategory: ${employmentCategory}`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Registration found. You can continue with email verification.',
        data: {
          userId: existingUser.id,
          email: existingUser.email || email,
          userType,
          employmentCategory,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Registration resume error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        details: {
          message: [error instanceof Error ? error.message : 'Unknown error'],
        },
      },
      { status: 500 }
    );
  }
}

