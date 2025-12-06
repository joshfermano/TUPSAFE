/**
 * Employee Portal Deadlines API - GET /api/deadlines
 *
 * Provides active submission deadlines for employees to view.
 * Employees can see when their PDS and SALN submissions are due.
 *
 * Features:
 * - Returns only active deadlines (isActive = true)
 * - Optional filtering by formType ('pds' | 'saln')
 * - Includes daysRemaining calculation for each deadline
 * - Sorted by deadline date (ascending - soonest first)
 *
 * Security:
 * - Requires authenticated session
 * - No role restriction - all authenticated users can view deadlines
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db, submissionDeadlines } from '@tupsafe/database/server';
import { eq, and, asc, gte } from 'drizzle-orm';

/**
 * Urgency level type for deadlines
 */
type UrgencyLevel = 'critical' | 'warning' | 'normal';

/**
 * Calculate days remaining until deadline
 * Returns negative number if deadline has passed
 *
 * IMPORTANT: Handles timezone correctly by parsing date as local timezone
 * Database stores dates as YYYY-MM-DD which JavaScript parses as UTC by default
 */
function calculateDaysRemaining(deadlineDate: string | Date): number {
  // Parse deadline date in local timezone to avoid UTC offset issues
  // Database returns "2025-12-19" format, need to parse as local date
  let deadline: Date;
  if (typeof deadlineDate === 'string') {
    // Split date string and create date in local timezone (not UTC)
    const [year, month, day] = deadlineDate.split('-').map(Number);
    deadline = new Date(year, month - 1, day, 0, 0, 0, 0);
  } else {
    deadline = new Date(deadlineDate);
    deadline.setHours(0, 0, 0, 0);
  }

  // Get today's date at midnight local time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate difference
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Determine urgency level based on days remaining
 * - critical: < 7 days remaining
 * - warning: 7-30 days remaining
 * - normal: > 30 days remaining
 */
function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining < 7) return 'critical';
  if (daysRemaining <= 30) return 'warning';
  return 'normal';
}

/**
 * Response type for deadline items
 */
interface DeadlineItem {
  id: string;
  formType: 'pds' | 'saln';
  year: number;
  deadlineDate: string;
  reminderDaysBefore: number[];
  daysRemaining: number;
  urgencyLevel: UrgencyLevel;
  isOverdue: boolean;
}

interface DeadlinesResponse {
  success: boolean;
  deadlines: DeadlineItem[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    normal: number;
    overdue: number;
  };
}

/**
 * GET /api/deadlines
 * Fetch active deadlines for employees
 *
 * Query Parameters:
 * - formType (optional): 'pds' | 'saln' - Filter by form type
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const formTypeParam = searchParams.get('formType');

    // Validate formType parameter if provided
    const validFormTypes = ['pds', 'saln'];
    if (formTypeParam && !validFormTypes.includes(formTypeParam)) {
      return NextResponse.json(
        {
          error: 'Invalid formType parameter',
          details: 'formType must be either "pds" or "saln"',
        },
        { status: 400 }
      );
    }

    const formType = formTypeParam as 'pds' | 'saln' | null;

    // Get current date for filtering (only show deadlines that haven't passed too long ago)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Show deadlines from 30 days ago (to show recently passed) onwards
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    // Build query conditions
    const conditions = [
      eq(submissionDeadlines.isActive, true),
      gte(submissionDeadlines.deadlineDate, dateFilter),
    ];

    // Add form type filter if specified
    if (formType) {
      conditions.push(eq(submissionDeadlines.formType, formType));
    }

    // Fetch active deadlines
    const deadlinesData = await db
      .select({
        id: submissionDeadlines.id,
        formType: submissionDeadlines.formType,
        year: submissionDeadlines.year,
        deadlineDate: submissionDeadlines.deadlineDate,
        reminderDaysBefore: submissionDeadlines.reminderDaysBefore,
      })
      .from(submissionDeadlines)
      .where(and(...conditions))
      .orderBy(asc(submissionDeadlines.deadlineDate));

    // Transform data with computed fields
    const deadlines: DeadlineItem[] = deadlinesData.map((deadline) => {
      // Ensure deadlineDate is formatted as YYYY-MM-DD string
      // Drizzle returns Date objects, need to convert to string for JSON serialization
      let deadlineDateString: string;
      const deadlineValue = deadline.deadlineDate as Date | string;
      if (deadlineValue instanceof Date) {
        // Format as YYYY-MM-DD in local timezone
        const year = deadlineValue.getFullYear();
        const month = String(deadlineValue.getMonth() + 1).padStart(2, '0');
        const day = String(deadlineValue.getDate()).padStart(2, '0');
        deadlineDateString = `${year}-${month}-${day}`;
      } else if (typeof deadlineValue === 'string') {
        // Already a string, extract just the date part (YYYY-MM-DD)
        deadlineDateString = deadlineValue.split('T')[0];
      } else {
        // Fallback
        deadlineDateString = String(deadline.deadlineDate);
      }

      const daysRemaining = calculateDaysRemaining(deadlineDateString);
      const urgencyLevel = getUrgencyLevel(daysRemaining);
      const isOverdue = daysRemaining < 0;

      return {
        id: deadline.id,
        formType: deadline.formType as 'pds' | 'saln',
        year: deadline.year,
        deadlineDate: deadlineDateString,
        reminderDaysBefore: deadline.reminderDaysBefore || [30, 15, 7, 3, 1],
        daysRemaining,
        urgencyLevel,
        isOverdue,
      };
    });

    // Calculate summary statistics
    const summary = {
      total: deadlines.length,
      critical: deadlines.filter((d) => d.urgencyLevel === 'critical' && !d.isOverdue).length,
      warning: deadlines.filter((d) => d.urgencyLevel === 'warning').length,
      normal: deadlines.filter((d) => d.urgencyLevel === 'normal').length,
      overdue: deadlines.filter((d) => d.isOverdue).length,
    };

    const response: DeadlinesResponse = {
      success: true,
      deadlines,
      summary,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Employee Deadlines API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch deadlines',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
