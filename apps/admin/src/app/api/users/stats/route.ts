/**
 * User Management API - Statistics
 * GET /api/users/stats
 *
 * Provides comprehensive user statistics for admin dashboard
 *
 * Features:
 * - Total user counts and breakdowns
 * - Active vs inactive users
 * - Pending approvals count
 * - User distribution by role, type, and status
 * - Recent registration trends (7 days, 30 days)
 * - Employment category distribution
 * - Optimized aggregation queries
 *
 * Security:
 * - Requires admin, hr, or supervisor role
 * - Cached results for performance (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { db, profiles } from '@tupsafe/database/server';
import { eq, and, gte, sql, count } from 'drizzle-orm';
import type { UserStatsResponse } from '@tupsafe/types';

export async function GET(_request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('[Stats API] Request received');

    // Verify permissions (using Supabase session)
    const authStartTime = Date.now();
    const hasPermission = await checkUserRoleFromSupabase(['admin', 'hr', 'supervisor'], 'admin');
    const authDuration = Date.now() - authStartTime;
    console.log(`[Stats API] Permission check completed in ${authDuration}ms - result:`, hasPermission);

    if (!hasPermission) {
      console.log('[Stats API] Permission denied - returning 403');
      return NextResponse.json(
        { error: 'Unauthorized. Admin, HR, or Supervisor role required.' },
        { status: 403 }
      );
    }

    console.log('[Stats API] Permission granted - fetching stats');

    // Calculate date ranges for recent registration trends
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute all statistics queries in parallel for optimal performance
    const queryStartTime = Date.now();
    const [
      // Total counts
      [{ totalUsers }],
      [{ activeUsers }],
      [{ pendingApprovals }],
      [{ suspendedUsers }],

      // User type distribution
      [{ employeesCount }],
      [{ applicantsCount }],

      // Role distribution
      roleDistribution,

      // Account status distribution
      statusDistribution,

      // Employment category distribution (for employees only)
      employmentCategoryDistribution,

      // Recent registrations
      [{ recentSevenDays }],
      [{ recentThirtyDays }],
    ] = await Promise.all([
      // Total users
      db.select({ totalUsers: count() }).from(profiles),

      // Active users
      db
        .select({ activeUsers: count() })
        .from(profiles)
        .where(
          and(eq(profiles.isActive, true), eq(profiles.accountStatus, 'active'))
        ),

      // Pending approvals
      db
        .select({ pendingApprovals: count() })
        .from(profiles)
        .where(eq(profiles.accountStatus, 'pending')),

      // Suspended users
      db
        .select({ suspendedUsers: count() })
        .from(profiles)
        .where(eq(profiles.accountStatus, 'suspended')),

      // Employees count
      db
        .select({ employeesCount: count() })
        .from(profiles)
        .where(eq(profiles.userType, 'employee')),

      // Applicants count
      db
        .select({ applicantsCount: count() })
        .from(profiles)
        .where(eq(profiles.userType, 'applicant')),

      // Role distribution - aggregate counts by role
      db
        .select({
          role: profiles.role,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(profiles)
        .groupBy(profiles.role),

      // Account status distribution
      db
        .select({
          status: profiles.accountStatus,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(profiles)
        .groupBy(profiles.accountStatus),

      // Employment category distribution (employees only)
      db
        .select({
          category: profiles.employmentCategory,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(profiles)
        .where(
          and(
            eq(profiles.userType, 'employee'),
            sql`${profiles.employmentCategory} != 'not_applicable'`
          )
        )
        .groupBy(profiles.employmentCategory),

      // Recent registrations - last 7 days
      db
        .select({ recentSevenDays: count() })
        .from(profiles)
        .where(gte(profiles.createdAt, sevenDaysAgo)),

      // Recent registrations - last 30 days
      db
        .select({ recentThirtyDays: count() })
        .from(profiles)
        .where(gte(profiles.createdAt, thirtyDaysAgo)),
    ]);
    const queryDuration = Date.now() - queryStartTime;
    console.log(`[Stats API] All queries completed in ${queryDuration}ms`);

    // Transform role distribution into keyed object
    const roleDistributionMap = {
      employee: 0,
      hr: 0,
      admin: 0,
      supervisor: 0,
      auditor: 0,
    };

    roleDistribution.forEach((item) => {
      if (item.role in roleDistributionMap) {
        roleDistributionMap[item.role as keyof typeof roleDistributionMap] =
          item.count;
      }
    });

    // Transform account status distribution into keyed object
    const statusDistributionMap = {
      pending: 0,
      active: 0,
      suspended: 0,
      rejected: 0,
    };

    statusDistribution.forEach((item) => {
      if (item.status in statusDistributionMap) {
        statusDistributionMap[
          item.status as keyof typeof statusDistributionMap
        ] = item.count;
      }
    });

    // Transform employment category distribution
    const employmentCategoryMap = {
      faculty: 0,
      administrative: 0,
      contractual: 0,
    };

    employmentCategoryDistribution.forEach((item) => {
      if (
        item.category &&
        item.category !== 'not_applicable' &&
        item.category in employmentCategoryMap
      ) {
        employmentCategoryMap[
          item.category as keyof typeof employmentCategoryMap
        ] = item.count;
      }
    });

    // Construct response
    const stats: UserStatsResponse = {
      total: totalUsers,
      activeUsers,
      pendingApprovals,
      suspendedUsers,
      byUserType: {
        employees: employeesCount,
        applicants: applicantsCount,
      },
      byRole: roleDistributionMap,
      byAccountStatus: statusDistributionMap,
      recentRegistrations: {
        last7Days: recentSevenDays,
        last30Days: recentThirtyDays,
      },
      byEmploymentCategory: employmentCategoryMap,
    };

    // Performance logging
    const totalDuration = Date.now() - startTime;
    console.log(`[Stats API] Total request duration: ${totalDuration}ms (auth: ${authDuration}ms, queries: ${queryDuration}ms)`);
    console.log('[Stats API] Returning stats:', JSON.stringify(stats, null, 2));

    // Add cache headers for performance (5 minute cache)
    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Response-Time': `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
