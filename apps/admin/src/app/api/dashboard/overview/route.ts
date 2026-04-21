import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '../../../../lib/api-helpers';
import { db } from '@tupsafe/database/server';
import {
  profiles,
  pendingRegistrations,
  pdsSubmissions,
  salnSubmissions,
  auditLogs,
} from '@tupsafe/database/schema';
import { eq, and, gte, lt, sql, desc, count, avg } from 'drizzle-orm';
import type { DashboardOverviewResponse } from '@tupsafe/types';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { computeComplianceRates } from '../../../../lib/compliance';

export const dynamic = 'force-dynamic';

/** Overall handler timeout (ms) — returns a structured JSON error before
 *  Nginx's default 60s proxy_read_timeout fires. */
const HANDLER_TIMEOUT_MS = 30_000;

/** Zeroed skeleton used when the DB is slow/flaky so the dashboard still
 *  renders "—" rather than white-screening. */
function buildFallbackOverview(): DashboardOverviewResponse {
  return {
    users: {
      total: 0,
      employees: 0,
      applicants: 0,
      activeLastMonth: 0,
      newThisWeek: 0,
      newThisMonth: 0,
      growth: { value: 0, trend: 'stable' },
    },
    registrations: {
      pending: 0,
      approvedThisWeek: 0,
      approvedThisMonth: 0,
      rejectedThisMonth: 0,
      averageApprovalTime: '0.0 hours',
    },
    submissions: {
      pending: { pds: 0, saln: 0, total: 0 },
      approvedThisWeek: 0,
      approvedThisMonth: 0,
      complianceRate: 0,
    },
    compliance: {
      pds: { submitted: 0, expected: 0, rate: 0, overdue: 0 },
      saln: { submitted: 0, expected: 0, rate: 0, overdue: 0 },
    },
    recentActivity: [],
    alerts: [],
  };
}
/**
 * GET /api/dashboard/overview
 *
 * Main dashboard analytics endpoint providing real-time insights
 *
 * Features:
 * - User growth metrics (total, new, active)
 * - Registration workflow status
 * - Submission compliance tracking
 * - Recent activity feed
 * - Alert notifications
 *
 * Caching: 5 minutes (s-maxage=300)
 * Performance: Parallel query execution
 */
export async function GET(_request: NextRequest) {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');

    if (!hasPermission) {
      return apiError('Unauthorized. Admin, Co-Admin, or HR role required.', 403);
    }

    // Date ranges for metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for performance, racing against a
    // handler-level timeout so one slow query cannot hold the whole response
    // past Nginx's proxy_read_timeout.
    const workPromise = Promise.all([
      // Total users by type
      db
        .select({
          userType: profiles.userType,
          count: sql<number>`COUNT(*)`,
        })
        .from(profiles)
        .where(eq(profiles.accountStatus, 'active'))
        .groupBy(profiles.userType),

      // Active users (active account status)
      db
        .select({ count: count() })
        .from(profiles)
        .where(eq(profiles.accountStatus, 'active')),

      // New users this week
      db
        .select({ count: count() })
        .from(profiles)
        .where(gte(profiles.createdAt, oneWeekAgo)),

      // New users this month
      db
        .select({ count: count() })
        .from(profiles)
        .where(gte(profiles.createdAt, oneMonthAgo)),

      // Previous month users (for growth calculation)
      db
        .select({ count: count() })
        .from(profiles)
        .where(
          and(
            gte(profiles.createdAt, twoMonthsAgo),
            lt(profiles.createdAt, oneMonthAgo)
          )
        ),

      // Pending registrations
      db
        .select({ count: count() })
        .from(pendingRegistrations)
        .where(eq(pendingRegistrations.status, 'pending')),

      // Approved registrations this week
      db
        .select({ count: count() })
        .from(pendingRegistrations)
        .where(
          and(
            eq(pendingRegistrations.status, 'approved'),
            gte(pendingRegistrations.approvedAt, oneWeekAgo)
          )
        ),

      // Approved registrations this month
      db
        .select({ count: count() })
        .from(pendingRegistrations)
        .where(
          and(
            eq(pendingRegistrations.status, 'approved'),
            gte(pendingRegistrations.approvedAt, oneMonthAgo)
          )
        ),

      // Rejected registrations this month
      db
        .select({ count: count() })
        .from(pendingRegistrations)
        .where(
          and(
            eq(pendingRegistrations.status, 'rejected'),
            gte(pendingRegistrations.rejectedAt, oneMonthAgo)
          )
        ),

      // Average approval time (in hours)
      db
        .select({
          avgHours: avg(
            sql<number>`EXTRACT(EPOCH FROM (${pendingRegistrations.approvedAt} - ${pendingRegistrations.createdAt})) / 3600`
          ),
        })
        .from(pendingRegistrations)
        .where(
          and(
            eq(pendingRegistrations.status, 'approved'),
            gte(pendingRegistrations.approvedAt, oneMonthAgo)
          )
        ),

      // Pending PDS submissions (includes both 'submitted' and 'reviewing' statuses)
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(sql`${pdsSubmissions.status} IN ('submitted', 'reviewing')`),

      // Pending SALN submissions (includes both 'submitted' and 'reviewing' statuses)
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(sql`${salnSubmissions.status} IN ('submitted', 'reviewing')`),

      // Approved submissions this week (PDS + SALN)
      Promise.all([
        db
          .select({ count: count() })
          .from(pdsSubmissions)
          .where(
            and(
              eq(pdsSubmissions.status, 'approved'),
              gte(pdsSubmissions.approvedAt, oneWeekAgo)
            )
          ),
        db
          .select({ count: count() })
          .from(salnSubmissions)
          .where(
            and(
              eq(salnSubmissions.status, 'approved'),
              gte(salnSubmissions.approvedAt, oneWeekAgo)
            )
          ),
      ]),

      // Approved submissions this month
      Promise.all([
        db
          .select({ count: count() })
          .from(pdsSubmissions)
          .where(
            and(
              eq(pdsSubmissions.status, 'approved'),
              gte(pdsSubmissions.approvedAt, oneMonthAgo)
            )
          ),
        db
          .select({ count: count() })
          .from(salnSubmissions)
          .where(
            and(
              eq(salnSubmissions.status, 'approved'),
              gte(salnSubmissions.approvedAt, oneMonthAgo)
            )
          ),
      ]),

      // Centralized compliance rates — see apps/admin/src/lib/compliance.ts
      computeComplianceRates(undefined, now),

      // Recent activity (last 10 events)
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          userId: auditLogs.userId,
          changes: auditLogs.changes,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(10),
    ]);

    const timeoutPromise = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), HANDLER_TIMEOUT_MS)
    );

    const raced = await Promise.race([workPromise, timeoutPromise]);
    if (raced === 'timeout') {
      console.error(
        '[Dashboard Overview] handler timed out after %dms',
        HANDLER_TIMEOUT_MS
      );
      return NextResponse.json(buildFallbackOverview(), {
        status: 200,
        headers: { 'Cache-Control': 'no-store', 'X-Partial-Data': '1' },
      });
    }

    const [
      userStats,
      activeUsers,
      newUsersWeek,
      newUsersMonth,
      previousMonthUsers,
      pendingRegs,
      approvedRegsWeek,
      approvedRegsMonth,
      rejectedRegsMonth,
      avgApprovalTime,
      pendingPDS,
      pendingSALN,
      approvedSubmissionsWeek,
      approvedSubmissionsMonth,
      complianceRates,
      recentActivity,
    ] = raced;

    // Process user statistics
    const usersByType = userStats.reduce(
      (acc, row) => {
        acc[row.userType] = Number(row.count);
        return acc;
      },
      { employee: 0, applicant: 0 } as Record<string, number>
    );

    const totalUsers = usersByType.employee + usersByType.applicant;
    const newThisMonth = newUsersMonth[0]?.count ?? 0;
    const previousMonth = previousMonthUsers[0]?.count ?? 0;
    const growthValue =
      previousMonth > 0
        ? ((newThisMonth - previousMonth) / previousMonth) * 100
        : 0;

    // Calculate average approval time
    const avgHours = Number(avgApprovalTime[0]?.avgHours ?? 0);
    const avgDays = avgHours / 24;
    const averageApprovalTime =
      avgDays < 1
        ? `${avgHours.toFixed(1)} hours`
        : `${avgDays.toFixed(1)} days`;

    // Pull canonical compliance rates from the centralized helper. Both PDS and
    // SALN share the same denominator (active, non-applicant employees), so
    // expose it under both `pdsExpected` and `salnExpected` for the response
    // shape that downstream widgets already consume.
    const {
      expected: complianceExpected,
      pdsSubmitted,
      salnSubmitted: salnSubmittedCount,
      pdsRate,
      salnRate,
      overallRate: overallComplianceRate,
    } = complianceRates;
    const pdsExpected = complianceExpected;
    const salnExpected = complianceExpected;

    // Calculate overall compliance
    const totalPendingSubmissions =
      (pendingPDS[0]?.count ?? 0) + (pendingSALN[0]?.count ?? 0);
    const totalApprovedWeek =
      (approvedSubmissionsWeek[0][0]?.count ?? 0) +
      (approvedSubmissionsWeek[1][0]?.count ?? 0);
    const totalApprovedMonth =
      (approvedSubmissionsMonth[0][0]?.count ?? 0) +
      (approvedSubmissionsMonth[1][0]?.count ?? 0);

    // Generate alerts based on metrics
    const alerts: DashboardOverviewResponse['alerts'] = [];

    if (pendingRegs[0]?.count > 10) {
      alerts.push({
        id: 'pending-registrations',
        type: 'warning',
        title: 'Pending Registrations',
        message: `${pendingRegs[0].count} registration requests awaiting review`,
        count: pendingRegs[0].count,
        action: {
          label: 'Review Now',
          url: '/dashboard/registrations',
        },
      });
    }

    if (totalPendingSubmissions > 20) {
      alerts.push({
        id: 'pending-submissions',
        type: 'warning',
        title: 'Pending Submissions',
        message: `${totalPendingSubmissions} PDS/SALN submissions awaiting review`,
        count: totalPendingSubmissions,
        action: {
          label: 'Review Submissions',
          url: '/dashboard/submissions',
        },
      });
    }

    if (pdsRate < 70) {
      alerts.push({
        id: 'low-pds-compliance',
        type: 'error',
        title: 'Low PDS Compliance',
        message: `Only ${pdsRate.toFixed(1)}% of employees have submitted PDS`,
        action: {
          label: 'View Submissions',
          url: '/dashboard/submissions/pds',
        },
      });
    }

    if (salnRate < 70) {
      alerts.push({
        id: 'low-saln-compliance',
        type: 'error',
        title: 'Low SALN Compliance',
        message: `Only ${salnRate.toFixed(
          1
        )}% of employees have submitted SALN for ${now.getFullYear()}`,
        action: {
          label: 'View Submissions',
          url: '/dashboard/submissions/saln',
        },
      });
    }

    // Map recent activity to user-friendly format
    const recentActivityMapped = recentActivity.map((log) => ({
      id: log.id,
      type: mapActionToType(log.action),
      description: generateActivityDescription(log),
      timestamp: log.createdAt,
    }));

    // Construct response
    const response: DashboardOverviewResponse = {
      users: {
        total: totalUsers,
        employees: usersByType.employee,
        applicants: usersByType.applicant,
        activeLastMonth: activeUsers[0]?.count ?? 0,
        newThisWeek: newUsersWeek[0]?.count ?? 0,
        newThisMonth: newThisMonth,
        growth: {
          value: Math.abs(growthValue),
          trend: growthValue > 5 ? 'up' : growthValue < -5 ? 'down' : 'stable',
        },
      },
      registrations: {
        pending: pendingRegs[0]?.count ?? 0,
        approvedThisWeek: approvedRegsWeek[0]?.count ?? 0,
        approvedThisMonth: approvedRegsMonth[0]?.count ?? 0,
        rejectedThisMonth: rejectedRegsMonth[0]?.count ?? 0,
        averageApprovalTime,
      },
      submissions: {
        pending: {
          pds: pendingPDS[0]?.count ?? 0,
          saln: pendingSALN[0]?.count ?? 0,
          total: totalPendingSubmissions,
        },
        approvedThisWeek: totalApprovedWeek,
        approvedThisMonth: totalApprovedMonth,
        complianceRate: overallComplianceRate,
      },
      compliance: {
        pds: {
          submitted: pdsSubmitted,
          expected: pdsExpected,
          rate: pdsRate,
          overdue: pdsExpected - pdsSubmitted,
        },
        saln: {
          submitted: salnSubmittedCount,
          expected: salnExpected,
          rate: salnRate,
          overdue: salnExpected - salnSubmittedCount,
        },
      },
      recentActivity: recentActivityMapped,
      alerts,
    };

    // Cache for 5 minutes
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[Dashboard Overview] Error:', error);
    // Return a zeroed skeleton so the dashboard shows "—" rather than an
    // "Application error" white screen. The unused apiError helper import is
    // retained for future non-dashboard routes.
    void apiError;
    return NextResponse.json(buildFallbackOverview(), {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'X-Partial-Data': '1' },
    });
  }
}

/**
 * Maps audit log action to activity type
 */
function mapActionToType(
  action: string
): DashboardOverviewResponse['recentActivity'][0]['type'] {
  if (action.includes('user_created') || action.includes('user.created')) {
    return 'user_created';
  }
  if (
    action.includes('registration_approved') ||
    action.includes('registration.approved')
  ) {
    return 'registration_approved';
  }
  if (
    action.includes('submission_approved') ||
    action.includes('submission.approved')
  ) {
    return 'submission_approved';
  }
  if (
    action.includes('submission_rejected') ||
    action.includes('submission.rejected')
  ) {
    return 'submission_rejected';
  }
  return 'user_created'; // Default
}

/**
 * Generates human-readable activity description
 */
interface AuditLogRecord {
  action: string;
  metadata?: Record<string, string | number | boolean>;
}

function generateActivityDescription(log: AuditLogRecord): string {
  const action = log.action;
  const metadata = log.metadata || {};

  if (action.includes('user_created')) {
    return `New ${metadata.userType || 'user'} account created`;
  }
  if (action.includes('registration_approved')) {
    return `Registration approved for ${metadata.email || 'user'}`;
  }
  if (action.includes('submission_approved')) {
    return `${metadata.submissionType || 'Submission'} approved`;
  }
  if (action.includes('submission_rejected')) {
    return `${metadata.submissionType || 'Submission'} rejected`;
  }

  return action;
}
