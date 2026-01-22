/**
 * Submission Statistics API
 * GET /api/submissions/stats
 *
 * Provides comprehensive analytics for submission management dashboard
 *
 * Features:
 * - Pending review counts (submitted + reviewing)
 * - Approved/rejected counts (this week, this month)
 * - Average review time calculation
 * - Breakdown by submission type (PDS, SALN)
 * - Department-level statistics
 * - Upcoming deadlines with compliance tracking
 * - Overall compliance rate
 * - Optimized parallel queries for performance
 *
 * Security:
 * - Requires admin or hr role
 * - No sensitive data exposed
 *
 * @returns {SubmissionStatsResponse} Comprehensive submission statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  profiles,
  departments,
  pdsSubmissions,
  salnSubmissions,
  submissionDeadlines,
} from '@tupsafe/database/server';
import { eq, and, gte, count, sql, desc } from 'drizzle-orm';
import type { SubmissionStatsResponse } from '@tupsafe/types';

export async function GET(_request: NextRequest) {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for optimal performance
    const [
      // PDS counts by status
      pdsSubmittedCount,
      pdsReviewingCount,
      pdsApprovedCount,
      pdsRejectedCount,
      pdsApprovedThisWeek,
      pdsApprovedThisMonth,
      pdsRejectedThisWeek,
      pdsRejectedThisMonth,

      // SALN counts by status
      salnSubmittedCount,
      salnReviewingCount,
      salnApprovedCount,
      salnRejectedCount,
      salnApprovedThisWeek,
      salnApprovedThisMonth,
      salnRejectedThisWeek,
      salnRejectedThisMonth,

      // Average review time for PDS
      pdsAvgReviewTime,

      // Average review time for SALN
      salnAvgReviewTime,

      // Department statistics
      departmentStats,

      // Upcoming deadlines
      upcomingDeadlines,

      // Total active employees (for compliance rate)
      totalActiveEmployees,
    ] = await Promise.all([
      // PDS status counts
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.status, 'submitted'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.status, 'reviewing'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.status, 'approved'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.status, 'rejected'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.status, 'approved'),
            gte(pdsSubmissions.approvedAt, weekAgo)
          )
        )
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.status, 'approved'),
            gte(pdsSubmissions.approvedAt, monthAgo)
          )
        )
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.status, 'rejected'),
            gte(pdsSubmissions.approvedAt, weekAgo)
          )
        )
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.status, 'rejected'),
            gte(pdsSubmissions.approvedAt, monthAgo)
          )
        )
        .then((r) => r[0]?.count || 0),

      // SALN status counts
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'submitted'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'reviewing'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'approved'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'rejected'))
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(
          and(
            eq(salnSubmissions.status, 'approved'),
            gte(salnSubmissions.approvedAt, weekAgo)
          )
        )
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(
          and(
            eq(salnSubmissions.status, 'approved'),
            gte(salnSubmissions.approvedAt, monthAgo)
          )
        )
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(
          and(
            eq(salnSubmissions.status, 'rejected'),
            gte(salnSubmissions.approvedAt, weekAgo)
          )
        )
        .then((r) => r[0]?.count || 0),
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(
          and(
            eq(salnSubmissions.status, 'rejected'),
            gte(salnSubmissions.approvedAt, monthAgo)
          )
        )
        .then((r) => r[0]?.count || 0),

      // Average review time for PDS (in hours)
      db
        .select({
          avgHours: sql<number>`
            AVG(EXTRACT(EPOCH FROM (${pdsSubmissions.approvedAt} - ${pdsSubmissions.submittedAt})) / 3600)
          `,
        })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.status, 'approved'),
            sql`${pdsSubmissions.submittedAt} IS NOT NULL`,
            sql`${pdsSubmissions.approvedAt} IS NOT NULL`
          )
        )
        .then((r) => r[0]?.avgHours || 0),

      // Average review time for SALN (in hours)
      db
        .select({
          avgHours: sql<number>`
            AVG(EXTRACT(EPOCH FROM (${salnSubmissions.approvedAt} - ${salnSubmissions.submittedAt})) / 3600)
          `,
        })
        .from(salnSubmissions)
        .where(
          and(
            eq(salnSubmissions.status, 'approved'),
            sql`${salnSubmissions.submittedAt} IS NOT NULL`,
            sql`${salnSubmissions.approvedAt} IS NOT NULL`
          )
        )
        .then((r) => r[0]?.avgHours || 0),

      // Department-level statistics
      db
        .select({
          departmentId: profiles.departmentId,
          departmentName: departments.name,
          pdsPending: sql<number>`
            COUNT(DISTINCT CASE
              WHEN ${pdsSubmissions.status} IN ('submitted', 'reviewing')
              THEN ${pdsSubmissions.userId}
            END)
          `,
          pdsApproved: sql<number>`
            COUNT(DISTINCT CASE
              WHEN ${pdsSubmissions.status} = 'approved'
              THEN ${pdsSubmissions.userId}
            END)
          `,
          pdsRejected: sql<number>`
            COUNT(DISTINCT CASE
              WHEN ${pdsSubmissions.status} = 'rejected'
              THEN ${pdsSubmissions.userId}
            END)
          `,
          salnPending: sql<number>`
            COUNT(DISTINCT CASE
              WHEN ${salnSubmissions.status} IN ('submitted', 'reviewing')
              THEN ${salnSubmissions.userId}
            END)
          `,
          salnApproved: sql<number>`
            COUNT(DISTINCT CASE
              WHEN ${salnSubmissions.status} = 'approved'
              THEN ${salnSubmissions.userId}
            END)
          `,
          salnRejected: sql<number>`
            COUNT(DISTINCT CASE
              WHEN ${salnSubmissions.status} = 'rejected'
              THEN ${salnSubmissions.userId}
            END)
          `,
        })
        .from(departments)
        .leftJoin(profiles, eq(departments.id, profiles.departmentId))
        .leftJoin(pdsSubmissions, eq(profiles.id, pdsSubmissions.userId))
        .leftJoin(salnSubmissions, eq(profiles.id, salnSubmissions.userId))
        .where(eq(departments.isActive, true))
        .groupBy(profiles.departmentId, departments.name)
        .orderBy(desc(departments.name)),

      // Upcoming deadlines
      db
        .select()
        .from(submissionDeadlines)
        .where(
          and(
            eq(submissionDeadlines.isActive, true),
            gte(submissionDeadlines.deadlineDate, now.toISOString().split('T')[0])
          )
        )
        .orderBy(submissionDeadlines.deadlineDate)
        .limit(5),

      // Total active employees for compliance calculation
      db
        .select({ count: count() })
        .from(profiles)
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.isActive, true),
            eq(profiles.accountStatus, 'active')
          )
        )
        .then((r) => r[0]?.count || 0),
    ]);

    // Calculate average review time (combined PDS and SALN)
    const combinedAvgReviewHours =
      (pdsAvgReviewTime + salnAvgReviewTime) / (pdsAvgReviewTime && salnAvgReviewTime ? 2 : 1);
    const avgReviewDays = combinedAvgReviewHours / 24;
    const averageReviewTime =
      avgReviewDays >= 1
        ? `${avgReviewDays.toFixed(1)} days`
        : `${combinedAvgReviewHours.toFixed(1)} hours`;

    // Calculate compliance rate (approved submissions / total employees)
    const totalApprovedSubmissions = pdsApprovedCount + salnApprovedCount;
    const complianceRate =
      totalActiveEmployees > 0
        ? Math.round((totalApprovedSubmissions / totalActiveEmployees) * 100)
        : 0;

    // Transform department stats
    const byDepartment = departmentStats
      .filter((d) => d.departmentId)
      .map((d) => ({
        departmentId: d.departmentId!,
        departmentName: d.departmentName || 'Unknown',
        pending: Number(d.pdsPending) + Number(d.salnPending),
        approved: Number(d.pdsApproved) + Number(d.salnApproved),
        rejected: Number(d.pdsRejected) + Number(d.salnRejected),
      }));

    // Transform upcoming deadlines
    const transformedDeadlines = upcomingDeadlines.map((d) => {
      const deadlineDate = new Date(d.deadlineDate);
      const daysRemaining = Math.ceil(
        (deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      return {
        type: d.formType as 'pds' | 'saln',
        deadline: deadlineDate,
        daysRemaining,
        submitted: d.formType === 'pds' ? pdsSubmittedCount : salnSubmittedCount,
        total: totalActiveEmployees,
      };
    });

    // Build response
    const response: SubmissionStatsResponse = {
      pending: {
        total: pdsSubmittedCount + pdsReviewingCount + salnSubmittedCount + salnReviewingCount,
        pds: pdsSubmittedCount + pdsReviewingCount,
        saln: salnSubmittedCount + salnReviewingCount,
      },
      approved: {
        thisWeek: pdsApprovedThisWeek + salnApprovedThisWeek,
        thisMonth: pdsApprovedThisMonth + salnApprovedThisMonth,
      },
      rejected: {
        thisWeek: pdsRejectedThisWeek + salnRejectedThisWeek,
        thisMonth: pdsRejectedThisMonth + salnRejectedThisMonth,
      },
      averageReviewTime,
      byType: {
        pds: {
          total:
            pdsSubmittedCount + pdsReviewingCount + pdsApprovedCount + pdsRejectedCount,
          submitted: pdsSubmittedCount,
          reviewing: pdsReviewingCount,
          approved: pdsApprovedCount,
          rejected: pdsRejectedCount,
        },
        saln: {
          total:
            salnSubmittedCount +
            salnReviewingCount +
            salnApprovedCount +
            salnRejectedCount,
          submitted: salnSubmittedCount,
          reviewing: salnReviewingCount,
          approved: salnApprovedCount,
          rejected: salnRejectedCount,
        },
      },
      byDepartment,
      upcomingDeadlines: transformedDeadlines,
      complianceRate,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Submission stats error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch submission statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
