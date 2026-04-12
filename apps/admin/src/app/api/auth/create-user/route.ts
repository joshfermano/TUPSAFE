/**
 * Create User API Route (Admin)
 *
 * Allows HR/Admin to manually create employee accounts with:
 * - Auto-generated DOB-based employee ID (TUPM-MMDD-YY-###)
 * - Server-generated temporary password
 * - Email notification with credentials
 * - RBAC enforcement (only admins can create admin accounts)
 * - Optional linking to a hired job application (updates conversion fields, notifies applicant)
 *
 * When linking to a hired application:
 * - Credentials are sent to both the employee email and the applicant's personal email
 * - The application's conversion fields are updated (convertedToEmployeeId, conversionDate)
 * - An in-app notification is sent to the applicant
 *
 * @module api/auth/create-user
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  profiles,
  departments,
  notifications,
  createAuditLog,
  generateAndRegisterEmployeeIdFromDOB,
  jobApplications,
} from '@tupsafe/database/server';
import { eq, and } from 'drizzle-orm';
import {
  getUserFromSupabase,
  generatePassword,
  sendCredentialsEmail,
  createAdminClient,
} from '@tupsafe/auth/server';
import { createUserSchema, type CreateUserResponse, isAdminPortalRole, isHRDepartment } from '@tupsafe/types';

export const dynamic = 'force-dynamic';
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

    // Verify user has HR, admin, or co_admin role
    const allowedRoles = ['hr', 'admin', 'co_admin'];
    if (!allowedRoles.includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. HR, Admin, or Co-Admin role required.' },
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

    // RBAC: Only admins/co-admins can create admin or co_admin accounts
    if (data.role === 'admin' || data.role === 'co_admin') {
      const creatorProfile = await db.query.profiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.id, adminUser.userId),
        columns: { role: true },
      });

      if (!creatorProfile || !['admin', 'co_admin'].includes(creatorProfile.role)) {
        return NextResponse.json(
          {
            error:
              'Unauthorized. Only administrators can create admin or co-admin accounts.',
          },
          { status: 403 }
        );
      }
    }

    // Enforce HR* department requirement for Admin Portal roles
    if (isAdminPortalRole(data.role)) {
      if (!data.departmentId) {
        return NextResponse.json(
          {
            error: `Department is required for ${data.role} role. Admin Portal users must be assigned to an HR office.`,
          },
          { status: 400 }
        );
      }

      // Validate department exists and is an HR office
      const [dept] = await db
        .select({ code: departments.code, name: departments.name })
        .from(departments)
        .where(eq(departments.id, data.departmentId))
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

    // Handle linking to a hired job application
    let linkedApplication:
      | {
          applicationNumber: string;
          applicationId: string;
          applicantId: string;
          applicantPersonalEmail?: string;
          applicantEmailSent: boolean;
        }
      | undefined;

    if (data.hiredApplicationNumber) {
      console.log(
        `[Create User] Linking employee to hired application: ${data.hiredApplicationNumber}`
      );

      try {
        // Find the hired application
        const [application] = await db
          .select({
            id: jobApplications.id,
            applicationNumber: jobApplications.applicationNumber,
            applicantId: jobApplications.applicantId,
            status: jobApplications.status,
            convertedToEmployeeId: jobApplications.convertedToEmployeeId,
          })
          .from(jobApplications)
          .where(
            and(
              eq(
                jobApplications.applicationNumber,
                data.hiredApplicationNumber
              ),
              eq(jobApplications.status, 'hired')
            )
          )
          .limit(1);

        if (!application) {
          console.warn(
            `[Create User] Application not found or not in 'hired' status: ${data.hiredApplicationNumber}`
          );
        } else if (application.convertedToEmployeeId) {
          console.warn(
            `[Create User] Application already linked to employee: ${application.convertedToEmployeeId}`
          );
        } else {
          // Update the application with conversion data
          await db
            .update(jobApplications)
            .set({
              convertedToEmployeeId: employeeId,
              conversionDate: now,
              updatedAt: now,
            })
            .where(eq(jobApplications.id, application.id));

          console.log(
            `[Create User] Updated application ${application.applicationNumber} with employee ID: ${employeeId}`
          );

          // Fetch applicant's personal email from auth
          let applicantPersonalEmail: string | undefined;
          try {
            const { data: applicantUser } =
              await supabase.auth.admin.getUserById(application.applicantId);
            applicantPersonalEmail = applicantUser?.user?.email || undefined;
          } catch (emailFetchError) {
            console.error(
              '[Create User] Error fetching applicant email:',
              emailFetchError
            );
          }

          // Send credentials to applicant's personal email as well
          let applicantEmailSent = false;
          if (
            applicantPersonalEmail &&
            data.notifyApplicantPersonalEmail !== false &&
            data.sendCredentials
          ) {
            try {
              const applicantEmailResult = await sendCredentialsEmail(
                applicantPersonalEmail,
                employeeId,
                temporaryPassword,
                data.firstName
              );
              applicantEmailSent = applicantEmailResult.success;

              if (applicantEmailSent) {
                console.log(
                  `[Create User] Credentials also sent to applicant's personal email: ${applicantPersonalEmail}`
                );
              } else {
                console.warn(
                  `[Create User] Failed to send credentials to applicant email: ${applicantEmailResult.error}`
                );
              }
            } catch (applicantEmailError) {
              console.error(
                '[Create User] Error sending credentials to applicant:',
                applicantEmailError
              );
            }
          }

          // Create notification for the applicant about their account being ready
          try {
            await db.insert(notifications).values({
              userId: application.applicantId,
              type: 'system_update',
              title: 'Your employee account is ready!',
              message: `Your employee account has been created. Your employee ID is ${employeeId}. Please check your email for login credentials. Welcome to the team!`,
              isRead: false,
              createdAt: now,
            });
          } catch (notificationError) {
            console.error(
              '[Create User] Error creating applicant notification:',
              notificationError
            );
          }

          linkedApplication = {
            applicationNumber: application.applicationNumber,
            applicationId: application.id,
            applicantId: application.applicantId,
            applicantPersonalEmail,
            applicantEmailSent,
          };
        }
      } catch (linkError) {
        console.error(
          '[Create User] Error linking to hired application:',
          linkError
        );
        // Non-critical - employee is already created, just log the error
      }
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
            linkedApplication: linkedApplication
              ? {
                  applicationNumber: linkedApplication.applicationNumber,
                  applicationId: linkedApplication.applicationId,
                  applicantId: linkedApplication.applicantId,
                }
              : undefined,
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

    // Build appropriate message based on what happened
    let message: string;
    if (linkedApplication) {
      if (emailSent && linkedApplication.applicantEmailSent) {
        message = `Employee created and linked to application ${linkedApplication.applicationNumber}. Credentials sent to both employee email and applicant's personal email.`;
      } else if (emailSent) {
        message = `Employee created and linked to application ${linkedApplication.applicationNumber}. Credentials sent to employee email.`;
      } else {
        message = `Employee created and linked to application ${linkedApplication.applicationNumber}. Credentials email could not be sent.`;
      }
    } else {
      message = emailSent
        ? 'User created successfully. Credentials have been sent to their email.'
        : 'User created successfully. Credentials email could not be sent.';
    }

    const response: CreateUserResponse = {
      success: true,
      message,
      data: {
        userId,
        employeeId,
        email: data.email,
        role: data.role,
        // Always return temporaryPassword to the admin UI so they can copy it
        temporaryPassword,
        emailSent,
        linkedApplication,
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
