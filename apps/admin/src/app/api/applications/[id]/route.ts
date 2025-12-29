/**
 * Application Detail API - GET/PATCH /api/applications/[id]
 *
 * GET: Retrieves comprehensive application details including:
 * - Full applicant profile
 * - Position details with department
 * - PDS submission details if linked
 * - Complete status history
 * - Other applications by the same applicant
 *
 * PATCH: Updates application reviewer notes and interview details
 *
 * Security:
 * - Requires admin or hr role
 * - Application validation
 * - Audit logging for updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  jobApplications,
  applicationStatusHistory,
  profiles,
  openPositions,
  pdsSubmissions,
  pdsPersonalInfo,
  pdsEducation,
  pdsWorkExperience,
  departments,
  createAuditLog,
} from '@tupsafe/database/server';
import { eq, and, ne, desc } from 'drizzle-orm';
import { z } from 'zod';
import type { JobApplicationDetail } from '@tupsafe/types';

// Update application schema (for reviewer notes and interview details)
const updateApplicationSchema = z.object({
  reviewerNotes: z.string().max(1000).optional(),
  interviewDate: z.coerce.date().optional(),
  interviewLocation: z.string().max(500).optional(),
  interviewNotes: z.string().max(1000).optional(),
});

type UpdateApplicationData = z.infer<typeof updateApplicationSchema>;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Application Detail API] GET request received');

    // Get current user from Supabase session (portal-specific)
    const currentUser = await getUserFromSupabase('admin');

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Verify admin/HR permissions
    const allowedRoles = ['admin', 'hr'];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get application ID from params
    const { id: applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Query 1: Fetch application with all related data
    const applicationData = await db
      .select({
        // Application fields
        id: jobApplications.id,
        applicationNumber: jobApplications.applicationNumber,
        status: jobApplications.status,
        applicationDate: jobApplications.applicationDate,
        pdsSubmissionId: jobApplications.pdsSubmissionId,
        coverLetter: jobApplications.coverLetter,
        resumeUrl: jobApplications.resumeUrl,
        additionalDocuments: jobApplications.additionalDocuments,
        reviewerNotes: jobApplications.reviewerNotes,
        reviewedAt: jobApplications.reviewedAt,
        interviewDate: jobApplications.interviewDate,
        interviewLocation: jobApplications.interviewLocation,
        interviewNotes: jobApplications.interviewNotes,
        finalDecision: jobApplications.finalDecision,
        decisionAt: jobApplications.decisionAt,
        rejectionReason: jobApplications.rejectionReason,
        convertedToEmployeeId: jobApplications.convertedToEmployeeId,
        convertedHireDate: jobApplications.convertedHireDate,
        conversionDate: jobApplications.conversionDate,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,

        // Applicant fields
        applicantId: profiles.id,
        applicantApplicantId: profiles.applicantId,
        applicantFirstName: profiles.firstName,
        applicantLastName: profiles.lastName,
        applicantMiddleName: profiles.middleName,
        applicantPhone: profiles.phoneNumber,
        applicantAccountStatus: profiles.accountStatus,
        applicantCreatedAt: profiles.createdAt,

        // Position fields
        positionId: openPositions.id,
        positionTitle: openPositions.positionTitle,
        positionCode: openPositions.positionCode,
        positionDescription: openPositions.description,
        positionEmploymentCategory: openPositions.employmentCategory,
        positionApplicationDeadline: openPositions.applicationDeadline,
        positionStatus: openPositions.status,

        // Department fields
        departmentId: departments.id,
        departmentName: departments.name,
        departmentCode: departments.code,
      })
      .from(jobApplications)
      .innerJoin(profiles, eq(jobApplications.applicantId, profiles.id))
      .innerJoin(openPositions, eq(jobApplications.positionId, openPositions.id))
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!applicationData.length) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const application = applicationData[0];

    // Get applicant email from auth.users
    const [applicantEmailResult] = await db.execute<{ email: string }>(
      `SELECT email FROM auth.users WHERE id = '${application.applicantId}'::uuid`
    );

    // Query 2: Fetch reviewer details if exists
    let reviewedByData = null;
    if (application.reviewedAt) {
      const reviewers = await db
        .select({
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
        })
        .from(profiles)
        .innerJoin(jobApplications, eq(profiles.id, jobApplications.reviewedBy))
        .where(eq(jobApplications.id, applicationId))
        .limit(1);

      reviewedByData = reviewers.length ? reviewers[0] : null;
    }

    // Query 3: Fetch decision maker details if exists
    let decisionByData = null;
    if (application.decisionAt) {
      const decisionMakers = await db
        .select({
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
        })
        .from(profiles)
        .innerJoin(jobApplications, eq(profiles.id, jobApplications.decisionBy))
        .where(eq(jobApplications.id, applicationId))
        .limit(1);

      decisionByData = decisionMakers.length ? decisionMakers[0] : null;
    }

    // Query 4: Fetch PDS data if linked
    let pdsData = undefined;
    if (application.pdsSubmissionId) {
      const pdsSubmission = await db
        .select({
          id: pdsSubmissions.id,
          version: pdsSubmissions.version,
        })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.id, application.pdsSubmissionId))
        .limit(1);

      if (pdsSubmission.length) {
        // Fetch personal info
        const personalInfoData = await db
          .select({
            surname: pdsPersonalInfo.surname,
            firstName: pdsPersonalInfo.firstName,
            middleName: pdsPersonalInfo.middleName,
            dateOfBirth: pdsPersonalInfo.dateOfBirth,
            emailAddress: pdsPersonalInfo.emailAddress,
            mobileNo: pdsPersonalInfo.mobileNo,
          })
          .from(pdsPersonalInfo)
          .where(eq(pdsPersonalInfo.pdsSubmissionId, application.pdsSubmissionId))
          .limit(1);

        // Fetch education
        const educationData = await db
          .select({
            level: pdsEducation.level,
            schoolName: pdsEducation.schoolName,
            degreeCourse: pdsEducation.degreeCourse,
            yearGraduated: pdsEducation.yearGraduated,
          })
          .from(pdsEducation)
          .where(eq(pdsEducation.pdsSubmissionId, application.pdsSubmissionId))
          .orderBy(desc(pdsEducation.yearGraduated));

        // Fetch work experience
        const workExperienceData = await db
          .select({
            positionTitle: pdsWorkExperience.positionTitle,
            departmentAgency: pdsWorkExperience.departmentAgency,
            dateFrom: pdsWorkExperience.dateFrom,
            dateTo: pdsWorkExperience.dateTo,
          })
          .from(pdsWorkExperience)
          .where(eq(pdsWorkExperience.pdsSubmissionId, application.pdsSubmissionId))
          .orderBy(desc(pdsWorkExperience.dateFrom));

        pdsData = {
          id: pdsSubmission[0].id,
          version: pdsSubmission[0].version,
          personalInfo: personalInfoData.length
            ? {
                fullName: `${personalInfoData[0].firstName} ${personalInfoData[0].middleName || ''} ${personalInfoData[0].surname}`.trim(),
                dateOfBirth: personalInfoData[0].dateOfBirth?.toString() || '',
                email: personalInfoData[0].emailAddress || '',
                phoneNumber: personalInfoData[0].mobileNo || '',
              }
            : {
                fullName: '',
                dateOfBirth: '',
                email: '',
                phoneNumber: '',
              },
          education: educationData.map((edu) => ({
            level: edu.level,
            schoolName: edu.schoolName,
            degreeCourse: edu.degreeCourse,
            yearGraduated: edu.yearGraduated,
          })),
          workExperience: workExperienceData.map((work) => ({
            positionTitle: work.positionTitle,
            departmentAgency: work.departmentAgency,
            dateFrom: work.dateFrom.toString(),
            dateTo: work.dateTo?.toString() || null,
          })),
        };
      }
    }

    // Query 5: Fetch status history
    const statusHistoryData = await db
      .select({
        id: applicationStatusHistory.id,
        previousStatus: applicationStatusHistory.previousStatus,
        newStatus: applicationStatusHistory.newStatus,
        changedAt: applicationStatusHistory.changedAt,
        notes: applicationStatusHistory.notes,
        changedById: applicationStatusHistory.changedBy,
      })
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(desc(applicationStatusHistory.changedAt));

    // Fetch changedBy profile details
    const statusHistory = await Promise.all(
      statusHistoryData.map(async (history) => {
        let changedBy = null;
        if (history.changedById) {
          const changedByProfiles = await db
            .select({
              id: profiles.id,
              firstName: profiles.firstName,
              lastName: profiles.lastName,
            })
            .from(profiles)
            .where(eq(profiles.id, history.changedById))
            .limit(1);

          changedBy = changedByProfiles.length ? changedByProfiles[0] : null;
        }

        return {
          id: history.id,
          previousStatus: history.previousStatus,
          newStatus: history.newStatus,
          changedBy,
          changedAt: history.changedAt!,
          notes: history.notes,
        };
      })
    );

    // Query 6: Fetch other applications by the same applicant
    const otherApplicationsData = await db
      .select({
        id: jobApplications.id,
        applicationNumber: jobApplications.applicationNumber,
        status: jobApplications.status,
        applicationDate: jobApplications.applicationDate,
        positionTitle: openPositions.positionTitle,
      })
      .from(jobApplications)
      .innerJoin(openPositions, eq(jobApplications.positionId, openPositions.id))
      .where(
        and(
          eq(jobApplications.applicantId, application.applicantId),
          ne(jobApplications.id, applicationId)
        )
      )
      .orderBy(desc(jobApplications.applicationDate));

    // Construct response
    const response: JobApplicationDetail = {
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status!,
        applicationDate: application.applicationDate!,
        pdsSubmissionId: application.pdsSubmissionId,
        coverLetter: application.coverLetter,
        resumeUrl: application.resumeUrl,
        additionalDocuments: application.additionalDocuments as string[],
        reviewedBy: reviewedByData
          ? {
              id: reviewedByData.id,
              firstName: reviewedByData.firstName,
              lastName: reviewedByData.lastName,
              email: '', // Email not needed in list view
            }
          : null,
        reviewedAt: application.reviewedAt,
        reviewerNotes: application.reviewerNotes,
        interviewDate: application.interviewDate,
        interviewLocation: application.interviewLocation,
        interviewNotes: application.interviewNotes,
        finalDecision: application.finalDecision,
        decisionBy: decisionByData
          ? {
              id: decisionByData.id,
              firstName: decisionByData.firstName,
              lastName: decisionByData.lastName,
            }
          : null,
        decisionAt: application.decisionAt,
        rejectionReason: application.rejectionReason,
        convertedToEmployeeId: application.convertedToEmployeeId,
        convertedHireDate: application.convertedHireDate,
        conversionDate: application.conversionDate,
        createdAt: application.createdAt!,
        updatedAt: application.updatedAt!,
      },
      applicant: {
        id: application.applicantId,
        applicantId: application.applicantApplicantId,
        firstName: application.applicantFirstName,
        lastName: application.applicantLastName,
        middleName: application.applicantMiddleName,
        email: applicantEmailResult?.email || '',
        phoneNumber: application.applicantPhone,
        accountStatus: application.applicantAccountStatus,
        createdAt: application.applicantCreatedAt!,
      },
      position: {
        id: application.positionId,
        positionTitle: application.positionTitle,
        positionCode: application.positionCode,
        description: application.positionDescription,
        employmentCategory: application.positionEmploymentCategory,
        department: application.departmentId
          ? {
              id: application.departmentId,
              name: application.departmentName!,
              code: application.departmentCode!,
            }
          : null,
        applicationDeadline: application.positionApplicationDeadline,
        status: application.positionStatus!,
      },
      pdsData,
      statusHistory,
      otherApplications: otherApplicationsData
        .filter((app) => app.status !== null)
        .map((app) => ({
          id: app.id,
          applicationNumber: app.applicationNumber,
          positionTitle: app.positionTitle,
          status: app.status!,
          applicationDate: app.applicationDate!,
        })),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[Application Detail API] GET Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch application details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Application Detail API] PATCH request received');

    // Get current user from Supabase session (portal-specific)
    const currentUser = await getUserFromSupabase('admin');

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Verify admin/HR permissions
    const allowedRoles = ['admin', 'hr'];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get application ID from params
    const { id: applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateApplicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data: UpdateApplicationData = validationResult.data;

    // Check if application exists
    const existingApplication = await db
      .select({ id: jobApplications.id, status: jobApplications.status })
      .from(jobApplications)
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!existingApplication.length) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Update application
    const updateData: Partial<typeof jobApplications.$inferInsert> = {
      updatedAt: now,
    };

    if (data.reviewerNotes !== undefined) {
      updateData.reviewerNotes = data.reviewerNotes;
      updateData.reviewedBy = currentUser.userId;
      updateData.reviewedAt = now;
    }

    if (data.interviewDate !== undefined) {
      updateData.interviewDate = data.interviewDate;
    }

    if (data.interviewLocation !== undefined) {
      updateData.interviewLocation = data.interviewLocation;
    }

    if (data.interviewNotes !== undefined) {
      updateData.interviewNotes = data.interviewNotes;
    }

    await db
      .update(jobApplications)
      .set(updateData)
      .where(eq(jobApplications.id, applicationId));

    // Log audit event
    try {
      await createAuditLog({
        userId: currentUser.userId,
        action: 'UPDATE',
        entityType: 'application',
        entityId: applicationId,
        changes: {
          before: existingApplication[0],
          after: updateData,
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

    return NextResponse.json(
      {
        success: true,
        message: 'Application updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Application Detail API] PATCH Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/applications/[id]
 *
 * Permanently deletes a withdrawn application.
 * Only applications with status 'withdrawn' can be deleted.
 *
 * Security:
 * - Requires admin or hr role
 * - Only withdrawn applications can be deleted
 * - Audit logging for deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Application Detail API] DELETE request received');

    // Get current user from Supabase session (portal-specific)
    const currentUser = await getUserFromSupabase('admin');

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Verify admin/HR permissions
    const allowedRoles = ['admin', 'hr'];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get application ID from params
    const { id: applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Check if application exists and get its status
    const existingApplication = await db
      .select({
        id: jobApplications.id,
        status: jobApplications.status,
        applicationNumber: jobApplications.applicationNumber,
        applicantId: jobApplications.applicantId,
        positionId: jobApplications.positionId,
      })
      .from(jobApplications)
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!existingApplication.length) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const application = existingApplication[0];

    // Only allow deletion of withdrawn applications
    if (application.status !== 'withdrawn') {
      return NextResponse.json(
        {
          error: 'Cannot delete application',
          message: 'Only withdrawn applications can be deleted. Current status: ' + application.status,
        },
        { status: 400 }
      );
    }

    // Delete status history first (foreign key constraint)
    await db
      .delete(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId));

    // Delete the application
    await db
      .delete(jobApplications)
      .where(eq(jobApplications.id, applicationId));

    // Log audit event
    try {
      await createAuditLog({
        userId: currentUser.userId,
        action: 'DELETE',
        entityType: 'application',
        entityId: applicationId,
        changes: {
          deletedApplication: {
            id: application.id,
            applicationNumber: application.applicationNumber,
            status: application.status,
            applicantId: application.applicantId,
            positionId: application.positionId,
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

    return NextResponse.json(
      {
        success: true,
        message: 'Application deleted successfully',
        deletedApplicationNumber: application.applicationNumber,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Application Detail API] DELETE Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
