/**
 * Deadline Management API - GET /api/deadlines, POST /api/deadlines
 *
 * Provides endpoints for listing and creating submission deadlines for PDS/SALN forms.
 *
 * Features:
 * - List all deadlines with filtering (formType, year, isActive)
 * - Pagination with configurable page size
 * - Sorting by deadlineDate, year, or createdAt
 * - Create new deadline with Zod validation
 * - Duplicate prevention for same formType+year combination
 *
 * Security:
 * - Requires admin or hr role
 * - Uses Supabase session validation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  submissionDeadlines,
} from '@tupsafe/database/server';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import {
  listDeadlinesSchema,
  createDeadlineSchema,
  type DeadlineListItem,
  type DeadlineListResponse,
  type CreateDeadlineResponse,
} from '@tupsafe/types';

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
 * GET /api/deadlines
 * List all deadlines with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization check - HR or Admin only
    const hasPermission = await checkUserRoleFromSupabase(['hr', 'admin'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      formType: searchParams.get('formType'),
      year: searchParams.get('year'),
      isActive: searchParams.get('isActive'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    };

    const validationResult = listDeadlinesSchema.safeParse(queryParams);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      console.error('[Deadlines API] Validation failed:', {
        queryParams,
        fieldErrors,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      formType,
      year,
      isActive,
      sortBy,
      sortOrder,
    } = validationResult.data;

    // Build WHERE conditions
    const conditions = [];

    // Filter by form type if provided and not 'all'
    if (formType && formType !== 'all') {
      conditions.push(eq(submissionDeadlines.formType, formType));
    }

    // Filter by year if provided
    if (year) {
      conditions.push(eq(submissionDeadlines.year, year));
    }

    // Filter by isActive status if provided
    if (isActive !== undefined) {
      conditions.push(eq(submissionDeadlines.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(submissionDeadlines)
      .where(whereClause);

    const total = totalCountResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Determine sort field and direction
    const sortField =
      sortBy === 'year'
        ? submissionDeadlines.year
        : sortBy === 'formType'
          ? submissionDeadlines.formType
          : sortBy === 'createdAt'
            ? submissionDeadlines.createdAt
            : submissionDeadlines.deadlineDate;

    const orderByClause = sortOrder === 'asc' ? asc(sortField) : desc(sortField);

    // Fetch paginated data
    const deadlinesData = await db
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
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset((page - 1) * limit);

    // Transform data to include computed fields
    const deadlines: DeadlineListItem[] = deadlinesData.map((deadline) => {
      const daysRemaining = calculateDaysRemaining(deadline.deadlineDate);

      return {
        id: deadline.id,
        formType: deadline.formType as 'pds' | 'saln',
        year: deadline.year,
        deadlineDate: new Date(deadline.deadlineDate),
        reminderDaysBefore: deadline.reminderDaysBefore || [30, 15, 7, 3, 1],
        isActive: deadline.isActive,
        createdAt: deadline.createdAt,
        daysRemaining,
      };
    });

    // Calculate summary statistics
    const [summaryStats] = await db
      .select({
        totalActive: sql<number>`COUNT(*) FILTER (WHERE ${submissionDeadlines.isActive} = true)`,
        totalInactive: sql<number>`COUNT(*) FILTER (WHERE ${submissionDeadlines.isActive} = false)`,
        upcomingCount: sql<number>`COUNT(*) FILTER (WHERE ${submissionDeadlines.deadlineDate} > CURRENT_DATE AND ${submissionDeadlines.isActive} = true)`,
        pastCount: sql<number>`COUNT(*) FILTER (WHERE ${submissionDeadlines.deadlineDate} <= CURRENT_DATE)`,
      })
      .from(submissionDeadlines)
      .where(whereClause);

    const response: DeadlineListResponse = {
      deadlines,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalActive: Number(summaryStats?.totalActive) || 0,
        totalInactive: Number(summaryStats?.totalInactive) || 0,
        upcomingCount: Number(summaryStats?.upcomingCount) || 0,
        pastCount: Number(summaryStats?.pastCount) || 0,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Deadlines API] Error fetching deadlines:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching deadlines',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deadlines
 * Create a new submission deadline
 */
export async function POST(request: NextRequest) {
  try {
    // Authorization check - HR or Admin only
    const hasPermission = await checkUserRoleFromSupabase(['hr', 'admin'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createDeadlineSchema.safeParse(body);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      console.error('[Deadlines API] Validation failed:', {
        body,
        fieldErrors,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const { formType, year, deadlineDate, reminderDaysBefore } = validationResult.data;

    // Check for duplicate deadline (same formType + year combination)
    const [existingDeadline] = await db
      .select({ id: submissionDeadlines.id })
      .from(submissionDeadlines)
      .where(
        and(
          eq(submissionDeadlines.formType, formType),
          eq(submissionDeadlines.year, year)
        )
      )
      .limit(1);

    if (existingDeadline) {
      return NextResponse.json(
        {
          success: false,
          error: `A deadline for ${formType.toUpperCase()} ${year} already exists`,
          details: {
            existingId: existingDeadline.id,
          },
        },
        { status: 409 }
      );
    }

    // Create the new deadline
    const [newDeadline] = await db
      .insert(submissionDeadlines)
      .values({
        formType,
        year,
        deadlineDate,
        reminderDaysBefore,
        isActive: true,
      })
      .returning({
        id: submissionDeadlines.id,
        formType: submissionDeadlines.formType,
        year: submissionDeadlines.year,
        deadlineDate: submissionDeadlines.deadlineDate,
        reminderDaysBefore: submissionDeadlines.reminderDaysBefore,
        isActive: submissionDeadlines.isActive,
        createdAt: submissionDeadlines.createdAt,
      });

    if (!newDeadline) {
      throw new Error('Failed to create deadline');
    }

    const daysRemaining = calculateDaysRemaining(newDeadline.deadlineDate);

    const deadlineResponse: DeadlineListItem = {
      id: newDeadline.id,
      formType: newDeadline.formType as 'pds' | 'saln',
      year: newDeadline.year,
      deadlineDate: new Date(newDeadline.deadlineDate),
      reminderDaysBefore: newDeadline.reminderDaysBefore || [30, 15, 7, 3, 1],
      isActive: newDeadline.isActive,
      createdAt: newDeadline.createdAt,
      daysRemaining,
    };

    const response: CreateDeadlineResponse = {
      success: true,
      message: `Deadline for ${formType.toUpperCase()} ${year} created successfully`,
      deadline: deadlineResponse,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Deadlines API] Error creating deadline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while creating the deadline',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
