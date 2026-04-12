/**
 * Reports Overview API
 * GET /api/reports
 *
 * Provides comprehensive analytics data for the admin reports page
 *
 * Features:
 * - Compliance overview metrics (PDS/SALN)
 * - Submission statistics and trends
 * - Department-level compliance rankings
 * - Status distribution analytics
 * - Recent activity feed
 * - 6-month submission trend data
 *
 * Security:
 * - Requires admin, hr, or supervisor role
 * - Cached results for performance (5 minutes)
 *
 * Performance:
 * - All queries executed in parallel
 * - Optimized with database indexes
 * - Target: < 100ms without cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import {
  profiles,
  departments,
  pdsSubmissions,
  salnSubmissions,
  auditLogs,
} from '@tupsafe/database/schema';
import { eq, and, gte, lt, sql, desc, count } from 'drizzle-orm';
import type { ReportsOverviewResponse } from '@tupsafe/types';

export const dynamic = 'force-dynamic';
export async function GET(_request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('[Reports API] Request received');

    // Verify permissions (admin, hr, or supervisor role required)
    const authStartTime = Date.now();
    const hasPermission = await checkUserRoleFromSupabase([
      'admin',
      'hr',
      'supervisor',
    ], 'admin');
    const authDuration = Date.now() - authStartTime;
    console.log(
      `[Reports API] Permission check completed in ${authDuration}ms - result:`,
      hasPermission
    );

    if (!hasPermission) {
      console.log('[Reports API] Permission denied - returning 403');
      return NextResponse.json(
        { error: 'Unauthorized. Admin, HR, or Supervisor role required.' },
        { status: 403 }
      );
    }

    console.log('[Reports API] Permission granted - fetching report data');

    // Calculate date ranges
    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      1
    );

    // Execute all queries in parallel for optimal performance
    const queryStartTime = Date.now();
    const [
      // Active employee count
      [{ activeEmployees }],

      // PDS compliance (approved submissions)
      [{ approvedPDS }],

      // SALN compliance (approved submissions for current year)
      [{ approvedSALN }],

      // Recent 7-day compliance for trend
      [{ recentSevenDaysPDS }],
      [{ recentSevenDaysSALN }],

      // Previous 7-day period for comparison
      [{ previousSevenDaysPDS }],
      [{ previousSevenDaysSALN }],

      // Total submission counts
      [{ totalPDS }],
      [{ totalSALNCurrentYear }],

      // Recent submissions (last 30 days)
      [{ recentPDS }],
      [{ recentSALN }],

      // Submission trends (6 months)
      submissionTrendsData,

      // Department compliance
      departmentComplianceData,

      // Status distribution
      pdsStatusDistribution,
      salnStatusDistribution,

      // Recent activity (last 10 events)
      recentActivityData,
    ] = await Promise.all([
      // Active employees count
      db
        .select({ activeEmployees: count() })
        .from(profiles)
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active'),
            eq(profiles.isActive, true)
          )
        ),

      // Approved PDS submissions
      db
        .select({ approvedPDS: count() })
        .from(pdsSubmissions)
        .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.isActive, true),
            eq(profiles.accountStatus, 'active'),
            eq(pdsSubmissions.status, 'approved')
          )
        ),

      // Approved SALN submissions (current year)
      db
        .select({ approvedSALN: count() })
        .from(salnSubmissions)
        .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.isActive, true),
            eq(profiles.accountStatus, 'active'),
            eq(salnSubmissions.year, currentYear),
            eq(salnSubmissions.status, 'approved')
          )
        ),

      // Recent 7-day PDS submissions
      db
        .select({ recentSevenDaysPDS: count() })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.status, 'approved'),
            gte(pdsSubmissions.approvedAt, sevenDaysAgo)
          )
        ),

      // Recent 7-day SALN submissions
      db
        .select({ recentSevenDaysSALN: count() })
        .from(salnSubmissions)
        .where(
          and(
            eq(salnSubmissions.status, 'approved'),
            gte(salnSubmissions.approvedAt, sevenDaysAgo)
          )
        ),

      // Previous 7-day PDS submissions (for trend comparison)
      db
        .select({ previousSevenDaysPDS: count() })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.status, 'approved'),
            gte(pdsSubmissions.approvedAt, fourteenDaysAgo),
            lt(pdsSubmissions.approvedAt, sevenDaysAgo)
          )
        ),

      // Previous 7-day SALN submissions (for trend comparison)
      db
        .select({ previousSevenDaysSALN: count() })
        .from(salnSubmissions)
        .where(
          and(
            eq(salnSubmissions.status, 'approved'),
            gte(salnSubmissions.approvedAt, fourteenDaysAgo),
            lt(salnSubmissions.approvedAt, sevenDaysAgo)
          )
        ),

      // Total PDS submissions (all time)
      db.select({ totalPDS: count() }).from(pdsSubmissions),

      // Total SALN submissions (current year)
      db
        .select({ totalSALNCurrentYear: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.year, currentYear)),

      // Recent PDS submissions (last 30 days)
      db
        .select({ recentPDS: count() })
        .from(pdsSubmissions)
        .where(gte(pdsSubmissions.createdAt, thirtyDaysAgo)),

      // Recent SALN submissions (last 30 days)
      db
        .select({ recentSALN: count() })
        .from(salnSubmissions)
        .where(gte(salnSubmissions.createdAt, thirtyDaysAgo)),

      // Submission trends (6 months) - monthly aggregation
      Promise.all([
        // PDS trends by month
        db
          .select({
            month: sql<string>`TO_CHAR(${pdsSubmissions.createdAt}, 'YYYY-MM')`,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(pdsSubmissions)
          .where(gte(pdsSubmissions.createdAt, sixMonthsAgo))
          .groupBy(sql`TO_CHAR(${pdsSubmissions.createdAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${pdsSubmissions.createdAt}, 'YYYY-MM')`),

        // SALN trends by month
        db
          .select({
            month: sql<string>`TO_CHAR(${salnSubmissions.createdAt}, 'YYYY-MM')`,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(salnSubmissions)
          .where(gte(salnSubmissions.createdAt, sixMonthsAgo))
          .groupBy(sql`TO_CHAR(${salnSubmissions.createdAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${salnSubmissions.createdAt}, 'YYYY-MM')`),
      ]),

      // Department compliance rankings
      db
        .select({
          departmentId: profiles.departmentId,
          departmentName: departments.name,
          departmentCode: departments.code,
          totalEmployees: sql<number>`cast(count(distinct ${profiles.id}) as int)`,
          pdsCount: sql<number>`cast(count(distinct ${pdsSubmissions.userId}) as int)`,
          salnCount: sql<number>`cast(count(distinct ${salnSubmissions.userId}) as int)`,
        })
        .from(profiles)
        .leftJoin(departments, eq(profiles.departmentId, departments.id))
        .leftJoin(
          pdsSubmissions,
          and(
            eq(pdsSubmissions.userId, profiles.id),
            eq(pdsSubmissions.status, 'approved')
          )
        )
        .leftJoin(
          salnSubmissions,
          and(
            eq(salnSubmissions.userId, profiles.id),
            eq(salnSubmissions.status, 'approved'),
            eq(salnSubmissions.year, currentYear)
          )
        )
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active'),
            eq(profiles.isActive, true),
            sql`${profiles.departmentId} IS NOT NULL`
          )
        )
        .groupBy(profiles.departmentId, departments.name, departments.code)
        .orderBy(
          sql`cast(count(distinct ${pdsSubmissions.userId}) + count(distinct ${salnSubmissions.userId}) as float) / cast(count(distinct ${profiles.id}) as float) DESC`
        ),

      // PDS status distribution
      db
        .select({
          status: pdsSubmissions.status,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(pdsSubmissions)
        .groupBy(pdsSubmissions.status),

      // SALN status distribution
      db
        .select({
          status: salnSubmissions.status,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.year, currentYear))
        .groupBy(salnSubmissions.status),

      // Recent activity (last 10 audit log entries)
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          userId: auditLogs.userId,
          createdAt: auditLogs.createdAt,
          userName: sql<string>`concat(${profiles.firstName}, ' ', ${profiles.lastName})`,
        })
        .from(auditLogs)
        .leftJoin(profiles, eq(auditLogs.userId, profiles.id))
        .where(
          sql`${auditLogs.entityType} IN ('pds', 'saln', 'user', 'system')`
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(10),
    ]);

    const queryDuration = Date.now() - queryStartTime;
    console.log(`[Reports API] All queries completed in ${queryDuration}ms`);

    // Calculate compliance rates
    const activeEmpCount = activeEmployees || 1; // Avoid division by zero
    const pdsComplianceRate = (approvedPDS / activeEmpCount) * 100;
    const salnComplianceRate = (approvedSALN / activeEmpCount) * 100;
    const overallComplianceRate = (pdsComplianceRate + salnComplianceRate) / 2;

    // Calculate 7-day trend
    const recentTotal = recentSevenDaysPDS + recentSevenDaysSALN;
    const previousTotal = previousSevenDaysPDS + previousSevenDaysSALN;
    const trendPercentage =
      previousTotal > 0
        ? ((recentTotal - previousTotal) / previousTotal) * 100
        : recentTotal > 0
          ? 100
          : 0;

    // Process submission trends data (merge PDS and SALN by month)
    const [pdsTrends, salnTrends] = submissionTrendsData;
    const trendsMap = new Map<string, { pdsCount: number; salnCount: number }>();

    pdsTrends.forEach((item) => {
      trendsMap.set(item.month, {
        pdsCount: item.count,
        salnCount: 0,
      });
    });

    salnTrends.forEach((item) => {
      const existing = trendsMap.get(item.month);
      if (existing) {
        existing.salnCount = item.count;
      } else {
        trendsMap.set(item.month, {
          pdsCount: 0,
          salnCount: item.count,
        });
      }
    });

    const submissionTrends = Array.from(trendsMap.entries())
      .map(([month, counts]) => ({
        month,
        pdsCount: counts.pdsCount,
        salnCount: counts.salnCount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Process department compliance data
    const departmentCompliance = departmentComplianceData.map((dept) => {
      const totalSubmissions = dept.pdsCount + dept.salnCount;
      const maxPossibleSubmissions = dept.totalEmployees * 2; // PDS + SALN per employee
      const complianceRate =
        maxPossibleSubmissions > 0
          ? (totalSubmissions / maxPossibleSubmissions) * 100
          : 0;

      return {
        id: dept.departmentId || '',
        name: dept.departmentName || 'Unknown Department',
        code: dept.departmentCode || '',
        rate: Math.round(complianceRate * 10) / 10, // Round to 1 decimal
        pdsCount: dept.pdsCount,
        salnCount: dept.salnCount,
        totalEmployees: dept.totalEmployees,
      };
    });

    // Process status distribution (combine PDS and SALN)
    const statusMap = {
      approved: 0,
      pending: 0,
      inReview: 0,
      rejected: 0,
    };

    pdsStatusDistribution.forEach((item) => {
      if (item.status === 'approved') statusMap.approved += item.count;
      else if (item.status === 'submitted') statusMap.pending += item.count;
      else if (item.status === 'reviewing') statusMap.inReview += item.count;
      else if (item.status === 'rejected') statusMap.rejected += item.count;
    });

    salnStatusDistribution.forEach((item) => {
      if (item.status === 'approved') statusMap.approved += item.count;
      else if (item.status === 'submitted') statusMap.pending += item.count;
      else if (item.status === 'reviewing') statusMap.inReview += item.count;
      else if (item.status === 'rejected') statusMap.rejected += item.count;
    });

    // Process recent activity
    const recentActivity = recentActivityData.map((log) => ({
      id: log.id,
      action: log.action,
      user: log.userName || 'System',
      timestamp: log.createdAt,
      type: determineActivityType(log.entityType),
    }));

    // Construct response
    const response: ReportsOverviewResponse = {
      complianceOverview: {
        overallRate: Math.round(overallComplianceRate * 10) / 10,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
        pdsCompliance: Math.round(pdsComplianceRate * 10) / 10,
        salnCompliance: Math.round(salnComplianceRate * 10) / 10,
      },
      submissionStats: {
        pdsTotal: totalPDS,
        salnTotal: totalSALNCurrentYear,
        pdsRecent: recentPDS,
        salnRecent: recentSALN,
      },
      submissionTrends,
      departmentCompliance,
      statusDistribution: statusMap,
      recentActivity,
    };

    // Performance logging
    const totalDuration = Date.now() - startTime;
    console.log(
      `[Reports API] Total request duration: ${totalDuration}ms (auth: ${authDuration}ms, queries: ${queryDuration}ms)`
    );

    // Add cache headers for performance (5 minute cache)
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[Reports API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch reports data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Determines the activity type based on entity type
 */
function determineActivityType(
  entityType: string
): 'pds' | 'saln' | 'user' | 'system' {
  if (entityType === 'pds') return 'pds';
  if (entityType === 'saln') return 'saln';
  if (entityType === 'user' || entityType === 'profile') return 'user';
  return 'system';
}
