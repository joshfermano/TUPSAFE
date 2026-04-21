import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tupsafe/database/server';
import {
  profiles,
  departments,
  pdsSubmissions,
  salnSubmissions,
} from '@tupsafe/database/schema';
import { and, eq, sql } from 'drizzle-orm';
import type {
  DashboardDepartmentsResponse,
  DepartmentMetrics,
} from '@tupsafe/types';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import {
  computeDepartmentCompliance,
  currentReportingYear,
  roundRate,
  safeRate,
} from '../../../../lib/compliance';

export const dynamic = 'force-dynamic';

const HANDLER_TIMEOUT_MS = 30_000;

function buildFallbackResponse(): DashboardDepartmentsResponse {
  return {
    departments: [],
    summary: {
      totalDepartments: 0,
      averageCompliance: 0,
      bestPerforming: { name: 'N/A', compliance: 0 },
      needsAttention: [],
    },
  };
}

/**
 * GET /api/dashboard/departments
 *
 * Department-level performance and compliance analytics.
 *
 * Compliance numbers are produced by the centralized `computeDepartmentCompliance`
 * helper (correlated subqueries) so they remain consistent with the overview
 * and compliance endpoints. Pending/active user counts come from a separate
 * single aggregation query — that join can be widened without inflating
 * DISTINCT compliance counts because the two datasets are independent.
 */
export async function GET(_request: NextRequest) {
  try {
    const hasPermission = await checkUserRoleFromSupabase(
      ['superadmin', 'admin', 'hr'],
      'admin'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    const now = new Date();
    const currentYear = currentReportingYear(now);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const workPromise = Promise.all([
      // Canonical per-department compliance (single query w/ correlated subqueries).
      computeDepartmentCompliance(now),

      // Pending submission counts + user counts per department — run in parallel
      // and keyed on department_id, NOT per-department N+1.
      db
        .select({
          deptId: departments.id,
          deptCode: departments.code,
          totalUsers: sql<number>`COUNT(DISTINCT ${profiles.id})`,
          activeUsers: sql<number>`COUNT(DISTINCT CASE WHEN ${profiles.accountStatus} = 'active' THEN ${profiles.id} END)`,
          pdsPending: sql<number>`COUNT(DISTINCT CASE WHEN ${pdsSubmissions.status} IN ('submitted', 'reviewing') THEN ${pdsSubmissions.userId} END)`,
          salnPending: sql<number>`COUNT(DISTINCT CASE WHEN ${salnSubmissions.status} IN ('submitted', 'reviewing') THEN ${salnSubmissions.userId} END)`,
        })
        .from(departments)
        .leftJoin(
          profiles,
          and(
            eq(profiles.departmentId, departments.id),
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active'),
            eq(profiles.isActive, true)
          )
        )
        .leftJoin(pdsSubmissions, eq(pdsSubmissions.userId, profiles.id))
        .leftJoin(salnSubmissions, eq(salnSubmissions.userId, profiles.id))
        .groupBy(departments.id, departments.code),

      // Previous-month-ish compliance baseline (for trend).
      db
        .select({
          deptId: departments.id,
          previousPdsCount: sql<number>`COUNT(DISTINCT CASE WHEN ${pdsSubmissions.status} IN ('submitted','approved') AND ${pdsSubmissions.approvedAt} >= ${twoMonthsAgo.toISOString()} AND ${pdsSubmissions.approvedAt} < ${oneMonthAgo.toISOString()} THEN ${pdsSubmissions.userId} END)`,
          previousSalnCount: sql<number>`COUNT(DISTINCT CASE WHEN ${salnSubmissions.status} IN ('submitted','approved') AND ${salnSubmissions.year} = ${currentYear} AND ${salnSubmissions.approvedAt} >= ${twoMonthsAgo.toISOString()} AND ${salnSubmissions.approvedAt} < ${oneMonthAgo.toISOString()} THEN ${salnSubmissions.userId} END)`,
        })
        .from(departments)
        .leftJoin(
          profiles,
          and(
            eq(profiles.departmentId, departments.id),
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active'),
            eq(profiles.isActive, true)
          )
        )
        .leftJoin(pdsSubmissions, eq(pdsSubmissions.userId, profiles.id))
        .leftJoin(salnSubmissions, eq(salnSubmissions.userId, profiles.id))
        .groupBy(departments.id),
    ]);

    const timeoutPromise = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), HANDLER_TIMEOUT_MS)
    );

    const raced = await Promise.race([workPromise, timeoutPromise]);
    if (raced === 'timeout') {
      console.error(
        '[Dashboard Departments] handler timed out after %dms',
        HANDLER_TIMEOUT_MS
      );
      return NextResponse.json(buildFallbackResponse(), {
        status: 200,
        headers: { 'Cache-Control': 'no-store', 'X-Partial-Data': '1' },
      });
    }

    const [complianceRows, pendingRows, previousMonthCompliance] = raced;

    const pendingMap = new Map(
      pendingRows.map((r) => [
        r.deptId,
        {
          totalUsers: Number(r.totalUsers ?? 0),
          activeUsers: Number(r.activeUsers ?? 0),
          pdsPending: Number(r.pdsPending ?? 0),
          salnPending: Number(r.salnPending ?? 0),
          deptCode: r.deptCode ?? null,
        },
      ])
    );

    const previousComplianceMap = new Map(
      previousMonthCompliance.map((r) => [
        r.deptId,
        {
          pdsCount: Number(r.previousPdsCount ?? 0),
          salnCount: Number(r.previousSalnCount ?? 0),
        },
      ])
    );

    const departmentMetrics: DepartmentMetrics[] = complianceRows.map(
      (dept) => {
        const pending = pendingMap.get(dept.departmentId);
        const totalUsers = pending?.totalUsers ?? dept.expected;
        const activeUsers = pending?.activeUsers ?? dept.expected;
        const pdsPending = pending?.pdsPending ?? 0;
        const salnPending = pending?.salnPending ?? 0;

        const pdsCompliance = dept.pdsRate;
        const salnCompliance = dept.salnRate;
        const overallCompliance = dept.overallRate;

        // Trend
        const previous = previousComplianceMap.get(dept.departmentId);
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (previous && dept.expected > 0) {
          const prevPds = safeRate(previous.pdsCount, dept.expected);
          const prevSaln = safeRate(previous.salnCount, dept.expected);
          const previousOverall = (prevPds + prevSaln) / 2;
          const difference = overallCompliance - previousOverall;
          if (difference > 5) trend = 'improving';
          else if (difference < -5) trend = 'declining';
        }

        return {
          id: dept.departmentId,
          name: dept.departmentName,
          code: dept.departmentCode ?? pending?.deptCode ?? '',
          users: { total: totalUsers, active: activeUsers },
          submissions: {
            pdsCompliance: roundRate(pdsCompliance, 2),
            salnCompliance: roundRate(salnCompliance, 2),
            pending: pdsPending + salnPending,
            overdue:
              Math.max(0, dept.expected - dept.pdsSubmitted) +
              Math.max(0, dept.expected - dept.salnSubmitted),
          },
          rank: 0,
          trend,
        };
      }
    );

    const sortedDepartments = [...departmentMetrics].sort((a, b) => {
      const aComp =
        (a.submissions.pdsCompliance + a.submissions.salnCompliance) / 2;
      const bComp =
        (b.submissions.pdsCompliance + b.submissions.salnCompliance) / 2;
      return bComp - aComp;
    });

    sortedDepartments.forEach((dept, index) => {
      dept.rank = index + 1;
    });

    const totalDepartments = sortedDepartments.length;
    const averageCompliance =
      totalDepartments > 0
        ? sortedDepartments.reduce((sum, dept) => {
            const c =
              (dept.submissions.pdsCompliance +
                dept.submissions.salnCompliance) /
              2;
            return sum + c;
          }, 0) / totalDepartments
        : 0;

    const bestPerforming = sortedDepartments[0];
    const bestCompliance = bestPerforming
      ? (bestPerforming.submissions.pdsCompliance +
          bestPerforming.submissions.salnCompliance) /
        2
      : 0;

    const needsAttention = sortedDepartments
      .filter((dept) => {
        const c =
          (dept.submissions.pdsCompliance + dept.submissions.salnCompliance) /
          2;
        return c < 70;
      })
      .map((dept) => ({
        name: dept.name,
        compliance: roundRate(
          (dept.submissions.pdsCompliance + dept.submissions.salnCompliance) /
            2,
          2
        ),
      }));

    const response: DashboardDepartmentsResponse = {
      departments: sortedDepartments,
      summary: {
        totalDepartments,
        averageCompliance: roundRate(averageCompliance, 2),
        bestPerforming: {
          name: bestPerforming?.name ?? 'N/A',
          compliance: roundRate(bestCompliance, 2),
        },
        needsAttention,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=600, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[Dashboard Departments] Error:', error);
    return NextResponse.json(buildFallbackResponse(), {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'X-Partial-Data': '1' },
    });
  }
}
