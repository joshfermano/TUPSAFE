/**
 * PDS Submissions Analytics API - GET /api/submissions/pds/stats
 *
 * Provides comprehensive analytics data for PDS submissions including:
 * - Monthly submission trends (6 months)
 * - Department-level compliance breakdown
 * - Aggregate statistics
 *
 * Features:
 * - Parallel query execution for optimal performance
 * - 6-month historical trend data
 * - Department compliance metrics
 * - Status distribution analytics
 *
 * Security:
 * - Requires admin or hr role
 * - Cached for performance (5 minutes)
 */

import { NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { db, profiles, departments, pdsSubmissions } from '@tupsafe/database/server';
import { eq, and, gte, sql } from 'drizzle-orm';
import type { PdsTimelineStats } from '@tupsafe/types';

export const dynamic = 'force-dynamic';
export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[PDS Stats API] Request received');

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

    console.log('[PDS Stats API] Permission granted - fetching statistics');

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

      // Department breakdown
      departmentComplianceData,
    ] = await Promise.all([
      // Monthly total submissions
      db
        .select({
          month: sql<string>`TO_CHAR(${pdsSubmissions.createdAt}, 'YYYY-MM')`,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(pdsSubmissions)
        .where(gte(pdsSubmissions.createdAt, sixMonthsAgo))
        .groupBy(sql`TO_CHAR(${pdsSubmissions.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${pdsSubmissions.createdAt}, 'YYYY-MM')`),

      // Monthly approved submissions
      db
        .select({
          month: sql<string>`TO_CHAR(${pdsSubmissions.submittedAt}, 'YYYY-MM')`,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(pdsSubmissions)
        .where(
          and(
            gte(pdsSubmissions.submittedAt, sixMonthsAgo),
            eq(pdsSubmissions.status, 'approved')
          )
        )
        .groupBy(sql`TO_CHAR(${pdsSubmissions.submittedAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${pdsSubmissions.submittedAt}, 'YYYY-MM')`),

      // Monthly rejected submissions
      db
        .select({
          month: sql<string>`TO_CHAR(${pdsSubmissions.submittedAt}, 'YYYY-MM')`,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(pdsSubmissions)
        .where(
          and(
            gte(pdsSubmissions.submittedAt, sixMonthsAgo),
            eq(pdsSubmissions.status, 'rejected')
          )
        )
        .groupBy(sql`TO_CHAR(${pdsSubmissions.submittedAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${pdsSubmissions.submittedAt}, 'YYYY-MM')`),

      // Department compliance
      db
        .select({
          departmentId: profiles.departmentId,
          departmentName: departments.name,
          departmentCode: departments.code,
          totalEmployees: sql<number>`cast(count(distinct ${profiles.id}) as int)`,
          totalSubmissions: sql<number>`cast(count(distinct ${pdsSubmissions.id}) as int)`,
          pendingSubmissions: sql<number>`cast(count(distinct CASE WHEN ${pdsSubmissions.status} IN ('submitted', 'reviewing') THEN ${pdsSubmissions.id} END) as int)`,
        })
        .from(profiles)
        .leftJoin(departments, eq(profiles.departmentId, departments.id))
        .leftJoin(
          pdsSubmissions,
          and(
            eq(pdsSubmissions.userId, profiles.id),
            eq(pdsSubmissions.isLatest, true)
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
    ]);

    const queryDuration = Date.now() - queryStartTime;
    console.log(`[PDS Stats API] Queries completed in ${queryDuration}ms`);

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
    }));

    // Construct response
    const response: PdsTimelineStats = {
      monthlyData,
      departmentCompliance,
    };

    const totalDuration = Date.now() - startTime;
    console.log(
      `[PDS Stats API] Total request duration: ${totalDuration}ms (auth: ${authDuration}ms, queries: ${queryDuration}ms)`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('[PDS Stats API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch PDS statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
