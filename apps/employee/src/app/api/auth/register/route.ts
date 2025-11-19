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
import { sql } from 'drizzle-orm';
import {
  db,
  profiles,
  jobApplications,
  createAuditLog,
} from '@tupsafe/database/server';
import {
  generateOTP,
  sendOTPEmail,
  createServerClient,
} from '@tupsafe/auth/server';
import {
  employeeRegistrationSchemaWithConfirmation,
  applicantRegistrationSchemaWithConfirmation,
  type EmployeeRegistrationFormData,
  type ApplicantRegistrationFormData,
} from '@/lib/validations/auth';

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
 */
async function cleanupSupabaseUser(userId: string): Promise<void> {
  try {
    const supabase = await createServerClient();
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
 */
async function handleEmployeeRegistration(
  data: EmployeeRegistrationFormData,
  request: NextRequest
): Promise<RegistrationSuccessResponse> {
  const supabase = await createServerClient();

  // 1. Check if email already exists
  const { data: existingUsers, error: checkError } =
    await supabase.auth.admin.listUsers();

  if (checkError) {
    throw new Error('Failed to verify email availability');
  }

  const emailExists = existingUsers.users.some(
    (user) => user.email?.toLowerCase() === data.email.toLowerCase()
  );

  if (emailExists) {
    throw new Error('Email address is already registered');
  }

  // 2. Generate employee ID using database function
  const hireDateStr = data.hireDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const employeeIdResult = await db.execute<{ generate_employee_id: string }>(
    sql`SELECT generate_employee_id(${hireDateStr}::DATE) as generate_employee_id`
  );

  if (!Array.isArray(employeeIdResult) || employeeIdResult.length === 0) {
    throw new Error('Failed to generate employee ID');
  }

  const employeeId = employeeIdResult[0].generate_employee_id;

  // 3. Create Supabase user
  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false, // Will be confirmed via OTP
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName,
        user_type: 'employee',
        employment_category: data.employmentCategory,
      },
    });

  if (createError || !newUser.user) {
    console.error('Supabase user creation error:', createError);
    throw new Error(
      createError?.message || 'Failed to create user account'
    );
  }

  const userId = newUser.user.id;

  try {
    // 4. Determine department assignment
    // For faculty: use department if provided, otherwise use collegeOrOffice
    // For administrative: always use collegeOrOffice
    const departmentId =
      data.employmentCategory === 'faculty' && data.department
        ? data.department
        : data.collegeOrOffice;

    // 5. Create user profile
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
      positionId: data.position,
      role: 'employee',
      accountStatus: 'pending',
      isActive: true,
      temporaryPassword: false,
    });

    // 6. Send OTP verification email
    try {
      const otpResult = await generateOTP(userId, 'email_verification');
      if (otpResult.code) {
        await sendOTPEmail(data.email, otpResult.code, 'email_verification');
      }
    } catch (otpError) {
      console.error('OTP generation/sending failed:', otpError);
      // Don't fail registration - user can request resend
    }

    // 7. Create audit log
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
    // Cleanup on failure
    await cleanupSupabaseUser(userId);
    throw error;
  }
}

/**
 * Handle applicant registration flow
 */
async function handleApplicantRegistration(
  data: ApplicantRegistrationFormData,
  request: NextRequest
): Promise<RegistrationSuccessResponse> {
  const supabase = await createServerClient();

  // 1. Check if email already exists
  const { data: existingUsers, error: checkError } =
    await supabase.auth.admin.listUsers();

  if (checkError) {
    throw new Error('Failed to verify email availability');
  }

  const emailExists = existingUsers.users.some(
    (user) => user.email?.toLowerCase() === data.email.toLowerCase()
  );

  if (emailExists) {
    throw new Error('Email address is already registered');
  }

  // 2. Generate applicant ID using database function
  const applicantIdResult = await db.execute<{
    generate_applicant_id: string;
  }>(sql`SELECT generate_applicant_id() as generate_applicant_id`);

  if (!Array.isArray(applicantIdResult) || applicantIdResult.length === 0) {
    throw new Error('Failed to generate applicant ID');
  }

  const applicantId = applicantIdResult[0].generate_applicant_id;

  // 3. Create Supabase user
  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false, // Will be confirmed via OTP
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName,
        user_type: 'applicant',
      },
    });

  if (createError || !newUser.user) {
    console.error('Supabase user creation error:', createError);
    throw new Error(
      createError?.message || 'Failed to create user account'
    );
  }

  const userId = newUser.user.id;

  try {
    // 4. Create user profile
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

    // 7. Send OTP verification email
    try {
      const otpResult = await generateOTP(userId, 'email_verification');
      if (otpResult.code) {
        await sendOTPEmail(data.email, otpResult.code, 'email_verification');
      }
    } catch (otpError) {
      console.error('OTP generation/sending failed:', otpError);
      // Don't fail registration - user can request resend
    }

    // 8. Create audit log
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
    // Cleanup on failure
    await cleanupSupabaseUser(userId);
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
): Promise<NextResponse<RegistrationSuccessResponse | RegistrationErrorResponse>> {
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
          message: [
            error instanceof Error ? error.message : 'Unknown error',
          ],
        },
      },
      { status: 500 }
    );
  }
}
