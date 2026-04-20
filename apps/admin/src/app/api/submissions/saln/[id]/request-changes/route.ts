/**
 * Request Changes to SALN Submission API - POST /api/submissions/saln/[id]/request-changes
 *
 * Allows HR/admin to send a SALN submission back to the employee for revision.
 * Resets the submission to 'draft' status and includes detailed notes for the employee.
 *
 * Features:
 * - Validates submission exists and is in reviewable state
 * - Updates submission status to 'draft'
 * - Clears approval metadata
 * - Adds review notes for employee guidance
 * - Creates audit log entry
 * - Sends notification to employee
 *
 * Security:
 * - Requires admin or hr role
 * - Validates submission ownership
 * - Audit logging for compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkUserRoleFromSupabase,
  getUserFromSupabase,
  createAdminClient,
  sendSALNStatusEmail,
} from '@tupsafe/auth/server';
import { db, salnSubmissions, profiles, notifications } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { salnRequestChangesSchema } from '@tupsafe/types';
import { createAuditLog } from '@tupsafe/database/server';

export const dynamic = 'force-dynamic';
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();

  try {
    console.log('[SALN Request Changes API] Request received');

    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(['superadmin', 'admin', 'hr'], 'admin');
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

    // Get submission ID from URL params
    const { id: submissionId } = await params;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = salnRequestChangesSchema.parse(body);

    console.log('[SALN Request Changes API] Requesting changes for submission:', submissionId);

    // Fetch the submission with employee info
    const [submission] = await db
      .select({
        id: salnSubmissions.id,
        userId: salnSubmissions.userId,
        status: salnSubmissions.status,
        year: salnSubmissions.year,
        employeeFirstName: profiles.firstName,
        employeeLastName: profiles.lastName,
      })
      .from(salnSubmissions)
      .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
      .where(eq(salnSubmissions.id, submissionId))
      .limit(1);

    if (!submission) {
      return NextResponse.json(
        { error: 'SALN submission not found' },
        { status: 404 }
      );
    }

    // Verify submission is in a reviewable state
    if (submission.status === 'draft') {
      return NextResponse.json(
        { error: 'Cannot request changes for a draft submission' },
        { status: 400 }
      );
    }

    if (submission.status === 'approved') {
      return NextResponse.json(
        {
          error:
            'Cannot request changes for an approved submission. Consider requesting a new submission for the next fiscal year.',
        },
        { status: 400 }
      );
    }

    // Update submission status to draft
    const [updatedSubmission] = await db
      .update(salnSubmissions)
      .set({
        status: 'draft',
        approvedBy: null,
        approvedAt: null,
        rejectionReason: validatedData.notes, // Store notes in rejection_reason field
        updatedAt: new Date(),
      })
      .where(eq(salnSubmissions.id, submissionId))
      .returning();

    console.log('[SALN Request Changes API] Submission updated to draft status');

    // Create audit log
    await createAuditLog({
      userId: sessionUser.id,
      action: 'request_changes',
      entityType: 'saln_submission',
      entityId: submissionId,
      changes: {
        before: {
          status: submission.status,
        },
        after: {
          status: 'draft',
          reviewNotes: validatedData.notes,
        },
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim(),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    console.log('[SALN Request Changes API] Audit log created');

    // Send notification to employee
    await db.insert(notifications).values({
      userId: submission.userId,
      type: 'submission_status',
      title: 'SALN Submission Requires Changes',
      message: `Your SALN submission for year ${submission.year} requires changes. Please review the notes and resubmit. Notes: ${validatedData.notes}`,
      isRead: false,
    });

    console.log('[SALN Request Changes API] Notification sent to employee');

    // Send email notification (best-effort - don't fail if email fails)
    try {
      const adminClient = createAdminClient();
      const { data: userData } = await adminClient.auth.admin.getUserById(
        submission.userId
      );

      if (userData?.user?.email) {
        const employeeName = `${submission.employeeFirstName} ${submission.employeeLastName}`;
        await sendSALNStatusEmail({
          to: userData.user.email,
          employeeName,
          status: 'changes_requested',
          year: submission.year,
          notes: validatedData.notes,
        });
      }
    } catch (emailError) {
      // Log but don't fail the request
      console.error('Failed to send SALN request-changes email:', emailError);
    }

    const totalDuration = Date.now() - startTime;
    console.log(
      `[SALN Request Changes API] Request completed in ${totalDuration}ms`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Changes requested successfully. Employee has been notified.',
        submission: {
          id: updatedSubmission.id,
          status: updatedSubmission.status,
          updatedAt: updatedSubmission.updatedAt,
        },
      },
      {
        status: 200,
        headers: {
          'X-Response-Time': `${totalDuration}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[SALN Request Changes API] Error:', error);

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
        error: 'Failed to request changes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
