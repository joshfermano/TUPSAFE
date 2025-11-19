import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import { jobApplications, openPositions, departments } from '@tupsafe/database/server';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/applications
 * Fetch all applications for the current applicant
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an applicant
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, applicant_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'applicant') {
      return NextResponse.json(
        { error: 'Access denied. Applicants only.' },
        { status: 403 }
      );
    }

    // Get filter params
    const searchParams = request.nextUrl.searchParams;
    const _statusFilter = searchParams.get('status');

    // Fetch applications with position and department details
    const applicationsQuery = db
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
      .where(eq(jobApplications.applicantId, user.id))
      .orderBy(desc(jobApplications.applicationDate));

    // Execute query
    const applications = await applicationsQuery;

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
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
