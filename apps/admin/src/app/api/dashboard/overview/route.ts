import { NextRequest, NextResponse } from 'next/server';
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
export async function GET(request: NextRequest) {
  try {
    // TODO: Verify admin/HR role from session
    // const session = await getServerSession();
    // if (!session || !['admin', 'hr'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Date ranges for metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for performance
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
      pdsCompliance,
      salnCompliance,
      recentActivity,
    ] = await Promise.all([
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

      // Pending PDS submissions
      db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(eq(pdsSubmissions.status, 'submitted')),

      // Pending SALN submissions
      db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'submitted')),

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

      // PDS compliance (employees only)
      Promise.all([
        db.select({ count: count() }).from(profiles).where(eq(profiles.userType, 'employee')),
        db
          .select({ count: count() })
          .from(pdsSubmissions)
          .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
          .where(
            and(
              eq(profiles.userType, 'employee'),
              eq(pdsSubmissions.status, 'approved')
            )
          ),
      ]),

      // SALN compliance (employees only, current fiscal year)
      Promise.all([
        db.select({ count: count() }).from(profiles).where(eq(profiles.userType, 'employee')),
        db
          .select({ count: count() })
          .from(salnSubmissions)
          .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
          .where(
            and(
              eq(profiles.userType, 'employee'),
              eq(salnSubmissions.year, now.getFullYear()),
              eq(salnSubmissions.status, 'approved')
            )
          ),
      ]),

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
    const growthValue = previousMonth > 0 ? ((newThisMonth - previousMonth) / previousMonth) * 100 : 0;

    // Calculate average approval time
    const avgHours = Number(avgApprovalTime[0]?.avgHours ?? 0);
    const avgDays = avgHours / 24;
    const averageApprovalTime =
      avgDays < 1 ? `${avgHours.toFixed(1)} hours` : `${avgDays.toFixed(1)} days`;

    // Calculate compliance rates
    const [expectedPDS, submittedPDS] = pdsCompliance;
    const [expectedSALN, submittedSALN] = salnCompliance;

    const pdsExpected = expectedPDS[0]?.count ?? 1;
    const pdsSubmitted = submittedPDS[0]?.count ?? 0;
    const pdsRate = (pdsSubmitted / pdsExpected) * 100;

    const salnExpected = expectedSALN[0]?.count ?? 1;
    const salnSubmittedCount = submittedSALN[0]?.count ?? 0;
    const salnRate = (salnSubmittedCount / salnExpected) * 100;

    // Calculate overall compliance
    const totalPendingSubmissions =
      (pendingPDS[0]?.count ?? 0) + (pendingSALN[0]?.count ?? 0);
    const totalApprovedWeek =
      (approvedSubmissionsWeek[0][0]?.count ?? 0) + (approvedSubmissionsWeek[1][0]?.count ?? 0);
    const totalApprovedMonth =
      (approvedSubmissionsMonth[0][0]?.count ?? 0) + (approvedSubmissionsMonth[1][0]?.count ?? 0);
    const overallComplianceRate = (pdsRate + salnRate) / 2;

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
          label: 'View Report',
          url: '/dashboard/compliance',
        },
      });
    }

    if (salnRate < 70) {
      alerts.push({
        id: 'low-saln-compliance',
        type: 'error',
        title: 'Low SALN Compliance',
        message: `Only ${salnRate.toFixed(1)}% of employees have submitted SALN for ${now.getFullYear()}`,
        action: {
          label: 'View Report',
          url: '/dashboard/compliance',
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
    return NextResponse.json(
      { error: 'Failed to fetch dashboard overview' },
      { status: 500 }
    );
  }
}

/**
 * Maps audit log action to activity type
 */
function mapActionToType(action: string): DashboardOverviewResponse['recentActivity'][0]['type'] {
  if (action.includes('user_created') || action.includes('user.created')) {
    return 'user_created';
  }
  if (action.includes('registration_approved') || action.includes('registration.approved')) {
    return 'registration_approved';
  }
  if (action.includes('submission_approved') || action.includes('submission.approved')) {
    return 'submission_approved';
  }
  if (action.includes('submission_rejected') || action.includes('submission.rejected')) {
    return 'submission_rejected';
  }
  return 'user_created'; // Default
}

/**
 * Generates human-readable activity description
 */
function generateActivityDescription(log: any): string {
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
