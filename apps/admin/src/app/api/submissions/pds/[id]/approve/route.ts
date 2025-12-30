/**
 * PDS Submission Approval API
 * POST /api/submissions/pds/[id]/approve
 *
 * Approves a PDS submission after review
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
 * - Audit logging for compliance
 *
 * @param {string} id - PDS submission ID (UUID)
 * @param {ApproveSubmissionData} body - Optional review notes
 * @returns {ApiSuccess} Success response with updated submission
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkUserRoleFromSupabase,
  getUserFromSupabase,
  createAdminClient,
  sendPDSStatusEmail,
} from '@tupsafe/auth/server';
import {
  db,
  pdsSubmissions,
  notifications,
  profiles,
} from '@tupsafe/database/server';
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
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'co_admin', 'hr'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Get current user
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = approveSubmissionSchema.parse(body);

    // Fetch submission with employee info
    const [submission] = await db
      .select({
        id: pdsSubmissions.id,
        userId: pdsSubmissions.userId,
        status: pdsSubmissions.status,
        version: pdsSubmissions.version,
        employeeFirstName: profiles.firstName,
        employeeLastName: profiles.lastName,
      })
      .from(pdsSubmissions)
      .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
      .where(eq(pdsSubmissions.id, id))
      .limit(1);

    if (!submission) {
      return NextResponse.json(
        { error: 'PDS submission not found' },
        { status: 404 }
      );
    }

    // Prevent self-review
    if (submission.userId === sessionUser.id) {
      return NextResponse.json(
        { error: 'Cannot approve your own submission' },
        { status: 403 }
      );
    }

    // Verify submission is in reviewable status
    if (
      submission.status !== 'submitted' &&
      submission.status !== 'reviewing'
    ) {
      return NextResponse.json(
        {
          error: `Cannot approve submission with status '${submission.status}'`,
          details:
            'Only submissions with status "submitted" or "reviewing" can be approved',
        },
        { status: 409 }
      );
    }

    // Update submission to approved (atomic transaction)
    const now = new Date();
    const [updatedSubmission] = await db
      .update(pdsSubmissions)
      .set({
        status: 'approved',
        approvedBy: sessionUser.id,
        approvedAt: now,
        reviewNotes: validatedData.notes || null, // Store approval notes
        updatedAt: now,
      })
      .where(
        and(
          eq(pdsSubmissions.id, id),
          or(
            eq(pdsSubmissions.status, 'submitted'),
            eq(pdsSubmissions.status, 'reviewing')
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
      action: 'approve_pds_submission',
      entityType: 'pds_submission',
      entityId: id,
      changes: {
        submissionId: id,
        previousStatus: submission.status,
        newStatus: 'approved',
        approvedBy: sessionUser.id,
        approvedAt: now.toISOString(),
        version: submission.version,
        notes: validatedData.notes,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Send approval notification to employee
    const notificationMessage = validatedData.notes
      ? `Your PDS submission (Version ${submission.version}) has been approved.\n\nReviewer Feedback: ${validatedData.notes}`
      : `Your PDS submission (Version ${submission.version}) has been approved.`;

    await db.insert(notifications).values({
      id: uuidv7(),
      userId: submission.userId,
      type: 'submission_status',
      title: 'PDS Submission Approved',
      message: notificationMessage,
      isRead: false,
      createdAt: now,
    });

    // Send email notification (best-effort - don't fail if email fails)
    try {
      const adminClient = createAdminClient();
      const { data: userData } = await adminClient.auth.admin.getUserById(
        submission.userId
      );

      if (userData?.user?.email) {
        const employeeName = `${submission.employeeFirstName} ${submission.employeeLastName}`;
        await sendPDSStatusEmail({
          to: userData.user.email,
          employeeName,
          status: 'approved',
          version: submission.version,
          notes: validatedData.notes,
        });
      }
    } catch (emailError) {
      // Log but don't fail the request
      console.error('Failed to send PDS approval email:', emailError);
    }

    const response: ApiSuccess<typeof updatedSubmission> = {
      success: true,
      message: 'PDS submission approved successfully',
      data: updatedSubmission,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('PDS approval error:', error);

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
        error: 'Failed to approve PDS submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
