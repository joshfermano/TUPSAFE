/**
 * Admin Login API Route
 * Handles authentication for admin users
 *
 * Security Requirements:
 * - Admin-only access (verifies role: admin, super_admin, or hr)
 * - Account status validation (active, approved accounts only)
 * - Audit logging for all login attempts
 * - Session management with device fingerprinting
 *
 * NOTE: OTP verification is currently disabled for the admin portal.
 * For enhanced security, OTP can be re-enabled by uncommenting the
 * device trust verification code in this file.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  db,
  profiles,
  createAuditLog,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import {
  createServerClient,
  generateDeviceFingerprint,
  createSession,
} from '@tupsafe/auth/server';

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Allowed admin roles
const ADMIN_ROLES = ['admin', 'super_admin', 'hr'] as const;

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

    // ADMIN PORTAL SECURITY: Verify user has admin privileges
    if (!ADMIN_ROLES.includes(profile.role as 'admin' | 'hr' | 'super_admin')) {
      // Log unauthorized access attempt
      try {
        await createAuditLog({
          userId,
          action: 'LOGIN_ATTEMPT',
          entityType: 'auth',
          entityId: userId,
          metadata: {
            success: false,
            reason: 'insufficient_privileges',
            attemptedRole: profile.role,
          },
          ipAddress:
            request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });
      } catch (error) {
        console.error('Error logging unauthorized access attempt:', error);
      }

      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'Admin or HR privileges required to access this portal.',
        },
        { status: 403 }
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

    // Generate device fingerprint for audit logging
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '';
    const deviceFingerprint = generateDeviceFingerprint(ipAddress, userAgent);

    // NOTE: OTP verification disabled for admin portal
    // Admin users can login directly without device trust verification
    // For enhanced security, re-enable OTP by uncommenting the code below:

    /*
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
    */

    // Create session (admin session)
    await createSession({
      userId,
      id: userId,
      email,
      ...(profile.employeeId ? { employeeId: profile.employeeId } : {}),
      role: profile.role,
      lastActivity: Date.now(),
      deviceFingerprint,
    });

    // Log successful admin login
    try {
      await createAuditLog({
        userId,
        action: 'LOGIN',
        entityType: 'auth',
        entityId: userId,
        metadata: {
          otpVerification: false, // OTP disabled for admin portal
          role: profile.role,
          portalAccess: 'admin',
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
