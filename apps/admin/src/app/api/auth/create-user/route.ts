/**
 * Create User API Route (Admin)
 *
 * Allows HR/Admin to manually create employee accounts with:
 * - Auto-generated DOB-based employee ID (TUPM-MMDD-YY-###)
 * - Server-generated temporary password
 * - Email notification with credentials
 * - RBAC enforcement (only admins can create admin accounts)
 *
 * @module api/auth/create-user
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  profiles,
  notifications,
  createAuditLog,
  generateAndRegisterEmployeeIdFromDOB,
} from '@tupsafe/database/server';
import {
  getUserFromSupabase,
  generatePassword,
  sendCredentialsEmail,
  createAdminClient,
} from '@tupsafe/auth/server';
import { createUserSchema, type CreateUserResponse } from '@tupsafe/types';

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
    const allowedRoles = ['hr', 'admin'];
    if (!allowedRoles.includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. HR or Admin role required.' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // RBAC: Only admins can create admin accounts
    if (data.role === 'admin') {
      const creatorProfile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.id, adminUser.userId),
        columns: { role: true },
      });

      if (creatorProfile?.role !== 'admin') {
        return NextResponse.json(
          {
            error:
              'Unauthorized. Only administrators can create admin accounts.',
          },
          { status: 403 }
        );
      }
    }

    // Initialize Supabase admin client (service role - required for admin.createUser)
    const supabase = createAdminClient();

    // Generate temporary password server-side (single source of truth)
    const temporaryPassword = generatePassword();

    // Create Supabase Auth user first (this validates email uniqueness)
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: data.email,
        password: temporaryPassword,
        email_confirm: true, // Admin-created accounts are pre-verified
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          middle_name: data.middleName,
        },
      });

    if (createError) {
      console.error('Error creating Supabase user:', createError);

      // Handle email already exists error
      if (
        createError.message.includes('already registered') ||
        createError.message.includes('already been registered')
      ) {
        return NextResponse.json(
          { error: 'Email address is already registered' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to create user account',
          details: createError.message,
        },
        { status: 500 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user account - no user returned' },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    // Generate and register DOB-based employee ID
    let employeeId: string;
    try {
      employeeId = await generateAndRegisterEmployeeIdFromDOB(
        userId,
        data.dateOfBirth
      );
    } catch (error) {
      console.error('Error generating employee ID:', error);
      // Clean up: delete created Supabase user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to generate employee ID. Please try again.' },
        { status: 500 }
      );
    }

    const now = new Date();

    // Create user profile (immediately active since created by admin)
    try {
      await db.insert(profiles).values({
        id: userId,
        employeeId,
        userType: 'employee',
        employmentCategory: data.employmentCategory,
        dateOfBirth: data.dateOfBirth,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        phoneNumber: data.phoneNumber || null,
        role: data.role,
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        academicRank: data.academicRank || null,
        tenureStatus: data.tenureStatus || null,
        employmentType: data.employmentType || null,
        campusAssignment: data.campusAssignment || null,
        accountStatus: 'active', // Immediately active
        emailVerifiedAt: now, // Pre-verified
        approvedBy: adminUser.userId,
        approvedAt: now,
        temporaryPassword: true, // User must change password on first login
        isActive: true,
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      // Clean up: delete created Supabase user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    // Update user metadata with complete account details (ensures consistency with database)
    try {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          middle_name: data.middleName || null,
          user_type: 'employee',
          role: data.role,
          employee_id: employeeId,
          employment_category: data.employmentCategory,
          department_id: data.departmentId || null,
          date_of_birth: data.dateOfBirth,
          account_status: 'active',
          registration_completed: true,
          created_by_admin: true,
          approved_at: now.toISOString(),
          approved_by: adminUser.userId,
        },
      });
      console.log(`✓ Updated user metadata for admin-created user ${userId}`);
    } catch (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Non-critical - database is source of truth, continue
    }

    // Send credentials email if requested
    let emailSent = false;
    if (data.sendCredentials) {
      try {
        const emailResult = await sendCredentialsEmail(
          data.email,
          employeeId,
          temporaryPassword,
          data.firstName
        );
        emailSent = emailResult.success;

        if (!emailSent) {
          console.warn(
            'Credentials email not sent:',
            emailResult.error || 'Unknown error'
          );
        }
      } catch (error) {
        console.error('Error sending credentials email:', error);
        // Non-critical, continue
      }
    }

    // Create welcome notification for user
    try {
      await db.insert(notifications).values({
        userId,
        type: 'system_update',
        title: 'Welcome to TUPSAFE',
        message: data.sendCredentials
          ? 'Your account has been created. Please check your email for login credentials.'
          : 'Your account has been created. Please contact your administrator for login credentials.',
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
        action: 'CREATE',
        entityType: 'profile',
        entityId: userId,
        changes: {
          after: {
            createdUserId: userId,
            employeeId,
            email: data.email,
            role: data.role,
            employmentCategory: data.employmentCategory,
            createdBy: adminUser.userId,
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

    const response: CreateUserResponse = {
      success: true,
      message: emailSent
        ? 'User created successfully. Credentials have been sent to their email.'
        : 'User created successfully. Credentials email could not be sent.',
      data: {
        userId,
        employeeId,
        email: data.email,
        role: data.role,
        // Always return temporaryPassword to the admin UI so they can copy it
        temporaryPassword,
        emailSent,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while creating user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
