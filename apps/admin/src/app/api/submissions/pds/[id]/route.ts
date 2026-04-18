/**
 * PDS Submission Detail API
 * GET /api/submissions/pds/[id]
 *
 * Retrieves complete details of a PDS submission for review
 *
 * Features:
 * - Complete PDS data across all sections
 * - Employee profile information
 * - Previous submission versions
 * - Audit trail and review history
 * - Optimized queries with joins
 *
 * Security:
 * - Requires admin or hr role
 * - Audit logging for access
 * - Cannot review own submissions
 *
 * @param {string} id - PDS submission ID (UUID)
 * @returns {PDSSubmissionDetail} Complete PDS submission details
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase, createAdminClient, getProfilePicturePublicUrl } from '@tupsafe/auth/server';
import {
  db,
  profiles,
  departments,
  positions,
  pdsSubmissions,
  pdsPersonalInfo,
  pdsFamilyBackground,
  pdsChildren,
  pdsEducation,
  pdsCivilService,
  pdsWorkExperience,
  pdsVoluntaryWork,
  pdsTraining,
  pdsOtherInfo,
  pdsAttachments,
  notifications,
  auditLogs,
  deletePDSSubmissionAsAdmin,
  deletePdfFromStorage,
} from '@tupsafe/database/server';
import { and, eq, desc } from 'drizzle-orm';
import { createAuditLog } from '@tupsafe/database/utils/audit-log';
import { PDS_ATTACHMENTS_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from '@tupsafe/auth/server';
import { deleteSubmissionSchema, type ApiSuccess } from '@tupsafe/types';
import { v7 as uuidv7 } from 'uuid';
import type { PDSSubmissionDetail } from '@tupsafe/types';

export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user for audit logging
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    // Fetch main submission with employee details
    const [submission] = await db
      .select({
        id: pdsSubmissions.id,
        year: pdsSubmissions.year,
        userId: pdsSubmissions.userId,
        status: pdsSubmissions.status,
        submittedAt: pdsSubmissions.submittedAt,
        approvedBy: pdsSubmissions.approvedBy,
        approvedAt: pdsSubmissions.approvedAt,
        rejectionReason: pdsSubmissions.rejectionReason,
        version: pdsSubmissions.version,
        employeeId: profiles.employeeId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        departmentId: profiles.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        positionId: profiles.positionId,
        positionTitle: positions.title,
        avatarPath: profiles.avatarPath,
        reviewerFirstName: profiles.firstName,
        reviewerLastName: profiles.lastName,
      })
      .from(pdsSubmissions)
      .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(positions, eq(profiles.positionId, positions.id))
      .where(eq(pdsSubmissions.id, id))
      .limit(1);

    if (!submission) {
      return NextResponse.json({ error: 'PDS submission not found' }, { status: 404 });
    }

    // Block access to draft submissions in admin portal
    if (submission.status === 'draft') {
      return NextResponse.json(
        { error: 'Draft submissions are not accessible in admin portal' },
        { status: 403 }
      );
    }

    // Fetch reviewer details if reviewed
    let reviewedBy = null;
    if (submission.approvedBy) {
      const [reviewer] = await db
        .select({
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
        })
        .from(profiles)
        .where(eq(profiles.id, submission.approvedBy))
        .limit(1);

      if (reviewer) {
        reviewedBy = reviewer;
      }
    }

    // Get employee email from Supabase Auth
    const adminClient = await createAdminClient();
    const { data: authUser } = await adminClient.auth.admin.getUserById(
      submission.userId
    );
    const employeeEmail = authUser?.user?.email || null;

    // Fetch all PDS sections in parallel
    const [
      personalInfo,
      familyBackground,
      children,
      education,
      civilService,
      workExperience,
      voluntaryWork,
      training,
      otherInfo,
      attachmentsList,
      previousVersions,
      auditTrail,
    ] = await Promise.all([
      // Personal Info
      db
        .select()
        .from(pdsPersonalInfo)
        .where(eq(pdsPersonalInfo.pdsSubmissionId, id))
        .limit(1)
        .then((r) => r[0] || null),

      // Family Background
      db
        .select()
        .from(pdsFamilyBackground)
        .where(eq(pdsFamilyBackground.pdsSubmissionId, id))
        .limit(1)
        .then((r) => r[0] || null),

      // Children
      db.select().from(pdsChildren).where(eq(pdsChildren.pdsSubmissionId, id)),

      // Education
      db.select().from(pdsEducation).where(eq(pdsEducation.pdsSubmissionId, id)),

      // Civil Service
      db
        .select()
        .from(pdsCivilService)
        .where(eq(pdsCivilService.pdsSubmissionId, id)),

      // Work Experience
      db
        .select()
        .from(pdsWorkExperience)
        .where(eq(pdsWorkExperience.pdsSubmissionId, id)),

      // Voluntary Work
      db
        .select()
        .from(pdsVoluntaryWork)
        .where(eq(pdsVoluntaryWork.pdsSubmissionId, id)),

      // Training
      db.select().from(pdsTraining).where(eq(pdsTraining.pdsSubmissionId, id)),

      // Other Info
      db
        .select()
        .from(pdsOtherInfo)
        .where(eq(pdsOtherInfo.pdsSubmissionId, id))
        .limit(1)
        .then((r) => r[0] || null),

      // Attachments
      db
        .select()
        .from(pdsAttachments)
        .where(eq(pdsAttachments.pdsSubmissionId, id)),

      // Previous versions
      db
        .select({
          id: pdsSubmissions.id,
          version: pdsSubmissions.version,
          submittedAt: pdsSubmissions.submittedAt,
          status: pdsSubmissions.status,
        })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.userId, submission.userId),
            eq(pdsSubmissions.isLatest, false)
          )
        )
        .orderBy(desc(pdsSubmissions.version)),

      // Audit trail
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          userId: auditLogs.userId,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          createdAt: auditLogs.createdAt,
          changes: auditLogs.changes,
        })
        .from(auditLogs)
        .leftJoin(profiles, eq(auditLogs.userId, profiles.id))
        .where(
          and(
            eq(auditLogs.entityType, 'pds_submission'),
            eq(auditLogs.entityId, id)
          )
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(20),
    ]);

    // Get Supabase URL for public URLs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // Generate signed URLs for attachments (private bucket requires signed URLs)
    const processedAttachments = await Promise.all(
      attachmentsList.map(async (att) => {
        let fileUrl: string | null = null;

        if (att.filePath) {
          try {
            const { data: signedUrlData } = await adminClient.storage
              .from(PDS_ATTACHMENTS_BUCKET)
              .createSignedUrl(att.filePath, SIGNED_URL_EXPIRY_SECONDS);

            fileUrl = signedUrlData?.signedUrl || null;
          } catch (error) {
            console.error(`Failed to generate signed URL for attachment ${att.id}:`, error);
          }
        }

        return {
          id: att.id,
          fileName: att.fileName,
          mimeType: att.mimeType,
          sizeBytes: att.sizeBytes,
          filePath: att.filePath,
          fileUrl,
          trainingId: att.trainingId,
          civilServiceId: att.civilServiceId,
          createdAt: att.createdAt,
        };
      })
    );

    // Group attachments by training ID and civil service ID
    const attachmentsByTraining: Record<string, typeof processedAttachments> = {};
    const attachmentsByCivilService: Record<string, typeof processedAttachments> = {};

    processedAttachments.forEach((att) => {
      if (att.trainingId) {
        if (!attachmentsByTraining[att.trainingId]) {
          attachmentsByTraining[att.trainingId] = [];
        }
        attachmentsByTraining[att.trainingId].push(att);
      }
      if (att.civilServiceId) {
        if (!attachmentsByCivilService[att.civilServiceId]) {
          attachmentsByCivilService[att.civilServiceId] = [];
        }
        attachmentsByCivilService[att.civilServiceId].push(att);
      }
    });

    // Validate critical data exists before returning
    if (!personalInfo) {
      return NextResponse.json(
        {
          error: 'Personal information is missing from this submission',
          details: 'This PDS submission cannot generate a PDF without personal information'
        },
        { status: 422 }
      );
    }

    if (!personalInfo.surname || !personalInfo.firstName || !personalInfo.dateOfBirth) {
      return NextResponse.json(
        {
          error: 'Critical fields missing from PDS submission',
          details: 'Name and birth date are required for PDF generation. Please complete the submission first.',
          missingFields: {
            surname: !personalInfo.surname,
            firstName: !personalInfo.firstName,
            dateOfBirth: !personalInfo.dateOfBirth
          }
        },
        { status: 422 }
      );
    }

    // Create audit log for viewing this submission
    await createAuditLog({
      userId: sessionUser.id,
      action: 'view_pds_submission',
      entityType: 'pds_submission',
      entityId: id,
      changes: {
        submissionId: id,
        employeeId: submission.employeeId,
        status: submission.status,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Transform to response format
    const response: PDSSubmissionDetail = {
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        reviewedBy: reviewedBy,
        reviewedAt: submission.approvedAt,
        reviewNotes: null, // Add this field to schema if needed
        rejectionReason: submission.rejectionReason,
        year: submission.year,
        version: submission.version,
      },
      employee: {
        id: submission.userId,
        employeeId: submission.employeeId,
        firstName: submission.firstName,
        lastName: submission.lastName,
        email: employeeEmail,
        avatarUrl: submission.avatarPath
          ? getProfilePicturePublicUrl(supabaseUrl, submission.avatarPath)
          : null,
        department: submission.departmentId
          ? {
              id: submission.departmentId,
              name: submission.departmentName || '',
              code: submission.departmentCode || '',
            }
          : null,
        position: submission.positionId
          ? {
              id: submission.positionId,
              title: submission.positionTitle || '',
            }
          : null,
      },
      // pdsData uses canonical flat field names (same as employee API)
      // This ensures transformPdsForPdf() works consistently across both portals
      pdsData: {
        personalInfo: personalInfo
          ? {
              surname: personalInfo.surname ?? undefined,
              firstName: personalInfo.firstName ?? undefined,
              middleName: personalInfo.middleName ?? undefined,
              nameExtension: personalInfo.nameExtension ?? undefined,
              dateOfBirth: personalInfo.dateOfBirth ?? undefined,
              placeOfBirth: personalInfo.placeOfBirth ?? undefined,
              sex: personalInfo.sex ?? undefined,
              civilStatus: personalInfo.civilStatus ?? undefined,
              heightM: personalInfo.heightM ?? undefined,
              weightKg: personalInfo.weightKg ?? undefined,
              bloodType: personalInfo.bloodType ?? undefined,
              gsisNo: personalInfo.gsisNo ?? undefined,
              pagibigNo: personalInfo.pagibigNo ?? undefined,
              philhealthNo: personalInfo.philhealthNo ?? undefined,
              sssNo: personalInfo.sssNo ?? undefined,
              tinNo: personalInfo.tinNo ?? undefined,
              agencyEmployeeNo: personalInfo.agencyEmployeeNo ?? undefined,
              philsysNo: personalInfo.philsysNo ?? undefined,
              citizenship: personalInfo.citizenship,
              residentialAddress: personalInfo.residentialAddress,
              permanentAddress: personalInfo.permanentAddress,
              telephoneNo: personalInfo.telephoneNo ?? undefined,
              mobileNo: personalInfo.mobileNo ?? undefined,
              emailAddress: personalInfo.emailAddress ?? undefined,
            }
          : null,
        // familyBackground: flat DB field names for PDF transform compatibility
        familyBackground: familyBackground
          ? {
              spouseSurname: familyBackground.spouseSurname ?? undefined,
              spouseFirstName: familyBackground.spouseFirstName ?? undefined,
              spouseMiddleName: familyBackground.spouseMiddleName ?? undefined,
              spouseNameExtension: familyBackground.spouseNameExtension ?? undefined,
              spouseOccupation: familyBackground.spouseOccupation ?? undefined,
              spouseEmployer: familyBackground.spouseEmployer ?? undefined,
              spouseBusinessAddress: familyBackground.spouseBusinessAddress ?? undefined,
              spouseTelephoneNo: familyBackground.spouseTelephoneNo ?? undefined,
              fatherSurname: familyBackground.fatherSurname ?? undefined,
              fatherFirstName: familyBackground.fatherFirstName ?? undefined,
              fatherMiddleName: familyBackground.fatherMiddleName ?? undefined,
              fatherNameExtension: familyBackground.fatherNameExtension ?? undefined,
              motherMaidenSurname: familyBackground.motherMaidenSurname ?? undefined,
              motherFirstName: familyBackground.motherFirstName ?? undefined,
              motherMiddleName: familyBackground.motherMiddleName ?? undefined,
            }
          : null,
        children: children.map((child) => ({
          fullName: child.fullName,
          dateOfBirth: child.dateOfBirth,
        })),
        education: education.map((edu) => ({
          id: edu.id,
          level: edu.level,
          schoolName: edu.schoolName,
          degreeCourse: edu.degreeCourse ?? undefined,
          periodFrom: edu.periodFrom ?? undefined,
          periodTo: edu.periodTo ?? undefined,
          highestLevelEarned: edu.highestLevelEarned ?? undefined,
          yearGraduated: edu.yearGraduated ?? undefined,
          honorsReceived: edu.honorsReceived ?? undefined,
        })),
        civilService: civilService.map((cs) => ({
          id: cs.id,
          eligibilityName: cs.eligibilityName ?? undefined,
          rating: cs.rating ? parseFloat(cs.rating) : null,
          dateOfExam: cs.dateOfExam ?? undefined,
          placeOfExam: cs.placeOfExam ?? undefined,
          licenseNo: cs.licenseNo ?? undefined,
          licenseValidityDate: cs.licenseValidityDate ?? undefined,
          attachments: attachmentsByCivilService[cs.id] || [],
        })),
        workExperience: workExperience.map((we) => ({
          id: we.id,
          positionTitle: we.positionTitle ?? undefined,
          departmentAgency: we.departmentAgency ?? undefined,
          monthlySalary: we.monthlySalary ?? undefined,
          salaryGrade: we.salaryGrade ?? undefined,
          statusOfAppointment: we.statusOfAppointment ?? undefined,
          isGovernment: we.isGovernment ?? undefined,
          dateFrom: we.dateFrom ?? undefined,
          dateTo: we.dateTo ?? undefined,
        })),
        voluntaryWork: voluntaryWork.map((vw) => ({
          id: vw.id,
          organizationName: vw.organizationName ?? undefined,
          organizationAddress: vw.organizationAddress ?? undefined,
          positionNature: vw.positionNature ?? undefined,
          dateFrom: vw.dateFrom ?? undefined,
          dateTo: vw.dateTo ?? undefined,
          numberOfHours: vw.numberOfHours ?? undefined,
        })),
        training: training.map((t) => ({
          id: t.id,
          title: t.title ?? undefined,
          dateFrom: t.dateFrom ?? undefined,
          dateTo: t.dateTo ?? undefined,
          hours: t.hours ?? undefined,
          typeOfLd: t.typeOfLd ?? undefined,
          conductedBy: t.conductedBy ?? undefined,
          attachments: attachmentsByTraining[t.id] || [],
        })),
        otherInfo: otherInfo
          ? {
              skills: otherInfo.skills,
              recognitions: otherInfo.recognitions,
              associations: otherInfo.associations,
              references: otherInfo.references,
              questions: otherInfo.questions,
              governmentId: otherInfo.governmentId,
            }
          : null,
      },
      previousVersions,
      auditTrail: auditTrail.map((log) => ({
        id: log.id,
        action: log.action,
        performedBy: `${log.firstName || ''} ${log.lastName || ''}`.trim() || 'System',
        performedAt: log.createdAt,
        details: log.changes as import('@tupsafe/types').AuditTrailDetails | undefined,
      })),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('PDS submission detail error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch PDS submission details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submissions/pds/[id]
 *
 * Admin-only permanent deletion of a PDS submission at any status.
 * Archives the full snapshot to the archives table before hard-deleting.
 * Post-commit: cleans up storage files (best-effort) and sends owner notification.
 *
 * Security:
 * - Requires admin or co_admin role (HR cannot delete)
 * - Cannot delete own submission
 * - Requires reason (10-500 chars) for audit trail
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verify admin/co_admin permissions — HR is explicitly excluded
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'co_admin'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or Co-Admin role required.' },
        { status: 403 }
      );
    }

    // 2. Get current session user
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // 3. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validated = deleteSubmissionSchema.parse(body);

    // 5. Fetch submission to get owner + employee name for self-check and notification
    const [submissionRow] = await db
      .select({
        userId: pdsSubmissions.userId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
      })
      .from(pdsSubmissions)
      .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
      .where(eq(pdsSubmissions.id, id))
      .limit(1);

    if (!submissionRow) {
      return NextResponse.json(
        { error: 'PDS submission not found' },
        { status: 404 }
      );
    }

    // 6. Prevent admin from deleting their own submission
    if (submissionRow.userId === sessionUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own submission' },
        { status: 403 }
      );
    }

    // 7. Execute transactional deletion and archival
    const { ownerUserId, pdfFilePath, attachmentPaths, snapshot } =
      await deletePDSSubmissionAsAdmin(id, sessionUser.id, validated.reason);

    const ipAddress =
      request.headers.get('x-forwarded-for') || undefined;
    const userAgent =
      request.headers.get('user-agent') || undefined;
    const now = new Date();

    // 8a. Audit log (best-effort — never throws)
    try {
      await createAuditLog({
        userId: sessionUser.id,
        action: 'admin_delete_pds_submission',
        entityType: 'pds_submission',
        entityId: id,
        changes: { reason: validated.reason, before: snapshot },
        ipAddress,
        userAgent,
      });
    } catch (auditError) {
      console.error('[DELETE /pds] Failed to create audit log:', auditError);
    }

    // 8b. Storage cleanup — PDF (best-effort)
    if (pdfFilePath) {
      try {
        await deletePdfFromStorage('pds-submissions', pdfFilePath);
      } catch (storageError) {
        console.error('[DELETE /pds] Failed to delete PDF from storage:', storageError);
      }
    }

    // 8c. Storage cleanup — attachments (best-effort, all in parallel)
    if (attachmentPaths.length > 0) {
      try {
        await Promise.allSettled(
          attachmentPaths.map((p) => deletePdfFromStorage('pds-submissions', p))
        );
      } catch (attachmentError) {
        console.error('[DELETE /pds] Failed to delete attachment(s) from storage:', attachmentError);
      }
    }

    // 8d. Owner notification (best-effort)
    try {
      const employeeName =
        submissionRow.firstName && submissionRow.lastName
          ? `${submissionRow.firstName} ${submissionRow.lastName}`
          : null;
      const notificationMessage = employeeName
        ? `Your PDS submission (for ${employeeName}) was deleted by an administrator. Reason: ${validated.reason}`
        : `Your PDS submission was deleted by an administrator. Reason: ${validated.reason}`;

      await db.insert(notifications).values({
        id: uuidv7(),
        userId: ownerUserId,
        type: 'submission_status',
        title: 'PDS Submission Deleted',
        message: notificationMessage,
        isRead: false,
        createdAt: now,
      });
    } catch (notifyError) {
      console.error('[DELETE /pds] Failed to insert notification:', notifyError);
    }

    const response: ApiSuccess<{ id: string }> = {
      success: true,
      message: 'PDS submission deleted successfully',
      data: { id },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[DELETE /pds] Error:', error);

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    // Handle known "not found" from query layer
    if (
      error instanceof Error &&
      error.message.includes('PDS submission not found')
    ) {
      return NextResponse.json(
        { error: 'PDS submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to delete PDS submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
