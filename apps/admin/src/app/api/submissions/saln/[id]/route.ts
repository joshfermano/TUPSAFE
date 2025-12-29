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
  auditLogs,
} from '@tupsafe/database/server';
import { and, eq, desc, lt } from 'drizzle-orm';
import { createAuditLog } from '@tupsafe/database/utils/audit-log';
import type { SALNSubmissionDetail } from '@tupsafe/types';

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
        id: salnSubmissions.id,
        userId: salnSubmissions.userId,
        year: salnSubmissions.year,
        status: salnSubmissions.status,
        filingType: salnSubmissions.filingType,
        spouseName: salnSubmissions.spouseName,
        position: salnSubmissions.position,
        agency: salnSubmissions.agency,
        officeAddress: salnSubmissions.officeAddress,
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
      salnData: {
        spouseName: submission.spouseName,
        realProperties,
        personalProperties,
        liabilities,
        businessInterests,
        relativesInGov,
        totalAssets: submission.totalAssets || '0',
        totalLiabilities: submission.totalLiabilities || '0',
        netWorth: submission.netWorth || '0',
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
