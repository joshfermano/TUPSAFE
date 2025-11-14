/**
 * User Management API - Individual User Operations
 * GET    /api/users/[id] - Get detailed user information
 * PATCH  /api/users/[id] - Update user profile and settings
 * DELETE /api/users/[id] - Soft delete user account
 *
 * Security:
 * - Requires admin, hr, or supervisor role
 * - Role hierarchy validation (can't modify higher roles)
 * - Comprehensive audit logging
 * - Input validation with Zod
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRole, getSessionUser } from '@tupsafe/auth/server';
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
} from '@tupsafe/database/server';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import {
  updateUserSchema,
  type UserDetail,
  ROLE_HIERARCHY,
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
    // Verify permissions
    const hasPermission = await checkUserRole(['admin', 'hr', 'supervisor']);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, HR, or Supervisor role required.' },
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
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
        // Department details
        departmentId: profiles.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        // Position details
        positionId: profiles.positionId,
        positionTitle: positions.title,
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
      emailVerifiedAt: userProfile.emailVerifiedAt,
      approvedBy: userProfile.approvedBy,
      approvedAt: userProfile.approvedAt,
      temporaryPassword: userProfile.temporaryPassword,
      hireDate: userProfile.hireDate,
      academicRank: userProfile.academicRank,
      tenureStatus: userProfile.tenureStatus,
      employmentType: userProfile.employmentType,
      campusAssignment: userProfile.campusAssignment,
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
            title: userProfile.positionTitle || '',
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
    // Verify permissions
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const hasPermission = await checkUserRole(['admin', 'hr']);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
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

      // Check if current user can modify target user's role
      if (
        ROLE_HIERARCHY[targetCurrentRole as keyof typeof ROLE_HIERARCHY] >=
        ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY]
      ) {
        return NextResponse.json(
          {
            error: 'Cannot modify users with equal or higher role privilege',
          },
          { status: 403 }
        );
      }

      // Check if current user can assign the new role
      if (
        ROLE_HIERARCHY[targetNewRole as keyof typeof ROLE_HIERARCHY] >=
        ROLE_HIERARCHY[currentUserRole as keyof typeof ROLE_HIERARCHY]
      ) {
        return NextResponse.json(
          {
            error: 'Cannot assign role with equal or higher privilege',
          },
          { status: 403 }
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
 * Soft delete user account (set isActive = false, accountStatus = 'rejected')
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify permissions - only admins can delete users
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const hasPermission = await checkUserRole(['admin']);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin role required.' },
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

    // Perform soft delete
    const [deletedUser] = await db
      .update(profiles)
      .set({
        isActive: false,
        accountStatus: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    // Create audit log
    await createAuditLogFromRequest(
      sessionUser.userId,
      'DELETE',
      'profile',
      userId,
      {
        before: { isActive: currentUser.isActive, accountStatus: currentUser.accountStatus },
        after: { isActive: false, accountStatus: 'rejected' },
      },
      request.headers
    );

    return NextResponse.json(
      {
        success: true,
        message: 'User deactivated successfully',
        data: deletedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
