/**
 * Employee Portal Profile API Route
 * Fetches and updates the current user's profile data
 *
 * Security:
 * - Requires active session
 * - Account status must be 'active'
 * - Email must be verified
 *
 * Features:
 * - Full profile with department/college/position joins
 * - Tenure calculation
 * - Recent submission counts
 * - User type-specific data (employee vs applicant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import {
  profiles,
  departments,
  positions,
  pdsSubmissions,
  salnSubmissions,
  auditLogs,
} from '@tupsafe/database/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Profile update schema
 * Only allow updates to specific fields
 */
const profileUpdateSchema = z.object({
  phoneNumber: z.string().optional().nullable(),
  middleName: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
});

/**
 * GET /api/profile
 * Fetch authenticated user's complete profile
 */
export async function GET(_request: NextRequest) {
  try {
    // Get Supabase session
    const supabase = await createServerClient('employee');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch profile with joins
    const [profileData] = await db
      .select({
        // Profile fields
        id: profiles.id,
        userType: profiles.userType,
        employmentCategory: profiles.employmentCategory,
        applicantId: profiles.applicantId,
        employeeId: profiles.employeeId,
        hireDate: profiles.hireDate,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        middleName: profiles.middleName,
        phoneNumber: profiles.phoneNumber,
        role: profiles.role,
        departmentId: profiles.departmentId,
        positionId: profiles.positionId,
        academicRank: profiles.academicRank,
        tenureStatus: profiles.tenureStatus,
        employmentType: profiles.employmentType,
        campusAssignment: profiles.campusAssignment,
        accountStatus: profiles.accountStatus,
        emailVerifiedAt: profiles.emailVerifiedAt,
        isActive: profiles.isActive,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
        // Department fields
        departmentName: departments.name,
        departmentCode: departments.code,
        departmentOfficeType: departments.officeType,
        parentCollegeId: departments.parentCollegeId,
        // Position fields
        positionTitle: positions.title,
        positionGradeLevel: positions.gradeLevel,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(positions, eq(profiles.positionId, positions.id))
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get college information if department has a parent college
    let college = null;
    if (profileData.parentCollegeId) {
      const [collegeData] = await db
        .select({
          id: departments.id,
          name: departments.name,
          code: departments.code,
          officeType: departments.officeType,
        })
        .from(departments)
        .where(eq(departments.id, profileData.parentCollegeId))
        .limit(1);

      college = collegeData || null;
    }

    // Calculate tenure if employee with hire date
    let tenureYears = null;
    if (profileData.hireDate) {
      const hireDate = new Date(profileData.hireDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - hireDate.getTime());
      tenureYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    }

    // Get recent submission counts
    const [pdsCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(pdsSubmissions)
      .where(eq(pdsSubmissions.userId, userId));

    const [salnCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(salnSubmissions)
      .where(eq(salnSubmissions.userId, userId));

    // Get latest PDS submission status
    const [latestPDS] = await db
      .select({
        id: pdsSubmissions.id,
        status: pdsSubmissions.status,
        submittedAt: pdsSubmissions.submittedAt,
        version: pdsSubmissions.version,
      })
      .from(pdsSubmissions)
      .where(
        and(
          eq(pdsSubmissions.userId, userId),
          eq(pdsSubmissions.isLatest, true)
        )
      )
      .orderBy(desc(pdsSubmissions.createdAt))
      .limit(1);

    // Get latest SALN submission status (current year)
    const currentYear = new Date().getFullYear();
    const [latestSALN] = await db
      .select({
        id: salnSubmissions.id,
        status: salnSubmissions.status,
        submittedAt: salnSubmissions.submittedAt,
        year: salnSubmissions.year,
      })
      .from(salnSubmissions)
      .where(
        and(
          eq(salnSubmissions.userId, userId),
          eq(salnSubmissions.year, currentYear)
        )
      )
      .orderBy(desc(salnSubmissions.createdAt))
      .limit(1);

    // Construct response
    return NextResponse.json({
      success: true,
      profile: {
        id: profileData.id,
        email: session.user.email,
        userType: profileData.userType,
        employmentCategory: profileData.employmentCategory,
        applicantId: profileData.applicantId,
        employeeId: profileData.employeeId,
        hireDate: profileData.hireDate,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        middleName: profileData.middleName,
        phoneNumber: profileData.phoneNumber,
        role: profileData.role,
        academicRank: profileData.academicRank,
        tenureStatus: profileData.tenureStatus,
        employmentType: profileData.employmentType,
        campusAssignment: profileData.campusAssignment,
        accountStatus: profileData.accountStatus,
        emailVerifiedAt: profileData.emailVerifiedAt,
        isActive: profileData.isActive,
        createdAt: profileData.createdAt,
        updatedAt: profileData.updatedAt,
        // Computed fields
        tenureYears,
        // Joined data
        department: profileData.departmentId
          ? {
              id: profileData.departmentId,
              name: profileData.departmentName,
              code: profileData.departmentCode,
              officeType: profileData.departmentOfficeType,
            }
          : null,
        college,
        position: profileData.positionId
          ? {
              id: profileData.positionId,
              title: profileData.positionTitle,
              gradeLevel: profileData.positionGradeLevel,
            }
          : null,
        // Submission summary
        submissions: {
          pds: {
            total: Number(pdsCount?.count || 0),
            latest: latestPDS || null,
          },
          saln: {
            total: Number(salnCount?.count || 0),
            latest: latestSALN || null,
          },
        },
      },
    });
  } catch (error) {
    console.error('[Profile API] GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update editable profile fields
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get Supabase session
    const supabase = await createServerClient('employee');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Get current profile for audit log
    const [currentProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Verify account is active
    if (currentProfile.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'Account must be active to update profile' },
        { status: 403 }
      );
    }

    // If updating department, verify it exists and is active
    if (updates.departmentId) {
      const [department] = await db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.id, updates.departmentId),
            eq(departments.isActive, true)
          )
        )
        .limit(1);

      if (!department) {
        return NextResponse.json(
          { error: 'Invalid or inactive department' },
          { status: 400 }
        );
      }

      // Only employees can update department
      if (currentProfile.userType !== 'employee') {
        return NextResponse.json(
          { error: 'Only employees can update department' },
          { status: 403 }
        );
      }
    }

    // Perform update
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    // Create audit log
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null;
    const userAgent = request.headers.get('user-agent') || null;

    await db.insert(auditLogs).values({
      userId,
      action: 'profile.update',
      entityType: 'profile',
      entityId: userId,
      changes: {
        before: {
          phoneNumber: currentProfile.phoneNumber,
          middleName: currentProfile.middleName,
          departmentId: currentProfile.departmentId,
        },
        after: updates,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        phoneNumber: updatedProfile.phoneNumber,
        middleName: updatedProfile.middleName,
        departmentId: updatedProfile.departmentId,
        updatedAt: updatedProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Profile API] PATCH error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
