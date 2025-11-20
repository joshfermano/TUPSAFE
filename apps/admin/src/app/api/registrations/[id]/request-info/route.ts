/**
 * Request Additional Information API Route - POST /api/registrations/[id]/request-info
 * Request additional information from a registrant before approval
 *
 * Features:
 * - Status update to track pending information requests
 * - Email notification with requested information details
 * - In-app notification
 * - Audit logging
 * - Optional field-specific requests
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
  checkUserRole,
  getSessionUser,
  sendEmail,
  createServerClient,
} from '@tupsafe/auth/server';
import {
  requestInfoSchema,
  type ApiResponse,
} from '@tupsafe/types';

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
    const hasPermission = await checkUserRole(['hr', 'admin']);

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
    const adminUser = await getSessionUser();

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
    const validationResult = requestInfoSchema.safeParse(body);

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

    const { requestedInfo, notes, sendEmail: shouldSendEmail } =
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

    // Check if already processed (approved or rejected)
    if (pendingReg.status === 'approved' || pendingReg.status === 'rejected') {
      return NextResponse.json(
        {
          success: false,
          error: `Registration has already been ${pendingReg.status}. Cannot request additional information.`,
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

    // Update pending registration with info request note
    const existingNotes = pendingReg.adminNotes || '';
    const infoRequestNote = `[${now.toISOString()}] INFO REQUESTED: ${notes || '(no notes)'}${
      requestedInfo && requestedInfo.length > 0
        ? `\nRequired fields: ${requestedInfo.join(', ')}`
        : ''
    }`;
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${infoRequestNote}`
      : infoRequestNote;

    await db
      .update(pendingRegistrations)
      .set({
        adminNotes: updatedNotes,
      })
      .where(eq(pendingRegistrations.id, pendingReg.id));

    // Get user email for notification
    const supabase = await createServerClient('admin');
    let userEmail: string | null = null;

    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      userEmail = userData?.user?.email || null;
    } catch (error) {
      console.error(`Error fetching email for user ${userId}:`, error);
    }

    // Send email if requested and email is available
    if (shouldSendEmail && userEmail) {
      try {
        const fieldsSection = requestedInfo && requestedInfo.length > 0
          ? `
            <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Required Fields:</strong></p>
              <ul style="margin: 10px 0 0 0;">
                ${requestedInfo.map((field: string) => `<li>${field}</li>`).join('')}
              </ul>
            </div>
          `
          : '';

        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0066cc;">Additional Information Required - TUPSAFE</h2>
            <p>Dear ${profile.firstName} ${profile.lastName},</p>

            <p>Your registration for TUPSAFE is currently under review. We require some additional information before we can complete the approval process.</p>

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Request Details:</strong></p>
              <p style="margin: 10px 0 0 0;">${notes || 'Please provide the requested information.'}</p>
            </div>

            ${fieldsSection}

            <p>Please provide the requested information by contacting the HR department or updating your profile if applicable.</p>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Contact Information:</strong></p>
              <p style="margin: 10px 0 0 0;">
                HR Department<br>
                Technological University of the Philippines - Manila<br>
                Email: hr@tup.edu.ph
              </p>
            </div>

            <p>Thank you for your cooperation.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>TUPSAFE Team</strong><br>
              Technological University of the Philippines - Manila
            </p>
          </div>
        `;

        await sendEmail(userEmail, 'Additional Information Required - TUPSAFE', emailContent);
      } catch (error) {
        console.error('Error sending info request email:', error);
        // Non-critical, continue
      }
    }

    // Create in-app notification
    try {
      const notificationMessage = `Additional information is required for your registration. ${notes || ''}${
        requestedInfo && requestedInfo.length > 0
          ? ` Required fields: ${requestedInfo.join(', ')}`
          : ''
      }`;

      await db.insert(notifications).values({
        userId,
        type: 'system_update',
        title: 'Additional Information Required',
        message: notificationMessage,
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
        action: 'REQUEST_INFO_REGISTRATION',
        entityType: 'registration',
        entityId: pendingReg.id,
        changes: {
          requestedInfo: {
            userId,
            requestedBy: adminUser.userId,
            notes,
            requestedInfo,
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
      requestedBy: string;
      requestedAt: Date;
      notes: string | undefined;
      requestedInfo: string[];
      emailSent: boolean;
    }> = {
      success: true,
      data: {
        userId,
        requestedBy: adminUser.userId,
        requestedAt: now,
        notes,
        requestedInfo,
        emailSent: shouldSendEmail && !!userEmail,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error requesting additional information:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while requesting additional information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
