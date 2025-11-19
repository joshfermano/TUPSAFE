/**
 * Device Verification API Route
 * Verifies OTP for untrusted devices and trusts them for admin users
 *
 * Security:
 * - OTP verification for device trust
 * - 30-day device trust period
 * - Admin role verification
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  db,
  profiles,
  createAuditLog,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { verifyOTP, createSession, trustDevice } from '@tupsafe/auth/server';

// Device verification validation schema
const deviceVerificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  code: z.string().length(6, 'OTP must be 6 digits'),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required'),
});

// Allowed admin roles
const ADMIN_ROLES = ['admin', 'super_admin', 'hr'] as const;

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
    const otpVerification = await verifyOTP(userId, code, 'login_challenge');

    if (!otpVerification.success) {
      return NextResponse.json(
        {
          error:
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

    // Verify admin privileges
    if (!ADMIN_ROLES.includes(profile.role as (typeof ADMIN_ROLES)[number])) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'Admin or HR privileges required.',
        },
        { status: 403 }
      );
    }

    // Trust the device (30 days)
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '';

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

    // Create session
    await createSession({
      userId,
      id: userId,
      email: profile.firstName + '@' + profile.lastName, // Will get actual email from Supabase
      ...(profile.employeeId ? { employeeId: profile.employeeId } : {}),
      role: profile.role,
      lastActivity: Date.now(),
      deviceFingerprint,
    });

    // Log audit event for device verification
    try {
      await createAuditLog({
        userId,
        action: 'UPDATE',
        entityType: 'auth',
        entityId: userId,
        metadata: {
          action: 'device_verified',
          deviceFingerprint,
          role: profile.role,
          portalAccess: 'admin',
          trustedAt: new Date().toISOString(),
          expiresAt: trustResult.expiresAt?.toISOString(),
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
      message: 'Device verified and trusted successfully',
      data: {
        userId,
        employeeId: profile.employeeId,
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
