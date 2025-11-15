/**
 * Registration Statistics API Route - GET /api/registrations/stats
 * Provides comprehensive metrics for the admin dashboard
 *
 * Features:
 * - Total pending registrations
 * - Approved/rejected counts by time period (today, week, month)
 * - Average approval time
 * - Breakdown by user type (employee vs applicant)
 * - Breakdown by department
 * - Optimized queries with aggregations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  profiles,
  pendingRegistrations,
  departments,
} from '@tupsafe/database/server';
import { eq, and, gte, sql, count } from 'drizzle-orm';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import type { RegistrationStats, ApiResponse } from '@tupsafe/types';

export async function GET(request: NextRequest) {
  try {
    // Authorization check - HR or Admin only (using Supabase session)
    const hasPermission = await checkUserRoleFromSupabase(['hr', 'admin']);

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Query 1: Count pending registrations
    const [pendingResult] = await db
      .select({ count: count() })
      .from(profiles)
      .where(eq(profiles.accountStatus, 'pending'));

    const pending = pendingResult?.count || 0;

    // Query 2: Count approved today
    const [approvedTodayResult] = await db
      .select({ count: count() })
      .from(profiles)
      .where(
        and(
          eq(profiles.accountStatus, 'active'),
          gte(profiles.approvedAt, todayStart)
        )
      );

    const approvedToday = approvedTodayResult?.count || 0;

    // Query 3: Count approved this week
    const [approvedWeekResult] = await db
      .select({ count: count() })
      .from(profiles)
      .where(
        and(
          eq(profiles.accountStatus, 'active'),
          gte(profiles.approvedAt, weekStart)
        )
      );

    const approvedWeek = approvedWeekResult?.count || 0;

    // Query 4: Count approved this month
    const [approvedMonthResult] = await db
      .select({ count: count() })
      .from(profiles)
      .where(
        and(
          eq(profiles.accountStatus, 'active'),
          gte(profiles.approvedAt, monthStart)
        )
      );

    const approvedMonth = approvedMonthResult?.count || 0;

    // Query 5: Count rejected today
    const [rejectedTodayResult] = await db
      .select({ count: count() })
      .from(pendingRegistrations)
      .where(
        and(
          eq(pendingRegistrations.status, 'rejected'),
          gte(pendingRegistrations.rejectedAt, todayStart)
        )
      );

    const rejectedToday = rejectedTodayResult?.count || 0;

    // Query 6: Count rejected this week
    const [rejectedWeekResult] = await db
      .select({ count: count() })
      .from(pendingRegistrations)
      .where(
        and(
          eq(pendingRegistrations.status, 'rejected'),
          gte(pendingRegistrations.rejectedAt, weekStart)
        )
      );

    const rejectedWeek = rejectedWeekResult?.count || 0;

    // Query 7: Count rejected this month
    const [rejectedMonthResult] = await db
      .select({ count: count() })
      .from(pendingRegistrations)
      .where(
        and(
          eq(pendingRegistrations.status, 'rejected'),
          gte(pendingRegistrations.rejectedAt, monthStart)
        )
      );

    const rejectedMonth = rejectedMonthResult?.count || 0;

    // Query 8: Calculate average approval time (in hours)
    // This calculates the average time between account creation and approval
    const approvalTimeResult = await db
      .select({
        avgHours: sql<number>`
          AVG(
            EXTRACT(EPOCH FROM (${profiles.approvedAt} - ${profiles.createdAt})) / 3600
          )
        `.as('avg_hours'),
      })
      .from(profiles)
      .where(
        and(
          eq(profiles.accountStatus, 'active'),
          sql`${profiles.approvedAt} IS NOT NULL`,
          gte(profiles.approvedAt, monthStart) // Only consider this month for relevance
        )
      );

    const averageApprovalTimeHours = Math.round(
      approvalTimeResult[0]?.avgHours || 0
    );

    // Query 9: Count pending by user type
    const byUserTypeResult = await db
      .select({
        userType: profiles.userType,
        count: count(),
      })
      .from(profiles)
      .where(eq(profiles.accountStatus, 'pending'))
      .groupBy(profiles.userType);

    const byUserType = {
      employee: 0,
      applicant: 0,
    };

    byUserTypeResult.forEach((row) => {
      if (row.userType === 'employee') {
        byUserType.employee = row.count;
      } else if (row.userType === 'applicant') {
        byUserType.applicant = row.count;
      }
    });

    // Query 10: Count pending by department
    const byDepartmentResult = await db
      .select({
        departmentId: profiles.departmentId,
        departmentName: departments.name,
        count: count(),
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .where(eq(profiles.accountStatus, 'pending'))
      .groupBy(profiles.departmentId, departments.name);

    const byDepartment = byDepartmentResult.map((row) => ({
      departmentId: row.departmentId,
      departmentName: row.departmentName || 'Unassigned',
      count: row.count,
    }));

    // Query for total approved (active accounts)
    const [approvedTotalResult] = await db
      .select({ count: count() })
      .from(profiles)
      .where(eq(profiles.accountStatus, 'active'));

    const approved = approvedTotalResult?.count || 0;

    // Query for total rejected
    const [rejectedTotalResult] = await db
      .select({ count: count() })
      .from(profiles)
      .where(eq(profiles.accountStatus, 'rejected'));

    const rejected = rejectedTotalResult?.count || 0;

    // Sort by count descending
    byDepartment.sort((a, b) => b.count - a.count);

    const stats: RegistrationStats = {
      pending,
      approvedToday,
      approved: {
        total: approved,
        thisWeek: approvedWeek,
        thisMonth: approvedMonth,
      },
      rejected: {
        total: rejected,
        thisWeek: rejectedWeek,
        thisMonth: rejectedMonth,
      },
      averageApprovalTime: `${(averageApprovalTimeHours / 24).toFixed(1)} days`,
      averageApprovalTimeHours,
      byDepartment,
      recentActivity: [], // TODO: Implement recent activity if needed
    };

    const response: ApiResponse<RegistrationStats> = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching registration statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
