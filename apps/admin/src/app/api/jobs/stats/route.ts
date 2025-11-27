/**
 * Jobs Statistics API
 * GET /api/jobs/stats
 *
 * Provides aggregated statistics for job positions management dashboard
 */

import { NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { db, openPositions, jobApplications, departments } from '@tupsafe/database/server';
import { eq, sql, count, and, gte, desc } from 'drizzle-orm';
import type { JobsStatsResponse } from '@tupsafe/types/admin/jobs';

/**
 * GET /api/jobs/stats
 * Get comprehensive job positions statistics
 */
export async function GET() {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get status counts
    const statusCounts = await db
      .select({
        status: openPositions.status,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(openPositions)
      .groupBy(openPositions.status);

    const byStatus = {
      open: 0,
      closed: 0,
      filled: 0,
      cancelled: 0,
    };

    statusCounts.forEach((sc) => {
      if (sc.status && sc.status in byStatus) {
        byStatus[sc.status as keyof typeof byStatus] = sc.count;
      }
    });

    // Get category counts
    const categoryCounts = await db
      .select({
        category: openPositions.employmentCategory,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(openPositions)
      .where(eq(openPositions.status, 'open'))
      .groupBy(openPositions.employmentCategory);

    const byCategory = {
      faculty: 0,
      administrative: 0,
      contractual: 0,
    };

    categoryCounts.forEach((cc) => {
      if (cc.category && cc.category in byCategory) {
        byCategory[cc.category as keyof typeof byCategory] = cc.count;
      }
    });

    // Get total applications count
    const [{ totalApplications }] = await db
      .select({ totalApplications: count() })
      .from(jobApplications);

    // Get total active positions
    const totalActivePositions = byStatus.open;

    // Calculate average applications per position
    const avgApplications =
      totalActivePositions > 0
        ? Math.round((totalApplications / totalActivePositions) * 10) / 10
        : 0;

    // Get upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingDeadlinesRaw = await db
      .select({
        positionId: openPositions.id,
        positionTitle: openPositions.positionTitle,
        deadline: openPositions.applicationDeadline,
        applicationsReceived: openPositions.applicationsReceived,
      })
      .from(openPositions)
      .where(
        and(
          eq(openPositions.status, 'open'),
          gte(openPositions.applicationDeadline, new Date())
        )
      )
      .orderBy(openPositions.applicationDeadline)
      .limit(5);

    const upcomingDeadlines = upcomingDeadlinesRaw.map((d) => {
      const daysRemaining = Math.ceil(
        (new Date(d.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return {
        positionId: d.positionId,
        positionTitle: d.positionTitle,
        deadline: d.deadline,
        daysRemaining: Math.max(0, daysRemaining),
        applicationsReceived: d.applicationsReceived || 0,
      };
    });

    // Get recent activity
    const recentPositions = await db
      .select({
        id: openPositions.id,
        positionTitle: openPositions.positionTitle,
        status: openPositions.status,
        postedAt: openPositions.postedAt,
        closedAt: openPositions.closedAt,
      })
      .from(openPositions)
      .orderBy(desc(openPositions.updatedAt))
      .limit(5);

    const recentActivity = recentPositions
      .map((p) => {
        let type: 'position_posted' | 'position_closed' | 'position_filled';
        let timestamp: Date;

        if (p.status === 'filled') {
          type = 'position_filled';
          timestamp = p.closedAt || p.postedAt || new Date();
        } else if (p.status === 'closed' || p.status === 'cancelled') {
          type = 'position_closed';
          timestamp = p.closedAt || p.postedAt || new Date();
        } else {
          type = 'position_posted';
          timestamp = p.postedAt || new Date();
        }

        return {
          type,
          positionId: p.id,
          positionTitle: p.positionTitle,
          timestamp,
        };
      })
      .filter((a) => a.timestamp !== null);

    // Get top positions by applications
    const topPositions = await db
      .select({
        positionId: openPositions.id,
        positionTitle: openPositions.positionTitle,
        applicationsReceived: openPositions.applicationsReceived,
        status: openPositions.status,
      })
      .from(openPositions)
      .orderBy(desc(openPositions.applicationsReceived))
      .limit(5);

    const response: JobsStatsResponse = {
      overview: {
        totalActivePositions,
        totalApplicationsReceived: totalApplications,
        positionsFilled: byStatus.filled,
        averageApplicationsPerPosition: avgApplications,
      },
      byStatus,
      byCategory,
      upcomingDeadlines,
      recentActivity,
      topPositions: topPositions.map((p) => ({
        positionId: p.positionId,
        positionTitle: p.positionTitle,
        applicationsReceived: p.applicationsReceived || 0,
        status: p.status || 'open',
      })),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Jobs stats error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch job statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
