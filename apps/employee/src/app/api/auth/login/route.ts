/**
 * Employee Login API Route
 * Handles authentication with device trust and OTP challenges
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, profiles, trustedDevices, createAuditLog } from '@tupsafe/database/server';
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

    // Initialize Supabase client
    const supabase = await createServerClient();

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

    // Check account status
    if (profile.accountStatus === 'pending') {
      return NextResponse.json(
        {
          error: 'Account pending approval',
          message:
            'Your account is pending admin approval. Please wait for confirmation.',
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
    const deviceFingerprint = await generateDeviceFingerprint(
      userAgent,
      ipAddress
    );

    // Check if device is trusted
    const isTrusted = await checkTrustedDevice(userId, deviceFingerprint);

    // If device is not trusted, require OTP
    if (!isTrusted) {
      try {
        const otpResult = await generateOTP(userId, 'login_challenge');
        if (otpResult.code) {
          await sendOTPEmail(email, otpResult.code, 'login_challenge');
        }

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
      email,
      employeeId: profile.employeeId || undefined,
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

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId,
        email,
        employeeId: profile.employeeId,
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
