/**
 * Multi-User Registration API Route
 *
 * Handles two distinct registration flows:
 * 1. Employee Registration (faculty/administrative staff with TUP email)
 * 2. Applicant Registration (job applicants with any email)
 *
 * @module api/auth/register
 * @version 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import {
  db,
  profiles,
  jobApplications,
  pendingRegistrations,
  createAuditLog,
} from '@tupsafe/database/server';
import { createAdminClient } from '@tupsafe/auth/server';
import {
  employeeRegistrationSchemaWithConfirmation,
  applicantRegistrationSchemaWithConfirmation,
  type EmployeeRegistrationFormData,
  type ApplicantRegistrationFormData,
} from '../../../../lib/validations/auth';

/**
 * Registration request payload - discriminated union based on userType
 * Note: Currently unused but kept for future type safety improvements
 */
type _RegistrationPayload =
  | EmployeeRegistrationFormData
  | ApplicantRegistrationFormData;

/**
 * Success response structure
 */
interface RegistrationSuccessResponse {
  success: true;
  message: string;
  data: {
    userId: string;
    email: string;
  } & (
    | { userType: 'employee'; employeeId: string }
    | { userType: 'applicant'; applicantId: string; applicationNumber: string }
  );
}

/**
 * Error response structure
 */
interface RegistrationErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[] | undefined>;
}

/**
 * Generate a unique application number for job applications
 * Format: TUPM-APPL-YYYYMMDD-XXXX
 */
async function generateApplicationNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  // Find the last application number for today
  const lastApplication = await db.execute<{ application_number: string }>(
    sql`
      SELECT application_number
      FROM job_applications
      WHERE application_number LIKE ${'TUPM-APPL-' + datePart + '-%'}
      ORDER BY application_number DESC
      LIMIT 1
    `
  );

  let sequence = 1;
  if (Array.isArray(lastApplication) && lastApplication.length > 0) {
    const lastNumber = lastApplication[0].application_number;
    const lastSequence = parseInt(lastNumber.split('-').pop() || '0', 10);
    sequence = lastSequence + 1;
  }

  const sequenceStr = String(sequence).padStart(4, '0');
  return `TUPM-APPL-${datePart}-${sequenceStr}`;
}

/**
 * Cleanup helper: Delete Supabase user if registration fails
 * Note: Currently unused but kept for potential future rollback scenarios
 */
async function _cleanupSupabaseUser(userId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error('Failed to cleanup Supabase user:', error);
  }
}

/**
 * Extract client IP address from request headers
 */
function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * Handle employee registration flow
 * Note: Email verification must be completed before calling this endpoint
 */
async function handleEmployeeRegistration(
  data: EmployeeRegistrationFormData,
  request: NextRequest
): Promise<RegistrationSuccessResponse> {
  const supabase = createAdminClient();

  // 1. Query auth.users table directly by email for better performance
  // This is more efficient than listUsers() which retrieves ALL users
  const { data: authUsers, error: queryError } = await supabase
    .from('auth.users')
    .select('id, email, email_confirmed_at')
    .ilike('email', data.email)
    .limit(1)
    .single();

  if (queryError || !authUsers) {
    console.error('Failed to find user by email:', queryError);
    throw new Error(
      'User not found. Please start registration from the beginning.'
    );
  }

  const userId = authUsers.id;

  // 2. Verify email was verified
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  // Check if profile exists and email is verified
  if (profile && !profile.emailVerifiedAt) {
    throw new Error('Email verification required. Please verify your email.');
  }

  // If profile exists, registration already completed
  if (profile) {
    throw new Error('Registration already completed for this email.');
  }

  // 3. Generate employee ID using database function
  const hireDateStr = data.hireDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const employeeIdResult = await db.execute<{ generate_employee_id: string }>(
    sql`SELECT generate_employee_id(${hireDateStr}::DATE) as generate_employee_id`
  );

  if (!Array.isArray(employeeIdResult) || employeeIdResult.length === 0) {
    throw new Error('Failed to generate employee ID');
  }

  const employeeId = employeeIdResult[0].generate_employee_id;

  try {
    // 4. Determine department assignment
    // For faculty: use department if provided, otherwise use collegeOrOffice
    // For administrative: always use collegeOrOffice
    const departmentId =
      data.employmentCategory === 'faculty' && data.department
        ? data.department
        : data.collegeOrOffice;

    // 5. Create user profile (email already verified from step 2)
    // Note: positionId is null - HR will assign position during approval process
    await db.insert(profiles).values({
      id: userId,
      userType: 'employee',
      employmentCategory: data.employmentCategory,
      employeeId,
      hireDate: hireDateStr,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName || null,
      phoneNumber: data.phoneNumber,
      departmentId,
      positionId: null, // HR assigns position later
      role: 'employee',
      accountStatus: 'pending',
      isActive: true,
      temporaryPassword: false,
      emailVerifiedAt: new Date(), // Email verified in step 2
    });

    // 6. Create pending registration entry for admin approval
    await db.insert(pendingRegistrations).values({
      userId,
      status: 'pending',
    });

    // 7. Update auth user metadata with account status for middleware checks
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        account_status: 'pending',
        user_type: 'employee',
        employment_category: data.employmentCategory,
        email_verified_at: new Date().toISOString(),
      },
    });

    // 8. Create audit log
    await createAuditLog({
      userId,
      action: 'CREATE',
      entityType: 'profile',
      entityId: userId,
      metadata: {
        userType: 'employee',
        employmentCategory: data.employmentCategory,
        employeeId,
        departmentId,
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return {
      success: true,
      message:
        'Employee registration successful! Please check your email for verification code.',
      data: {
        userId,
        userType: 'employee',
        employeeId,
        email: data.email,
      },
    };
  } catch (error) {
    // Don't cleanup user - they already verified email
    // Just re-throw the error
    throw error;
  }
}

/**
 * Handle applicant registration flow
 * Note: Email verification must be completed before calling this endpoint
 */
async function handleApplicantRegistration(
  data: ApplicantRegistrationFormData,
  request: NextRequest
): Promise<RegistrationSuccessResponse> {
  const supabase = createAdminClient();

  // 1. Query auth.users table directly by email for better performance
  // This is more efficient than listUsers() which retrieves ALL users
  const { data: authUsers, error: queryError } = await supabase
    .from('auth.users')
    .select('id, email, email_confirmed_at')
    .ilike('email', data.email)
    .limit(1)
    .single();

  if (queryError || !authUsers) {
    console.error('Failed to find user by email:', queryError);
    throw new Error(
      'User not found. Please start registration from the beginning.'
    );
  }

  const userId = authUsers.id;

  // 2. Verify email was verified
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  // Check if profile exists and email is verified
  if (profile && !profile.emailVerifiedAt) {
    throw new Error('Email verification required. Please verify your email.');
  }

  // If profile exists, registration already completed
  if (profile) {
    throw new Error('Registration already completed for this email.');
  }

  // 3. Generate applicant ID using database function
  const applicantIdResult = await db.execute<{
    generate_applicant_id: string;
  }>(sql`SELECT generate_applicant_id() as generate_applicant_id`);

  if (!Array.isArray(applicantIdResult) || applicantIdResult.length === 0) {
    throw new Error('Failed to generate applicant ID');
  }

  const applicantId = applicantIdResult[0].generate_applicant_id;

  try {
    // 4. Create user profile (email already verified from step 2)
    await db.insert(profiles).values({
      id: userId,
      userType: 'applicant',
      employmentCategory: 'not_applicable',
      applicantId,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName || null,
      phoneNumber: data.phoneNumber,
      role: 'employee', // Default role for applicants
      accountStatus: 'pending',
      isActive: true,
      temporaryPassword: false,
      emailVerifiedAt: new Date(), // Email verified in step 2
    });

    // 5. Generate application number
    const applicationNumber = await generateApplicationNumber();

    // 6. Create job application record
    await db.insert(jobApplications).values({
      applicationNumber,
      applicantId: userId,
      positionId: data.positionAppliedFor,
      status: 'pending',
      applicationDate: new Date(),
    });

    // 7. Create pending registration entry for admin approval
    await db.insert(pendingRegistrations).values({
      userId,
      status: 'pending',
    });

    // 8. Update auth user metadata with account status for middleware checks
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        account_status: 'pending',
        user_type: 'applicant',
        email_verified_at: new Date().toISOString(),
      },
    });

    // 9. Create audit log
    await createAuditLog({
      userId,
      action: 'CREATE',
      entityType: 'profile',
      entityId: userId,
      metadata: {
        userType: 'applicant',
        applicantId,
        applicationNumber,
        positionId: data.positionAppliedFor,
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return {
      success: true,
      message:
        'Applicant registration successful! Please check your email for verification code.',
      data: {
        userId,
        userType: 'applicant',
        applicantId,
        applicationNumber,
        email: data.email,
      },
    };
  } catch (error) {
    // Don't cleanup user - they already verified email
    // Just re-throw the error
    throw error;
  }
}

/**
 * POST /api/auth/register
 *
 * Main registration endpoint handling both employee and applicant flows
 */
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<RegistrationSuccessResponse | RegistrationErrorResponse>
> {
  try {
    // Parse request body
    const body = await request.json();

    // Determine user type and validate accordingly
    const userType = body.userType;

    if (!userType || !['employee', 'applicant'].includes(userType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing user type',
          details: {
            userType: ['User type must be either "employee" or "applicant"'],
          },
        },
        { status: 400 }
      );
    }

    // Validate based on user type
    if (userType === 'employee') {
      const validationResult =
        employeeRegistrationSchemaWithConfirmation.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Employee registration validation failed',
            details: validationResult.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      // Handle employee registration
      const result = await handleEmployeeRegistration(
        validationResult.data,
        request
      );

      return NextResponse.json(result, { status: 201 });
    } else {
      // userType === 'applicant'
      const validationResult =
        applicantRegistrationSchemaWithConfirmation.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Applicant registration validation failed',
            details: validationResult.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      // Handle applicant registration
      const result = await handleApplicantRegistration(
        validationResult.data,
        request
      );

      return NextResponse.json(result, { status: 201 });
    }
  } catch (error) {
    console.error('Registration error:', error);

    // Handle known error messages
    if (error instanceof Error) {
      const message = error.message;

      // Email already exists
      if (message.includes('already registered')) {
        return NextResponse.json(
          {
            success: false,
            error: message,
          },
          { status: 409 }
        );
      }

      // Validation or generation errors
      if (
        message.includes('Failed to generate') ||
        message.includes('Failed to verify')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: message,
          },
          { status: 500 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during registration',
        details: {
          message: [error instanceof Error ? error.message : 'Unknown error'],
        },
      },
      { status: 500 }
    );
  }
}
