/**
 * Device Verification API Route
 * Verifies OTP for untrusted devices and trusts them
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  db,
  profiles,
  createAuditLog,
  createSessionLog,
  updateLastLogin,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { verifyOTP, createSession, trustDevice, createAdminClient, createServerClient } from '@tupsafe/auth/server';
import { parseUserAgent, formatUserAgent } from '@/lib/user-agent-parser';

// Device verification validation schema
const deviceVerificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  code: z.string().length(6, 'OTP must be 6 digits'),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = deviceVerificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, code, deviceFingerprint } = validationResult.data;

    // Verify OTP
    const otpResult = await verifyOTP(userId, code, 'login_challenge');

    if (!otpResult.success) {
      return NextResponse.json(
        {
          error: otpResult.error ||
            'Invalid or expired verification code. Please request a new code.',
        },
        { status: 400 }
      );
    }

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

    // Trust the device (30 days) using utility function
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') || '';

    const trustResult = await trustDevice(
      userId,
      deviceFingerprint,
      userAgent,
      ipAddress
    );

    if (!trustResult.success) {
      return NextResponse.json(
        { error: 'Failed to trust device' },
        { status: 500 }
      );
    }

    // Get user email from Supabase auth (not stored in profiles table)
    const adminClient = createAdminClient();
    const { data: userData, error: userError } =
      await adminClient.auth.admin.getUserById(userId);

    if (userError || !userData.user || !userData.user.email) {
      return NextResponse.json(
        { error: 'Failed to retrieve user email' },
        { status: 500 }
      );
    }

    const email = userData.user.email;

    // Generate a magic link using admin client to get hashed_token
    // This is needed because the login route signed out when OTP was required
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData) {
      console.error('Failed to generate magic link:', linkError?.message || linkError);
      return NextResponse.json(
        { error: 'Failed to create session token. Please try logging in again.' },
        { status: 500 }
      );
    }

    if (!linkData.properties?.hashed_token) {
      console.error('Magic link generated but missing hashed_token');
      return NextResponse.json(
        { error: 'Invalid session token generated. Please try logging in again.' },
        { status: 500 }
      );
    }

    // Use server client (with portal-specific cookies) to verify the token and create session
    // CRITICAL: Pass 'employee' portal to ensure session isolation from admin portal
    const supabase = await createServerClient('employee');
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token,
    });

    if (sessionError || !sessionData.session) {
      // Type assertion for error details
      const errorDetails = sessionError as { message?: string; code?: string; status?: number } | null;

      console.error('Failed to create session:', {
        error: errorDetails?.message || sessionError,
        code: errorDetails?.code,
        status: errorDetails?.status,
      });

      // Provide user-friendly error message
      const errorMessage = errorDetails?.message?.includes('token_hash')
        ? 'Invalid verification token. Please request a new verification code.'
        : 'Failed to establish session. Please try logging in again.';

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Create application session
    await createSession({
      userId,
      id: userId,
      email,
      ...(profile.employeeId ? { employeeId: profile.employeeId } : {}),
      ...(profile.applicantId ? { applicantId: profile.applicantId } : {}),
      role: profile.role,
      lastActivity: Date.now(),
      deviceFingerprint,
    });

    // Create database session log
    try {
      // Parse user agent to extract device information
      const parsedUserAgent = parseUserAgent(userAgent);

      // Create session log in database
      await createSessionLog({
        userId,
        ipAddress,
        userAgent,
        parsed: parsedUserAgent,
        deviceFingerprint,
      });

      // Update profile's last login information
      const deviceDescription = formatUserAgent(parsedUserAgent);
      await updateLastLogin({
        userId,
        ipAddress,
        device: deviceDescription,
      });

      console.log(`[Device Verification] Session log created for user: ${userId}`);
    } catch (error) {
      // Non-critical operation - log error but don't fail device verification
      console.error('[Device Verification] Error creating session log:', error);
    }

    // Log audit event
    try {
      await createAuditLog({
        userId,
        action: 'UPDATE',
        entityType: 'auth',
        entityId: userId,
        metadata: {
          deviceFingerprint,
          deviceTrusted: true,
          trustedAt: new Date(Date.now()).toISOString(),
          expiresAt: trustResult.expiresAt?.toISOString(),
        },
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Non-critical, continue
    }

    // Return success with session information
    return NextResponse.json({
      success: true,
      message: 'Device verified and trusted successfully',
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
        expires_in: sessionData.session.expires_in,
        token_type: sessionData.session.token_type,
        user: sessionData.session.user,
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
    console.error('Device verification error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred during device verification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
