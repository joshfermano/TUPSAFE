import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import {
  jobApplications,
  openPositions,
  departments,
  applicationStatusHistory,
  profiles,
} from '@tupsafe/database/server';
import { eq, desc, and } from 'drizzle-orm';

/**
 * GET /api/applications/[id]
 * Fetch single application details with status history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: applicationId } = await params;

    // Fetch application with all details
    const [application] = await db
      .select({
        // Application fields
        id: jobApplications.id,
        applicationNumber: jobApplications.applicationNumber,
        status: jobApplications.status,
        applicationDate: jobApplications.applicationDate,
        coverLetter: jobApplications.coverLetter,
        resumeUrl: jobApplications.resumeUrl,
        additionalDocuments: jobApplications.additionalDocuments,
        pdsSubmissionId: jobApplications.pdsSubmissionId,
        interviewDate: jobApplications.interviewDate,
        interviewLocation: jobApplications.interviewLocation,
        interviewNotes: jobApplications.interviewNotes,
        reviewerNotes: jobApplications.reviewerNotes,
        finalDecision: jobApplications.finalDecision,
        rejectionReason: jobApplications.rejectionReason,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
        // Position fields
        positionId: openPositions.id,
        positionTitle: openPositions.positionTitle,
        positionCode: openPositions.positionCode,
        employmentCategory: openPositions.employmentCategory,
        description: openPositions.description,
        qualifications: openPositions.qualifications,
        responsibilities: openPositions.responsibilities,
        requirements: openPositions.requirements,
        salaryGrade: openPositions.salaryGrade,
        salaryRangeMin: openPositions.salaryRangeMin,
        salaryRangeMax: openPositions.salaryRangeMax,
        employmentType: openPositions.employmentType,
        numberOfOpenings: openPositions.numberOfOpenings,
        applicationDeadline: openPositions.applicationDeadline,
        // Department fields
        departmentId: departments.id,
        departmentName: departments.name,
        departmentCode: departments.code,
      })
      .from(jobApplications)
      .leftJoin(openPositions, eq(jobApplications.positionId, openPositions.id))
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .where(
        and(
          eq(jobApplications.id, applicationId),
          eq(jobApplications.applicantId, user.id) // Security: ensure applicant owns this application
        )
      );

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Fetch status history
    const statusHistory = await db
      .select({
        id: applicationStatusHistory.id,
        previousStatus: applicationStatusHistory.previousStatus,
        newStatus: applicationStatusHistory.newStatus,
        changedAt: applicationStatusHistory.changedAt,
        notes: applicationStatusHistory.notes,
        changedByFirstName: profiles.firstName,
        changedByLastName: profiles.lastName,
      })
      .from(applicationStatusHistory)
      .leftJoin(profiles, eq(applicationStatusHistory.changedBy, profiles.id))
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(desc(applicationStatusHistory.changedAt));

    // Format response
    const formattedApplication = {
      id: application.id,
      applicationNumber: application.applicationNumber,
      status: application.status,
      applicationDate: application.applicationDate,
      coverLetter: application.coverLetter,
      resumeUrl: application.resumeUrl,
      additionalDocuments: application.additionalDocuments,
      pdsSubmissionId: application.pdsSubmissionId,
      interviewDate: application.interviewDate,
      interviewLocation: application.interviewLocation,
      interviewNotes: application.interviewNotes,
      reviewerNotes: application.reviewerNotes,
      finalDecision: application.finalDecision,
      rejectionReason: application.rejectionReason,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      position: {
        id: application.positionId,
        title: application.positionTitle,
        code: application.positionCode,
        employmentCategory: application.employmentCategory,
        description: application.description,
        qualifications: application.qualifications,
        responsibilities: application.responsibilities,
        requirements: application.requirements,
        salaryGrade: application.salaryGrade,
        salaryRangeMin: application.salaryRangeMin,
        salaryRangeMax: application.salaryRangeMax,
        employmentType: application.employmentType,
        numberOfOpenings: application.numberOfOpenings,
        applicationDeadline: application.applicationDeadline,
        department: {
          id: application.departmentId,
          name: application.departmentName,
          code: application.departmentCode,
        },
      },
      statusHistory: statusHistory.map((history) => ({
        id: history.id,
        previousStatus: history.previousStatus,
        newStatus: history.newStatus,
        changedAt: history.changedAt,
        notes: history.notes,
        changedBy:
          history.changedByFirstName && history.changedByLastName
            ? `${history.changedByFirstName} ${history.changedByLastName}`
            : 'System',
      })),
    };

    return NextResponse.json(formattedApplication);
  } catch (error) {
    console.error('Error fetching application details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application details' },
      { status: 500 }
    );
  }
}
