/**
 * SALN Submissions Analytics API - GET /api/submissions/saln/stats
 *
 * Provides comprehensive analytics data for SALN submissions including:
 * - Monthly submission trends (6 months)
 * - Department-level compliance breakdown with net worth aggregations
 * - Yearly comparison with financial metrics
 * - Net worth statistics (average, median)
 *
 * Features:
 * - Parallel query execution for optimal performance
 * - 6-month historical trend data
 * - Department compliance with avg net worth
 * - Year-over-year comparison with median calculations
 * - Status distribution analytics
 *
 * Security:
 * - Requires admin or hr role
 * - Cached for performance (5 minutes)
 */

import { NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { db, profiles, departments, salnSubmissions } from '@tupsafe/database/server';
import { eq, and, gte, sql } from 'drizzle-orm';
import type { SalnTimelineStats } from '@tupsafe/types';

export const dynamic = 'force-dynamic';
export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[SALN Stats API] Request received');

    // Verify admin/HR permissions
    const authStartTime = Date.now();
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'co_admin', 'hr'], 'admin');
    const authDuration = Date.now() - authStartTime;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    console.log('[SALN Stats API] Permission granted - fetching statistics');

    // Calculate date ranges
    const now = new Date();
    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      1
    );

    // Execute all queries in parallel for optimal performance
    const queryStartTime = Date.now();
    const [
      // Monthly trends (6 months)
      monthlySubmissionsData,
      monthlyApprovedData,
      monthlyRejectedData,

      // Department breakdown with avg net worth
      departmentComplianceData,

      // Yearly comparison with financial metrics
      yearlyComparisonData,
    ] = await Promise.all([
      // Monthly total submissions
      db
        .select({
          month: sql<string>`TO_CHAR(${salnSubmissions.createdAt}, 'YYYY-MM')`,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(salnSubmissions)
        .where(gte(salnSubmissions.createdAt, sixMonthsAgo))
        .groupBy(sql`TO_CHAR(${salnSubmissions.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${salnSubmissions.createdAt}, 'YYYY-MM')`),

      // Monthly approved submissions
      db
        .select({
          month: sql<string>`TO_CHAR(${salnSubmissions.submittedAt}, 'YYYY-MM')`,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(salnSubmissions)
        .where(
          and(
            gte(salnSubmissions.submittedAt, sixMonthsAgo),
            eq(salnSubmissions.status, 'approved')
          )
        )
        .groupBy(sql`TO_CHAR(${salnSubmissions.submittedAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${salnSubmissions.submittedAt}, 'YYYY-MM')`),

      // Monthly rejected submissions
      db
        .select({
          month: sql<string>`TO_CHAR(${salnSubmissions.submittedAt}, 'YYYY-MM')`,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(salnSubmissions)
        .where(
          and(
            gte(salnSubmissions.submittedAt, sixMonthsAgo),
            eq(salnSubmissions.status, 'rejected')
          )
        )
        .groupBy(sql`TO_CHAR(${salnSubmissions.submittedAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${salnSubmissions.submittedAt}, 'YYYY-MM')`),

      // Department compliance with average net worth
      db
        .select({
          departmentId: profiles.departmentId,
          departmentName: departments.name,
          departmentCode: departments.code,
          totalEmployees: sql<number>`cast(count(distinct ${profiles.id}) as int)`,
          totalSubmissions: sql<number>`cast(count(distinct ${salnSubmissions.id}) as int)`,
          pendingSubmissions: sql<number>`cast(count(distinct CASE WHEN ${salnSubmissions.status} IN ('submitted', 'reviewing') THEN ${salnSubmissions.id} END) as int)`,
          avgNetWorth: sql<string>`COALESCE(CAST(AVG(CAST(${salnSubmissions.netWorth} AS NUMERIC)) AS TEXT), '0')`,
        })
        .from(profiles)
        .leftJoin(departments, eq(profiles.departmentId, departments.id))
        .leftJoin(
          salnSubmissions,
          and(
            eq(salnSubmissions.userId, profiles.id),
            eq(salnSubmissions.status, 'approved')
          )
        )
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active'),
            sql`${profiles.departmentId} IS NOT NULL`
          )
        )
        .groupBy(profiles.departmentId, departments.name, departments.code)
        .orderBy(departments.name),

      // Yearly comparison with net worth aggregations
      db
        .select({
          year: salnSubmissions.year,
          totalSubmissions: sql<number>`cast(count(*) as int)`,
          avgNetWorth: sql<string>`COALESCE(CAST(AVG(CAST(${salnSubmissions.netWorth} AS NUMERIC)) AS TEXT), '0')`,
          medianNetWorth: sql<string>`COALESCE(CAST(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CAST(${salnSubmissions.netWorth} AS NUMERIC)) AS TEXT), '0')`,
        })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.status, 'approved'))
        .groupBy(salnSubmissions.year)
        .orderBy(salnSubmissions.year),
    ]);

    const queryDuration = Date.now() - queryStartTime;
    console.log(`[SALN Stats API] Queries completed in ${queryDuration}ms`);

    // Process monthly trends - merge submitted, approved, and rejected by month
    const trendsMap = new Map<
      string,
      { submitted: number; approved: number; rejected: number }
    >();

    // Initialize with submitted data
    monthlySubmissionsData.forEach((item) => {
      trendsMap.set(item.month, {
        submitted: item.count,
        approved: 0,
        rejected: 0,
      });
    });

    // Add approved data
    monthlyApprovedData.forEach((item) => {
      const existing = trendsMap.get(item.month);
      if (existing) {
        existing.approved = item.count;
      } else {
        trendsMap.set(item.month, {
          submitted: 0,
          approved: item.count,
          rejected: 0,
        });
      }
    });

    // Add rejected data
    monthlyRejectedData.forEach((item) => {
      const existing = trendsMap.get(item.month);
      if (existing) {
        existing.rejected = item.count;
      } else {
        trendsMap.set(item.month, {
          submitted: 0,
          approved: 0,
          rejected: item.count,
        });
      }
    });

    // Convert to array and sort by month
    const monthlyData = Array.from(trendsMap.entries())
      .map(([month, counts]) => ({
        month,
        submitted: counts.submitted,
        approved: counts.approved,
        rejected: counts.rejected,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Process department compliance data
    const departmentCompliance = departmentComplianceData.map((dept) => ({
      departmentId: dept.departmentId || '',
      departmentName: dept.departmentName || 'Unknown Department',
      departmentCode: dept.departmentCode || '',
      totalEmployees: dept.totalEmployees,
      totalSubmissions: dept.totalSubmissions,
      pendingSubmissions: dept.pendingSubmissions,
      avgNetWorth: dept.avgNetWorth,
    }));

    // Process yearly comparison data
    const yearlyComparison = yearlyComparisonData.map((year) => ({
      year: year.year,
      totalSubmissions: year.totalSubmissions,
      avgNetWorth: year.avgNetWorth,
      medianNetWorth: year.medianNetWorth,
    }));

    // Construct response
    const response: SalnTimelineStats = {
      monthlyData,
      departmentCompliance,
      yearlyComparison,
    };

    const totalDuration = Date.now() - startTime;
    console.log(
      `[SALN Stats API] Total request duration: ${totalDuration}ms (auth: ${authDuration}ms, queries: ${queryDuration}ms)`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[SALN Stats API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch SALN statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
