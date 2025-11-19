import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tupsafe/database/server';
import {
  profiles,
  pendingRegistrations,
  pdsSubmissions,
  salnSubmissions,
} from '@tupsafe/database/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import {
  trendsQuerySchema,
  type DashboardTrendsResponse,
  type TrendDataPoint,
} from '@tupsafe/types';

/**
 * GET /api/dashboard/trends
 *
 * Historical trend data for charts and visualizations
 *
 * Query Parameters:
 * - period: 'week' | 'month' | 'quarter' | 'year' (default: 'month')
 * - metric: 'users' | 'registrations' | 'submissions' | 'compliance'
 * - groupBy: 'day' | 'week' | 'month' (default: 'day')
 *
 * Caching: 15 minutes
 * Performance: Optimized aggregation queries
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = trendsQuerySchema.parse({
      period: searchParams.get('period') || 'month',
      metric: searchParams.get('metric') || 'users',
      groupBy: searchParams.get('groupBy') || 'day',
    });

    const { period, metric, groupBy } = params;

    // Calculate date ranges
    const endDate = new Date();
    const startDate = getStartDate(period, endDate);
    const comparisonStartDate = getComparisonStartDate(period, startDate);

    // Fetch trend data based on metric
    let trendData: TrendDataPoint[] = [];
    let comparisonData: TrendDataPoint[] = [];

    switch (metric) {
      case 'users':
        [trendData, comparisonData] = await getUserTrends(
          startDate,
          endDate,
          comparisonStartDate,
          groupBy
        );
        break;
      case 'registrations':
        [trendData, comparisonData] = await getRegistrationTrends(
          startDate,
          endDate,
          comparisonStartDate,
          groupBy
        );
        break;
      case 'submissions':
        [trendData, comparisonData] = await getSubmissionTrends(
          startDate,
          endDate,
          comparisonStartDate,
          groupBy
        );
        break;
      case 'compliance':
        [trendData, comparisonData] = await getComplianceTrends(
          startDate,
          endDate,
          comparisonStartDate,
          groupBy
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid metric parameter' },
          { status: 400 }
        );
    }

    // Calculate summary statistics
    const summary = calculateSummary(trendData, comparisonData);

    // Construct response
    const response: DashboardTrendsResponse = {
      period,
      metric,
      data: trendData,
      summary,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=900, stale-while-revalidate=120', // 15 minutes
      },
    });
  } catch (error) {
    console.error('[Dashboard Trends] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    );
  }
}

/**
 * Get user growth trends
 */
async function getUserTrends(
  startDate: Date,
  endDate: Date,
  comparisonStartDate: Date,
  groupBy: 'day' | 'week' | 'month'
): Promise<[TrendDataPoint[], TrendDataPoint[]]> {
  const dateFormat = getDateFormat(groupBy);

  // Convert dates to ISO strings for sql template
  const endDateStr = endDate.toISOString();
  const startDateStr = startDate.toISOString();

  // Use sql.raw() to inline the date format string
  // This ensures PostgreSQL sees the exact same expression in SELECT and GROUP BY
  const dateExpression = sql.raw(`TO_CHAR("profiles"."created_at", '${dateFormat}')`);

  const [currentPeriod, previousPeriod] = await Promise.all([
    db
      .select({
        date: sql<string>`${dateExpression}`,
        value: sql<number>`COUNT(*)`,
        userType: profiles.userType,
      })
      .from(profiles)
      .where(
        and(gte(profiles.createdAt, startDate), sql`${profiles.createdAt} <= ${endDateStr}`)
      )
      .groupBy(sql`${dateExpression}`, profiles.userType)
      .orderBy(sql`${dateExpression}`),

    db
      .select({
        date: sql<string>`${dateExpression}`,
        value: sql<number>`COUNT(*)`,
        userType: profiles.userType,
      })
      .from(profiles)
      .where(
        and(
          gte(profiles.createdAt, comparisonStartDate),
          sql`${profiles.createdAt} < ${startDateStr}`
        )
      )
      .groupBy(sql`${dateExpression}`, profiles.userType)
      .orderBy(sql`${dateExpression}`),
  ]);

  // Aggregate by date with breakdown
  const trendMap = new Map<string, TrendDataPoint>();
  currentPeriod.forEach((row) => {
    const existing = trendMap.get(row.date) || {
      date: row.date,
      value: 0,
      breakdown: {},
    };
    existing.value += Number(row.value);
    existing.breakdown![row.userType] = Number(row.value);
    trendMap.set(row.date, existing);
  });

  const comparisonMap = new Map<string, TrendDataPoint>();
  previousPeriod.forEach((row) => {
    const existing = comparisonMap.get(row.date) || {
      date: row.date,
      value: 0,
      breakdown: {},
    };
    existing.value += Number(row.value);
    existing.breakdown![row.userType] = Number(row.value);
    comparisonMap.set(row.date, existing);
  });

  return [Array.from(trendMap.values()), Array.from(comparisonMap.values())];
}

/**
 * Get registration trends
 */
async function getRegistrationTrends(
  startDate: Date,
  endDate: Date,
  comparisonStartDate: Date,
  groupBy: 'day' | 'week' | 'month'
): Promise<[TrendDataPoint[], TrendDataPoint[]]> {
  const dateFormat = getDateFormat(groupBy);

  // Convert dates to ISO strings for sql template
  const endDateStr = endDate.toISOString();
  const startDateStr = startDate.toISOString();

  // Use sql.raw() to inline the date format string
  const dateExpression = sql.raw(`TO_CHAR("pending_registrations"."created_at", '${dateFormat}')`);

  const [currentPeriod, previousPeriod] = await Promise.all([
    db
      .select({
        date: sql<string>`${dateExpression}`,
        value: sql<number>`COUNT(*)`,
        status: pendingRegistrations.status,
      })
      .from(pendingRegistrations)
      .where(
        and(
          gte(pendingRegistrations.createdAt, startDate),
          sql`${pendingRegistrations.createdAt} <= ${endDateStr}`
        )
      )
      .groupBy(sql`${dateExpression}`, pendingRegistrations.status)
      .orderBy(sql`${dateExpression}`),

    db
      .select({
        date: sql<string>`${dateExpression}`,
        value: sql<number>`COUNT(*)`,
        status: pendingRegistrations.status,
      })
      .from(pendingRegistrations)
      .where(
        and(
          gte(pendingRegistrations.createdAt, comparisonStartDate),
          sql`${pendingRegistrations.createdAt} < ${startDateStr}`
        )
      )
      .groupBy(sql`${dateExpression}`, pendingRegistrations.status)
      .orderBy(sql`${dateExpression}`),
  ]);

  return aggregateTrendData(currentPeriod, previousPeriod, 'status');
}

/**
 * Get submission trends (PDS + SALN)
 */
async function getSubmissionTrends(
  startDate: Date,
  endDate: Date,
  comparisonStartDate: Date,
  groupBy: 'day' | 'week' | 'month'
): Promise<[TrendDataPoint[], TrendDataPoint[]]> {
  const dateFormat = getDateFormat(groupBy);

  // Convert dates to ISO strings for sql template
  const endDateStr = endDate.toISOString();
  const startDateStr = startDate.toISOString();

  // Use sql.raw() to inline the date format string
  const pdsDateExpression = sql.raw(`TO_CHAR("pds_submissions"."created_at", '${dateFormat}')`);
  const salnDateExpression = sql.raw(`TO_CHAR("saln_submissions"."created_at", '${dateFormat}')`);

  const [currentPDS, currentSALN, previousPDS, previousSALN] = await Promise.all([
    // Current period PDS
    db
      .select({
        date: sql<string>`${pdsDateExpression}`,
        value: sql<number>`COUNT(*)`,
        type: sql<string>`'pds'`,
      })
      .from(pdsSubmissions)
      .where(
        and(
          gte(pdsSubmissions.createdAt, startDate),
          sql`${pdsSubmissions.createdAt} <= ${endDateStr}`
        )
      )
      .groupBy(sql`${pdsDateExpression}`)
      .orderBy(sql`${pdsDateExpression}`),

    // Current period SALN
    db
      .select({
        date: sql<string>`${salnDateExpression}`,
        value: sql<number>`COUNT(*)`,
        type: sql<string>`'saln'`,
      })
      .from(salnSubmissions)
      .where(
        and(
          gte(salnSubmissions.createdAt, startDate),
          sql`${salnSubmissions.createdAt} <= ${endDateStr}`
        )
      )
      .groupBy(sql`${salnDateExpression}`)
      .orderBy(sql`${salnDateExpression}`),

    // Previous period PDS
    db
      .select({
        date: sql<string>`${pdsDateExpression}`,
        value: sql<number>`COUNT(*)`,
        type: sql<string>`'pds'`,
      })
      .from(pdsSubmissions)
      .where(
        and(
          gte(pdsSubmissions.createdAt, comparisonStartDate),
          sql`${pdsSubmissions.createdAt} < ${startDateStr}`
        )
      )
      .groupBy(sql`${pdsDateExpression}`)
      .orderBy(sql`${pdsDateExpression}`),

    // Previous period SALN
    db
      .select({
        date: sql<string>`${salnDateExpression}`,
        value: sql<number>`COUNT(*)`,
        type: sql<string>`'saln'`,
      })
      .from(salnSubmissions)
      .where(
        and(
          gte(salnSubmissions.createdAt, comparisonStartDate),
          sql`${salnSubmissions.createdAt} < ${startDateStr}`
        )
      )
      .groupBy(sql`${salnDateExpression}`)
      .orderBy(sql`${salnDateExpression}`),
  ]);

  const currentCombined = [...currentPDS, ...currentSALN];
  const previousCombined = [...previousPDS, ...previousSALN];

  return aggregateTrendData(currentCombined, previousCombined, 'type');
}

/**
 * Get compliance trends
 */
async function getComplianceTrends(
  startDate: Date,
  endDate: Date,
  comparisonStartDate: Date,
  groupBy: 'day' | 'week' | 'month'
): Promise<[TrendDataPoint[], TrendDataPoint[]]> {
  // For compliance, we calculate rate over time
  // This is more complex - calculate approved submissions vs total employees
  const dateFormat = getDateFormat(groupBy);

  // Convert dates to ISO strings for sql template
  const endDateStr = endDate.toISOString();
  const startDateStr = startDate.toISOString();

  // Use sql.raw() to inline the date format string
  const dateExpression = sql.raw(`TO_CHAR("pds_submissions"."approved_at", '${dateFormat}')`);

  const [currentApproved, previousApproved] = await Promise.all([
    db
      .select({
        date: sql<string>`${dateExpression}`,
        value: sql<number>`COUNT(*)`,
      })
      .from(pdsSubmissions)
      .where(
        and(
          eq(pdsSubmissions.status, 'approved'),
          gte(pdsSubmissions.approvedAt, startDate),
          sql`${pdsSubmissions.approvedAt} <= ${endDateStr}`
        )
      )
      .groupBy(sql`${dateExpression}`)
      .orderBy(sql`${dateExpression}`),

    db
      .select({
        date: sql<string>`${dateExpression}`,
        value: sql<number>`COUNT(*)`,
      })
      .from(pdsSubmissions)
      .where(
        and(
          eq(pdsSubmissions.status, 'approved'),
          gte(pdsSubmissions.approvedAt, comparisonStartDate),
          sql`${pdsSubmissions.approvedAt} < ${startDateStr}`
        )
      )
      .groupBy(sql`${dateExpression}`)
      .orderBy(sql`${dateExpression}`),
  ]);

  const trendData = currentApproved.map((row) => ({
    date: row.date,
    value: Number(row.value),
  }));

  const comparisonData = previousApproved.map((row) => ({
    date: row.date,
    value: Number(row.value),
  }));

  return [trendData, comparisonData];
}

/**
 * Aggregate trend data with breakdown
 */
interface TrendRow {
  date: string;
  value: number;
  [key: string]: string | number;
}

function aggregateTrendData(
  current: TrendRow[],
  previous: TrendRow[],
  breakdownKey: string
): [TrendDataPoint[], TrendDataPoint[]] {
  const trendMap = new Map<string, TrendDataPoint>();
  current.forEach((row: TrendRow) => {
    const existing = trendMap.get(row.date) || {
      date: row.date,
      value: 0,
      breakdown: {} as Record<string, number>,
    };
    existing.value += Number(row.value);
    const breakdownKeyValue = row[breakdownKey] as string;
    (existing.breakdown as Record<string, number>)[breakdownKeyValue] = Number(row.value);
    trendMap.set(row.date, existing);
  });

  const comparisonMap = new Map<string, TrendDataPoint>();
  previous.forEach((row: TrendRow) => {
    const existing = comparisonMap.get(row.date) || {
      date: row.date,
      value: 0,
      breakdown: {} as Record<string, number>,
    };
    existing.value += Number(row.value);
    const breakdownKeyValue = row[breakdownKey] as string;
    (existing.breakdown as Record<string, number>)[breakdownKeyValue] = Number(row.value);
    comparisonMap.set(row.date, existing);
  });

  return [Array.from(trendMap.values()), Array.from(comparisonMap.values())];
}

/**
 * Calculate summary statistics
 */
function calculateSummary(
  trendData: TrendDataPoint[],
  comparisonData: TrendDataPoint[]
): DashboardTrendsResponse['summary'] {
  const total = trendData.reduce((sum, point) => sum + point.value, 0);
  const average = trendData.length > 0 ? total / trendData.length : 0;

  const peak = trendData.reduce(
    (max, point) => (point.value > max.value ? point : max),
    { value: 0, date: new Date() }
  );

  const comparisonTotal = comparisonData.reduce((sum, point) => sum + point.value, 0);
  const percentageChange =
    comparisonTotal > 0 ? ((total - comparisonTotal) / comparisonTotal) * 100 : 0;

  const trend: 'up' | 'down' | 'stable' =
    percentageChange > 5 ? 'up' : percentageChange < -5 ? 'down' : 'stable';

  return {
    total,
    average: Number(average.toFixed(2)),
    peak: {
      value: peak.value,
      date: new Date(peak.date),
    },
    trend,
    percentageChange: Number(percentageChange.toFixed(2)),
  };
}

/**
 * Get start date based on period
 */
function getStartDate(period: string, endDate: Date): Date {
  const start = new Date(endDate);
  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  return start;
}

/**
 * Get comparison start date (previous period)
 */
function getComparisonStartDate(period: string, currentStart: Date): Date {
  const comparisonStart = new Date(currentStart);
  switch (period) {
    case 'week':
      comparisonStart.setDate(comparisonStart.getDate() - 7);
      break;
    case 'month':
      comparisonStart.setMonth(comparisonStart.getMonth() - 1);
      break;
    case 'quarter':
      comparisonStart.setMonth(comparisonStart.getMonth() - 3);
      break;
    case 'year':
      comparisonStart.setFullYear(comparisonStart.getFullYear() - 1);
      break;
  }
  return comparisonStart;
}

/**
 * Get PostgreSQL date format string
 */
function getDateFormat(groupBy: 'day' | 'week' | 'month'): string {
  switch (groupBy) {
    case 'day':
      return 'YYYY-MM-DD';
    case 'week':
      return 'IYYY-IW'; // ISO week format
    case 'month':
      return 'YYYY-MM';
  }
}
