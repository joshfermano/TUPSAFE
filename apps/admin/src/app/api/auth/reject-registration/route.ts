/**
 * Reject Registration API Route
 * Rejects pending employee registration
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
import { eq } from 'drizzle-orm';
import {
  checkUserRole,
  getSessionUser,
  sendEmail,
  createServerClient,
} from '@tupsafe/auth/server';

// Rejection validation schema
const rejectionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  adminNotes: z.string().min(1, 'Rejection reason is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Check if user has HR or admin role
    const hasPermission = await checkUserRole(['hr', 'admin']);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. HR or Admin role required.' },
        { status: 403 }
      );
    }

    // Get current admin user
    const adminUser = await getSessionUser();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = rejectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, adminNotes } = validationResult.data;

    // Check if pending registration exists
    const [pendingReg] = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.userId, userId))
      .limit(1);

    if (!pendingReg) {
      return NextResponse.json(
        { error: 'Pending registration not found' },
        { status: 404 }
      );
    }

    if (pendingReg.status !== 'pending') {
      return NextResponse.json(
        { error: 'Registration has already been processed' },
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

    const now = new Date();

    // Update profile to rejected
    await db
      .update(profiles)
      .set({
        accountStatus: 'rejected',
        updatedAt: now,
      })
      .where(eq(profiles.id, userId));

    // Update pending registration
    await db
      .update(pendingRegistrations)
      .set({
        status: 'rejected',
        approvedBy: adminUser.userId, // Track who rejected
        rejectedAt: now,
        adminNotes,
      })
      .where(eq(pendingRegistrations.userId, userId));

    // Get user email for notification
    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;

    // Send rejection email
    if (userEmail) {
      try {
        await sendEmail(
          userEmail,
          'Registration Update - TUPSAFE',
          `
            <h2>Registration Status Update</h2>
            <p>Dear ${profile.firstName} ${profile.lastName},</p>
            <p>We regret to inform you that your registration for TUPSAFE has not been approved at this time.</p>
            <p><strong>Reason:</strong> ${adminNotes}</p>
            <p>If you believe this is an error or have questions, please contact the HR department.</p>
            <br>
            <p>Best regards,</p>
            <p>TUPSAFE Team</p>
          `
        );
      } catch (error) {
        console.error('Error sending rejection email:', error);
        // Non-critical, continue
      }
    }

    // Create notification for user
    try {
      await db.insert(notifications).values({
        userId,
        type: 'system_update',
        title: 'Registration Not Approved',
        message: `Your registration was not approved. Reason: ${adminNotes}`,
        isRead: false,
        createdAt: now,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Non-critical, continue
    }

    // Log audit event
    try {
      await createAuditLog({
        userId: adminUser.userId,
        action: 'REJECT',
        entityType: 'profile',
        entityId: pendingReg.id,
        changes: {
          after: {
            rejectedUserId: userId,
            employeeId: profile.employeeId,
            rejectedBy: adminUser.userId,
            reason: adminNotes,
          },
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
      message: 'Registration rejected successfully',
      data: {
        userId,
        employeeId: profile.employeeId,
        rejectedBy: adminUser.userId,
        rejectedAt: now,
        reason: adminNotes,
      },
    });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while rejecting registration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
