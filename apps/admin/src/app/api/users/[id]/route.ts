/**
 * User Management API - Individual User Operations
 * GET    /api/users/[id] - Get detailed user information
 * PATCH  /api/users/[id] - Update user profile and settings
 * DELETE /api/users/[id] - Hard delete user account (permanent removal)
 *
 * Security:
 * - Requires admin, hr, or supervisor role
 * - Role hierarchy validation (can't modify higher roles)
 * - Comprehensive audit logging
 * - Input validation with Zod
 * - Dependency checking before deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase, getProfilePicturePublicUrl, createAdminClient } from '@tupsafe/auth/server';
import {
  db,
  profiles,
  departments,
  positions,
  pdsSubmissions,
  salnSubmissions,
  auditLogs,
  createAuditLogFromRequest,
  generateChanges,
  otpVerifications,
  pendingRegistrations,
  trustedDevices,
  openPositions,
  jobApplications,
} from '@tupsafe/database/server';
import { eq, desc, and, count } from 'drizzle-orm';
import {
  updateUserSchema,
  type UserDetail,
  ROLE_HIERARCHY,
  isAdminPortalRole,
  isHRDepartment,
} from '@tupsafe/types';

/**
 * GET /api/users/[id]
 * Fetch detailed user information including submission history and audit logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify permissions using Supabase auth
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr', 'supervisor'], 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, HR, or Supervisor role required.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch user profile with department and position details
    const [userProfile] = await db
      .select({
        // Profile fields
        id: profiles.id,
        employeeId: profiles.employeeId,
        applicantId: profiles.applicantId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        middleName: profiles.middleName,
        phoneNumber: profiles.phoneNumber,
        role: profiles.role,
        userType: profiles.userType,
        employmentCategory: profiles.employmentCategory,
        accountStatus: profiles.accountStatus,
        isActive: profiles.isActive,
        emailVerifiedAt: profiles.emailVerifiedAt,
        approvedBy: profiles.approvedBy,
        approvedAt: profiles.approvedAt,
        temporaryPassword: profiles.temporaryPassword,
        hireDate: profiles.hireDate,
        academicRank: profiles.academicRank,
        tenureStatus: profiles.tenureStatus,
        employmentType: profiles.employmentType,
        campusAssignment: profiles.campusAssignment,
        salaryGrade: profiles.salaryGrade,
        positionTitle: profiles.positionTitle,
        avatarPath: profiles.avatarPath,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
        // Department details
        departmentId: profiles.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        // Position details
        positionId: profiles.positionId,
        positionTitleFromPosition: positions.title,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(positions, eq(profiles.positionId, positions.id))
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch email from Supabase Auth
    let email: string | null = null;
    try {
      const { createAdminClient } = await import('@tupsafe/auth/server');
      const adminClient = await createAdminClient();
      const { data } = await adminClient.auth.admin.getUserById(userId);
      email = data?.user?.email || null;
    } catch (error) {
      console.error('Error fetching user email:', error);
    }

    // Fetch submission counts and latest submissions
    const [
      [{ pdsCount }],
      [{ salnCount }],
      latestPds,
      latestSaln,
      recentAuditLogs,
    ] = await Promise.all([
      // PDS submission count
      db
        .select({ pdsCount: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.userId, userId)),

      // SALN submission count
      db
        .select({ salnCount: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.userId, userId)),

      // Latest PDS submission
      db
        .select({
          id: pdsSubmissions.id,
          status: pdsSubmissions.status,
          submittedAt: pdsSubmissions.submittedAt,
        })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.userId, userId))
        .orderBy(desc(pdsSubmissions.createdAt))
        .limit(1),

      // Latest SALN submission
      db
        .select({
          id: salnSubmissions.id,
          year: salnSubmissions.year,
          status: salnSubmissions.status,
          submittedAt: salnSubmissions.submittedAt,
        })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.userId, userId))
        .orderBy(desc(salnSubmissions.createdAt))
        .limit(1),

      // Recent audit logs (last 10 actions)
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(10),
    ]);

    // Build avatar URL from path
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const avatarUrl = userProfile.avatarPath
      ? getProfilePicturePublicUrl(supabaseUrl, userProfile.avatarPath)
      : null;

    // Construct detailed user response
    const userDetail: UserDetail = {
      id: userProfile.id,
      email,
      employeeId: userProfile.employeeId,
      applicantId: userProfile.applicantId,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      middleName: userProfile.middleName,
      phoneNumber: userProfile.phoneNumber,
      role: userProfile.role,
      userType: userProfile.userType,
      employmentCategory: userProfile.employmentCategory,
      accountStatus: userProfile.accountStatus,
      isActive: userProfile.isActive,
      avatarPath: userProfile.avatarPath,
      avatarUrl,
      emailVerifiedAt: userProfile.emailVerifiedAt,
      approvedBy: userProfile.approvedBy,
      approvedAt: userProfile.approvedAt,
      temporaryPassword: userProfile.temporaryPassword,
      hireDate: userProfile.hireDate,
      academicRank: userProfile.academicRank,
      tenureStatus: userProfile.tenureStatus,
      employmentType: userProfile.employmentType,
      campusAssignment: userProfile.campusAssignment,
      salaryGrade: userProfile.salaryGrade,
      positionTitle: userProfile.positionTitle,
      department: userProfile.departmentId
        ? {
            id: userProfile.departmentId,
            name: userProfile.departmentName || '',
            code: userProfile.departmentCode || '',
          }
        : null,
      position: userProfile.positionId
        ? {
            id: userProfile.positionId,
            title: userProfile.positionTitleFromPosition || '',
          }
        : null,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
      pdsSubmissionsCount: pdsCount,
      salnSubmissionsCount: salnCount,
      lastPdsSubmission: latestPds[0] || null,
      lastSalnSubmission: latestSaln[0] || null,
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        createdAt: log.createdAt,
      })),
    };

    return NextResponse.json({ success: true, data: userDetail }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update user profile and settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify permissions using Supabase auth
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Additional validation for salary grade
    if (validatedData.salaryGrade !== undefined && validatedData.salaryGrade !== null) {
      if (validatedData.salaryGrade < 1 || validatedData.salaryGrade > 33) {
        return NextResponse.json(
          { error: 'Salary grade must be between 1 and 33 (Philippine SSL V)' },
          { status: 400 }
        );
      }
    }

    // Fetch current user data for audit trail
    const [currentUser] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Role hierarchy validation - prevent privilege escalation
    if (validatedData.role) {
      const currentUserRole = sessionUser.role;
      const targetCurrentRole = currentUser.role;
      const targetNewRole = validatedData.role;

      // Debug: Log role hierarchy check
      console.log('[PATCH /api/users/[id]] Role Hierarchy Check:', {
        currentUserRole,
        currentUserHierarchy: ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY],
        targetCurrentRole,
        targetCurrentHierarchy: ROLE_HIERARCHY[targetCurrentRole as keyof typeof ROLE_HIERARCHY],
        targetNewRole,
        targetNewHierarchy: ROLE_HIERARCHY[targetNewRole as keyof typeof ROLE_HIERARCHY],
        fullRoleHierarchy: ROLE_HIERARCHY,
      });

      // Check if current user can modify target user's role
      const canModifyTarget =
        ROLE_HIERARCHY[targetCurrentRole as keyof typeof ROLE_HIERARCHY] <
        ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY];

      console.log('[PATCH /api/users/[id]] Can modify target user?', {
        canModifyTarget,
        comparison: `${ROLE_HIERARCHY[targetCurrentRole as keyof typeof ROLE_HIERARCHY]} < ${ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY]}`,
      });

      if (!canModifyTarget) {
        return NextResponse.json(
          {
            error: 'Cannot modify users with equal or higher role privilege',
          },
          { status: 403 }
        );
      }

      // Check if current user can assign the new role
      const canAssignNewRole =
        ROLE_HIERARCHY[targetNewRole as keyof typeof ROLE_HIERARCHY] <
        ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY];

      console.log('[PATCH /api/users/[id]] Can assign new role?', {
        canAssignNewRole,
        comparison: `${ROLE_HIERARCHY[targetNewRole as keyof typeof ROLE_HIERARCHY]} < ${ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY]}`,
      });

      if (!canAssignNewRole) {
        return NextResponse.json(
          {
            error: 'Cannot assign role with equal or higher privilege',
          },
          { status: 403 }
        );
      }
    }

    // Determine the effective role and department for HR office validation
    const effectiveRole = validatedData.role || currentUser.role;
    const effectiveDepartmentId = validatedData.departmentId ?? currentUser.departmentId;

    // Enforce HR* department requirement for Admin Portal roles
    if (isAdminPortalRole(effectiveRole)) {
      if (!effectiveDepartmentId) {
        return NextResponse.json(
          {
            error: `Department is required for ${effectiveRole} role. Admin Portal users must be assigned to an HR office.`,
          },
          { status: 400 }
        );
      }

      // Validate department is an HR office
      const [dept] = await db
        .select({ code: departments.code, name: departments.name })
        .from(departments)
        .where(eq(departments.id, effectiveDepartmentId))
        .limit(1);

      if (!dept) {
        return NextResponse.json(
          { error: 'Department not found.' },
          { status: 400 }
        );
      }

      if (!isHRDepartment(dept.code)) {
        return NextResponse.json(
          {
            error: `Admin Portal users (admin, co-admin, HR) must be assigned to an HR office. "${dept.name}" (${dept.code}) is not an HR department. HR departments have codes starting with "HR".`,
          },
          { status: 400 }
        );
      }
    }

    // Validate department and position exist if provided
    if (validatedData.departmentId) {
      const [dept] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.id, validatedData.departmentId),
            eq(departments.isActive, true)
          )
        )
        .limit(1);

      if (!dept) {
        return NextResponse.json(
          { error: 'Invalid or inactive department' },
          { status: 400 }
        );
      }
    }

    if (validatedData.positionId) {
      const [pos] = await db
        .select({ id: positions.id })
        .from(positions)
        .where(
          and(
            eq(positions.id, validatedData.positionId),
            eq(positions.isActive, true)
          )
        )
        .limit(1);

      if (!pos) {
        return NextResponse.json(
          { error: 'Invalid or inactive position' },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const [updatedUser] = await db
      .update(profiles)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    // Sync Supabase Auth metadata when role or department changes
    if (validatedData.role || validatedData.departmentId) {
      try {
        const supabase = createAdminClient();
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            role: updatedUser.role,
            department_id: updatedUser.departmentId || null,
            updated_at: new Date().toISOString(),
          },
        });
        console.log(`✓ Synced user metadata for ${userId} (role: ${updatedUser.role})`);
      } catch (metadataError) {
        console.error('Error syncing user metadata:', metadataError);
        // Non-critical - database is source of truth, continue
      }
    }

    // Create audit log
    const changes = generateChanges(
      { ...currentUser },
      { ...updatedUser }
    );

    await createAuditLogFromRequest(
      sessionUser.userId,
      'UPDATE',
      'profile',
      userId,
      changes,
      request.headers
    );

    return NextResponse.json(
      {
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Hard delete user account (permanent removal from database)
 * 
 * Query Parameters:
 * - forceDelete: If 'true', will cascade delete job applications and related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify permissions using Supabase auth
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    
    // Check for forceDelete query parameter
    const searchParams = request.nextUrl.searchParams;
    const forceDelete = searchParams.get('forceDelete') === 'true';

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === sessionUser.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Fetch current user data
    const [currentUser] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Role hierarchy validation - prevent deleting higher privilege users
    const currentUserRole = sessionUser.role;
    const targetRole = currentUser.role;

    if (
      ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY] >=
      ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY]
    ) {
      return NextResponse.json(
        {
          error: 'Cannot delete users with equal or higher role privilege',
        },
        { status: 403 }
      );
    }

    // Check for dependencies that would prevent deletion
    const [
      [{ pdsCount }],
      [{ salnCount }],
      [{ positionsPostedCount }],
      [{ applicationsCount }],
    ] = await Promise.all([
      db
        .select({ pdsCount: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.userId, userId)),
      db
        .select({ salnCount: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.userId, userId)),
      db
        .select({ positionsPostedCount: count() })
        .from(openPositions)
        .where(eq(openPositions.postedBy, userId)),
      db
        .select({ applicationsCount: count() })
        .from(jobApplications)
        .where(eq(jobApplications.applicantId, userId)),
    ]);

    // Build dependency error message if any dependencies exist
    const dependencies: string[] = [];
    if (pdsCount > 0) {
      dependencies.push(`${pdsCount} PDS submission${pdsCount > 1 ? 's' : ''}`);
    }
    if (salnCount > 0) {
      dependencies.push(`${salnCount} SALN submission${salnCount > 1 ? 's' : ''}`);
    }
    if (positionsPostedCount > 0) {
      dependencies.push(`${positionsPostedCount} posted position${positionsPostedCount > 1 ? 's' : ''}`);
    }
    if (applicationsCount > 0) {
      dependencies.push(`${applicationsCount} job application${applicationsCount > 1 ? 's' : ''}`);
    }

    // Check if forceDelete is needed but not provided
    // Posted positions cannot be force-deleted (must be reassigned)
    // PDS/SALN submissions and job applications CAN be force-deleted with warning
    
    // If user has posted positions, always block (cannot cascade delete positions)
    if (positionsPostedCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete user with posted positions',
          details: `This user has ${positionsPostedCount} posted position${positionsPostedCount > 1 ? 's' : ''}. Please reassign these positions to another user before deletion.`,
          dependencies: {
            pdsSubmissions: pdsCount,
            salnSubmissions: salnCount,
            positionsPosted: positionsPostedCount,
            jobApplications: applicationsCount,
          },
          canForceDelete: false,
        },
        { status: 409 }
      );
    }

    // If there are any forceable dependencies and forceDelete is not set, return conflict with option
    const totalForceableDeps = pdsCount + salnCount + applicationsCount;
    if (totalForceableDeps > 0 && !forceDelete) {
      const depList: string[] = [];
      if (pdsCount > 0) depList.push(`${pdsCount} PDS submission${pdsCount > 1 ? 's' : ''}`);
      if (salnCount > 0) depList.push(`${salnCount} SALN submission${salnCount > 1 ? 's' : ''}`);
      if (applicationsCount > 0) depList.push(`${applicationsCount} job application${applicationsCount > 1 ? 's' : ''}`);
      
      const hasComplianceRecords = pdsCount > 0 || salnCount > 0;
      
      return NextResponse.json(
        {
          error: 'Cannot delete user with existing data dependencies',
          details: `This user has ${depList.join(', ')}. ${hasComplianceRecords ? '⚠️ WARNING: This includes compliance records (PDS/SALN) that will be permanently deleted. ' : ''}Use forceDelete=true to permanently delete all associated data.`,
          dependencies: {
            pdsSubmissions: pdsCount,
            salnSubmissions: salnCount,
            positionsPosted: positionsPostedCount,
            jobApplications: applicationsCount,
          },
          canForceDelete: true,
          hasComplianceRecords,
        },
        { status: 409 }
      );
    }

    // Perform hard delete within a transaction
    await db.transaction(async (tx) => {
      // If forceDelete, delete all user data
      if (forceDelete) {
        // Delete job applications (cascade to applicationStatusHistory)
        if (applicationsCount > 0) {
          console.log(`[Delete User] Force deleting ${applicationsCount} job applications for user ${userId}`);
          
          // First delete application status history records
          const userApplications = await tx
            .select({ id: jobApplications.id })
            .from(jobApplications)
            .where(eq(jobApplications.applicantId, userId));
          
          const applicationIds = userApplications.map(app => app.id);
          
          if (applicationIds.length > 0) {
            const { applicationStatusHistory } = await import('@tupsafe/database/server');
            
            // Delete status history for all applications
            for (const appId of applicationIds) {
              await tx.delete(applicationStatusHistory).where(eq(applicationStatusHistory.applicationId, appId));
            }
          }
          
          // Then delete the applications themselves
          await tx.delete(jobApplications).where(eq(jobApplications.applicantId, userId));
        }
        
        // Delete PDS submissions and related data
        if (pdsCount > 0) {
          console.log(`[Delete User] Force deleting ${pdsCount} PDS submissions for user ${userId}`);
          
          // Import the related PDS tables
          const { 
            pdsPersonalInfo,
            pdsFamilyBackground,
            pdsChildren,
            pdsEducation,
            pdsCivilService,
            pdsWorkExperience,
            pdsVoluntaryWork,
            pdsTraining,
            pdsOtherInfo,
          } = await import('@tupsafe/database/server');
          
          // Get all PDS submission IDs for this user
          const userPdsSubmissions = await tx
            .select({ id: pdsSubmissions.id })
            .from(pdsSubmissions)
            .where(eq(pdsSubmissions.userId, userId));
          
          for (const pds of userPdsSubmissions) {
            // Delete related records in reverse dependency order
            await tx.delete(pdsOtherInfo).where(eq(pdsOtherInfo.pdsSubmissionId, pds.id));
            await tx.delete(pdsTraining).where(eq(pdsTraining.pdsSubmissionId, pds.id));
            await tx.delete(pdsVoluntaryWork).where(eq(pdsVoluntaryWork.pdsSubmissionId, pds.id));
            await tx.delete(pdsWorkExperience).where(eq(pdsWorkExperience.pdsSubmissionId, pds.id));
            await tx.delete(pdsCivilService).where(eq(pdsCivilService.pdsSubmissionId, pds.id));
            await tx.delete(pdsEducation).where(eq(pdsEducation.pdsSubmissionId, pds.id));
            await tx.delete(pdsChildren).where(eq(pdsChildren.pdsSubmissionId, pds.id));
            await tx.delete(pdsFamilyBackground).where(eq(pdsFamilyBackground.pdsSubmissionId, pds.id));
            await tx.delete(pdsPersonalInfo).where(eq(pdsPersonalInfo.pdsSubmissionId, pds.id));
          }
          
          // Delete PDS submissions
          await tx.delete(pdsSubmissions).where(eq(pdsSubmissions.userId, userId));
        }
        
        // Delete SALN submissions and related data
        if (salnCount > 0) {
          console.log(`[Delete User] Force deleting ${salnCount} SALN submissions for user ${userId}`);
          
          // Import related SALN tables
          const {
            salnRealProperties,
            salnPersonalProperties,
            salnLiabilities: salnLiabilitiesTable,
            salnBusinessInterests,
            salnRelativesInGov,
          } = await import('@tupsafe/database/server');
          
          // Get all SALN submission IDs for this user
          const userSalnSubmissions = await tx
            .select({ id: salnSubmissions.id })
            .from(salnSubmissions)
            .where(eq(salnSubmissions.userId, userId));
          
          for (const saln of userSalnSubmissions) {
            // Delete related records
            await tx.delete(salnRelativesInGov).where(eq(salnRelativesInGov.salnSubmissionId, saln.id));
            await tx.delete(salnBusinessInterests).where(eq(salnBusinessInterests.salnSubmissionId, saln.id));
            await tx.delete(salnLiabilitiesTable).where(eq(salnLiabilitiesTable.salnSubmissionId, saln.id));
            await tx.delete(salnPersonalProperties).where(eq(salnPersonalProperties.salnSubmissionId, saln.id));
            await tx.delete(salnRealProperties).where(eq(salnRealProperties.salnSubmissionId, saln.id));
          }
          
          // Delete SALN submissions
          await tx.delete(salnSubmissions).where(eq(salnSubmissions.userId, userId));
        }
      }
      
      // Clean up auth-related tables (these don't have critical data)
      await tx.delete(otpVerifications).where(eq(otpVerifications.userId, userId));
      await tx.delete(pendingRegistrations).where(eq(pendingRegistrations.userId, userId));
      await tx.delete(trustedDevices).where(eq(trustedDevices.userId, userId));

      // userPreferences will cascade automatically due to ON DELETE CASCADE

      // Delete from profiles table (hard delete)
      await tx.delete(profiles).where(eq(profiles.id, userId));
    });

    // Delete from Supabase Auth
    const { createAdminClient } = await import('@tupsafe/auth/server');
    const adminClient = await createAdminClient();

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('[Delete User] Failed to delete from Supabase Auth:', authDeleteError);
      // Don't fail the request - profile is already deleted from database
    }

    // Create audit log
    await createAuditLogFromRequest(
      sessionUser.userId,
      'DELETE',
      'profile',
      userId,
      {
        before: {
          ...currentUser,
          _deletedData: forceDelete ? {
            applications: applicationsCount,
            pdsSubmissions: pdsCount,
            salnSubmissions: salnCount,
          } : null,
        },
      },
      request.headers
    );

    // Build success message
    let successMessage = 'User permanently deleted successfully';
    if (forceDelete) {
      const deletedItems: string[] = [];
      if (applicationsCount > 0) deletedItems.push(`${applicationsCount} job application${applicationsCount > 1 ? 's' : ''}`);
      if (pdsCount > 0) deletedItems.push(`${pdsCount} PDS submission${pdsCount > 1 ? 's' : ''}`);
      if (salnCount > 0) deletedItems.push(`${salnCount} SALN submission${salnCount > 1 ? 's' : ''}`);
      
      if (deletedItems.length > 0) {
        successMessage = `User and ${deletedItems.join(', ')} permanently deleted successfully`;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        deletedData: forceDelete ? {
          applications: applicationsCount,
          pdsSubmissions: pdsCount,
          salnSubmissions: salnCount,
        } : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);

    // Handle foreign key constraint violations
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        {
          error: 'Cannot delete user due to data dependencies',
          details: 'This user is referenced by other records in the system. Please remove or reassign those records first.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
