/**
 * Email Verification API Route
 * Verifies OTP and creates pending registration for admin approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  db,
  pendingRegistrations,
  profiles,
  notifications,
  createAuditLog,
} from '@tupsafe/database/server';
import { eq, and, or } from 'drizzle-orm';
import { verifyOTP, createServerClient } from '@tupsafe/auth/server';

// Verification validation schema
const verificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = verificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, code } = validationResult.data;

    // Verify OTP
    const otpResult = await verifyOTP(userId, code, 'email_verification');

    if (!otpResult.success) {
      return NextResponse.json(
        {
          error:
            otpResult.error ||
            'Invalid or expired verification code. Please request a new code.',
        },
        { status: 400 }
      );
    }

    // Update profile email verification timestamp
    try {
      await db
        .update(profiles)
        .set({
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));
    } catch (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    // CRITICAL: Also confirm email in Supabase auth.users table
    // This is required for signInWithPassword() to work
    // Without this, users will get 401 errors when trying to log in
    try {
      const supabase = await createServerClient('employee');
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          email_confirm: true,
        }
      );

      if (confirmError) {
        console.error('Error confirming email in Supabase:', confirmError);
        // Don't fail the entire request - user can still be manually fixed
      }
    } catch (error) {
      console.error('Error updating Supabase email confirmation:', error);
      // Non-critical for user experience, but should be monitored
    }

    // Create pending registration entry for admin approval
    try {
      await db.insert(pendingRegistrations).values({
        userId,
        status: 'pending',
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error creating pending registration:', error);
      return NextResponse.json(
        { error: 'Failed to create approval request' },
        { status: 500 }
      );
    }

    // Get all HR and admin users for notification
    const hrAndAdmins = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.isActive, true),
          eq(profiles.accountStatus, 'active'),
          or(eq(profiles.role, 'hr'), eq(profiles.role, 'admin'))
        )
      );

    // Create notifications for HR/admins
    if (hrAndAdmins.length > 0) {
      try {
        const notificationPromises = hrAndAdmins.map((admin) =>
          db.insert(notifications).values({
            userId: admin.id,
            type: 'approval_required',
            title: 'New Employee Registration',
            message: `A new employee registration requires your approval. Employee ID: ${userId}`,
            isRead: false,
            createdAt: new Date(),
          })
        );

        await Promise.all(notificationPromises);
      } catch (error) {
        console.error('Error creating notifications:', error);
        // Non-critical, continue
      }
    }

    // Log audit event
    try {
      await createAuditLog({
        userId,
        action: 'UPDATE',
        entityType: 'profile',
        entityId: userId,
        metadata: {
          emailVerifiedAt: new Date().toISOString(),
        },
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Non-critical, continue
    }

    return NextResponse.json({
      success: true,
      message:
        'Email verified successfully! Your account is now pending admin approval.',
      data: {
        userId,
        status: 'pending_approval',
      },
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred during verification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
