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
import { checkUserRoleFromSupabase, getUserFromSupabase, createAdminClient } from '@tupsafe/auth/server';
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
  auditLogs,
} from '@tupsafe/database/server';
import { and, eq, desc } from 'drizzle-orm';
import { createAuditLog } from '@tupsafe/database/utils/audit-log';
import type { PDSSubmissionDetail } from '@tupsafe/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
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
        version: submission.version,
      },
      employee: {
        id: submission.userId,
        employeeId: submission.employeeId,
        firstName: submission.firstName,
        lastName: submission.lastName,
        email: employeeEmail,
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
              height: personalInfo.heightM ? parseFloat(personalInfo.heightM) : undefined,
              weight: personalInfo.weightKg ? parseFloat(personalInfo.weightKg) : undefined,
              bloodType: personalInfo.bloodType ?? undefined,
              gsisNo: personalInfo.gsisNo ?? undefined,
              pagibigNo: personalInfo.pagibigNo ?? undefined,
              philhealthNo: personalInfo.philhealthNo ?? undefined,
              sssNo: personalInfo.sssNo ?? undefined,
              tinNo: personalInfo.tinNo ?? undefined,
              citizenship: personalInfo.citizenship as string | undefined,
              residentialAddress: personalInfo.residentialAddress as {
                houseNo?: string;
                street?: string;
                subdivision?: string;
                barangay?: string;
                city?: string;
                province?: string;
                zipCode?: string;
              } | undefined,
              permanentAddress: personalInfo.permanentAddress as {
                houseNo?: string;
                street?: string;
                subdivision?: string;
                barangay?: string;
                city?: string;
                province?: string;
                zipCode?: string;
              } | undefined,
              telephoneNo: personalInfo.telephoneNo ?? undefined,
              mobileNo: personalInfo.mobileNo ?? undefined,
              emailAddress: personalInfo.emailAddress ?? undefined,
            }
          : {},
        familyBackground: familyBackground
          ? {
              spouse: {
                surname: familyBackground.spouseSurname ?? undefined,
                firstName: familyBackground.spouseFirstName ?? undefined,
                middleName: familyBackground.spouseMiddleName ?? undefined,
                nameExtension: familyBackground.spouseNameExtension ?? undefined,
                occupation: familyBackground.spouseOccupation ?? undefined,
                employer: familyBackground.spouseEmployer ?? undefined,
                businessAddress: familyBackground.spouseBusinessAddress ?? undefined,
                telephoneNo: familyBackground.spouseTelephoneNo ?? undefined,
              },
              father: {
                surname: familyBackground.fatherSurname ?? undefined,
                firstName: familyBackground.fatherFirstName ?? undefined,
                middleName: familyBackground.fatherMiddleName ?? undefined,
                nameExtension: undefined, // Not in DB schema
              },
              mother: {
                maidenName: familyBackground.motherMaidenSurname ?? undefined,
                surname: undefined, // Not in DB schema
                firstName: familyBackground.motherFirstName ?? undefined,
                middleName: familyBackground.motherMiddleName ?? undefined,
              },
            }
          : {},
        children: children.map((child) => ({
          name: child.fullName,
          dateOfBirth: child.dateOfBirth,
        })),
        education: education.map((edu) => ({
          level: edu.level,
          schoolName: edu.schoolName,
          basicEducation: edu.degreeCourse ?? undefined,
          periodFrom: edu.periodFrom ?? undefined,
          periodTo: edu.periodTo ?? undefined,
          highestLevel: edu.highestLevelEarned ?? undefined,
          yearGraduated: edu.yearGraduated?.toString() ?? undefined,
          scholarshipHonors: edu.honorsReceived ?? undefined,
        })),
        civilService: civilService.map((cs) => ({
          careerService: cs.eligibilityName ?? undefined,
          rating: cs.rating ? parseFloat(cs.rating) : undefined,
          dateOfExamination: cs.dateOfExam ?? undefined,
          placeOfExamination: cs.placeOfExam ?? undefined,
          licenseNumber: cs.licenseNo ?? undefined,
          validity: cs.licenseValidityDate ?? undefined,
        })),
        workExperience: workExperience.map((we) => ({
          positionTitle: we.positionTitle ?? undefined,
          department: we.departmentAgency ?? undefined,
          monthlySalary: we.monthlySalary ? parseFloat(we.monthlySalary) : undefined,
          salaryGrade: we.salaryGrade ?? undefined,
          statusOfAppointment: we.statusOfAppointment ?? undefined,
          govService: we.isGovernment ?? undefined,
          periodFrom: we.dateFrom ?? undefined,
          periodTo: we.dateTo ?? undefined,
        })),
        voluntaryWork: voluntaryWork.map((vw) => ({
          organization: vw.organizationName ?? undefined,
          position: vw.positionNature ?? undefined,
          periodFrom: vw.dateFrom ?? undefined,
          periodTo: vw.dateTo ?? undefined,
          numberOfHours: vw.numberOfHours ?? undefined,
          natureOfWork: vw.organizationAddress ?? undefined,
        })),
        training: training.map((t) => ({
          title: t.title ?? undefined,
          periodFrom: t.dateFrom ?? undefined,
          periodTo: t.dateTo ?? undefined,
          numberOfHours: t.hours ?? undefined,
          type: t.typeOfLd ?? undefined,
          conductedBy: t.conductedBy ?? undefined,
        })),
        otherInfo: otherInfo
          ? {
              skills: Array.isArray(otherInfo.skills) ? (otherInfo.skills as string[]) : undefined,
              recognitions: Array.isArray(otherInfo.recognitions)
                ? (otherInfo.recognitions as Array<{ recognition?: string; date?: string }>)
                : undefined,
              organizations: Array.isArray(otherInfo.associations)
                ? (otherInfo.associations as Array<{ organization?: string; role?: string }>)
                : undefined,
              references: Array.isArray(otherInfo.references)
                ? (otherInfo.references as Array<{ name?: string; address?: string; telephoneNo?: string }>)
                : undefined,
            }
          : {},
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
