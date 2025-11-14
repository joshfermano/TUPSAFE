import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tupsafe/database/server';
import {
  profiles,
  departments,
  pdsSubmissions,
  salnSubmissions,
} from '@tupsafe/database/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import type { DashboardDepartmentsResponse, DepartmentMetrics } from '@tupsafe/types';

/**
 * GET /api/dashboard/departments
 *
 * Department-level performance and compliance analytics
 *
 * Features:
 * - User count per department
 * - Submission compliance per department
 * - Pending reviews per department
 * - Department rankings by compliance
 * - Trend analysis (improving/declining/stable)
 *
 * Caching: 10 minutes
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Verify admin/HR role
    // const session = await getServerSession();
    // if (!session || !['admin', 'hr'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const now = new Date();
    const currentYear = now.getFullYear();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all departments with their metrics
    const departmentData = await db
      .select({
        deptId: departments.id,
        deptName: departments.name,
        deptCode: departments.code,
        totalUsers: sql<number>`COUNT(DISTINCT ${profiles.id})`,
        activeUsers: sql<number>`COUNT(DISTINCT CASE WHEN ${profiles.accountStatus} = 'active' THEN ${profiles.id} END)`,
        pdsSubmitted: sql<number>`COUNT(DISTINCT CASE WHEN ${pdsSubmissions.status} = 'approved' THEN ${pdsSubmissions.userId} END)`,
        salnSubmitted: sql<number>`COUNT(DISTINCT CASE WHEN ${salnSubmissions.status} = 'approved' AND ${salnSubmissions.year} = ${currentYear} THEN ${salnSubmissions.userId} END)`,
        pdsPending: sql<number>`COUNT(DISTINCT CASE WHEN ${pdsSubmissions.status} = 'submitted' THEN ${pdsSubmissions.id} END)`,
        salnPending: sql<number>`COUNT(DISTINCT CASE WHEN ${salnSubmissions.status} = 'submitted' THEN ${salnSubmissions.id} END)`,
      })
      .from(departments)
      .leftJoin(profiles, and(
        eq(profiles.departmentId, departments.id),
        eq(profiles.userType, 'employee'),
        eq(profiles.accountStatus, 'active')
      ))
      .leftJoin(pdsSubmissions, eq(pdsSubmissions.userId, profiles.id))
      .leftJoin(salnSubmissions, eq(salnSubmissions.userId, profiles.id))
      .groupBy(departments.id, departments.name, departments.code)
      .orderBy(departments.name);

    // Calculate previous month compliance for trend analysis
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const previousMonthCompliance = await db
      .select({
        deptId: departments.id,
        previousPdsCount: sql<number>`COUNT(DISTINCT CASE WHEN ${pdsSubmissions.status} = 'approved' AND ${pdsSubmissions.approvedAt} >= ${twoMonthsAgo} AND ${pdsSubmissions.approvedAt} < ${oneMonthAgo} THEN ${pdsSubmissions.userId} END)`,
        previousSalnCount: sql<number>`COUNT(DISTINCT CASE WHEN ${salnSubmissions.status} = 'approved' AND ${salnSubmissions.year} = ${currentYear} AND ${salnSubmissions.approvedAt} >= ${twoMonthsAgo} AND ${salnSubmissions.approvedAt} < ${oneMonthAgo} THEN ${salnSubmissions.userId} END)`,
      })
      .from(departments)
      .leftJoin(profiles, and(
        eq(profiles.departmentId, departments.id),
        eq(profiles.userType, 'employee')
      ))
      .leftJoin(pdsSubmissions, eq(pdsSubmissions.userId, profiles.id))
      .leftJoin(salnSubmissions, eq(salnSubmissions.userId, profiles.id))
      .groupBy(departments.id);

    // Map previous month data for easy lookup
    const previousComplianceMap = new Map(
      previousMonthCompliance.map((row) => [
        row.deptId,
        {
          pdsCount: Number(row.previousPdsCount),
          salnCount: Number(row.previousSalnCount),
        },
      ])
    );

    // Process department metrics
    const departmentMetrics: DepartmentMetrics[] = departmentData.map((dept) => {
      const totalUsers = Number(dept.totalUsers);
      const activeUsers = Number(dept.activeUsers);
      const pdsSubmitted = Number(dept.pdsSubmitted);
      const salnSubmitted = Number(dept.salnSubmitted);
      const pdsPending = Number(dept.pdsPending);
      const salnPending = Number(dept.salnPending);

      // Calculate compliance rates
      const pdsCompliance = totalUsers > 0 ? (pdsSubmitted / totalUsers) * 100 : 0;
      const salnCompliance = totalUsers > 0 ? (salnSubmitted / totalUsers) * 100 : 0;
      const overallCompliance = (pdsCompliance + salnCompliance) / 2;

      // Calculate trend
      const previous = previousComplianceMap.get(dept.deptId);
      let trend: 'improving' | 'declining' | 'stable' = 'stable';

      if (previous && totalUsers > 0) {
        const previousPdsRate = (previous.pdsCount / totalUsers) * 100;
        const previousSalnRate = (previous.salnCount / totalUsers) * 100;
        const previousOverall = (previousPdsRate + previousSalnRate) / 2;

        const difference = overallCompliance - previousOverall;
        if (difference > 5) {
          trend = 'improving';
        } else if (difference < -5) {
          trend = 'declining';
        }
      }

      return {
        id: dept.deptId,
        name: dept.deptName,
        code: dept.deptCode,
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        submissions: {
          pdsCompliance: Number(pdsCompliance.toFixed(2)),
          salnCompliance: Number(salnCompliance.toFixed(2)),
          pending: pdsPending + salnPending,
          overdue: Math.max(0, totalUsers - pdsSubmitted) + Math.max(0, totalUsers - salnSubmitted),
        },
        rank: 0, // Will be set after sorting
        trend,
      };
    });

    // Rank departments by compliance
    const sortedDepartments = [...departmentMetrics].sort((a, b) => {
      const aCompliance = (a.submissions.pdsCompliance + a.submissions.salnCompliance) / 2;
      const bCompliance = (b.submissions.pdsCompliance + b.submissions.salnCompliance) / 2;
      return bCompliance - aCompliance;
    });

    // Assign ranks
    sortedDepartments.forEach((dept, index) => {
      dept.rank = index + 1;
    });

    // Calculate summary statistics
    const totalDepartments = sortedDepartments.length;
    const averageCompliance =
      totalDepartments > 0
        ? sortedDepartments.reduce((sum, dept) => {
            const compliance = (dept.submissions.pdsCompliance + dept.submissions.salnCompliance) / 2;
            return sum + compliance;
          }, 0) / totalDepartments
        : 0;

    const bestPerforming = sortedDepartments[0] || {
      name: 'N/A',
      submissions: { pdsCompliance: 0, salnCompliance: 0 },
    };

    const needsAttention = sortedDepartments
      .filter((dept) => {
        const compliance = (dept.submissions.pdsCompliance + dept.submissions.salnCompliance) / 2;
        return compliance < 70; // Below 70% compliance
      })
      .map((dept) => ({
        name: dept.name,
        compliance: Number(
          ((dept.submissions.pdsCompliance + dept.submissions.salnCompliance) / 2).toFixed(2)
        ),
      }));

    // Construct response
    const response: DashboardDepartmentsResponse = {
      departments: sortedDepartments,
      summary: {
        totalDepartments,
        averageCompliance: Number(averageCompliance.toFixed(2)),
        bestPerforming: {
          name: bestPerforming.name,
          compliance: Number(
            (
              (bestPerforming.submissions.pdsCompliance + bestPerforming.submissions.salnCompliance) /
              2
            ).toFixed(2)
          ),
        },
        needsAttention,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=600, stale-while-revalidate=120', // 10 minutes
      },
    });
  } catch (error) {
    console.error('[Dashboard Departments] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department analytics' },
      { status: 500 }
    );
  }
}
