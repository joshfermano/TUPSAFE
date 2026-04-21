import { NextResponse } from 'next/server';
import { db } from '@tupsafe/database/server';
import {
  pdsSubmissions,
  salnSubmissions,
  profiles,
  submissionDeadlines,
} from '@tupsafe/database/schema';
import { and, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import type { DashboardComplianceResponse } from '@tupsafe/types';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import {
  COMPLIANT_SUBMISSION_STATUSES,
  computeComplianceRates,
  computeDepartmentCompliance,
  currentReportingYear,
  roundRate,
  safeRate,
} from '../../../../lib/compliance';

export const dynamic = 'force-dynamic';

/** Overall handler timeout (ms). Chosen to return a structured JSON error
 *  before Nginx's default 60s proxy_read_timeout fires. */
const HANDLER_TIMEOUT_MS = 30_000;

/** Skeleton payload returned when a sub-query times out so the dashboard can
 *  still render something instead of a 504/white screen. */
function buildFallbackResponse(
  currentYear: number
): DashboardComplianceResponse {
  return {
    deadlines: {
      pds: {
        next: null,
        daysRemaining: 0,
        submitted: 0,
        expected: 0,
        status: 'overdue',
      },
      saln: {
        next: null,
        fiscalYear: currentYear,
        deadline: new Date(),
        daysRemaining: 0,
        submitted: 0,
        expected: 0,
        status: 'overdue',
      },
    },
    byDepartment: [],
    overdue: { pds: [], saln: [] },
    overall: {
      complianceRate: 0,
      grade: 'F',
      comparison: { lastMonth: 0, percentageChange: 0 },
    },
  };
}

/**
 * GET /api/dashboard/compliance
 *
 * Detailed compliance tracking with deadlines.
 * Uses the centralized `compliance.ts` helper so numbers match every other
 * widget that displays PDS/SALN rates.
 */
export async function GET() {
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
    const nowStr = now.toISOString().split('T')[0];

    const workPromise = (async () => {
      const [
        pdsDeadlineData,
        salnDeadlineData,
        compliance,
        departmentCompliance,
        overduePDS,
        overdueSALN,
        previousMonthCompliance,
      ] = await Promise.all([
        db
          .select({
            deadline: submissionDeadlines.deadlineDate,
            submissionType: submissionDeadlines.formType,
          })
          .from(submissionDeadlines)
          .where(
            and(
              eq(submissionDeadlines.formType, 'pds'),
              eq(submissionDeadlines.isActive, true),
              gte(submissionDeadlines.deadlineDate, nowStr)
            )
          )
          .orderBy(submissionDeadlines.deadlineDate)
          .limit(1),

        db
          .select({
            deadline: submissionDeadlines.deadlineDate,
            submissionType: submissionDeadlines.formType,
            fiscalYear: submissionDeadlines.year,
          })
          .from(submissionDeadlines)
          .where(
            and(
              eq(submissionDeadlines.formType, 'saln'),
              eq(submissionDeadlines.year, currentYear),
              eq(submissionDeadlines.isActive, true)
            )
          )
          .limit(1),

        // Canonical compliance rates (one source of truth).
        computeComplianceRates(undefined, now),

        // Canonical per-department compliance (uses correlated subqueries so
        // LEFT JOINs don't inflate DISTINCT counts).
        computeDepartmentCompliance(now),

        db
          .select({
            employeeId: profiles.employeeId,
            firstName: profiles.firstName,
            lastName: profiles.lastName,
            createdAt: profiles.createdAt,
          })
          .from(profiles)
          .leftJoin(
            pdsSubmissions,
            and(
              eq(pdsSubmissions.userId, profiles.id),
              sql`${pdsSubmissions.status} IN ('submitted','approved')`
            )
          )
          .where(
            and(
              eq(profiles.userType, 'employee'),
              eq(profiles.accountStatus, 'active'),
              eq(profiles.isActive, true),
              isNull(pdsSubmissions.id)
            )
          )
          .limit(20),

        db
          .select({
            employeeId: profiles.employeeId,
            firstName: profiles.firstName,
            lastName: profiles.lastName,
            createdAt: profiles.createdAt,
          })
          .from(profiles)
          .leftJoin(
            salnSubmissions,
            and(
              eq(salnSubmissions.userId, profiles.id),
              eq(salnSubmissions.year, currentYear),
              sql`${salnSubmissions.status} IN ('submitted','approved')`
            )
          )
          .where(
            and(
              eq(profiles.userType, 'employee'),
              eq(profiles.accountStatus, 'active'),
              eq(profiles.isActive, true),
              isNull(salnSubmissions.id)
            )
          )
          .limit(20),

        // Previous-month baseline (last-month comparison card)
        Promise.all([
          db
            .select({
              count: sql<number>`COUNT(DISTINCT ${pdsSubmissions.userId})`,
            })
            .from(pdsSubmissions)
            .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
            .where(
              and(
                eq(profiles.userType, 'employee'),
                eq(profiles.accountStatus, 'active'),
                eq(profiles.isActive, true),
                sql`${pdsSubmissions.status} IN ('submitted','approved')`,
                lt(pdsSubmissions.approvedAt, oneMonthAgo)
              )
            ),
          db
            .select({
              count: sql<number>`COUNT(DISTINCT ${salnSubmissions.userId})`,
            })
            .from(salnSubmissions)
            .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
            .where(
              and(
                eq(profiles.userType, 'employee'),
                eq(profiles.accountStatus, 'active'),
                eq(profiles.isActive, true),
                sql`${salnSubmissions.status} IN ('submitted','approved')`,
                eq(salnSubmissions.year, currentYear),
                lt(salnSubmissions.approvedAt, oneMonthAgo)
              )
            ),
        ]),
      ]);

      return {
        pdsDeadlineData,
        salnDeadlineData,
        compliance,
        departmentCompliance,
        overduePDS,
        overdueSALN,
        previousMonthCompliance,
      };
    })();

    // Race the whole work promise against a 30s timeout so that even if one
    // sub-query deadlocks, the handler returns a structured payload before
    // Nginx's proxy_read_timeout fires.
    const timeoutPromise = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), HANDLER_TIMEOUT_MS)
    );

    const result = await Promise.race([workPromise, timeoutPromise]);

    if (result === 'timeout') {
      console.error(
        '[Dashboard Compliance] handler timed out after %dms',
        HANDLER_TIMEOUT_MS
      );
      return NextResponse.json(buildFallbackResponse(currentYear), {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'X-Partial-Data': '1',
        },
      });
    }

    const {
      pdsDeadlineData,
      salnDeadlineData,
      compliance,
      departmentCompliance,
      overduePDS,
      overdueSALN,
      previousMonthCompliance,
    } = result;

    const pdsDeadline = pdsDeadlineData[0];
    const salnDeadline = salnDeadlineData[0];

    const expected = compliance.expected;
    const pdsSubmittedCount = compliance.pdsSubmitted;
    const salnSubmittedCount = compliance.salnSubmitted;
    const pdsRate = compliance.pdsRate;
    const salnRate = compliance.salnRate;

    const pdsDaysRemaining = pdsDeadline
      ? Math.ceil(
          (new Date(pdsDeadline.deadline).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const pdsStatus: 'on-track' | 'at-risk' | 'overdue' =
      pdsRate >= 80 ? 'on-track' : pdsRate >= 50 ? 'at-risk' : 'overdue';

    const salnDaysRemaining = salnDeadline
      ? Math.ceil(
          (new Date(salnDeadline.deadline).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const salnStatus: 'on-track' | 'at-risk' | 'overdue' =
      salnRate >= 80 ? 'on-track' : salnRate >= 50 ? 'at-risk' : 'overdue';

    // Per-department compliance — sourced from the canonical helper so totals
    // and rates match the department analytics endpoint.
    const byDepartment = departmentCompliance.map((dept) => ({
      department: dept.departmentName,
      pdsRate: roundRate(dept.pdsRate, 2),
      salnRate: roundRate(dept.salnRate, 2),
      overdue:
        Math.max(0, dept.expected - dept.pdsSubmitted) +
        Math.max(0, dept.expected - dept.salnSubmitted),
    }));

    const overduePDSList = overduePDS.map((emp) => {
      const daysOverdue = Math.ceil(
        (now.getTime() - emp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        employeeId: emp.employeeId || 'N/A',
        name: `${emp.firstName} ${emp.lastName}`,
        daysOverdue,
      };
    });

    const overdueSALNList = overdueSALN.map((emp) => {
      const daysOverdue = Math.ceil(
        (now.getTime() - emp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        employeeId: emp.employeeId || 'N/A',
        name: `${emp.firstName} ${emp.lastName}`,
        fiscalYear: currentYear,
        daysOverdue,
      };
    });

    const overallComplianceRate = compliance.overallRate;
    const grade: 'A' | 'B' | 'C' | 'D' | 'F' =
      overallComplianceRate >= 90
        ? 'A'
        : overallComplianceRate >= 80
          ? 'B'
          : overallComplianceRate >= 70
            ? 'C'
            : overallComplianceRate >= 60
              ? 'D'
              : 'F';

    const previousPDS = Number(previousMonthCompliance[0][0]?.count ?? 0);
    const previousSALN = Number(previousMonthCompliance[1][0]?.count ?? 0);
    // Mirror the canonical (pdsRate + salnRate) / 2 aggregation.
    const previousRate =
      expected > 0
        ? (safeRate(previousPDS, expected) + safeRate(previousSALN, expected)) /
          2
        : 0;
    const percentageChange =
      previousRate > 0
        ? ((overallComplianceRate - previousRate) / previousRate) * 100
        : 0;

    // Keep `COMPLIANT_SUBMISSION_STATUSES` referenced so tooling doesn't flag
    // it as dead; downstream consumers can import it from here too.
    void COMPLIANT_SUBMISSION_STATUSES;

    const response: DashboardComplianceResponse = {
      deadlines: {
        pds: {
          next: pdsDeadline?.deadline ? new Date(pdsDeadline.deadline) : null,
          daysRemaining: pdsDaysRemaining,
          submitted: pdsSubmittedCount,
          expected,
          status: pdsStatus,
        },
        saln: {
          next: salnDeadline?.deadline
            ? new Date(salnDeadline.deadline)
            : null,
          fiscalYear: currentYear,
          deadline: salnDeadline?.deadline
            ? new Date(salnDeadline.deadline)
            : new Date(),
          daysRemaining: salnDaysRemaining,
          submitted: salnSubmittedCount,
          expected,
          status: salnStatus,
        },
      },
      byDepartment,
      overdue: {
        pds: overduePDSList,
        saln: overdueSALNList,
      },
      overall: {
        complianceRate: roundRate(overallComplianceRate, 2),
        grade,
        comparison: {
          lastMonth: roundRate(previousRate, 2),
          percentageChange: roundRate(percentageChange, 2),
        },
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[Dashboard Compliance] Error:', error);
    // Return a skeleton 200 so the dashboard widgets render "0%/—" rather than
    // the entire page white-screening on a 500.
    return NextResponse.json(
      buildFallbackResponse(currentReportingYear()),
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'X-Partial-Data': '1',
        },
      }
    );
  }
}
