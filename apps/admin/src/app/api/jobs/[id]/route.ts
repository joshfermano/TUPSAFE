/**
 * Job Position Management API - Individual Position Operations
 * GET    /api/jobs/[id] - Get detailed job position information
 * PATCH  /api/jobs/[id] - Update job position details
 * DELETE /api/jobs/[id] - Soft delete job position (cancel)
 *
 * Security:
 * - GET: Requires admin, hr, or supervisor role
 * - PATCH: Requires admin or hr role
 * - DELETE: Requires admin role only
 * - Comprehensive audit logging
 * - Input validation with Zod
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSupabase } from '@tupsafe/auth/server';
import {
  db,
  openPositions,
  departments,
  profiles,
  jobApplications,
  createAuditLogFromRequest,
  generateChanges,
} from '@tupsafe/database/server';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import {
  updateOpenPositionSchema,
  type OpenPositionDetail,
  type ApplicationStatus,
  APPLICATION_STATUS,
} from '@tupsafe/types';

/**
 * GET /api/jobs/[id]
 * Fetch detailed job position information including department info,
 * recent applications, and application statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user from Supabase session (portal-specific)
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify permissions
    const allowedRoles = ['admin', 'hr', 'supervisor'];
    if (!allowedRoles.includes(sessionUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, HR, or Supervisor role required.' },
        { status: 403 }
      );
    }

    const { id: positionId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(positionId)) {
      return NextResponse.json(
        { error: 'Invalid position ID format' },
        { status: 400 }
      );
    }

    // Fetch position details with department and posted by user info
    const [positionData] = await db
      .select({
        // Position fields
        id: openPositions.id,
        positionTitle: openPositions.positionTitle,
        positionCode: openPositions.positionCode,
        employmentCategory: openPositions.employmentCategory,
        description: openPositions.description,
        qualifications: openPositions.qualifications,
        responsibilities: openPositions.responsibilities,
        requirements: openPositions.requirements,
        salaryGrade: openPositions.salaryGrade,
        salaryRangeMin: openPositions.salaryRangeMin,
        salaryRangeMax: openPositions.salaryRangeMax,
        employmentType: openPositions.employmentType,
        status: openPositions.status,
        applicationDeadline: openPositions.applicationDeadline,
        numberOfOpenings: openPositions.numberOfOpenings,
        applicationsReceived: openPositions.applicationsReceived,
        isActive: openPositions.isActive,
        isFeatured: openPositions.isFeatured,
        postedAt: openPositions.postedAt,
        updatedAt: openPositions.updatedAt,
        closedAt: openPositions.closedAt,
        // Department details
        departmentId: departments.id,
        departmentName: departments.name,
        departmentCode: departments.code,
        // Posted by user details
        postedById: profiles.id,
        postedByFirstName: profiles.firstName,
        postedByLastName: profiles.lastName,
      })
      .from(openPositions)
      .leftJoin(departments, eq(openPositions.departmentId, departments.id))
      .leftJoin(profiles, eq(openPositions.postedBy, profiles.id))
      .where(eq(openPositions.id, positionId))
      .limit(1);

    if (!positionData) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Fetch email of posted by user from Supabase Auth
    let postedByEmail: string | null = null;
    if (positionData.postedById) {
      try {
        const { createAdminClient } = await import('@tupsafe/auth/server');
        const adminClient = await createAdminClient();
        const { data } = await adminClient.auth.admin.getUserById(
          positionData.postedById
        );
        postedByEmail = data?.user?.email || null;
      } catch (error) {
        console.error('Error fetching posted by user email:', error);
      }
    }

    // Fetch recent applications (last 5)
    const recentApplications = await db
      .select({
        id: jobApplications.id,
        applicationNumber: jobApplications.applicationNumber,
        status: jobApplications.status,
        applicationDate: jobApplications.applicationDate,
        applicantId: profiles.id,
        applicantFirstName: profiles.firstName,
        applicantLastName: profiles.lastName,
      })
      .from(jobApplications)
      .leftJoin(profiles, eq(jobApplications.applicantId, profiles.id))
      .where(eq(jobApplications.positionId, positionId))
      .orderBy(desc(jobApplications.applicationDate))
      .limit(5);

    // Fetch application statistics by status
    const applicationStats = await db
      .select({
        status: jobApplications.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(jobApplications)
      .where(eq(jobApplications.positionId, positionId))
      .groupBy(jobApplications.status);

    // Build application stats object
    const byStatus: Record<ApplicationStatus, number> = {
      pending: 0,
      under_review: 0,
      shortlisted: 0,
      for_interview: 0,
      interviewed: 0,
      for_final_review: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
      hired: 0,
    };

    let totalApplications = 0;
    applicationStats.forEach((stat) => {
      if (stat.status) {
        byStatus[stat.status as ApplicationStatus] = stat.count;
        totalApplications += stat.count;
      }
    });

    // Construct detailed position response
    const positionDetail: OpenPositionDetail = {
      id: positionData.id,
      positionTitle: positionData.positionTitle,
      positionCode: positionData.positionCode,
      department: positionData.departmentId
        ? {
            id: positionData.departmentId,
            name: positionData.departmentName || '',
            code: positionData.departmentCode || '',
          }
        : null,
      employmentCategory: positionData.employmentCategory,
      description: positionData.description,
      qualifications: positionData.qualifications as string[],
      responsibilities: positionData.responsibilities as string[],
      requirements: positionData.requirements as {
        education: string[];
        experience: string[];
        skills: string[];
      },
      salaryGrade: positionData.salaryGrade,
      // Parse decimal strings to numbers for consistent frontend handling
      salaryRangeMin: positionData.salaryRangeMin ? parseFloat(positionData.salaryRangeMin) : null,
      salaryRangeMax: positionData.salaryRangeMax ? parseFloat(positionData.salaryRangeMax) : null,
      employmentType: positionData.employmentType,
      status: positionData.status || 'open',
      applicationDeadline: positionData.applicationDeadline,
      numberOfOpenings: positionData.numberOfOpenings || 1,
      applicationsReceived: positionData.applicationsReceived || 0,
      isActive: positionData.isActive,
      isFeatured: positionData.isFeatured,
      postedBy: positionData.postedById
        ? {
            id: positionData.postedById,
            firstName: positionData.postedByFirstName || '',
            lastName: positionData.postedByLastName || '',
            email: postedByEmail || '',
          }
        : null,
      postedAt: positionData.postedAt,
      updatedAt: positionData.updatedAt,
      closedAt: positionData.closedAt,
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        applicationNumber: app.applicationNumber,
        applicantName: `${app.applicantFirstName} ${app.applicantLastName}`,
        status: app.status || 'pending',
        applicationDate: app.applicationDate || new Date(),
      })),
      applicationStats: {
        total: totalApplications,
        byStatus,
      },
    };

    return NextResponse.json(
      { success: true, data: positionDetail },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get position error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch position details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update job position details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user from Supabase session (portal-specific)
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify permissions
    const allowedRoles = ['admin', 'co_admin', 'hr'];
    if (!allowedRoles.includes(sessionUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    const { id: positionId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(positionId)) {
      return NextResponse.json(
        { error: 'Invalid position ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateOpenPositionSchema.parse(body);

    // Fetch current position data for audit trail
    const [currentPosition] = await db
      .select()
      .from(openPositions)
      .where(eq(openPositions.id, positionId))
      .limit(1);

    if (!currentPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Validate department exists if provided
    if (validatedData.departmentId) {
      const [dept] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.id, validatedData.departmentId),
            eq(departments.isActive, true)
          )
        )
        .limit(1);

      if (!dept) {
        return NextResponse.json(
          { error: 'Invalid or inactive department' },
          { status: 400 }
        );
      }
    }

    // Transform salary values from numbers to strings for database (decimal type)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { salaryRangeMin, salaryRangeMax, ...restData } = validatedData;
    const updateData: Record<string, unknown> = {
      ...restData,
      updatedAt: new Date(),
    };
    // Convert salary numbers to strings if present
    if (salaryRangeMin !== undefined) {
      updateData.salaryRangeMin = String(salaryRangeMin);
    }
    if (salaryRangeMax !== undefined) {
      updateData.salaryRangeMax = String(salaryRangeMax);
    }

    // Update position
    const [updatedPosition] = await db
      .update(openPositions)
      .set(updateData)
      .where(eq(openPositions.id, positionId))
      .returning();

    // Create audit log with before/after state
    const changes = generateChanges({ ...currentPosition }, { ...updatedPosition });

    await createAuditLogFromRequest(
      sessionUser.userId,
      'UPDATE',
      'open_position',
      positionId,
      changes,
      request.headers
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Position updated successfully',
        data: updatedPosition,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update position error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update position',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 * Soft delete job position by setting status to 'cancelled' and isActive to false
 * Does not allow deletion if position has active applications
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[DELETE /api/jobs/[id]] Request received');
    
    // Get current user from Supabase session (portal-specific)
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      console.error('[DELETE /api/jobs/[id]] Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[DELETE /api/jobs/[id]] User authenticated:', sessionUser.userId, 'Role:', sessionUser.role);

    // Verify permissions - admin only
    if (sessionUser.role !== 'admin') {
      console.error('[DELETE /api/jobs/[id]] Unauthorized - role is', sessionUser.role);
      return NextResponse.json(
        { error: 'Unauthorized. Admin role required.' },
        { status: 403 }
      );
    }

    const { id: positionId } = await params;
    console.log('[DELETE /api/jobs/[id]] Position ID:', positionId);

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(positionId)) {
      console.error('[DELETE /api/jobs/[id]] Invalid UUID format:', positionId);
      return NextResponse.json(
        { error: 'Invalid position ID format' },
        { status: 400 }
      );
    }

    console.log('[DELETE /api/jobs/[id]] UUID validation passed');

    // Fetch current position data
    const [currentPosition] = await db
      .select()
      .from(openPositions)
      .where(eq(openPositions.id, positionId))
      .limit(1);

    if (!currentPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Check if position already cancelled - return success (idempotent)
    if (currentPosition.status === 'cancelled') {
      console.log(`[DELETE /api/jobs/${positionId}] Position is already cancelled - returning success (idempotent)`);
      return NextResponse.json(
        {
          success: true,
          message: 'Position is already cancelled',
          data: currentPosition,
        },
        { status: 200 }
      );
    }

    console.log(`[DELETE /api/jobs/${positionId}] Current position status:`, currentPosition.status);

    // Check for active applications (not rejected or withdrawn)
    const activeStatuses: ApplicationStatus[] = [
      APPLICATION_STATUS.PENDING,
      APPLICATION_STATUS.UNDER_REVIEW,
      APPLICATION_STATUS.SHORTLISTED,
      APPLICATION_STATUS.FOR_INTERVIEW,
      APPLICATION_STATUS.INTERVIEWED,
      APPLICATION_STATUS.FOR_FINAL_REVIEW,
      APPLICATION_STATUS.ACCEPTED,
      APPLICATION_STATUS.HIRED,
    ];

    // Query for active applications - handling null status by excluding it
    const [activeApplicationsCount] = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.positionId, positionId),
          sql`${jobApplications.status} IS NOT NULL`,
          inArray(jobApplications.status, activeStatuses)
        )
      );

    const activeCount = activeApplicationsCount?.count || 0;
    console.log(`[DELETE /api/jobs/${positionId}] Active applications count:`, activeCount);

    if (activeCount > 0) {
      const errorMsg = `Cannot delete position with ${activeCount} active application(s). Please reject or process all applications first.`;
      console.error(`[DELETE /api/jobs/${positionId}] ${errorMsg}`);
      return NextResponse.json(
        {
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    // Perform soft delete
    const [deletedPosition] = await db
      .update(openPositions)
      .set({
        status: 'cancelled',
        isActive: false,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(openPositions.id, positionId))
      .returning();

    // Create audit log
    await createAuditLogFromRequest(
      sessionUser.userId,
      'DELETE',
      'open_position',
      positionId,
      {
        before: {
          status: currentPosition.status,
          isActive: currentPosition.isActive,
          closedAt: currentPosition.closedAt,
        },
        after: {
          status: 'cancelled',
          isActive: false,
          closedAt: deletedPosition.closedAt,
        },
      },
      request.headers
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Position cancelled successfully',
        data: deletedPosition,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete position error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete position',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
