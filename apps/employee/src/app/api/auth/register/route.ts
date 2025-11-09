/**
 * Employee Registration API Route
 * Handles new employee registration with email verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@tupsafe/database';
import { profiles, employeeIdRegistry } from '@tupsafe/database';
import {
  generateAndRegisterEmployeeId,
  isEmployeeIdAvailable,
} from '@tupsafe/auth';
import { generateOTP, sendOTPEmail } from '@tupsafe/auth';
import { createServerClient } from '@tupsafe/auth';
import { createAuditLog } from '@tupsafe/database';
import { eq } from 'drizzle-orm';

// Registration validation schema
const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  phoneNumber: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  academicRank: z.string().optional(),
  tenureStatus: z.string().optional(),
  employmentType: z.string().optional(),
  campusAssignment: z.string().optional(),
});

type RegistrationData = z.infer<typeof registrationSchema>;

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data: RegistrationData = validationResult.data;

    // Initialize Supabase client
    const supabase = await createServerClient();

    // Check if email already exists
    const { data: existingUser, error: checkError } =
      await supabase.auth.admin.listUsers();

    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify email availability' },
        { status: 500 }
      );
    }

    const emailExists = existingUser.users.some(
      (user: { email?: string }) => user.email === data.email
    );

    if (emailExists) {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 409 }
      );
    }

    // Generate unique employee ID
    let employeeId: string;
    try {
      employeeId = await generateAndRegisterEmployeeId('temp-id'); // Will update after user creation
    } catch (error) {
      console.error('Error generating employee ID:', error);
      return NextResponse.json(
        { error: 'Failed to generate employee ID. Please try again.' },
        { status: 500 }
      );
    }

    // Create Supabase user
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: false, // We'll confirm via OTP
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          middle_name: data.middleName,
        },
      });

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    // Update employee ID registry with actual user ID
    try {
      await db
        .update(employeeIdRegistry)
        .set({ userId })
        .where(eq(employeeIdRegistry.employeeId, employeeId));
    } catch (error) {
      console.error('Error updating employee ID registry:', error);
      // Clean up: delete created user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to complete registration. Please try again.' },
        { status: 500 }
      );
    }

    // Create user profile
    try {
      await db.insert(profiles).values({
        id: userId,
        employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        phoneNumber: data.phoneNumber || null,
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        academicRank: data.academicRank || null,
        tenureStatus: data.tenureStatus || null,
        employmentType: data.employmentType || null,
        campusAssignment: data.campusAssignment || null,
        role: 'employee',
        accountStatus: 'pending',
        isActive: true,
        temporaryPassword: false,
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      // Clean up: delete created user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    // Generate and send OTP for email verification
    try {
      const otpResult = await generateOTP(userId, 'email_verification');
      if (otpResult.code) {
        await sendOTPEmail(data.email, otpResult.code, 'email_verification');
      }
    } catch (error) {
      console.error('Error sending verification OTP:', error);
      // Don't fail registration, user can request resend
    }

    // Log audit event
    try {
      await createAuditLog({
        userId,
        action: 'CREATE',
        entityType: 'profile',
        entityId: userId,
        metadata: {
          employeeId,
          role: 'employee',
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Non-critical, continue
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Registration successful! Please check your email for verification code.',
        data: {
          userId,
          employeeId,
          email: data.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred during registration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
