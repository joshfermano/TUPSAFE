/**
 * SALN Submission Detail API
 * GET /api/submissions/saln/[id]
 *
 * Retrieves complete details of a SALN submission for review
 *
 * Features:
 * - Complete SALN data across all sections
 * - Employee profile information
 * - Previous year's SALN for comparison
 * - Year-over-year net worth changes
 * - Audit trail and review history
 * - Optimized queries with joins
 *
 * Security:
 * - Requires admin or hr role
 * - Audit logging for access
 * - Cannot review own submissions
 *
 * @param {string} id - SALN submission ID (UUID)
 * @returns {SALNSubmissionDetail} Complete SALN submission details
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, getUserFromSupabase, createAdminClient, getProfilePicturePublicUrl } from '@tupsafe/auth/server';
import {
  db,
  profiles,
  departments,
  positions,
  salnSubmissions,
  salnRealProperties,
  salnPersonalProperties,
  salnLiabilities,
  salnBusinessInterests,
  salnRelativesInGov,
  notifications,
  auditLogs,
  deleteSALNSubmissionAsAdmin,
  deletePdfFromStorage,
} from '@tupsafe/database/server';
import { and, eq, desc, lt } from 'drizzle-orm';
import { createAuditLog } from '@tupsafe/database/utils/audit-log';
import { deleteSubmissionSchema, type ApiSuccess } from '@tupsafe/types';
import { v7 as uuidv7 } from 'uuid';
import type { SALNSubmissionDetail } from '@tupsafe/types';

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
        id: salnSubmissions.id,
        userId: salnSubmissions.userId,
        year: salnSubmissions.year,
        status: salnSubmissions.status,
        filingType: salnSubmissions.filingType,
        spouseName: salnSubmissions.spouseName,
        position: salnSubmissions.position,
        agency: salnSubmissions.agency,
        officeAddress: salnSubmissions.officeAddress,
        // 2025 SALN format fields
        complianceType: salnSubmissions.complianceType,
        complianceDate: salnSubmissions.complianceDate,
        hasMultipleMarriages: salnSubmissions.hasMultipleMarriages,
        previousSpouseNames: salnSubmissions.previousSpouseNames,
        spouseIsPublicOfficial: salnSubmissions.spouseIsPublicOfficial,
        spousePosition: salnSubmissions.spousePosition,
        spouseAgency: salnSubmissions.spouseAgency,
        spouseOfficeAddress: salnSubmissions.spouseOfficeAddress,
        unmarriedChildren: salnSubmissions.unmarriedChildren,
        hasNoBusinessInterests: salnSubmissions.hasNoBusinessInterests,
        hasNoRelativesInGov: salnSubmissions.hasNoRelativesInGov,
        governmentIdType: salnSubmissions.governmentIdType,
        governmentIdNumber: salnSubmissions.governmentIdNumber,
        governmentIdDateIssued: salnSubmissions.governmentIdDateIssued,
        governmentIdType2: salnSubmissions.governmentIdType2,
        governmentIdNumber2: salnSubmissions.governmentIdNumber2,
        governmentIdDateIssued2: salnSubmissions.governmentIdDateIssued2,
        declarantTin: salnSubmissions.declarantTin,
        spouseTin: salnSubmissions.spouseTin,
        spouseDateOfBirth: salnSubmissions.spouseDateOfBirth,
        salnFormatVersion: salnSubmissions.salnFormatVersion,
        submittedAt: salnSubmissions.submittedAt,
        approvedBy: salnSubmissions.approvedBy,
        approvedAt: salnSubmissions.approvedAt,
        rejectionReason: salnSubmissions.rejectionReason,
        reviewNotes: salnSubmissions.reviewNotes,
        totalAssets: salnSubmissions.totalAssets,
        totalLiabilities: salnSubmissions.totalLiabilities,
        netWorth: salnSubmissions.netWorth,
        employeeId: profiles.employeeId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        middleName: profiles.middleName,
        departmentId: profiles.departmentId,
        departmentName: departments.name,
        departmentCode: departments.code,
        positionId: profiles.positionId,
        positionTitle: positions.title,
        avatarPath: profiles.avatarPath,
      })
      .from(salnSubmissions)
      .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(positions, eq(profiles.positionId, positions.id))
      .where(eq(salnSubmissions.id, id))
      .limit(1);

    if (!submission) {
      return NextResponse.json({ error: 'SALN submission not found' }, { status: 404 });
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

    // Fetch all SALN sections in parallel
    const [
      realProperties,
      personalProperties,
      liabilities,
      businessInterests,
      relativesInGov,
      previousYearSaln,
      auditTrail,
    ] = await Promise.all([
      // Real Properties
      db
        .select()
        .from(salnRealProperties)
        .where(eq(salnRealProperties.salnSubmissionId, id)),

      // Personal Properties
      db
        .select()
        .from(salnPersonalProperties)
        .where(eq(salnPersonalProperties.salnSubmissionId, id)),

      // Liabilities
      db.select().from(salnLiabilities).where(eq(salnLiabilities.salnSubmissionId, id)),

      // Business Interests
      db
        .select()
        .from(salnBusinessInterests)
        .where(eq(salnBusinessInterests.salnSubmissionId, id)),

      // Relatives in Government
      db
        .select()
        .from(salnRelativesInGov)
        .where(eq(salnRelativesInGov.salnSubmissionId, id)),

      // Previous year's SALN for comparison
      db
        .select({
          id: salnSubmissions.id,
          year: salnSubmissions.year,
          netWorth: salnSubmissions.netWorth,
          status: salnSubmissions.status,
        })
        .from(salnSubmissions)
        .where(
          and(
            eq(salnSubmissions.userId, submission.userId),
            lt(salnSubmissions.year, submission.year),
            eq(salnSubmissions.status, 'approved')
          )
        )
        .orderBy(desc(salnSubmissions.year))
        .limit(1)
        .then((r) => r[0] || null),

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
            eq(auditLogs.entityType, 'saln_submission'),
            eq(auditLogs.entityId, id)
          )
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(20),
    ]);

    // Calculate year-over-year changes
    let previousYear = null;
    if (previousYearSaln && submission.netWorth && previousYearSaln.netWorth) {
      const currentNetWorth = parseFloat(submission.netWorth);
      const previousNetWorth = parseFloat(previousYearSaln.netWorth);
      const netWorthChange = currentNetWorth - previousNetWorth;
      const netWorthChangePercent =
        previousNetWorth !== 0 ? (netWorthChange / previousNetWorth) * 100 : 0;

      previousYear = {
        fiscalYear: previousYearSaln.year,
        netWorth: previousYearSaln.netWorth,
        netWorthChange: netWorthChange.toFixed(2),
        netWorthChangePercent: parseFloat(netWorthChangePercent.toFixed(2)),
      };
    }

    // Create audit log for viewing this submission
    await createAuditLog({
      userId: sessionUser.id,
      action: 'view_saln_submission',
      entityType: 'saln_submission',
      entityId: id,
      changes: {
        submissionId: id,
        employeeId: submission.employeeId,
        fiscalYear: submission.year,
        status: submission.status,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Get Supabase URL for profile picture URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // Transform to response format
    const response: SALNSubmissionDetail = {
      submission: {
        id: submission.id,
        fiscalYear: submission.year,
        status: submission.status,
        filingType: submission.filingType || 'separate',
        spouseName: submission.spouseName,
        position: submission.position,
        agency: submission.agency,
        officeAddress: submission.officeAddress,
        submittedAt: submission.submittedAt,
        reviewedBy: reviewedBy,
        reviewedAt: submission.approvedAt,
        reviewNotes: submission.reviewNotes,
        rejectionReason: submission.rejectionReason,
        netWorth: submission.netWorth || '0',
      },
      employee: {
        id: submission.userId,
        employeeId: submission.employeeId || null,
        firstName: submission.firstName,
        lastName: submission.lastName,
        middleName: submission.middleName,
        email: employeeEmail,
        avatarUrl: submission.avatarPath
          ? getProfilePicturePublicUrl(supabaseUrl, submission.avatarPath)
          : null,
        officeAddress: submission.officeAddress,
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
      // salnData uses canonical format consistent with employee API
      // Financial fields are converted to numbers for PDF compatibility
      salnData: {
        spouseName: submission.spouseName,
        // Transform real properties with number values for PDF
        realProperties: realProperties.map((prop) => ({
          id: prop.id,
          description: prop.description,
          kind: prop.kind,
          exactLocation: prop.exactLocation,
          assessedValue: prop.assessedValue ? parseFloat(prop.assessedValue) : 0,
          currentFairMarketValue: prop.currentFairMarketValue ? parseFloat(prop.currentFairMarketValue) : 0,
          acquisitionYear: prop.acquisitionYear,
          acquisitionMode: prop.acquisitionMode,
          acquisitionCost: prop.acquisitionCost ? parseFloat(prop.acquisitionCost) : 0,
          owner: prop.owner,
          childName: prop.childName,
        })),
        // Transform personal properties with number values for PDF
        personalProperties: personalProperties.map((prop) => ({
          id: prop.id,
          description: prop.description,
          yearAcquired: prop.yearAcquired,
          acquisitionCost: prop.acquisitionCost ? parseFloat(prop.acquisitionCost) : 0,
          owner: prop.owner,
          childName: prop.childName,
        })),
        // Transform liabilities with number values for PDF
        liabilities: liabilities.map((liability) => ({
          id: liability.id,
          nature: liability.nature,
          creditorName: liability.creditorName,
          outstandingBalance: liability.outstandingBalance ? parseFloat(liability.outstandingBalance) : 0,
          owner: liability.owner,
          childName: liability.childName,
        })),
        // Business interests - keep dates as strings
        businessInterests: businessInterests.map((interest) => ({
          id: interest.id,
          entityName: interest.entityName,
          businessAddress: interest.businessAddress,
          natureOfBusiness: interest.natureOfBusiness,
          dateOfAcquisition: interest.dateOfAcquisition,
          owner: interest.owner,
          childName: interest.childName,
        })),
        // Relatives in government - pass through
        relativesInGov: relativesInGov.map((relative) => ({
          id: relative.id,
          name: relative.name,
          relationship: relative.relationship,
          position: relative.position,
          agencyAddress: relative.agencyAddress,
        })),
        totalAssets: submission.totalAssets ? parseFloat(submission.totalAssets) : 0,
        totalLiabilities: submission.totalLiabilities ? parseFloat(submission.totalLiabilities) : 0,
        netWorth: submission.netWorth ? parseFloat(submission.netWorth) : 0,
        // 2025 SALN format fields for PDF generation
        complianceType: submission.complianceType,
        complianceDate: submission.complianceDate,
        hasMultipleMarriages: submission.hasMultipleMarriages,
        previousSpouseNames: submission.previousSpouseNames,
        spouseIsPublicOfficial: submission.spouseIsPublicOfficial,
        spousePosition: submission.spousePosition,
        spouseAgency: submission.spouseAgency,
        spouseOfficeAddress: submission.spouseOfficeAddress,
        unmarriedChildren: submission.unmarriedChildren,
        hasNoBusinessInterests: submission.hasNoBusinessInterests,
        hasNoRelativesInGov: submission.hasNoRelativesInGov,
        governmentIdType: submission.governmentIdType,
        governmentIdNumber: submission.governmentIdNumber,
        governmentIdDateIssued: submission.governmentIdDateIssued,
        governmentIdType2: submission.governmentIdType2,
        governmentIdNumber2: submission.governmentIdNumber2,
        governmentIdDateIssued2: submission.governmentIdDateIssued2,
        declarantTin: submission.declarantTin,
        spouseTin: submission.spouseTin,
        spouseDateOfBirth: submission.spouseDateOfBirth,
        salnFormatVersion: submission.salnFormatVersion,
      },
      previousYear,
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
    console.error('SALN submission detail error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch SALN submission details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submissions/saln/[id]
 *
 * Admin-only permanent deletion of a SALN submission at any status.
 * Archives the full snapshot to the archives table before hard-deleting.
 * Post-commit: cleans up storage file (best-effort) and sends owner notification.
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
        userId: salnSubmissions.userId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
      })
      .from(salnSubmissions)
      .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
      .where(eq(salnSubmissions.id, id))
      .limit(1);

    if (!submissionRow) {
      return NextResponse.json(
        { error: 'SALN submission not found' },
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
    const { ownerUserId, pdfFilePath, snapshot } =
      await deleteSALNSubmissionAsAdmin(id, sessionUser.id, validated.reason);

    const ipAddress =
      request.headers.get('x-forwarded-for') || undefined;
    const userAgent =
      request.headers.get('user-agent') || undefined;
    const now = new Date();

    // 8a. Audit log (best-effort — never throws)
    try {
      await createAuditLog({
        userId: sessionUser.id,
        action: 'admin_delete_saln_submission',
        entityType: 'saln_submission',
        entityId: id,
        changes: { reason: validated.reason, before: snapshot },
        ipAddress,
        userAgent,
      });
    } catch (auditError) {
      console.error('[DELETE /saln] Failed to create audit log:', auditError);
    }

    // 8b. Storage cleanup — PDF (best-effort)
    if (pdfFilePath) {
      try {
        await deletePdfFromStorage('saln-submissions', pdfFilePath);
      } catch (storageError) {
        console.error('[DELETE /saln] Failed to delete PDF from storage:', storageError);
      }
    }

    // 8c. Owner notification (best-effort)
    try {
      const employeeName =
        submissionRow.firstName && submissionRow.lastName
          ? `${submissionRow.firstName} ${submissionRow.lastName}`
          : null;
      const notificationMessage = employeeName
        ? `Your SALN submission (for ${employeeName}) was deleted by an administrator. Reason: ${validated.reason}`
        : `Your SALN submission was deleted by an administrator. Reason: ${validated.reason}`;

      await db.insert(notifications).values({
        id: uuidv7(),
        userId: ownerUserId,
        type: 'submission_status',
        title: 'SALN Submission Deleted',
        message: notificationMessage,
        isRead: false,
        createdAt: now,
      });
    } catch (notifyError) {
      console.error('[DELETE /saln] Failed to insert notification:', notifyError);
    }

    const response: ApiSuccess<{ id: string }> = {
      success: true,
      message: 'SALN submission deleted successfully',
      data: { id },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[DELETE /saln] Error:', error);

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
      error.message.includes('SALN submission not found')
    ) {
      return NextResponse.json(
        { error: 'SALN submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to delete SALN submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
