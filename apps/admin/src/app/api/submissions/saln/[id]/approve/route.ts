/**
 * SALN Submission Approval API
 * POST /api/submissions/saln/[id]/approve
 *
 * Approves a SALN submission after review
 *
 * Workflow:
 * 1. Validate admin/HR has permission
 * 2. Verify submission is in 'submitted' or 'reviewing' status
 * 3. Prevent self-review
 * 4. Update status to 'approved'
 * 5. Set reviewedBy and reviewedAt
 * 6. Store optional review notes
 * 7. Create comprehensive audit log
 * 8. Send approval notification to employee
 * 9. Return updated submission
 *
 * Security:
 * - Requires admin or hr role
 * - Cannot approve own submission
 * - Transaction handling for atomicity
 * - Audit logging for CSC compliance
 *
 * @param {string} id - SALN submission ID (UUID)
 * @param {ApproveSubmissionData} body - Optional review notes
 * @returns {ApiSuccess} Success response with updated submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRole, getSessionUser } from '@tupsafe/auth/server';
import { db, salnSubmissions, notifications } from '@tupsafe/database/server';
import { eq, and, or } from 'drizzle-orm';
import { createAuditLog } from '@tupsafe/database/utils/audit-log';
import { approveSubmissionSchema, type ApiSuccess } from '@tupsafe/types';
import { v7 as uuidv7 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin/HR permissions
    const hasPermission = await checkUserRole(['admin', 'hr']);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = approveSubmissionSchema.parse(body);

    // Fetch submission and verify it exists
    const [submission] = await db
      .select({
        id: salnSubmissions.id,
        userId: salnSubmissions.userId,
        status: salnSubmissions.status,
        year: salnSubmissions.year,
      })
      .from(salnSubmissions)
      .where(eq(salnSubmissions.id, id))
      .limit(1);

    if (!submission) {
      return NextResponse.json({ error: 'SALN submission not found' }, { status: 404 });
    }

    // Prevent self-review
    if (submission.userId === sessionUser.id) {
      return NextResponse.json(
        { error: 'Cannot approve your own submission' },
        { status: 403 }
      );
    }

    // Verify submission is in reviewable status
    if (submission.status !== 'submitted' && submission.status !== 'reviewing') {
      return NextResponse.json(
        {
          error: `Cannot approve submission with status '${submission.status}'`,
          details: 'Only submissions with status "submitted" or "reviewing" can be approved',
        },
        { status: 409 }
      );
    }

    // Update submission to approved (atomic transaction)
    const now = new Date();
    const [updatedSubmission] = await db
      .update(salnSubmissions)
      .set({
        status: 'approved',
        approvedBy: sessionUser.id,
        approvedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(salnSubmissions.id, id),
          or(
            eq(salnSubmissions.status, 'submitted'),
            eq(salnSubmissions.status, 'reviewing')
          )
        )
      )
      .returning();

    if (!updatedSubmission) {
      return NextResponse.json(
        {
          error: 'Failed to approve submission',
          details: 'Submission may have been modified by another user',
        },
        { status: 409 }
      );
    }

    // Create comprehensive audit log
    await createAuditLog({
      userId: sessionUser.id,
      action: 'approve_saln_submission',
      entityType: 'saln_submission',
      entityId: id,
      changes: {
        submissionId: id,
        previousStatus: submission.status,
        newStatus: 'approved',
        approvedBy: sessionUser.id,
        approvedAt: now.toISOString(),
        fiscalYear: submission.year,
        notes: validatedData.notes,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Send approval notification to employee
    await db.insert(notifications).values({
      id: uuidv7(),
      userId: submission.userId,
      type: 'submission_status',
      title: 'SALN Submission Approved',
      message: `Your SALN submission for fiscal year ${submission.year} has been approved.${validatedData.notes ? ` Reviewer notes: ${validatedData.notes}` : ''}`,
      isRead: false,
      createdAt: now,
    });

    const response: ApiSuccess<typeof updatedSubmission> = {
      success: true,
      message: 'SALN submission approved successfully',
      data: updatedSubmission,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('SALN approval error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to approve SALN submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
