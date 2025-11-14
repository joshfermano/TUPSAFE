import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tupsafe/database/server';
import {
  profiles,
  departments,
  pdsSubmissions,
  salnSubmissions,
  submissionDeadlines,
} from '@tupsafe/database/schema';
import { eq, and, sql, desc, isNull } from 'drizzle-orm';
import type { DashboardComplianceResponse } from '@tupsafe/types';

/**
 * GET /api/dashboard/compliance
 *
 * Detailed compliance tracking with deadlines
 *
 * Features:
 * - Upcoming PDS/SALN deadlines
 * - Submission status breakdown
 * - Overdue submissions
 * - Department-level compliance
 * - Individual employee compliance status
 * - Compliance grading system
 *
 * Caching: 5 minutes (compliance data is time-sensitive)
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

    // Execute queries in parallel
    const [
      pdsDeadlineData,
      salnDeadlineData,
      totalEmployees,
      pdsApproved,
      salnApproved,
      departmentCompliance,
      overduePDS,
      overdueSALN,
      previousMonthCompliance,
    ] = await Promise.all([
      // PDS deadline
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
            sql`${submissionDeadlines.deadlineDate} >= ${now}`
          )
        )
        .orderBy(submissionDeadlines.deadlineDate)
        .limit(1),

      // SALN deadline
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

      // Total employees
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(profiles)
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active')
          )
        ),

      // PDS approved count
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${pdsSubmissions.userId})` })
        .from(pdsSubmissions)
        .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active'),
            eq(pdsSubmissions.status, 'approved')
          )
        ),

      // SALN approved count (current year)
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${salnSubmissions.userId})` })
        .from(salnSubmissions)
        .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active'),
            eq(salnSubmissions.status, 'approved'),
            eq(salnSubmissions.year, currentYear)
          )
        ),

      // Department-level compliance
      db
        .select({
          departmentName: departments.name,
          totalUsers: sql<number>`COUNT(DISTINCT ${profiles.id})`,
          pdsSubmitted: sql<number>`COUNT(DISTINCT CASE WHEN ${pdsSubmissions.status} = 'approved' THEN ${pdsSubmissions.userId} END)`,
          salnSubmitted: sql<number>`COUNT(DISTINCT CASE WHEN ${salnSubmissions.status} = 'approved' AND ${salnSubmissions.year} = ${currentYear} THEN ${salnSubmissions.userId} END)`,
        })
        .from(departments)
        .leftJoin(profiles, and(
          eq(profiles.departmentId, departments.id),
          eq(profiles.userType, 'employee'),
          eq(profiles.accountStatus, 'active')
        ))
        .leftJoin(pdsSubmissions, and(
          eq(pdsSubmissions.userId, profiles.id),
          eq(pdsSubmissions.status, 'approved')
        ))
        .leftJoin(salnSubmissions, and(
          eq(salnSubmissions.userId, profiles.id),
          eq(salnSubmissions.status, 'approved'),
          eq(salnSubmissions.year, currentYear)
        ))
        .groupBy(departments.id, departments.name)
        .orderBy(departments.name),

      // Overdue PDS submissions
      db
        .select({
          employeeId: profiles.employeeId,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .leftJoin(pdsSubmissions, and(
          eq(pdsSubmissions.userId, profiles.id),
          eq(pdsSubmissions.status, 'approved')
        ))
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active'),
            isNull(pdsSubmissions.id) // No approved PDS
          )
        )
        .limit(20), // Limit for performance

      // Overdue SALN submissions
      db
        .select({
          employeeId: profiles.employeeId,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .leftJoin(salnSubmissions, and(
          eq(salnSubmissions.userId, profiles.id),
          eq(salnSubmissions.status, 'approved'),
          eq(salnSubmissions.year, currentYear)
        ))
        .where(
          and(
            eq(profiles.userType, 'employee'),
            eq(profiles.accountStatus, 'active'),
            isNull(salnSubmissions.id) // No approved SALN for current year
          )
        )
        .limit(20),

      // Previous month compliance (for comparison)
      Promise.all([
        db
          .select({ count: sql<number>`COUNT(DISTINCT ${pdsSubmissions.userId})` })
          .from(pdsSubmissions)
          .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
          .where(
            and(
              eq(profiles.userType, 'employee'),
              eq(pdsSubmissions.status, 'approved'),
              sql`${pdsSubmissions.approvedAt} < ${oneMonthAgo}`
            )
          ),
        db
          .select({ count: sql<number>`COUNT(DISTINCT ${salnSubmissions.userId})` })
          .from(salnSubmissions)
          .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
          .where(
            and(
              eq(profiles.userType, 'employee'),
              eq(salnSubmissions.status, 'approved'),
              eq(salnSubmissions.year, currentYear),
              sql`${salnSubmissions.approvedAt} < ${oneMonthAgo}`
            )
          ),
      ]),
    ]);

    // Process deadline data
    const pdsDeadline = pdsDeadlineData[0];
    const salnDeadline = salnDeadlineData[0];

    const expected = Number(totalEmployees[0]?.count ?? 0);
    const pdsSubmittedCount = Number(pdsApproved[0]?.count ?? 0);
    const salnSubmittedCount = Number(salnApproved[0]?.count ?? 0);

    // Calculate PDS deadline info
    const pdsDaysRemaining = pdsDeadline
      ? Math.ceil((new Date(pdsDeadline.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const pdsRate = expected > 0 ? (pdsSubmittedCount / expected) * 100 : 0;
    const pdsStatus: 'on-track' | 'at-risk' | 'overdue' =
      pdsRate >= 80
        ? 'on-track'
        : pdsRate >= 50
          ? 'at-risk'
          : 'overdue';

    // Calculate SALN deadline info
    const salnDaysRemaining = salnDeadline
      ? Math.ceil((new Date(salnDeadline.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const salnRate = expected > 0 ? (salnSubmittedCount / expected) * 100 : 0;
    const salnStatus: 'on-track' | 'at-risk' | 'overdue' =
      salnRate >= 80
        ? 'on-track'
        : salnRate >= 50
          ? 'at-risk'
          : 'overdue';

    // Process department compliance
    const byDepartment = departmentCompliance.map((dept) => {
      const total = Number(dept.totalUsers);
      const pds = Number(dept.pdsSubmitted);
      const saln = Number(dept.salnSubmitted);

      return {
        department: dept.departmentName,
        pdsRate: total > 0 ? Number(((pds / total) * 100).toFixed(2)) : 0,
        salnRate: total > 0 ? Number(((saln / total) * 100).toFixed(2)) : 0,
        overdue: Math.max(0, total - pds) + Math.max(0, total - saln),
      };
    });

    // Process overdue lists
    const overduePDSList = overduePDS.map((emp) => {
      const daysOverdue = Math.ceil((now.getTime() - emp.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return {
        employeeId: emp.employeeId || 'N/A',
        name: `${emp.firstName} ${emp.lastName}`,
        daysOverdue,
      };
    });

    const overdueSALNList = overdueSALN.map((emp) => {
      const daysOverdue = Math.ceil((now.getTime() - emp.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return {
        employeeId: emp.employeeId || 'N/A',
        name: `${emp.firstName} ${emp.lastName}`,
        fiscalYear: currentYear,
        daysOverdue,
      };
    });

    // Calculate overall compliance
    const overallComplianceRate = (pdsRate + salnRate) / 2;
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

    // Calculate previous month comparison
    const previousPDS = Number(previousMonthCompliance[0][0]?.count ?? 0);
    const previousSALN = Number(previousMonthCompliance[1][0]?.count ?? 0);
    const previousRate = expected > 0 ? ((previousPDS + previousSALN) / (expected * 2)) * 100 : 0;
    const percentageChange = previousRate > 0 ? ((overallComplianceRate - previousRate) / previousRate) * 100 : 0;

    // Construct response
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
          next: salnDeadline?.deadline ? new Date(salnDeadline.deadline) : null,
          fiscalYear: currentYear,
          deadline: salnDeadline?.deadline ? new Date(salnDeadline.deadline) : new Date(),
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
        complianceRate: Number(overallComplianceRate.toFixed(2)),
        grade,
        comparison: {
          lastMonth: Number(previousRate.toFixed(2)),
          percentageChange: Number(percentageChange.toFixed(2)),
        },
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60', // 5 minutes
      },
    });
  } catch (error) {
    console.error('[Dashboard Compliance] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}
