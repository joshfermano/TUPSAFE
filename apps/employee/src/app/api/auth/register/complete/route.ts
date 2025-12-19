/**
 * Registration Completion API Route
 *
 * Step 4 of the registration process:
 * - Updates profile with employment details (department, hire date)
 * - Called after user accepts terms and conditions
 * - Profile must already exist (created during email verification)
 *
 * @module api/auth/register/complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, profiles } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { createAdminClient } from '@tupsafe/auth/server';

/**
 * Registration completion schema
 */
const completionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  employmentCategory: z.enum(['faculty', 'administrative']),
  hireDate: z.string().optional(), // ISO date string
  // For faculty: departmentId (department within college)
  // For administrative: officeId (administrative office)
  departmentId: z.string().uuid('Invalid department/office ID').optional(),
  // For faculty: collegeId (parent college)
  collegeId: z.string().uuid('Invalid college ID').optional(),
});

type CompletionData = z.infer<typeof completionSchema>;

/**
 * Success response structure
 */
interface CompleteSuccessResponse {
  success: true;
  message: string;
  data: {
    userId: string;
    departmentId: string | null;
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
 * 3. Updating the profile with employment details
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

    const data: CompletionData = validationResult.data;
    const { userId, employmentCategory, hireDate, departmentId, collegeId } = data;

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

    // Determine the department ID to save
    // For faculty: use departmentId (department within college)
    // For administrative: use collegeId as the office ID
    let finalDepartmentId: string | null = null;

    console.log('[Registration Complete] Processing:', {
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
      console.log('[Registration Complete] Faculty - using departmentId:', finalDepartmentId);
    } else if (employmentCategory === 'administrative') {
      // Administrative: must have office selected (passed as collegeId from form)
      if (!collegeId) {
        console.error('[Registration Complete] Admin staff missing collegeId (office)');
        return NextResponse.json(
          {
            success: false,
            error: 'Office is required for administrative staff',
          },
          { status: 400 }
        );
      }
      finalDepartmentId = collegeId; // Office ID
      console.log('[Registration Complete] Administrative - using collegeId as office:', finalDepartmentId);
    }
    // Note: For applicants (if they reach this endpoint), no department is required

    // Update profile with employment details
    try {
      // Drizzle's date() type expects a string in 'YYYY-MM-DD' format
      const hireDateForDb = hireDate
        ? new Date(hireDate).toISOString().split('T')[0]
        : null;

      await db
        .update(profiles)
        .set({
          departmentId: finalDepartmentId,
          hireDate: hireDateForDb,
          employmentCategory: employmentCategory,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      console.log(
        `✓ Updated profile for user ${userId} with employment details:`,
        {
          departmentId: finalDepartmentId,
          hireDate,
          employmentCategory,
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

    // Also update user metadata with department info for quick access
    try {
      const existingMetadata = authUser.user.user_metadata || {};
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingMetadata,
          department_id: finalDepartmentId,
          employment_category: employmentCategory,
          hire_date: hireDate || null,
          registration_completed: true,
        },
      });
      console.log(`✓ Updated user metadata with department info for ${userId}`);
    } catch (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Non-critical, continue
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration completed successfully. Awaiting admin approval.',
        data: {
          userId,
          departmentId: finalDepartmentId,
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
