import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { jobApplications, openPositions, departments, profiles } from '@tupsafe/database/server';
import { eq, desc, and } from 'drizzle-orm';

// Valid application statuses that can be filtered
const VALID_STATUSES = [
  'pending',
  'under_review',
  'shortlisted',
  'for_interview',
  'interviewed',
  'for_final_review',
  'accepted',
  'rejected',
  'withdrawn',
  'hired',
] as const;

type ApplicationStatus = typeof VALID_STATUSES[number];

/**
 * GET /api/applications
 * Fetch all applications for the current applicant
 * 
 * Query params:
 * - status: Filter by application status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient('employee');

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an applicant using Drizzle (source of truth)
    // Avoids PostgREST/RLS edge cases that can return 0 rows even when profile exists
    const [profile] = await db
      .select({
        userType: profiles.userType,
        applicantId: profiles.applicantId,
        accountStatus: profiles.accountStatus,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      console.error('[Applications API] Profile not found for user:', user.id);
      return NextResponse.json(
        { error: 'User profile not found or invalid.' },
        { status: 403 }
      );
    }

    console.log('[Applications API] User profile:', {
      userId: user.id,
      userType: profile.userType,
      applicantId: profile.applicantId,
      accountStatus: profile.accountStatus,
    });

    // Allow both 'applicant' and 'employee' userTypes to view applications
    // Employees may have been hired from applicant status and should still see their application history
    const allowedUserTypes = ['applicant', 'employee'];
    if (!allowedUserTypes.includes(profile.userType ?? '')) {
      return NextResponse.json(
        { error: 'Access denied.' },
        { status: 403 }
      );
    }

    if (profile.accountStatus !== 'active') {
      return NextResponse.json(
        {
          error: `Account status is ${profile.accountStatus}. ${
            profile.accountStatus === 'pending'
              ? 'Your account is pending approval.'
              : 'Please contact support.'
          }`,
        },
        { status: 403 }
      );
    }

    // Get filter params
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') as ApplicationStatus | null;

    // Build where conditions
    const whereConditions = [eq(jobApplications.applicantId, user.id)];

    // Add status filter if provided and valid
    if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
      whereConditions.push(eq(jobApplications.status, statusFilter));
    }

    // Fetch applications with position and department details
    const applications = await db
      .select({
        // Application fields
        id: jobApplications.id,
        applicationNumber: jobApplications.applicationNumber,
        status: jobApplications.status,
        applicationDate: jobApplications.applicationDate,
        coverLetter: jobApplications.coverLetter,
        resumeUrl: jobApplications.resumeUrl,
        interviewDate: jobApplications.interviewDate,
        interviewLocation: jobApplications.interviewLocation,
        reviewerNotes: jobApplications.reviewerNotes,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
        // Position fields
        positionId: openPositions.id,
        positionTitle: openPositions.positionTitle,
        positionCode: openPositions.positionCode,
        employmentCategory: openPositions.employmentCategory,
        salaryGrade: openPositions.salaryGrade,
        employmentType: openPositions.employmentType,
        applicationDeadline: openPositions.applicationDeadline,
        // Department fields
        departmentId: departments.id,
        departmentName: departments.name,
        departmentCode: departments.code,
      })
      .from(jobApplications)
      .leftJoin(openPositions, eq(jobApplications.positionId, openPositions.id))
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .where(and(...whereConditions))
      .orderBy(desc(jobApplications.applicationDate));

    // Transform to cleaner structure
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      status: app.status,
      applicationDate: app.applicationDate,
      coverLetter: app.coverLetter,
      resumeUrl: app.resumeUrl,
      interviewDate: app.interviewDate,
      interviewLocation: app.interviewLocation,
      reviewerNotes: app.reviewerNotes,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      position: {
        id: app.positionId,
        title: app.positionTitle,
        code: app.positionCode,
        employmentCategory: app.employmentCategory,
        salaryGrade: app.salaryGrade,
        employmentType: app.employmentType,
        applicationDeadline: app.applicationDeadline,
        department: {
          id: app.departmentId,
          name: app.departmentName,
          code: app.departmentCode,
        },
      },
    }));

    return NextResponse.json({
      applications: formattedApplications,
      total: formattedApplications.length,
      filter: statusFilter || 'all',
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
