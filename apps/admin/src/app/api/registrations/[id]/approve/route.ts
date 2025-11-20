/**
 * Approve Registration API Route - POST /api/registrations/[id]/approve
 * Enhanced approval endpoint with role, department, and position assignment
 *
 * Features:
 * - Account activation (accountStatus: 'pending' -> 'active', isActive: true)
 * - Optional role assignment (employee, hr, admin)
 * - Optional department and position assignment
 * - Employee ID generation for employee user type
 * - Email notification
 * - In-app notification
 * - Comprehensive audit logging
 * - Transaction safety for data consistency
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  profiles,
  pendingRegistrations,
  notifications,
  createAuditLog,
  generateAdminEmployeeId,
} from '@tupsafe/database/server';
import { eq, or } from 'drizzle-orm';
import {
  checkUserRole,
  getSessionUser,
  sendEmail,
  createServerClient,
} from '@tupsafe/auth/server';
import {
  approveRegistrationSchema,
  type ApproveRegistrationInput,
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
    const validationResult = approveRegistrationSchema.safeParse(body);

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

    const { role: assignedRole, assignedDepartmentId: departmentId, assignedPositionId: positionId, notes }: ApproveRegistrationInput =
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

    // Generate employee ID if user is employee type and doesn't have one
    let employeeId = profile.employeeId;
    if (profile.userType === 'employee' && !employeeId) {
      try {
        employeeId = await generateAdminEmployeeId();
      } catch (error) {
        console.error('Error generating employee ID:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to generate employee ID',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Prepare profile update
    const profileUpdate: any = {
      accountStatus: 'active',
      isActive: true,
      approvedBy: adminUser.userId,
      approvedAt: now,
      updatedAt: now,
    };

    // Add optional fields if provided
    if (employeeId) profileUpdate.employeeId = employeeId;
    if (assignedRole) profileUpdate.role = assignedRole;
    if (departmentId) profileUpdate.departmentId = departmentId;
    if (positionId) profileUpdate.positionId = positionId;

    // Update profile
    await db
      .update(profiles)
      .set(profileUpdate)
      .where(eq(profiles.id, userId));

    // Update pending registration
    await db
      .update(pendingRegistrations)
      .set({
        status: 'approved',
        approvedBy: adminUser.userId,
        approvedAt: now,
        adminNotes: notes || null,
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

    // Send welcome email
    if (userEmail) {
      try {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0066cc;">Welcome to TUPSAFE!</h2>
            <p>Dear ${profile.firstName} ${profile.lastName},</p>

            <p>Congratulations! Your account has been approved and is now active.</p>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              ${employeeId ? `<p><strong>Employee ID:</strong> ${employeeId}</p>` : ''}
              ${assignedRole ? `<p><strong>Role:</strong> ${assignedRole.toUpperCase()}</p>` : ''}
              ${departmentId ? '<p><strong>Department:</strong> Assigned</p>' : ''}
              ${positionId ? '<p><strong>Position:</strong> Assigned</p>' : ''}
            </div>

            <p>You can now log in to your account and start using the system to:</p>
            <ul>
              <li>Submit and manage your Personal Data Sheet (PDS)</li>
              <li>File your Statement of Assets, Liabilities, and Net Worth (SALN)</li>
              <li>Track submission status and deadlines</li>
              <li>Update your profile information</li>
            </ul>

            ${notes ? `<p><strong>Note from HR:</strong> ${notes}</p>` : ''}

            <p>If you have any questions, please contact the HR department.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              <strong>TUPSAFE Team</strong><br>
              Technological University of the Philippines - Manila
            </p>
          </div>
        `;

        await sendEmail(userEmail, 'Account Approved - TUPSAFE', emailContent);
      } catch (error) {
        console.error('Error sending welcome email:', error);
        // Non-critical, continue
      }
    }

    // Create in-app notification
    try {
      await db.insert(notifications).values({
        userId,
        type: 'system_update',
        title: 'Account Approved',
        message: `Your account has been approved! ${employeeId ? `Your Employee ID is ${employeeId}.` : ''} You can now access all features of TUPSAFE.`,
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
        action: 'APPROVE_REGISTRATION',
        entityType: 'registration',
        entityId: pendingReg.id,
        changes: {
          before: {
            accountStatus: profile.accountStatus,
            isActive: profile.isActive,
            role: profile.role,
          },
          after: {
            accountStatus: 'active',
            isActive: true,
            approvedUserId: userId,
            employeeId,
            assignedRole,
            departmentId,
            positionId,
            approvedBy: adminUser.userId,
            notes,
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
      assignedRole?: string;
      approvedBy: string;
      approvedAt: Date;
    }> = {
      success: true,
      data: {
        userId,
        employeeId,
        assignedRole,
        approvedBy: adminUser.userId,
        approvedAt: now,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error approving registration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while approving registration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
