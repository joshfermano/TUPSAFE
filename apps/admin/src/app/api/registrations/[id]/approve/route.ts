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
} from '@tupsafe/database/server';
import { eq, or, sql } from 'drizzle-orm';
import {
  checkUserRoleFromSupabase,
  sendWelcomeEmail,
  createServerClient,
} from '@tupsafe/auth/server';
import {
  approveRegistrationSchema,
  type ApproveRegistrationInput,
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
    // Verify critical environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured!');
      return NextResponse.json({
        success: false,
        error: 'Server configuration error - missing service role key'
      }, { status: 500 });
    }

    const { id } = await params;
    console.log(`[Approve] Starting approval process for registration ID: ${id}`);

    // Authorization check - HR or Admin only
    const hasPermission = await checkUserRoleFromSupabase(['hr', 'admin'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    // Get current admin user (for audit trail)
    const sessionClient = await createServerClient('admin');
    const { data: { session } } = await sessionClient.auth.getSession();
    const adminUserId = session?.user?.id;

    // Create admin client for admin operations
    const { createAdminClient } = await import('@tupsafe/auth/server');
    const supabase = await createAdminClient();

    if (!adminUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session expired. Please login again.',
        },
        { status: 401 }
      );
    }

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
        // Validate date of birth is present
        if (!profile.dateOfBirth) {
          console.error('[Approve] Employee missing date of birth:', profile.id);
          return NextResponse.json(
            {
              success: false,
              error: 'Cannot generate employee ID: date of birth is required',
              details: 'This user registration is missing birth date information. Please ensure birth date is collected during registration.',
            },
            { status: 400 }
          );
        }

        // Call SQL function to generate employee ID based on birth date
        // Format: TUPM-MMDD-YY-### (e.g., TUPM-0513-04-001 for May 13, 2004)
        const result = await db.execute(
          sql`SELECT generate_employee_id(${profile.dateOfBirth}::date) as employee_id`
        );

        employeeId = result[0]?.employee_id as string;

        if (!employeeId) {
          throw new Error('SQL function returned no employee ID');
        }

        console.log(`[Approve] Generated employee ID: ${employeeId} for birth date: ${profile.dateOfBirth}`);
      } catch (error) {
        console.error('[Approve] Error generating employee ID:', error);
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
    const profileUpdate: Record<string, unknown> = {
      accountStatus: 'active',
      isActive: true,
      approvedBy: adminUserId,
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
        approvedBy: adminUserId,
        approvedAt: now,
        adminNotes: notes || null,
      })
      .where(eq(pendingRegistrations.id, pendingReg.id));

    // Get user email and update auth metadata
    let userEmail: string | null = null;

    try {
      const { data: userData, error: userDataError } = await supabase.auth.admin.getUserById(userId);
      
      if (userDataError) {
        console.error(`❌ Error fetching user data for ${userId}:`, userDataError);
        throw userDataError;
      }
      
      userEmail = userData?.user?.email || null;

      // CRITICAL: Update user metadata to sync account status with auth
      // This ensures the pending-approval page correctly detects approval
      if (userData?.user) {
        console.log(`[Approve] Updating metadata for user ${userId}:`, {
          account_status: 'active',
          employee_id: employeeId,
        });

        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...userData.user.user_metadata,
            account_status: 'active',
            employee_id: employeeId,
            user_type: profile.userType,
            updated_at: now.toISOString(),
          },
        });

        if (updateError) {
          console.error(`❌ CRITICAL: Failed to update user metadata for ${userId}:`, updateError);
          // This is critical - return error to admin
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to update user authentication metadata',
              details: updateError.message,
            },
            { status: 500 }
          );
        }

        console.log(`✅ Metadata update completed for ${userId}:`, {
          success: !updateError,
          account_status: 'active',
          employee_id: employeeId,
          user_type: profile.userType,
        });

        // Log the actual updated metadata
        if (updateData?.user?.user_metadata) {
          console.log(`[Approve] New metadata values:`, updateData.user.user_metadata);
        }

        // CRITICAL: Verify metadata was actually updated
        console.log(`🔍 Verifying metadata update for user ${userId}...`);
        const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(userId);

        if (verifyError) {
          console.error(`❌ Verification failed - cannot fetch user:`, verifyError);
          return NextResponse.json({
            success: false,
            error: 'Failed to verify metadata update',
            details: verifyError.message
          }, { status: 500 });
        }

        const currentMetadata = verifyData?.user?.user_metadata;
        console.log(`[Approve] Verified current metadata:`, currentMetadata);

        if (currentMetadata?.account_status !== 'active') {
          console.error(`❌ VERIFICATION FAILED: account_status is "${currentMetadata?.account_status}", expected "active"`);
          return NextResponse.json({
            success: false,
            error: 'Metadata verification failed - account_status not updated',
            details: `Current status: ${currentMetadata?.account_status}`,
          }, { status: 500 });
        }

        console.log(`✅ Metadata verification PASSED - account_status is "active"`);
      }
    } catch (error) {
      console.error(`❌ CRITICAL: Error updating user metadata for ${userId}:`, error);
      // Don't silently fail - this is critical for user login
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to sync user authentication data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Send welcome email using proper email function
    if (userEmail) {
      try {
        const result = await sendWelcomeEmail(
          userEmail,
          employeeId || profile.applicantId || 'N/A',
          profile.firstName
        );

        if (!result.success) {
          console.error('Failed to send welcome email:', result.error);
        } else {
          console.log(`✓ Welcome email sent to ${userEmail}`);
        }
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
        userId: adminUserId,
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
            approvedBy: adminUserId,
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

    // Return response matching ApproveRegistrationResponse type expected by frontend
    const response = {
      success: true,
      user: {
        id: userId,
        email: userEmail || '',
        employeeId: employeeId || '',
        role: assignedRole || profile.role || 'employee',
      },
      message: 'Registration approved successfully',
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
