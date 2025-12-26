/**
 * Registration Completion API Route
 *
 * Step 4 of the registration process for both employees and applicants:
 *
 * For EMPLOYEES:
 * - Updates profile with employment details (department, hire date)
 * - Account remains pending until HR approval
 * - Called after user accepts terms and conditions
 * - SECURITY: Only users who initiated as employees can complete as employees
 *
 * For APPLICANTS:
 * - Auto-activates the account (no HR approval needed)
 * - Generates applicant ID
 * - Sets accountStatus to 'active' immediately
 * - Applicant can then browse and apply to positions
 * - SECURITY: Applicants CANNOT be upgraded to employee via this endpoint
 *
 * @module api/auth/register/complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  db,
  profiles,
  generateAndRegisterEmployeeIdFromDOB,
  generateApplicantId,
} from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { createAdminClient } from '@tupsafe/auth/server';

/**
 * TUP Manila institutional email domains for employee validation
 * Employee registrations must use these domains
 */
const INSTITUTIONAL_EMAIL_DOMAINS = [
  'tup.edu.ph',
  'gsb.tup.edu.ph',
  'manila.tup.edu.ph',
  'gov.ph',
  'deped.gov.ph',
  'ched.gov.ph',
  'dost.gov.ph',
];

/**
 * Check if an email belongs to an institutional domain
 */
function isInstitutionalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return INSTITUTIONAL_EMAIL_DOMAINS.some((instDomain) =>
    domain?.endsWith(instDomain)
  );
}

/**
 * Registration completion schema - Discriminated union for employee vs applicant
 */
const employeeCompletionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  userType: z.literal('employee').optional(), // Default for backward compatibility
  employmentCategory: z.enum(['faculty', 'administrative']),
  hireDate: z.string().optional(), // ISO date string
  // For faculty: departmentId (department within college)
  // For administrative: officeId (administrative office)
  departmentId: z.string().uuid('Invalid department/office ID').optional(),
  // For faculty: collegeId (parent college)
  collegeId: z.string().uuid('Invalid college ID').optional(),
});

const applicantCompletionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  userType: z.literal('applicant'),
});

const completionSchema = z
  .discriminatedUnion('userType', [
    employeeCompletionSchema.extend({ userType: z.literal('employee') }),
    applicantCompletionSchema,
  ])
  .or(employeeCompletionSchema); // Also allow without userType for backward compatibility

/**
 * Success response structure
 */
interface CompleteSuccessResponse {
  success: true;
  message: string;
  data: {
    userId: string;
    employeeId?: string | null;
    applicantId?: string | null;
    departmentId?: string | null;
    userType: 'employee' | 'applicant';
    accountStatus: 'pending' | 'active';
  };
}

/**
 * Error response structure
 */
interface CompleteErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[] | undefined>;
}

/**
 * POST /api/auth/register/complete
 *
 * Completes the registration process by:
 * 1. Validating the provided data
 * 2. Verifying the user exists and has a pending profile
 * 3. For employees: updating profile with employment details (pending approval)
 * 4. For applicants: auto-activating account with applicant ID
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CompleteSuccessResponse | CompleteErrorResponse>> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = completionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration completion validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const { userId } = data;
    const userType = 'userType' in data ? data.userType : 'employee';
    const isApplicant = userType === 'applicant';

    // Verify user exists in auth
    const supabase = createAdminClient();
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser.user) {
      console.error('Auth user not found:', authError);
      return NextResponse.json(
        {
          success: false,
          error: 'User not found. Please restart registration.',
        },
        { status: 404 }
      );
    }

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!existingProfile) {
      console.error('Profile not found for user:', userId);
      return NextResponse.json(
        {
          success: false,
          error: 'Profile not found. Please complete email verification first.',
        },
        { status: 404 }
      );
    }

    // =========================================================================
    // SECURITY: Determine actual userType from trusted sources
    // Priority: 1) Existing DB profile, 2) Auth metadata, 3) Request body
    // This prevents applicants from upgrading themselves to employees
    // =========================================================================
    const existingUserType = existingProfile.userType;
    const metadataUserType = authUser.user.user_metadata?.user_type as
      | 'employee'
      | 'applicant'
      | undefined;
    const requestedUserType = userType;

    console.log('[Registration Complete] UserType check:', {
      existingUserType,
      metadataUserType,
      requestedUserType,
      userId,
    });

    // SECURITY CHECK 1: If profile is already marked as applicant, REJECT employee completion
    if (existingUserType === 'applicant' && requestedUserType === 'employee') {
      console.error(
        `[Registration Complete] SECURITY: Blocked applicant→employee upgrade attempt for user ${userId}`
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot complete as employee. This account was registered as an applicant. If you are a TUP employee, please register with your institutional email.',
        },
        { status: 403 }
      );
    }

    // SECURITY CHECK 2: If metadata says applicant, REJECT employee completion
    if (metadataUserType === 'applicant' && requestedUserType === 'employee') {
      console.error(
        `[Registration Complete] SECURITY: Blocked applicant→employee upgrade (metadata) for user ${userId}`
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot complete as employee. This account was initiated as an applicant.',
        },
        { status: 403 }
      );
    }

    // SECURITY CHECK 3: For employee completions, verify institutional email
    if (
      requestedUserType === 'employee' ||
      (!isApplicant && existingUserType !== 'applicant')
    ) {
      const userEmail = authUser.user.email;
      if (userEmail && !isInstitutionalEmail(userEmail)) {
        console.error(
          `[Registration Complete] SECURITY: Non-institutional email attempting employee completion: ${userEmail}`
        );
        return NextResponse.json(
          {
            success: false,
            error:
              'Employee registration requires a TUP Manila institutional email (e.g., @tup.edu.ph). If you are an applicant, please select "Applicant" during registration.',
          },
          { status: 403 }
        );
      }
    }

    // =========================================================================
    // APPLICANT COMPLETION: Auto-activate account
    // =========================================================================
    if (isApplicant) {
      console.log('[Registration Complete] Processing APPLICANT:', userId);

      // Generate applicant ID
      let generatedApplicantId: string;
      try {
        generatedApplicantId = await generateApplicantId();
        console.log(
          `✓ Generated applicant ID for user ${userId}: ${generatedApplicantId}`
        );
      } catch (idGenError) {
        console.error('Error generating applicant ID:', idGenError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to generate applicant ID. Please try again.',
          },
          { status: 500 }
        );
      }

      // Update profile with applicant details and activate account
      try {
        await db
          .update(profiles)
          .set({
            userType: 'applicant',
            applicantId: generatedApplicantId,
            accountStatus: 'active', // Auto-activate applicants
            emailVerifiedAt: existingProfile.emailVerifiedAt || new Date(),
            isActive: true,
            employmentCategory: 'not_applicable',
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, userId));

        console.log(`✓ Applicant profile activated for user ${userId}:`, {
          applicantId: generatedApplicantId,
          accountStatus: 'active',
        });
      } catch (updateError) {
        console.error('Error updating applicant profile:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to activate applicant account.',
          },
          { status: 500 }
        );
      }

      // Update user metadata
      try {
        const existingMetadata = authUser.user.user_metadata || {};
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingMetadata,
            user_type: 'applicant',
            applicant_id: generatedApplicantId,
            account_status: 'active',
            registration_completed: true,
          },
        });
        console.log(`✓ Updated user metadata for applicant ${userId}`);
      } catch (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        // Non-critical, continue
      }

      return NextResponse.json(
        {
          success: true,
          message:
            'Registration completed successfully. Your account is now active!',
          data: {
            userId,
            applicantId: generatedApplicantId,
            userType: 'applicant',
            accountStatus: 'active',
          },
        },
        { status: 200 }
      );
    }

    // =========================================================================
    // EMPLOYEE COMPLETION: Pending approval flow
    // =========================================================================
    const { employmentCategory, hireDate, departmentId, collegeId } =
      data as z.infer<typeof employeeCompletionSchema>;

    // Determine the department ID to save
    // For faculty: use departmentId (department within college)
    // For administrative: use collegeId as the office ID
    let finalDepartmentId: string | null = null;

    console.log('[Registration Complete] Processing EMPLOYEE:', {
      userId,
      employmentCategory,
      departmentId,
      collegeId,
      hireDate,
    });

    if (employmentCategory === 'faculty') {
      // Faculty: must have department selected
      if (!departmentId) {
        console.error('[Registration Complete] Faculty missing departmentId');
        return NextResponse.json(
          {
            success: false,
            error: 'Department is required for faculty members',
          },
          { status: 400 }
        );
      }
      finalDepartmentId = departmentId;
      console.log(
        '[Registration Complete] Faculty - using departmentId:',
        finalDepartmentId
      );
    } else if (employmentCategory === 'administrative') {
      // Administrative: must have office selected (passed as collegeId from form)
      if (!collegeId) {
        console.error(
          '[Registration Complete] Admin staff missing collegeId (office)'
        );
        return NextResponse.json(
          {
            success: false,
            error: 'Office is required for administrative staff',
          },
          { status: 400 }
        );
      }
      finalDepartmentId = collegeId; // Office ID
      console.log(
        '[Registration Complete] Administrative - using collegeId as office:',
        finalDepartmentId
      );
    }

    // Generate employee ID from date of birth
    let generatedEmployeeId: string | null = null;
    const dateOfBirth = authUser.user.user_metadata?.date_of_birth;

    if (dateOfBirth) {
      try {
        generatedEmployeeId = await generateAndRegisterEmployeeIdFromDOB(
          userId,
          dateOfBirth
        );
        console.log(
          `✓ Generated employee ID for user ${userId}: ${generatedEmployeeId}`
        );
      } catch (idGenError) {
        console.error('Error generating employee ID:', idGenError);
        // Non-critical - we can continue without employee ID
        // Admin can assign manually later
      }
    } else {
      console.warn(
        `[Registration Complete] No date of birth found for user ${userId}, skipping employee ID generation`
      );
    }

    // Update profile with employment details and employee ID
    try {
      // Drizzle's date() type expects a string in 'YYYY-MM-DD' format
      const hireDateForDb = hireDate
        ? new Date(hireDate).toISOString().split('T')[0]
        : null;

      await db
        .update(profiles)
        .set({
          userType: 'employee',
          employeeId: generatedEmployeeId,
          departmentId: finalDepartmentId,
          hireDate: hireDateForDb,
          employmentCategory: employmentCategory,
          accountStatus: 'pending', // Employees need HR approval
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      console.log(
        `✓ Updated profile for employee ${userId} with employment details:`,
        {
          employeeId: generatedEmployeeId,
          departmentId: finalDepartmentId,
          hireDate,
          employmentCategory,
          accountStatus: 'pending',
        }
      );
    } catch (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update profile with employment details.',
        },
        { status: 500 }
      );
    }

    // Also update user metadata with department info and employee ID for quick access
    try {
      const existingMetadata = authUser.user.user_metadata || {};
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingMetadata,
          user_type: 'employee',
          employee_id: generatedEmployeeId,
          department_id: finalDepartmentId,
          employment_category: employmentCategory,
          hire_date: hireDate || null,
          account_status: 'pending',
          registration_completed: true,
        },
      });
      console.log(
        `✓ Updated user metadata with department info and employee ID for ${userId}`
      );
    } catch (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Non-critical, continue
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Registration completed successfully. Awaiting admin approval.',
        data: {
          userId,
          employeeId: generatedEmployeeId,
          departmentId: finalDepartmentId,
          userType: 'employee',
          accountStatus: 'pending',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Registration completion error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        details: {
          message: [error instanceof Error ? error.message : 'Unknown error'],
        },
      },
      { status: 500 }
    );
  }
}
