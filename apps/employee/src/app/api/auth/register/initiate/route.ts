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
import {
  db,
  profiles,
  otpVerifications,
  pendingRegistrations,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

/**
 * Personal information schema for step 1
 */
const personalInfoSchema = z.object({
  userType: z.enum(['employee', 'applicant']),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  middleName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^(\+639|09)\d{9}$/, 'Invalid phone number'),
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
  dateOfBirth: z
    .string()
    .refine(
      (date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      },
      'Invalid date format'
    )
    .refine(
      (date) => {
        const parsed = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - parsed.getFullYear();
        return age >= 18 && age <= 100;
      },
      'Birth date must indicate age between 18 and 100 years'
    ),
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
    employmentCategory?: 'faculty' | 'administrative' | null;
    isResume?: boolean; // True if resuming an existing incomplete registration
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

    // ENHANCED: Check for incomplete registration before creating user using admin API
    // If a previous registration failed during OTP sending, we can retry
    let existingUser = null;

    try {
      // Use admin API to list users by email (more reliable than querying auth.users)
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error('Error listing users:', listError);
      } else if (users && users.users) {
        // Find user with matching email (case-insensitive)
        existingUser = users.users.find(
          (u) => u.email?.toLowerCase() === data.email.toLowerCase()
        );

        if (existingUser) {
          console.log(
            `Found existing user: ${existingUser.email}, confirmed: ${!!existingUser.email_confirmed_at}`
          );
        }
      }
    } catch (error) {
      console.error('Error checking for existing user:', error);
    }

    // If user exists, check their status
    if (existingUser) {
      // User exists with confirmed email - check if they're actually active in database
      if (existingUser.email_confirmed_at) {
        console.log('User has confirmed email - checking database status');

        // Check if user is deleted/rejected in database
        const [dbUser] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, existingUser.id))
          .limit(1);

        // If user is rejected or inactive, allow re-registration
        if (dbUser && (dbUser.accountStatus === 'rejected' || !dbUser.isActive)) {
          console.log('User is deleted/rejected - allowing re-registration by deleting Auth user');

          // Clean up related tables BEFORE deleting auth user
          try {
            await db.delete(otpVerifications).where(eq(otpVerifications.userId, existingUser.id));
            await db.delete(pendingRegistrations).where(eq(pendingRegistrations.userId, existingUser.id));
            console.log('[Registration] Cleaned up related tables for retry:', existingUser.email);
          } catch (cleanupError) {
            console.error('[Registration] Failed to cleanup related tables:', cleanupError);
            // Continue anyway - auth user deletion is more critical
          }

          // Delete from Supabase Auth to allow fresh registration
          try {
            await supabase.auth.admin.deleteUser(existingUser.id);
            console.log('Deleted rejected user from Auth successfully');
            // Continue with registration flow below
            existingUser = null; // Reset to allow fresh registration
          } catch (deleteError) {
            console.error('Error deleting rejected user from Auth:', deleteError);
            const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error';
            return NextResponse.json(
              {
                success: false,
                error: 'Account cleanup required',
                details: {
                  message: [
                    'This email was previously registered but the account was deleted.',
                    'Please contact support to complete the cleanup process.',
                    `Error: ${errorMessage}`,
                  ],
                },
              },
              { status: 503 }
            );
          }
        } else if (dbUser) {
          // User is active - cannot re-register
          console.log('User has active account - returning error');
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
        // If no dbUser found, Auth user exists but no profile - allow registration to continue
      }

      // Check if existingUser was reset (re-registration allowed)
      if (!existingUser) {
        // Continue with normal registration flow below
      } else {
        // User exists with unconfirmed email (incomplete registration)
        const createdAt = new Date(existingUser.created_at);
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
            // TRANSACTIONAL CLEANUP: Delete in proper order to avoid foreign key violations
            // 1. Delete OTP records
            await db
              .delete(otpVerifications)
              .where(eq(otpVerifications.userId, existingUser.id));

            // 2. Delete pending registration if exists
            await db
              .delete(pendingRegistrations)
              .where(eq(pendingRegistrations.userId, existingUser.id));

            // 3. Delete profile if exists
            await db
              .delete(profiles)
              .where(eq(profiles.id, existingUser.id));

            // 4. Delete auth user
            const { error: deleteError } =
              await supabase.auth.admin.deleteUser(existingUser.id);

            if (deleteError) {
              throw deleteError;
            }

            console.log(
              '✅ Cleanup successful (deleted OTPs, pending regs, profile, auth user):',
              data.email
            );

            // Continue with normal registration flow below
          } catch (cleanupError) {
            console.error('Failed to cleanup old registration:', cleanupError);

            return NextResponse.json(
              {
                success: false,
                error:
                  'Unable to complete registration cleanup. Please try again in a few moments.',
                details: {
                  email: [
                    'A previous registration attempt is still being processed. Please wait 1-2 minutes and try again.',
                  ],
                },
              },
              { status: 503 } // Service Unavailable - suggests retry
            );
          }
        } else {
          // Still within OTP window - RESUME the registration instead of blocking
          // Update user_metadata with latest personal info (but NOT password for security)
          console.log(
            `Resuming incomplete registration for ${data.email}, user can use existing OTP or resend`
          );

          try {
            // Update metadata with latest personal info
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              {
                user_metadata: {
                  first_name: data.firstName,
                  last_name: data.lastName,
                  middle_name: data.middleName || null,
                  phone_number: data.phoneNumber,
                  user_type: data.userType,
                  employment_category: data.employmentCategory || null,
                  date_of_birth: data.dateOfBirth,
                  registration_step: 'email_verification_pending',
                  ip_address: getClientIp(request),
                  updated_at: new Date().toISOString(),
                },
              }
            );

            if (updateError) {
              console.error('Failed to update user metadata on resume:', updateError);
              // Non-critical - continue with the flow
            }
          } catch (updateError) {
            console.error('Error updating user metadata:', updateError);
            // Non-critical - continue with the flow
          }

          // Get user type and employment category from existing metadata or new data
          const metadata = existingUser.user_metadata || {};
          const userType = (data.userType || metadata.user_type || 'employee') as 'employee' | 'applicant';
          const employmentCategory = (data.employmentCategory || metadata.employment_category || null) as 'faculty' | 'administrative' | null;

          // Return success with existing userId so UI can proceed to OTP step
          return NextResponse.json(
            {
              success: true,
              message: 'Registration resumed. Please check your email for the verification code or tap "Resend Code".',
              data: {
                userId: existingUser.id,
                email: existingUser.email || data.email,
                userType,
                employmentCategory,
                isResume: true,
              },
            },
            { status: 200 }
          );
        }
      }
    }
    // If queryError (user doesn't exist), continue with normal registration below

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
          date_of_birth: data.dateOfBirth,
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
        const emailResult = await sendOTPEmail(
          data.email,
          otpResult.code,
          'email_verification'
        );
        // CRITICAL FIX: Check if email actually sent successfully
        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Failed to send OTP email');
        }
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
          employmentCategory: data.employmentCategory || null,
          isResume: false,
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
