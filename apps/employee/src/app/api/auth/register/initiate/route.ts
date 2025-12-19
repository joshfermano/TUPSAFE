/**
 * Registration Initiation API Route
 *
 * Step 1 of the registration process:
 * - Validates personal information and email
 * - Creates Supabase user account
 * - Sends OTP for email verification
 * - Does NOT create profile or assign IDs yet
 *
 * @module api/auth/register/initiate
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateOTP,
  sendOTPEmail,
  createAdminClient,
} from '@tupsafe/auth/server';

/**
 * Personal information schema for step 1
 */
const personalInfoSchema = z.object({
  userType: z.enum(['employee', 'applicant']),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  middleName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^(\+63|0)[0-9]{10}$/, 'Invalid phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
  employmentCategory: z.enum(['faculty', 'administrative']).optional(),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;

/**
 * Success response structure
 */
interface InitiateSuccessResponse {
  success: true;
  message: string;
  data: {
    userId: string;
    email: string;
    userType: 'employee' | 'applicant';
  };
}

/**
 * Error response structure
 */
interface InitiateErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[] | undefined>;
}

/**
 * Extract client IP address from request headers
 */
function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * POST /api/auth/register/initiate
 *
 * Initiates the registration process by:
 * 1. Validating personal information
 * 2. Checking if email already exists
 * 3. Creating Supabase user account
 * 4. Sending OTP verification email
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<InitiateSuccessResponse | InitiateErrorResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = personalInfoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Personal information validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data: PersonalInfoData = validationResult.data;
    const supabase = createAdminClient();

    // ENHANCED: Check for incomplete registration before creating user
    // If a previous registration failed during OTP sending, we can retry
    const { data: existingUsers } = await supabase
      .from('auth.users')
      .select('id, email, created_at, email_confirmed_at')
      .ilike('email', data.email)
      .limit(1)
      .single();

    // If user exists with unconfirmed email (incomplete registration)
    if (existingUsers && !existingUsers.email_confirmed_at) {
      const createdAt = new Date(existingUsers.created_at);
      const minutesOld = (Date.now() - createdAt.getTime()) / (1000 * 60);

      console.log(
        `Found incomplete registration for ${
          data.email
        }, age: ${minutesOld.toFixed(1)} minutes`
      );

      // If older than OTP expiry (15 minutes), delete and allow retry
      if (minutesOld > 15) {
        console.log('Cleaning up expired incomplete registration...');

        try {
          // Delete the old incomplete user
          await supabase.auth.admin.deleteUser(existingUsers.id);
          console.log('✅ Cleanup successful, retrying registration...');

          // Continue with normal registration flow below
        } catch (cleanupError) {
          console.error('Failed to cleanup old registration:', cleanupError);

          return NextResponse.json(
            {
              success: false,
              error:
                'Unable to complete registration. Please contact support or try again later.',
              details: {
                email: [
                  'A previous registration attempt needs to be cleared. Please try again in a few minutes.',
                ],
              },
            },
            { status: 409 }
          );
        }
      } else {
        // Still within OTP window - provide helpful message
        const minutesRemaining = Math.ceil(15 - minutesOld);

        return NextResponse.json(
          {
            success: false,
            error: 'Registration already in progress',
            details: {
              email: [
                `A verification email was recently sent. Please check your email (including spam folder) or try again in ${minutesRemaining} minute${
                  minutesRemaining !== 1 ? 's' : ''
                }.`,
              ],
            },
          },
          { status: 409 }
        );
      }
    }

    // Create Supabase user (no profile yet)
    // Supabase will automatically reject duplicate emails
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: false, // Will be confirmed via OTP in next step
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          middle_name: data.middleName || null,
          phone_number: data.phoneNumber,
          user_type: data.userType,
          employment_category: data.employmentCategory || null,
          registration_step: 'email_verification_pending',
          ip_address: getClientIp(request),
        },
      });

    if (createError || !newUser.user) {
      console.error('Supabase user creation error:', createError);

      // Check if error is due to duplicate email using error code
      // This handles confirmed users (completed registrations)
      if (createError?.code === 'email_exists') {
        return NextResponse.json(
          {
            success: false,
            error: 'Email address is already registered',
            details: {
              email: [
                'This email is already registered with an active account. Please try logging in.',
              ],
            },
          },
          { status: 409 }
        );
      }

      // Fallback check for message-based detection (backward compatibility)
      if (
        createError?.message?.toLowerCase().includes('email') &&
        (createError?.message?.toLowerCase().includes('already') ||
          createError?.message?.toLowerCase().includes('exists') ||
          createError?.message?.toLowerCase().includes('duplicate'))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email address is already registered',
            details: {
              email: [
                'This email is already registered. Please try logging in or use a different email.',
              ],
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: createError?.message || 'Failed to create user account',
        },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    // Generate and send OTP for email verification
    try {
      const otpResult = await generateOTP(userId, 'email_verification');
      if (otpResult.success && otpResult.code) {
        await sendOTPEmail(data.email, otpResult.code, 'email_verification');
      } else {
        throw new Error(otpResult.error || 'Failed to generate OTP');
      }
    } catch (otpError) {
      console.error('OTP generation/sending failed:', otpError);

      // Cleanup: Delete the created user since OTP failed
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (cleanupError) {
        console.error(
          'Failed to cleanup user after OTP failure:',
          cleanupError
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to send verification email. Please try again or contact support.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code sent! Please check your email.',
        data: {
          userId,
          email: data.email,
          userType: data.userType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Registration initiation error:', error);

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
