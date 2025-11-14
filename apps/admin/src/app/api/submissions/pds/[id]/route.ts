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
import { checkUserRole, getSessionUser, createAdminClient } from '@tupsafe/auth/server';
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
    const hasPermission = await checkUserRole(['admin', 'hr']);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user for audit logging
    const sessionUser = await getSessionUser();
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
        personalInfo,
        familyBackground,
        children,
        education,
        civilService,
        workExperience,
        voluntaryWork,
        training,
        otherInfo,
      },
      previousVersions,
      auditTrail: auditTrail.map((log) => ({
        id: log.id,
        action: log.action,
        performedBy: `${log.firstName || ''} ${log.lastName || ''}`.trim() || 'System',
        performedAt: log.createdAt,
        details: log.changes,
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
