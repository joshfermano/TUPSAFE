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
  employeeIdRegistry,
} from '@tupsafe/database/server';
import { eq, sql } from 'drizzle-orm';
import {
  getUserFromSupabase,
  sendEmail,
  createServerClient,
} from '@tupsafe/auth/server';

export const dynamic = 'force-dynamic';

// Approval validation schema
const approvalSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  adminNotes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get current admin user from Supabase session (portal-specific)
    const adminUser = await getUserFromSupabase('admin');

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Verify user has HR or admin role
    const allowedRoles = ['superadmin', 'admin', 'hr'];
    if (!allowedRoles.includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. HR or Admin role required.' },
        { status: 403 }
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

    // ========================================================================
    // CRITICAL: Generate employee_id or applicant_id based on user type
    // ========================================================================
    let generatedId: string | null = null;

    try {
      if (profile.userType === 'employee') {
        // CRITICAL: Birth date is required for employee ID generation
        if (!profile.dateOfBirth) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cannot approve employee registration',
              details: 'Birth date is required to generate employee ID. Please ensure the user provided their birth date during registration.',
            },
            { status: 400 }
          );
        }

        console.log(`Generating employee ID for birth date: ${profile.dateOfBirth}`);

        const result = await db.execute<{ generate_employee_id: string }>(
          sql`SELECT generate_employee_id(${profile.dateOfBirth}::date)`
        );

        if (!result || !result[0]?.generate_employee_id) {
          throw new Error('Failed to generate employee ID');
        }

        generatedId = result[0].generate_employee_id;
        console.log(`✓ Generated employee ID: ${generatedId}`);
      } else if (profile.userType === 'applicant') {
        // Generate applicant ID using SQL function
        // Format: APPL-YYYY-XXXX (e.g., APPL-2025-0001)

        console.log('Generating applicant ID for current year');

        const result = await db.execute<{ generate_applicant_id: string }>(
          sql`SELECT generate_applicant_id() as generate_applicant_id`
        );

        generatedId = result[0]?.generate_applicant_id;

        if (!generatedId) {
          throw new Error('Failed to generate applicant ID - function returned null');
        }

        console.log(`✓ Generated applicant ID: ${generatedId}`);
      } else {
        throw new Error(`Invalid user type: ${profile.userType}`);
      }
    } catch (error) {
      console.error('Error generating ID:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate user ID',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // ========================================================================
    // Update profile to active with generated ID
    // ========================================================================
    try {
      type ProfileUpdate = {
        accountStatus: 'active';
        approvedBy: string;
        approvedAt: Date;
        updatedAt: Date;
        employeeId?: string;
        applicantId?: string;
      };

      const updateData: ProfileUpdate = {
        accountStatus: 'active' as const,
        approvedBy: adminUser.userId,
        approvedAt: now,
        updatedAt: now,
      };

      // Add the generated ID to the appropriate field
      if (profile.userType === 'employee' && generatedId) {
        updateData.employeeId = generatedId;
      } else if (profile.userType === 'applicant' && generatedId) {
        updateData.applicantId = generatedId;
      }

      await db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.id, userId));

      console.log(`✓ Updated profile with ${profile.userType === 'employee' ? 'employee_id' : 'applicant_id'}: ${generatedId}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        {
          error: 'Failed to update profile with generated ID',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // ========================================================================
    // For employees: Register ID in employeeIdRegistry
    // ========================================================================
    if (profile.userType === 'employee' && generatedId) {
      try {
        await db.insert(employeeIdRegistry).values({
          employeeId: generatedId,
          userId: userId,
          createdAt: now,
        });

        console.log(`✓ Registered employee ID ${generatedId} in registry`);
      } catch (error) {
        console.error('Error registering employee ID:', error);
        // Non-critical - the ID is already set in profile
        // Log but continue
      }
    }

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

    // CRITICAL FIX: Sync user metadata to allow dashboard access
    // This updates the account_status to 'active' so middleware allows dashboard access
    try {
      type MetadataUpdate = {
        account_status: string;
        approved_at: string;
        approved_by: string;
        user_type: string;
        employee_id?: string;
        applicant_id?: string;
      };

      const metadataUpdate: MetadataUpdate = {
        account_status: 'active',
        approved_at: now.toISOString(),
        approved_by: adminUser.userId,
        user_type: profile.userType,
      };

      // Add the generated ID to metadata
      if (profile.userType === 'employee' && generatedId) {
        metadataUpdate.employee_id = generatedId;
      } else if (profile.userType === 'applicant' && generatedId) {
        metadataUpdate.applicant_id = generatedId;
      }

      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: metadataUpdate,
        }
      );

      if (metadataError) {
        console.error('Error syncing user metadata on approval:', metadataError);
        // Log but don't fail - user can still access via database check
      } else {
        console.log(`✓ Synced user metadata: accountStatus=active, ${profile.userType === 'employee' ? 'employee_id' : 'applicant_id'}=${generatedId} for ${userId}`);
      }
    } catch (error) {
      console.error('Error updating user metadata:', error);
      // Non-critical, continue
    }

    // Send welcome email
    if (userEmail) {
      try {
        const idLabel = profile.userType === 'employee' ? 'Employee ID' : 'Applicant ID';
        const idValue = generatedId;

        await sendEmail(
          userEmail,
          'Account Approved - TUPSAFE',
          `
            <h2>Welcome to TUPSAFE!</h2>
            <p>Dear ${profile.firstName} ${profile.lastName},</p>
            <p>Your account has been approved and is now active.</p>
            <p><strong>Your ${idLabel}:</strong> ${idValue}</p>
            <p>You can now log in to your account and start using the system.</p>
            ${profile.userType === 'employee' ? '<p>As an employee, you can submit and manage your PDS and SALN forms.</p>' : '<p>As an applicant, you can browse open positions and submit job applications.</p>'}
            <p>If you have any questions, please contact the HR department.</p>
            <br>
            <p>Best regards,</p>
            <p>TUPSAFE Team</p>
          `
        );

        console.log(`✓ Sent welcome email to ${userEmail} with ${idLabel}: ${idValue}`);
      } catch (error) {
        console.error('Error sending welcome email:', error);
        // Non-critical, continue
      }
    }

    // Create notification for user
    try {
      const idLabel = profile.userType === 'employee' ? 'Employee ID' : 'Applicant ID';

      await db.insert(notifications).values({
        userId,
        type: 'system_update',
        title: 'Account Approved',
        message: `Your account has been approved! Your ${idLabel} is ${generatedId}. You can now access all features of TUPSAFE.`,
        isRead: false,
        createdAt: now,
      });

      console.log(`✓ Created notification for user ${userId}`);
    } catch (error) {
      console.error('Error creating notification:', error);
      // Non-critical, continue
    }

    // Log audit event
    try {
      type AuditAfter = {
        approvedUserId: string;
        userType: string;
        approvedBy: string;
        adminNotes?: string;
        employeeId?: string;
        applicantId?: string;
      };

      const auditAfter: AuditAfter = {
        approvedUserId: userId,
        userType: profile.userType,
        approvedBy: adminUser.userId,
        adminNotes,
      };

      // Add the generated ID to audit log
      if (profile.userType === 'employee' && generatedId) {
        auditAfter.employeeId = generatedId;
      } else if (profile.userType === 'applicant' && generatedId) {
        auditAfter.applicantId = generatedId;
      }

      await createAuditLog({
        userId: adminUser.userId,
        action: 'APPROVE',
        entityType: 'profile',
        entityId: pendingReg.id,
        changes: { after: auditAfter },
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });

      console.log(`✓ Created audit log for approval of ${userId}`);
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Non-critical, continue
    }

    // Build response data
    type ResponseData = {
      userId: string;
      userType: string;
      approvedBy: string;
      approvedAt: Date;
      employeeId?: string;
      applicantId?: string;
    };

    const responseData: ResponseData = {
      userId,
      userType: profile.userType,
      approvedBy: adminUser.userId,
      approvedAt: now,
    };

    // Add the generated ID to response
    if (profile.userType === 'employee' && generatedId) {
      responseData.employeeId = generatedId;
    } else if (profile.userType === 'applicant' && generatedId) {
      responseData.applicantId = generatedId;
    }

    return NextResponse.json({
      success: true,
      message: 'Registration approved successfully',
      data: responseData,
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
