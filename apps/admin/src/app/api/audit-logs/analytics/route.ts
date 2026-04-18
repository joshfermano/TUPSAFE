import { NextResponse } from 'next/server';
import { db } from '@tupsafe/database/server';
import { auditLogs } from '@tupsafe/database/schema';
import { sql, desc, count, gte } from 'drizzle-orm';
import { subDays, format } from 'date-fns';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';

export const dynamic = 'force-dynamic';
/**
 * GET /api/audit-logs/analytics
 *
 * Provides aggregated analytics data for audit logs dashboard
 *
 * Returns:
 * - Activity timeline: Log counts over the last 30 days
 * - Action distribution: Breakdown of actions by type
 *
 * Features:
 * - Real-time aggregated data
 * - Optimized queries with proper indexing
 * - Date-based grouping for timeline
 *
 * Caching: 1 minute (relatively fresh for analytics)
 */
export async function GET() {
  try {
    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Query 1: Activity Timeline (last 30 days, grouped by date)
    const timelineData = await db
      .select({
        date: sql<string>`DATE(${auditLogs.createdAt})`,
        count: count(),
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${auditLogs.createdAt})`)
      .orderBy(sql`DATE(${auditLogs.createdAt}) ASC`);

    // Fill in missing dates with zero counts
    const timeline = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dataPoint = timelineData.find((d) => d.date === dateStr);

      timeline.push({
        date: format(date, 'MM/dd'),
        fullDate: dateStr,
        count: dataPoint?.count || 0,
      });
    }

    // Query 2: Action Distribution (all time, grouped by action)
    const distributionData = await db
      .select({
        action: auditLogs.action,
        count: count(),
      })
      .from(auditLogs)
      .groupBy(auditLogs.action)
      .orderBy(desc(count()))
      .limit(10); // Top 10 actions

    // Map actions to more readable names
    const distribution = distributionData.map((item) => ({
      name: formatActionName(item.action),
      value: item.count,
      rawAction: item.action,
    }));

    // Construct response
    const response = {
      timeline,
      distribution,
      metadata: {
        timelineStartDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
        timelineEndDate: format(new Date(), 'yyyy-MM-dd'),
        totalDistributionActions: distribution.reduce((sum, item) => sum + item.value, 0),
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[Audit Logs Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log analytics' },
      { status: 500 }
    );
  }
}

/**
 * Format action name for display
 * Converts database action names to human-readable format
 */
function formatActionName(action: string): string {
  // Remove common prefixes
  let formatted = action
    .replace(/^(user\.|auth\.|submission\.|system\.|pds\.|saln\.|department\.|position\.)/, '');

  // Convert to title case and replace underscores
  formatted = formatted
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return formatted;
}
