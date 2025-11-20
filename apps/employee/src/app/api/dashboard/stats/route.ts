/**
 * Employee Portal Dashboard Statistics API
 * Returns user-specific dashboard statistics based on user type
 *
 * Security:
 * - Requires active session
 * - Account status must be 'active'
 *
 * Features:
 * For Employees:
 * - PDS submission status
 * - SALN submission status
 * - Upcoming deadlines
 * - Recent notifications
 * - Compliance status
 *
 * For Applicants:
 * - Active applications count
 * - Application status breakdown
 * - Recent applications
 * - Recommended positions
 * - Notification count
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import {
  profiles,
  pdsSubmissions,
  salnSubmissions,
  submissionDeadlines,
  notifications,
  jobApplications,
  openPositions,
} from '@tupsafe/database/schema';
import { eq, and, sql, gte, desc, lte } from 'drizzle-orm';

/**
 * GET /api/dashboard/stats
 * Fetch user-specific dashboard statistics
 */
export async function GET(_request: NextRequest) {
  try {
    // Get Supabase session
    const supabase = await createServerClient('employee');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user profile to determine user type
    const [profile] = await db
      .select({
        id: profiles.id,
        userType: profiles.userType,
        accountStatus: profiles.accountStatus,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        employmentCategory: profiles.employmentCategory,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.accountStatus !== 'active') {
      return NextResponse.json(
        { error: 'Account must be active to access dashboard' },
        { status: 403 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const nowStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Get unread notifications count (common for both user types)
    const [unreadNotifications] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    const unreadCount = Number(unreadNotifications?.count || 0);

    // Branch based on user type
    if (profile.userType === 'employee') {
      // EMPLOYEE STATISTICS

      // Get PDS submission status
      const [latestPDS] = await db
        .select({
          id: pdsSubmissions.id,
          status: pdsSubmissions.status,
          submittedAt: pdsSubmissions.submittedAt,
          approvedAt: pdsSubmissions.approvedAt,
        })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.userId, userId),
            eq(pdsSubmissions.isLatest, true)
          )
        )
        .orderBy(desc(pdsSubmissions.createdAt))
        .limit(1);

      // Get SALN submission status (current year)
      const [latestSALN] = await db
        .select({
          id: salnSubmissions.id,
          status: salnSubmissions.status,
          year: salnSubmissions.year,
          submittedAt: salnSubmissions.submittedAt,
          approvedAt: salnSubmissions.approvedAt,
        })
        .from(salnSubmissions)
        .where(
          and(
            eq(salnSubmissions.userId, userId),
            eq(salnSubmissions.year, currentYear)
          )
        )
        .orderBy(desc(salnSubmissions.createdAt))
        .limit(1);

      // Get upcoming deadlines (next 30 days)
      const upcomingDeadlines = await db
        .select({
          formType: submissionDeadlines.formType,
          year: submissionDeadlines.year,
          deadlineDate: submissionDeadlines.deadlineDate,
          reminderDaysBefore: submissionDeadlines.reminderDaysBefore,
        })
        .from(submissionDeadlines)
        .where(
          and(
            eq(submissionDeadlines.isActive, true),
            gte(submissionDeadlines.deadlineDate, nowStr),
            lte(submissionDeadlines.deadlineDate, thirtyDaysFromNow)
          )
        )
        .orderBy(submissionDeadlines.deadlineDate)
        .limit(5);

      // Calculate compliance status
      const pdsCompliant = latestPDS?.status === 'approved';
      const salnCompliant = latestSALN?.status === 'approved';
      const overallCompliance = pdsCompliant && salnCompliant;

      // Calculate days until deadlines
      const deadlinesWithDays = upcomingDeadlines.map((deadline) => {
        const deadlineDate = new Date(deadline.deadlineDate);
        const daysUntil = Math.ceil(
          (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          ...deadline,
          daysUntil,
          isUrgent: daysUntil <= 7,
        };
      });

      return NextResponse.json({
        success: true,
        userType: 'employee',
        stats: {
          pds: {
            status: latestPDS?.status || 'not_submitted',
            submittedAt: latestPDS?.submittedAt || null,
            approvedAt: latestPDS?.approvedAt || null,
            isCompliant: pdsCompliant,
          },
          saln: {
            status: latestSALN?.status || 'not_submitted',
            year: currentYear,
            submittedAt: latestSALN?.submittedAt || null,
            approvedAt: latestSALN?.approvedAt || null,
            isCompliant: salnCompliant,
          },
          compliance: {
            overall: overallCompliance,
            pds: pdsCompliant,
            saln: salnCompliant,
            status: overallCompliance
              ? 'compliant'
              : pdsCompliant || salnCompliant
                ? 'partial'
                : 'non_compliant',
          },
          deadlines: deadlinesWithDays,
          notifications: {
            unread: unreadCount,
          },
        },
      });
    } else {
      // APPLICANT STATISTICS

      // Get active applications count
      const [activeApplications] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(jobApplications)
        .where(
          and(
            eq(jobApplications.applicantId, userId),
            sql`${jobApplications.status} NOT IN ('rejected', 'withdrawn', 'hired')`
          )
        );

      const activeCount = Number(activeApplications?.count || 0);

      // Get application status breakdown
      const statusBreakdown = await db
        .select({
          status: jobApplications.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(jobApplications)
        .where(eq(jobApplications.applicantId, userId))
        .groupBy(jobApplications.status);

      // Get recent applications (last 5)
      const recentApplications = await db
        .select({
          id: jobApplications.id,
          applicationNumber: jobApplications.applicationNumber,
          status: jobApplications.status,
          applicationDate: jobApplications.applicationDate,
          positionId: jobApplications.positionId,
          positionTitle: openPositions.positionTitle,
          positionCode: openPositions.positionCode,
          departmentId: openPositions.departmentId,
        })
        .from(jobApplications)
        .leftJoin(
          openPositions,
          eq(jobApplications.positionId, openPositions.id)
        )
        .where(eq(jobApplications.applicantId, userId))
        .orderBy(desc(jobApplications.applicationDate))
        .limit(5);

      // Get recommended positions count (open, in applicant's employment category)
      const [recommendedCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(openPositions)
        .where(
          and(
            eq(openPositions.status, 'open'),
            eq(openPositions.isActive, true),
            gte(openPositions.applicationDeadline, now),
            // Match employment category if available
            profile.employmentCategory && profile.employmentCategory !== 'not_applicable'
              ? eq(openPositions.employmentCategory, profile.employmentCategory)
              : sql`1=1`
          )
        );

      const recommended = Number(recommendedCount?.count || 0);

      // Get PDS submission status (applicants can submit PDS for applications)
      const [latestPDS] = await db
        .select({
          id: pdsSubmissions.id,
          status: pdsSubmissions.status,
          submittedAt: pdsSubmissions.submittedAt,
        })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.userId, userId),
            eq(pdsSubmissions.isLatest, true)
          )
        )
        .orderBy(desc(pdsSubmissions.createdAt))
        .limit(1);

      return NextResponse.json({
        success: true,
        userType: 'applicant',
        stats: {
          applications: {
            active: activeCount,
            total: statusBreakdown.reduce(
              (sum, item) => sum + Number(item.count),
              0
            ),
            breakdown: statusBreakdown.map((item) => ({
              status: item.status,
              count: Number(item.count),
            })),
          },
          recentApplications: recentApplications.map((app) => ({
            id: app.id,
            applicationNumber: app.applicationNumber,
            status: app.status,
            applicationDate: app.applicationDate,
            position: {
              id: app.positionId,
              title: app.positionTitle,
              code: app.positionCode,
            },
          })),
          positions: {
            recommended,
          },
          pds: {
            status: latestPDS?.status || 'not_submitted',
            submittedAt: latestPDS?.submittedAt || null,
            hasSubmission: !!latestPDS,
          },
          notifications: {
            unread: unreadCount,
          },
        },
      });
    }
  } catch (error) {
    console.error('[Dashboard Stats API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
