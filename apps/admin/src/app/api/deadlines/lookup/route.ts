/**
 * Deadline Lookup API - GET /api/deadlines/lookup
 *
 * Fetches a single deadline by form type and year combination.
 * Returns 404 if no deadline exists for the given combination.
 *
 * Query Parameters:
 * - formType: 'pds' | 'saln' (required)
 * - year: number (required)
 *
 * Security:
 * - Requires admin or hr role
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  submissionDeadlines,
  profiles,
  pdsSubmissions,
  salnSubmissions,
} from '@tupsafe/database/server';
import { eq, and, count, sql } from 'drizzle-orm';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
/**
 * Query parameter validation schema
 */
const lookupParamsSchema = z.object({
  formType: z.enum(['pds', 'saln']),
  year: z.coerce.number().int().min(2000).max(2100),
});

/**
 * Calculate days remaining until deadline
 */
function calculateDaysRemaining(deadlineDate: string | Date): number {
  const deadline = new Date(deadlineDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * GET /api/deadlines/lookup
 * Fetch a specific deadline by form type and year
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Deadlines Lookup API] Request started:', {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });

    // Authorization check - HR or Admin only
    console.log('[Deadlines Lookup API] Checking authorization...');
    const hasPermission = await checkUserRoleFromSupabase(['hr', 'admin'], 'admin');

    if (!hasPermission) {
      console.warn('[Deadlines Lookup API] Authorization failed - insufficient permissions');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    console.log('[Deadlines Lookup API] Authorization successful');

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      formType: searchParams.get('formType'),
      year: searchParams.get('year'),
    };

    console.log('[Deadlines Lookup API] Received query parameters:', queryParams);

    const validationResult = lookupParamsSchema.safeParse(queryParams);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      console.error('[Deadlines Lookup API] Validation failed:', {
        queryParams,
        fieldErrors,
        issues: validationResult.error.issues,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters. formType and year are required.',
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const { formType, year } = validationResult.data;
    console.log('[Deadlines Lookup API] Validated parameters:', { formType, year });

    // Fetch the deadline by form type and year
    console.log('[Deadlines Lookup API] Querying database...', {
      formType,
      year,
      tableName: 'submission_deadlines',
    });

    const [deadline] = await db
      .select({
        id: submissionDeadlines.id,
        formType: submissionDeadlines.formType,
        year: submissionDeadlines.year,
        deadlineDate: submissionDeadlines.deadlineDate,
        reminderDaysBefore: submissionDeadlines.reminderDaysBefore,
        isActive: submissionDeadlines.isActive,
        createdAt: submissionDeadlines.createdAt,
      })
      .from(submissionDeadlines)
      .where(
        and(
          eq(submissionDeadlines.formType, formType),
          eq(submissionDeadlines.year, year),
          eq(submissionDeadlines.isActive, true) // Only return active deadlines
        )
      )
      .limit(1);

    console.log('[Deadlines Lookup API] Database query completed:', {
      found: !!deadline,
      deadlineId: deadline?.id,
    });

    // Return 404 if deadline not found
    if (!deadline) {
      console.warn('[Deadlines Lookup API] No deadline found:', { formType, year });
      return NextResponse.json(
        {
          success: false,
          error: `No deadline found for ${formType.toUpperCase()} ${year}`,
        },
        { status: 404 }
      );
    }

    // Calculate days remaining
    const daysRemaining = calculateDaysRemaining(deadline.deadlineDate);

    // Get compliance statistics
    // Count total employees
    const [employeeCount] = await db
      .select({ count: count() })
      .from(profiles)
      .where(eq(profiles.userType, 'employee'));

    const totalEmployees = Number(employeeCount?.count) || 0;

    // Count submissions for this form type and year
    let submittedCount = 0;

    if (formType === 'pds') {
      const [pdsCount] = await db
        .select({ count: count() })
        .from(pdsSubmissions)
        .where(
          and(
            eq(pdsSubmissions.status, 'submitted'),
            sql`EXTRACT(YEAR FROM ${pdsSubmissions.submittedAt}) = ${year}`
          )
        );
      submittedCount = Number(pdsCount?.count) || 0;
    } else {
      const [salnCount] = await db
        .select({ count: count() })
        .from(salnSubmissions)
        .where(eq(salnSubmissions.year, year));
      submittedCount = Number(salnCount?.count) || 0;
    }

    const pendingCount = Math.max(0, totalEmployees - submittedCount);
    const overdueCount = daysRemaining < 0 ? pendingCount : 0;

    // Build response
    const response = {
      id: deadline.id,
      formType: deadline.formType as 'pds' | 'saln',
      year: deadline.year,
      deadlineDate: deadline.deadlineDate,
      reminderDaysBefore: deadline.reminderDaysBefore || [30, 15, 7, 3, 1],
      isActive: deadline.isActive,
      createdAt: deadline.createdAt,
      daysRemaining,
      complianceStats: {
        totalEmployees,
        submitted: submittedCount,
        pending: pendingCount,
        overdue: overdueCount,
      },
    };

    const duration = Date.now() - startTime;
    console.log('[Deadlines Lookup API] Request completed successfully:', {
      deadlineId: response.id,
      formType: response.formType,
      year: response.year,
      durationMs: duration,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Deadlines Lookup API] Error occurred:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching the deadline',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
