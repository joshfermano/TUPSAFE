/**
 * Device Verification API Route
 * Verifies OTP for untrusted devices and trusts them
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  db,
  profiles,
  trustedDevices,
  createAuditLog,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { verifyOTP, createSession } from '@tupsafe/auth/server';

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
    const isValid = await verifyOTP(userId, code, 'login_challenge');

    if (!isValid) {
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

    // Trust the device (30 days)
    const trustedAt = new Date();
    const expiresAt = new Date(trustedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    try {
      await db.insert(trustedDevices).values({
        userId,
        deviceFingerprint,
        browserInfo: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '',
        trustedAt,
        expiresAt,
        lastUsedAt: trustedAt,
      });
    } catch (error) {
      console.error('Error trusting device:', error);
      return NextResponse.json(
        { error: 'Failed to trust device' },
        { status: 500 }
      );
    }

    // Create session
    await createSession({
      userId,
      email: profile.firstName + '@' + profile.lastName, // We'll get actual email from Supabase
      employeeId: profile.employeeId || undefined,
      role: profile.role,
      lastActivity: Date.now(),
      deviceFingerprint,
    });

    // Log audit event
    try {
      await createAuditLog({
        userId,
        action: 'UPDATE',
        entityType: 'auth',
        entityId: userId,
        metadata: {
          deviceFingerprint,
          trustedAt: trustedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
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
