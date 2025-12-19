/**
 * Employee Login API Route
 * Handles authentication with device trust and OTP challenges
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  db,
  profiles,
  trustedDevices,
  createAuditLog,
} from '@tupsafe/database/server';
import { eq, and } from 'drizzle-orm';
import {
  createServerClient,
  generateDeviceFingerprint,
  checkTrustedDevice,
  generateOTP,
  sendOTPEmail,
  createSession,
} from '@tupsafe/auth/server';

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Initialize Supabase client with portal-specific cookie isolation
    // CRITICAL: Pass 'employee' portal to ensure session isolation from admin portal
    const supabase = await createServerClient('employee');

    // Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Get user profile and check account status
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

    // Check if email is verified
    if (!profile.emailVerifiedAt) {
      return NextResponse.json(
        {
          error: 'Email not verified',
          message:
            'Please verify your email address before logging in. Check your inbox for the verification code.',
          status: 'email_not_verified',
        },
        { status: 403 }
      );
    }

    // Block pending users - they must wait for admin approval
    if (profile.accountStatus === 'pending') {
      // Sign out to prevent session persistence
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          error: 'Account pending approval',
          message:
            'Your registration is pending admin approval. You will be notified once your account is approved.',
          status: 'pending_approval',
        },
        { status: 403 }
      );
    }

    if (profile.accountStatus === 'suspended') {
      return NextResponse.json(
        {
          error: 'Account suspended',
          message: 'Your account has been suspended. Please contact support.',
        },
        { status: 403 }
      );
    }

    if (profile.accountStatus === 'rejected') {
      return NextResponse.json(
        {
          error: 'Account rejected',
          message: 'Your registration was rejected. Please contact support.',
        },
        { status: 403 }
      );
    }

    if (!profile.isActive) {
      return NextResponse.json(
        {
          error: 'Account inactive',
          message: 'Your account is inactive. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Generate device fingerprint
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '';
    const deviceFingerprint = generateDeviceFingerprint(ipAddress, userAgent);

    // Check if device is trusted
    const deviceCheck = await checkTrustedDevice(userId, deviceFingerprint);
    const isTrusted = deviceCheck.trusted;

    // If device is not trusted, require OTP
    if (!isTrusted) {
      try {
        const otpResult = await generateOTP(userId, 'login_challenge');
        if (otpResult.code) {
          await sendOTPEmail(email, otpResult.code, 'login_challenge');
        }

        // CRITICAL: Sign out from Supabase to prevent session persistence
        // The session will be re-established after OTP verification
        await supabase.auth.signOut();

        return NextResponse.json({
          success: false,
          requiresOTP: true,
          message:
            'Device not recognized. Please verify with OTP sent to your email.',
          data: {
            userId,
            deviceFingerprint,
          },
        });
      } catch (error) {
        console.error('Error generating OTP:', error);
        return NextResponse.json(
          { error: 'Failed to send verification code' },
          { status: 500 }
        );
      }
    }

    // Update device last used timestamp
    try {
      await db
        .update(trustedDevices)
        .set({
          lastUsedAt: new Date(),
        })
        .where(
          and(
            eq(trustedDevices.userId, userId),
            eq(trustedDevices.deviceFingerprint, deviceFingerprint)
          )
        );
    } catch (error) {
      console.error('Error updating device last used:', error);
      // Non-critical, continue
    }

    // Create session
    await createSession({
      userId,
      id: userId,
      email,
      ...(profile.employeeId ? { employeeId: profile.employeeId } : {}),
      role: profile.role,
      lastActivity: Date.now(),
      deviceFingerprint,
    });

    // Log audit event
    try {
      await createAuditLog({
        userId,
        action: 'LOGIN',
        entityType: 'auth',
        entityId: userId,
        metadata: {
          deviceTrusted: true,
        },
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Non-critical, continue
    }

    // Return session data so the client can establish a Supabase session
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in,
        token_type: authData.session.token_type,
        user: authData.session.user,
      },
      data: {
        userId,
        email,
        employeeId: profile.employeeId,
        applicantId: profile.applicantId,
        userType: profile.userType,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role,
        departmentId: profile.departmentId,
        positionId: profile.positionId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred during login',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
