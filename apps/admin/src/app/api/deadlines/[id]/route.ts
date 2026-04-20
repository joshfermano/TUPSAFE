/**
 * Deadline Detail API - GET/PUT/DELETE /api/deadlines/[id]
 *
 * Provides endpoints for single deadline operations:
 * - GET: Get deadline details with compliance metrics
 * - PUT: Update deadline (deadlineDate, reminderDaysBefore, isActive)
 * - DELETE: Soft delete by setting isActive = false
 *
 * Security:
 * - Requires admin or hr role
 * - Uses Supabase session validation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  submissionDeadlines,
  pdsSubmissions,
  salnSubmissions,
  profiles,
} from '@tupsafe/database/server';
import { eq, and, sql, count } from 'drizzle-orm';
import { checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import {
  updateDeadlineSchema,
  type DeadlineDetail,
  type DeadlineComplianceStats,
  type UpdateDeadlineResponse,
} from '@tupsafe/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

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
 * Get compliance metrics for a deadline
 */
async function getComplianceMetrics(
  formType: 'pds' | 'saln',
  year: number
): Promise<DeadlineComplianceStats> {
  // Get total active employees (userType = 'employee' and isActive = true)
  const [employeeCount] = await db
    .select({ count: count() })
    .from(profiles)
    .where(
      and(
        eq(profiles.userType, 'employee'),
        eq(profiles.isActive, true),
        eq(profiles.accountStatus, 'active')
      )
    );

  const totalEmployees = employeeCount?.count || 0;

  let submissionStats: {
    submitted: number;
    approved: number;
    rejected: number;
    reviewing: number;
    draft: number;
  };

  if (formType === 'pds') {
    // For PDS, we count submissions that are marked as latest
    const [stats] = await db
      .select({
        submitted: sql<number>`COUNT(*) FILTER (WHERE ${pdsSubmissions.status} = 'submitted')`,
        approved: sql<number>`COUNT(*) FILTER (WHERE ${pdsSubmissions.status} = 'approved')`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE ${pdsSubmissions.status} = 'rejected')`,
        reviewing: sql<number>`COUNT(*) FILTER (WHERE ${pdsSubmissions.status} = 'reviewing')`,
        draft: sql<number>`COUNT(*) FILTER (WHERE ${pdsSubmissions.status} = 'draft')`,
      })
      .from(pdsSubmissions)
      .where(eq(pdsSubmissions.isLatest, true));

    submissionStats = {
      submitted: Number(stats?.submitted) || 0,
      approved: Number(stats?.approved) || 0,
      rejected: Number(stats?.rejected) || 0,
      reviewing: Number(stats?.reviewing) || 0,
      draft: Number(stats?.draft) || 0,
    };
  } else {
    // For SALN, we filter by year
    const [stats] = await db
      .select({
        submitted: sql<number>`COUNT(*) FILTER (WHERE ${salnSubmissions.status} = 'submitted')`,
        approved: sql<number>`COUNT(*) FILTER (WHERE ${salnSubmissions.status} = 'approved')`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE ${salnSubmissions.status} = 'rejected')`,
        reviewing: sql<number>`COUNT(*) FILTER (WHERE ${salnSubmissions.status} = 'reviewing')`,
        draft: sql<number>`COUNT(*) FILTER (WHERE ${salnSubmissions.status} = 'draft')`,
      })
      .from(salnSubmissions)
      .where(eq(salnSubmissions.year, year));

    submissionStats = {
      submitted: Number(stats?.submitted) || 0,
      approved: Number(stats?.approved) || 0,
      rejected: Number(stats?.rejected) || 0,
      reviewing: Number(stats?.reviewing) || 0,
      draft: Number(stats?.draft) || 0,
    };
  }

  // Calculate pending (submitted + reviewing) and compliance rate
  const pending = submissionStats.submitted + submissionStats.reviewing;
  const totalSubmitted =
    submissionStats.submitted +
    submissionStats.approved +
    submissionStats.rejected +
    submissionStats.reviewing;

  const complianceRate =
    totalEmployees > 0
      ? Math.round((submissionStats.approved / totalEmployees) * 100)
      : 0;

  return {
    totalEmployees,
    submitted: totalSubmitted,
    pending,
    approved: submissionStats.approved,
    rejected: submissionStats.rejected,
    draft: submissionStats.draft,
    complianceRate,
  };
}

/**
 * GET /api/deadlines/[id]
 * Get single deadline details with compliance metrics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authorization check - HR or Admin only
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid deadline ID format',
        },
        { status: 400 }
      );
    }

    // Fetch deadline data
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
      .where(eq(submissionDeadlines.id, id))
      .limit(1);

    if (!deadline) {
      return NextResponse.json(
        {
          success: false,
          error: 'Deadline not found',
        },
        { status: 404 }
      );
    }

    // Get compliance metrics
    const complianceStats = await getComplianceMetrics(
      deadline.formType as 'pds' | 'saln',
      deadline.year
    );

    const daysRemaining = calculateDaysRemaining(deadline.deadlineDate);

    // Build response - using a simplified version of DeadlineDetail
    const response: {
      success: boolean;
      deadline: DeadlineDetail;
    } = {
      success: true,
      deadline: {
        id: deadline.id,
        formType: deadline.formType as 'pds' | 'saln',
        year: deadline.year,
        deadlineDate: new Date(deadline.deadlineDate),
        reminderDaysBefore: deadline.reminderDaysBefore || [30, 15, 7, 3, 1],
        isActive: deadline.isActive,
        createdAt: deadline.createdAt,
        daysRemaining,
        updatedAt: deadline.createdAt, // We don't have updatedAt in the schema, using createdAt
        createdBy: null, // We don't track this in the current schema
        complianceStats,
        recentSubmissions: [], // Could be populated if needed
        departmentBreakdown: [], // Could be populated if needed
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Deadlines API] Error fetching deadline detail:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching deadline details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/deadlines/[id]
 * Update deadline (deadlineDate, reminderDaysBefore, isActive)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Authorization check - HR or Admin only
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid deadline ID format',
        },
        { status: 400 }
      );
    }

    // Check if deadline exists
    const [existingDeadline] = await db
      .select({ id: submissionDeadlines.id })
      .from(submissionDeadlines)
      .where(eq(submissionDeadlines.id, id))
      .limit(1);

    if (!existingDeadline) {
      return NextResponse.json(
        {
          success: false,
          error: 'Deadline not found',
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateDeadlineSchema.safeParse(body);

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

    const updateData = validationResult.data;

    // Check if there's anything to update
    if (
      updateData.deadlineDate === undefined &&
      updateData.reminderDaysBefore === undefined &&
      updateData.isActive === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'No update fields provided',
        },
        { status: 400 }
      );
    }

    // Build update object - only include fields that are provided
    const updateFields: Partial<{
      deadlineDate: string;
      reminderDaysBefore: number[];
      isActive: boolean;
    }> = {};

    if (updateData.deadlineDate !== undefined) {
      updateFields.deadlineDate = updateData.deadlineDate;
    }
    if (updateData.reminderDaysBefore !== undefined) {
      updateFields.reminderDaysBefore = updateData.reminderDaysBefore;
    }
    if (updateData.isActive !== undefined) {
      updateFields.isActive = updateData.isActive;
    }

    // Update the deadline
    const [updatedDeadline] = await db
      .update(submissionDeadlines)
      .set(updateFields)
      .where(eq(submissionDeadlines.id, id))
      .returning({
        id: submissionDeadlines.id,
        formType: submissionDeadlines.formType,
        year: submissionDeadlines.year,
        deadlineDate: submissionDeadlines.deadlineDate,
        reminderDaysBefore: submissionDeadlines.reminderDaysBefore,
        isActive: submissionDeadlines.isActive,
        createdAt: submissionDeadlines.createdAt,
      });

    if (!updatedDeadline) {
      throw new Error('Failed to update deadline');
    }

    const daysRemaining = calculateDaysRemaining(updatedDeadline.deadlineDate);

    const response: UpdateDeadlineResponse = {
      success: true,
      message: 'Deadline updated successfully',
      deadline: {
        id: updatedDeadline.id,
        formType: updatedDeadline.formType as 'pds' | 'saln',
        year: updatedDeadline.year,
        deadlineDate: new Date(updatedDeadline.deadlineDate),
        reminderDaysBefore: updatedDeadline.reminderDaysBefore || [30, 15, 7, 3, 1],
        isActive: updatedDeadline.isActive,
        createdAt: updatedDeadline.createdAt,
        daysRemaining,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Deadlines API] Error updating deadline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while updating the deadline',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deadlines/[id]
 * Soft delete by setting isActive = false
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authorization check - HR or Admin only
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid deadline ID format',
        },
        { status: 400 }
      );
    }

    // Check if deadline exists
    const [existingDeadline] = await db
      .select({
        id: submissionDeadlines.id,
        formType: submissionDeadlines.formType,
        year: submissionDeadlines.year,
        isActive: submissionDeadlines.isActive,
      })
      .from(submissionDeadlines)
      .where(eq(submissionDeadlines.id, id))
      .limit(1);

    if (!existingDeadline) {
      return NextResponse.json(
        {
          success: false,
          error: 'Deadline not found',
        },
        { status: 404 }
      );
    }

    // Check if already inactive
    if (!existingDeadline.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Deadline is already inactive',
        },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive = false
    await db
      .update(submissionDeadlines)
      .set({ isActive: false })
      .where(eq(submissionDeadlines.id, id));

    const response = {
      success: true,
      message: `Deadline for ${existingDeadline.formType.toUpperCase()} ${existingDeadline.year} has been deactivated`,
      deadlineId: id,
      formType: existingDeadline.formType as 'pds' | 'saln',
      year: existingDeadline.year,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Deadlines API] Error deleting deadline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while deleting the deadline',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
