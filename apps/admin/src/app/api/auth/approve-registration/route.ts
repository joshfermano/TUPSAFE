/**
 * Approve Registration API Route
 * Approves pending employee registration and activates account
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

// Approval validation schema
const approvalSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  adminNotes: z.string().optional(),
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
    const validationResult = approvalSchema.safeParse(body);

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

    // Update profile to active
    await db
      .update(profiles)
      .set({
        accountStatus: 'active',
        approvedBy: adminUser.userId,
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(profiles.id, userId));

    // Update pending registration
    await db
      .update(pendingRegistrations)
      .set({
        status: 'approved',
        approvedBy: adminUser.userId,
        approvedAt: now,
        adminNotes: adminNotes || null,
      })
      .where(eq(pendingRegistrations.userId, userId));

    // Get user email for notification
    const supabase = await createServerClient('admin');
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData?.user?.email;

    // Send welcome email
    if (userEmail) {
      try {
        await sendEmail(
          userEmail,
          'Account Approved - TUPSAFE',
          `
            <h2>Welcome to TUPSAFE!</h2>
            <p>Dear ${profile.firstName} ${profile.lastName},</p>
            <p>Your account has been approved and is now active.</p>
            <p><strong>Your Employee ID:</strong> ${profile.employeeId}</p>
            <p>You can now log in to your account and start using the system.</p>
            <p>If you have any questions, please contact the HR department.</p>
            <br>
            <p>Best regards,</p>
            <p>TUPSAFE Team</p>
          `
        );
      } catch (error) {
        console.error('Error sending welcome email:', error);
        // Non-critical, continue
      }
    }

    // Create notification for user
    try {
      await db.insert(notifications).values({
        userId,
        type: 'system_update',
        title: 'Account Approved',
        message: `Your account has been approved! You can now access all features of TUPSAFE.`,
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
        action: 'APPROVE',
        entityType: 'profile',
        entityId: pendingReg.id,
        changes: {
          after: {
            approvedUserId: userId,
            employeeId: profile.employeeId,
            approvedBy: adminUser.userId,
            adminNotes,
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
      message: 'Registration approved successfully',
      data: {
        userId,
        employeeId: profile.employeeId,
        approvedBy: adminUser.userId,
        approvedAt: now,
      },
    });
  } catch (error) {
    console.error('Error approving registration:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while approving registration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
