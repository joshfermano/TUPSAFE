/**
 * Revert to Applicant API
 * POST /api/users/[id]/revert-to-applicant
 *
 * Reverts a mistakenly converted employee account back to applicant status.
 * This is used when an applicant's account was incorrectly upgraded to employee
 * (e.g., through an old registration bug or manual error).
 *
 * Security:
 * - Requires admin or hr role
 * - Only works on accounts that were originally applicants (have applicantId)
 * - Preserves PDS submissions and job applications
 * - Comprehensive audit logging
 *
 * What it does:
 * - Sets userType back to 'applicant'
 * - Clears employee-specific fields (employeeId, hireDate, departmentId, positionId)
 * - Sets employmentCategory to 'not_applicable'
 * - Updates Supabase auth metadata
 * - Keeps applicantId and personal information intact
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkUserRoleFromSupabase,
  getUserFromSupabase,
  createAdminClient,
} from '@tupsafe/auth/server';
import {
  db,
  profiles,
  createAuditLog,
  employeeIdRegistry,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

interface RevertToApplicantResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    applicantId: string;
    previousUserType: string;
    previousEmployeeId: string | null;
  };
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RevertToApplicantResponse>> {
  try {
    // Verify permissions - only admin or hr can revert accounts
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'hr'], 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          error: 'Admin or HR role required to revert accounts.',
        },
        { status: 403 }
      );
    }

    // Get current admin user for audit logging
    const currentUser = await getUserFromSupabase('admin');
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          error: 'Could not verify current user.',
        },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user ID',
          error: 'Invalid user ID format',
        },
        { status: 400 }
      );
    }

    // Fetch current profile
    const [profile] = await db
      .select({
        id: profiles.id,
        userType: profiles.userType,
        applicantId: profiles.applicantId,
        employeeId: profiles.employeeId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        hireDate: profiles.hireDate,
        departmentId: profiles.departmentId,
        positionId: profiles.positionId,
        employmentCategory: profiles.employmentCategory,
        accountStatus: profiles.accountStatus,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
          error: 'No profile found for the specified user ID.',
        },
        { status: 404 }
      );
    }

    // Validate that this account is eligible for reversion
    // Must be: userType='employee' AND applicantId IS NOT NULL
    if (profile.userType !== 'employee') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid operation',
          error: `Cannot revert: user is already a ${profile.userType}. Only employee accounts can be reverted to applicant.`,
        },
        { status: 400 }
      );
    }

    if (!profile.applicantId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid operation',
          error:
            'Cannot revert: this account does not have an applicant ID. This means it was not originally registered as an applicant.',
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const previousEmployeeId = profile.employeeId;

    // Update profile to applicant state
    try {
      await db
        .update(profiles)
        .set({
          userType: 'applicant',
          // Clear employee-specific fields
          employeeId: null,
          hireDate: null,
          departmentId: null,
          positionId: null,
          // Reset employment category
          employmentCategory: 'not_applicable',
          // Reset role to employee (default for applicants)
          role: 'employee',
          // Keep account active so they can still access their applications
          accountStatus: 'active',
          isActive: true,
          updatedAt: now,
        })
        .where(eq(profiles.id, userId));

      console.log(
        `[Revert to Applicant] Updated profile ${userId} from employee to applicant`
      );
    } catch (updateError) {
      console.error('[Revert to Applicant] Profile update failed:', updateError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database update failed',
          error: 'Failed to update user profile. Please try again.',
        },
        { status: 500 }
      );
    }

    // Clean up employee ID registry if the user had an employee ID
    if (previousEmployeeId) {
      try {
        await db
          .delete(employeeIdRegistry)
          .where(eq(employeeIdRegistry.userId, userId));
        console.log(
          `[Revert to Applicant] Cleaned up employee ID registry for ${previousEmployeeId}`
        );
      } catch (registryError) {
        console.error(
          '[Revert to Applicant] Employee ID registry cleanup failed:',
          registryError
        );
        // Non-critical, continue
      }
    }

    // Update Supabase auth metadata
    try {
      const adminClient = createAdminClient();
      const { data: authUser, error: getUserError } =
        await adminClient.auth.admin.getUserById(userId);

      if (!getUserError && authUser?.user) {
        const existingMetadata = authUser.user.user_metadata || {};

        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingMetadata,
            user_type: 'applicant',
            employee_id: null,
            department_id: null,
            employment_category: 'not_applicable',
            hire_date: null,
            account_status: 'active',
            reverted_to_applicant: true,
            reverted_at: now.toISOString(),
            reverted_by: currentUser.userId,
          },
        });
        console.log(
          `[Revert to Applicant] Updated Supabase metadata for ${userId}`
        );
      }
    } catch (metadataError) {
      console.error(
        '[Revert to Applicant] Metadata update failed:',
        metadataError
      );
      // Non-critical - database is source of truth
    }

    // Create audit log
    try {
      await createAuditLog({
        userId: currentUser.userId,
        action: 'UPDATE',
        entityType: 'profile',
        entityId: userId,
        changes: {
          before: {
            userType: 'employee',
            employeeId: previousEmployeeId,
            hireDate: profile.hireDate,
            departmentId: profile.departmentId,
            positionId: profile.positionId,
            employmentCategory: profile.employmentCategory,
          },
          after: {
            userType: 'applicant',
            employeeId: null,
            hireDate: null,
            departmentId: null,
            positionId: null,
            employmentCategory: 'not_applicable',
          },
        },
        metadata: {
          action: 'revert_to_applicant',
          reason: 'Admin-initiated reversion of mistakenly converted account',
          applicantId: profile.applicantId,
          previousEmployeeId,
        },
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
      console.log(`[Revert to Applicant] Created audit log for ${userId}`);
    } catch (auditError) {
      console.error('[Revert to Applicant] Audit log creation failed:', auditError);
      // Non-critical, continue
    }

    console.log(
      `[Revert to Applicant] SUCCESS: Reverted ${profile.firstName} ${profile.lastName} (${userId}) from employee to applicant. Applicant ID: ${profile.applicantId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: `Successfully reverted account to applicant. The user can now be properly hired through the correct workflow.`,
        data: {
          userId,
          applicantId: profile.applicantId,
          previousUserType: 'employee',
          previousEmployeeId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Revert to Applicant] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

