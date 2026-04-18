/**
 * Reject Registration API Route - POST /api/registrations/[id]/reject
 * Enhanced rejection endpoint with improved validation and notifications
 *
 * Features:
 * - Account rejection (accountStatus: 'pending' -> 'rejected', isActive: false)
 * - Required rejection reason (min 10 characters)
 * - Optional email notification
 * - In-app notification with reason
 * - Comprehensive audit logging with rejection reason
 * - Professional rejection email template
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  profiles,
  pendingRegistrations,
  notifications,
  createAuditLog,
} from '@tupsafe/database/server';
import { eq, or } from 'drizzle-orm';
import {
  checkUserRoleFromSupabase,
  getUserFromSupabase,
  sendEmail,
} from '@tupsafe/auth/server';
import {
  rejectRegistrationSchema,
  type RejectRegistrationInput,
  type ApiResponse,
} from '@tupsafe/types';

export const dynamic = 'force-dynamic';
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authorization check - HR or Admin only
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    // Get current admin user
    const adminUser = await getUserFromSupabase('admin');

    if (!adminUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session expired. Please login again.',
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid registration ID',
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = rejectRegistrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { reason, sendEmail: shouldSendEmail }: RejectRegistrationInput =
      validationResult.data;

    // Find registration by pending registration ID or user ID
    const [pendingReg] = await db
      .select()
      .from(pendingRegistrations)
      .where(
        or(
          eq(pendingRegistrations.id, id),
          eq(pendingRegistrations.userId, id)
        )
      )
      .limit(1);

    if (!pendingReg) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pending registration not found',
        },
        { status: 404 }
      );
    }

    // Check if already processed
    if (pendingReg.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Registration has already been ${pendingReg.status}`,
        },
        { status: 400 }
      );
    }

    const userId = pendingReg.userId;

    // Get user profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found',
        },
        { status: 404 }
      );
    }

    const now = new Date();

    // Update profile to rejected
    await db
      .update(profiles)
      .set({
        accountStatus: 'rejected',
        isActive: false,
        updatedAt: now,
      })
      .where(eq(profiles.id, userId));

    // Update pending registration with rejection details
    await db
      .update(pendingRegistrations)
      .set({
        status: 'rejected',
        approvedBy: adminUser.userId, // Track who rejected
        rejectedAt: now,
        adminNotes: reason,
      })
      .where(eq(pendingRegistrations.id, pendingReg.id));

    // Get user email for notification (requires admin client)
    const { createAdminClient } = await import('@tupsafe/auth/server');
    const supabase = await createAdminClient();
    let userEmail: string | null = null;

    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      userEmail = userData?.user?.email || null;
    } catch (error) {
      console.error(`Error fetching email for user ${userId}:`, error);
    }

    // Send rejection email if requested and email is available
    if (shouldSendEmail && userEmail) {
      try {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0066cc;">Registration Status Update - TUPSAFE</h2>
            <p>Dear ${profile.firstName} ${profile.lastName},</p>

            <p>We regret to inform you that your registration for TUPSAFE has not been approved at this time.</p>

            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason:</strong></p>
              <p style="margin: 10px 0 0 0;">${reason}</p>
            </div>

            <p>If you believe this is an error or have questions regarding this decision, please contact the HR department for clarification.</p>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Contact Information:</strong></p>
              <p style="margin: 10px 0 0 0;">
                HR Department<br>
                Technological University of the Philippines - Manila<br>
                Email: hr@tup.edu.ph
              </p>
            </div>

            <p>Thank you for your interest in TUPSAFE.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>TUPSAFE Team</strong><br>
              Technological University of the Philippines - Manila
            </p>
          </div>
        `;

        await sendEmail(userEmail, 'Registration Update - TUPSAFE', emailContent);
      } catch (error) {
        console.error('Error sending rejection email:', error);
        // Non-critical, continue
      }
    }

    // Create in-app notification
    try {
      await db.insert(notifications).values({
        userId,
        type: 'system_update',
        title: 'Registration Not Approved',
        message: `Your registration was not approved. Reason: ${reason}. Please contact HR for more information.`,
        isRead: false,
        createdAt: now,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Non-critical, continue
    }

    // Create audit log
    try {
      await createAuditLog({
        userId: adminUser.userId,
        action: 'REJECT_REGISTRATION',
        entityType: 'registration',
        entityId: pendingReg.id,
        changes: {
          before: {
            accountStatus: profile.accountStatus,
            isActive: profile.isActive,
          },
          after: {
            accountStatus: 'rejected',
            isActive: false,
            rejectedUserId: userId,
            employeeId: profile.employeeId,
            rejectedBy: adminUser.userId,
            reason,
            emailSent: shouldSendEmail && !!userEmail,
          },
        },
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Non-critical, continue
    }

    const response: ApiResponse<{
      userId: string;
      employeeId: string | null;
      rejectedBy: string;
      rejectedAt: Date;
      reason: string;
      emailSent: boolean;
    }> = {
      success: true,
      data: {
        userId,
        employeeId: profile.employeeId,
        rejectedBy: adminUser.userId,
        rejectedAt: now,
        reason,
        emailSent: shouldSendEmail && !!userEmail,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error rejecting registration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while rejecting registration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
