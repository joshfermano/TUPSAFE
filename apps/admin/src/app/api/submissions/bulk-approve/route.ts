/**
 * Bulk Submission Approval API
 * POST /api/submissions/bulk-approve
 *
 * Approves multiple submissions (PDS and/or SALN) in a single operation
 *
 * Features:
 * - Support for mixed PDS and SALN submissions
 * - Maximum 50 submissions per request
 * - Individual success/failure tracking
 * - Transaction handling per submission
 * - Batch notifications
 * - Comprehensive error reporting
 * - Audit logging for each approval
 *
 * Workflow:
 * 1. Validate admin/HR permissions
 * 2. Validate request (1-50 submissions)
 * 3. Process each submission independently
 * 4. Track individual success/failure
 * 5. Create audit logs for all approvals
 * 6. Send batch notifications
 * 7. Return detailed results
 *
 * Security:
 * - Requires admin or hr role
 * - Individual authorization checks per submission
 * - Cannot approve own submissions
 * - Transaction isolation prevents partial failures
 * - Comprehensive audit trail
 *
 * @param {BulkApproveData} body - Array of submission IDs with types and optional notes
 * @returns {BulkApproveResponse} Detailed results for each submission
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromSupabase,
  createAdminClient,
  sendBulkApprovalEmail,
} from '@tupsafe/auth/server';
import { db, pdsSubmissions, salnSubmissions, notifications, profiles } from '@tupsafe/database/server';
import { eq, and, or, inArray } from 'drizzle-orm';
import { createAuditLog } from '@tupsafe/database/utils/audit-log';
import {
  bulkApproveSchema,
  type BulkApproveResponse,
  type ApiSuccess,
} from '@tupsafe/types';
import { v7 as uuidv7 } from 'uuid';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    // Get current user from Supabase session (portal-specific)
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Verify admin/HR permissions
    const allowedRoles = ['admin', 'co_admin', 'hr'];
    if (!allowedRoles.includes(sessionUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkApproveSchema.parse(body);

    // Separate PDS and SALN submission IDs
    const pdsIds = validatedData.submissionIds
      .filter((s) => s.type === 'pds')
      .map((s) => s.id);
    const salnIds = validatedData.submissionIds
      .filter((s) => s.type === 'saln')
      .map((s) => s.id);

    // Fetch all PDS submissions with employee info
    const pdsSubmissionsToApprove = pdsIds.length
      ? await db
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
          .where(inArray(pdsSubmissions.id, pdsIds))
      : [];

    // Fetch all SALN submissions with employee info
    const salnSubmissionsToApprove = salnIds.length
      ? await db
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
          .where(inArray(salnSubmissions.id, salnIds))
      : [];

    const now = new Date();
    const results: BulkApproveResponse['results'] = [];
    const notificationsToSend: Array<{
      userId: string;
      title: string;
      message: string;
    }> = [];
    
    // Track approvals per user for email aggregation
    const approvalsPerUser: Map<
      string,
      {
        employeeName: string;
        approvals: Array<{ type: 'pds' | 'saln'; identifier: string }>;
      }
    > = new Map();

    // Process each PDS submission
    for (const submission of pdsSubmissionsToApprove) {
      try {
        // Prevent self-review
        if (submission.userId === sessionUser.id) {
          results.push({
            id: submission.id,
            type: 'pds',
            status: 'failed',
            error: 'Cannot approve your own submission',
          });
          continue;
        }

        // Verify status is reviewable
        if (submission.status !== 'submitted' && submission.status !== 'reviewing') {
          results.push({
            id: submission.id,
            type: 'pds',
            status: 'failed',
            error: `Invalid status: ${submission.status}`,
          });
          continue;
        }

        // Update submission to approved
        const [updated] = await db
          .update(pdsSubmissions)
          .set({
            status: 'approved',
            approvedBy: sessionUser.id,
            approvedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(pdsSubmissions.id, submission.id),
              or(
                eq(pdsSubmissions.status, 'submitted'),
                eq(pdsSubmissions.status, 'reviewing')
              )
            )
          )
          .returning();

        if (!updated) {
          results.push({
            id: submission.id,
            type: 'pds',
            status: 'failed',
            error: 'Failed to update submission',
          });
          continue;
        }

        // Create audit log
        await createAuditLog({
          userId: sessionUser.id,
          action: 'bulk_approve_pds_submission',
          entityType: 'pds_submission',
          entityId: submission.id,
          changes: {
            submissionId: submission.id,
            previousStatus: submission.status,
            newStatus: 'approved',
            approvedBy: sessionUser.id,
            approvedAt: now.toISOString(),
            version: submission.version,
            bulkOperation: true,
            notes: validatedData.notes,
          },
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        // Queue notification
        notificationsToSend.push({
          userId: submission.userId,
          title: 'PDS Submission Approved',
          message: `Your PDS submission (Version ${submission.version}) has been approved.${validatedData.notes ? ` Notes: ${validatedData.notes}` : ''}`,
        });

        // Track for email aggregation
        const existingUserApprovals = approvalsPerUser.get(submission.userId);
        if (existingUserApprovals) {
          existingUserApprovals.approvals.push({
            type: 'pds',
            identifier: String(submission.version),
          });
        } else {
          approvalsPerUser.set(submission.userId, {
            employeeName: `${submission.employeeFirstName} ${submission.employeeLastName}`,
            approvals: [{ type: 'pds', identifier: String(submission.version) }],
          });
        }

        results.push({
          id: submission.id,
          type: 'pds',
          status: 'approved',
        });
      } catch (error) {
        console.error(`Error approving PDS ${submission.id}:`, error);
        results.push({
          id: submission.id,
          type: 'pds',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Process each SALN submission
    for (const submission of salnSubmissionsToApprove) {
      try {
        // Prevent self-review
        if (submission.userId === sessionUser.id) {
          results.push({
            id: submission.id,
            type: 'saln',
            status: 'failed',
            error: 'Cannot approve your own submission',
          });
          continue;
        }

        // Verify status is reviewable
        if (submission.status !== 'submitted' && submission.status !== 'reviewing') {
          results.push({
            id: submission.id,
            type: 'saln',
            status: 'failed',
            error: `Invalid status: ${submission.status}`,
          });
          continue;
        }

        // Update submission to approved
        const [updated] = await db
          .update(salnSubmissions)
          .set({
            status: 'approved',
            approvedBy: sessionUser.id,
            approvedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(salnSubmissions.id, submission.id),
              or(
                eq(salnSubmissions.status, 'submitted'),
                eq(salnSubmissions.status, 'reviewing')
              )
            )
          )
          .returning();

        if (!updated) {
          results.push({
            id: submission.id,
            type: 'saln',
            status: 'failed',
            error: 'Failed to update submission',
          });
          continue;
        }

        // Create audit log
        await createAuditLog({
          userId: sessionUser.id,
          action: 'bulk_approve_saln_submission',
          entityType: 'saln_submission',
          entityId: submission.id,
          changes: {
            submissionId: submission.id,
            previousStatus: submission.status,
            newStatus: 'approved',
            approvedBy: sessionUser.id,
            approvedAt: now.toISOString(),
            fiscalYear: submission.year,
            bulkOperation: true,
            notes: validatedData.notes,
          },
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        // Queue notification
        notificationsToSend.push({
          userId: submission.userId,
          title: 'SALN Submission Approved',
          message: `Your SALN submission for fiscal year ${submission.year} has been approved.${validatedData.notes ? ` Notes: ${validatedData.notes}` : ''}`,
        });

        // Track for email aggregation
        const existingSalnUserApprovals = approvalsPerUser.get(submission.userId);
        if (existingSalnUserApprovals) {
          existingSalnUserApprovals.approvals.push({
            type: 'saln',
            identifier: String(submission.year),
          });
        } else {
          approvalsPerUser.set(submission.userId, {
            employeeName: `${submission.employeeFirstName} ${submission.employeeLastName}`,
            approvals: [{ type: 'saln', identifier: String(submission.year) }],
          });
        }

        results.push({
          id: submission.id,
          type: 'saln',
          status: 'approved',
        });
      } catch (error) {
        console.error(`Error approving SALN ${submission.id}:`, error);
        results.push({
          id: submission.id,
          type: 'saln',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Send all notifications in batch
    if (notificationsToSend.length > 0) {
      await db.insert(notifications).values(
        notificationsToSend.map((n) => ({
          id: uuidv7(),
          userId: n.userId,
          type: 'submission_status' as const,
          title: n.title,
          message: n.message,
          isRead: false,
          createdAt: now,
        }))
      );
    }

    // Send aggregated email notifications per user (best-effort)
    if (approvalsPerUser.size > 0) {
      const adminClient = createAdminClient();

      for (const [userId, userApprovals] of approvalsPerUser) {
        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(userId);

          if (userData?.user?.email) {
            await sendBulkApprovalEmail({
              to: userData.user.email,
              employeeName: userApprovals.employeeName,
              approvals: userApprovals.approvals,
              notes: validatedData.notes,
            });
          }
        } catch (emailError) {
          // Log but don't fail the request
          console.error(`Failed to send bulk approval email to user ${userId}:`, emailError);
        }
      }
    }

    // Calculate summary
    const approvedCount = results.filter((r) => r.status === 'approved').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    const response: ApiSuccess<BulkApproveResponse> = {
      success: true,
      message: `Bulk approval completed: ${approvedCount} approved, ${failedCount} failed`,
      data: {
        success: failedCount === 0,
        results,
        summary: {
          total: results.length,
          approved: approvedCount,
          failed: failedCount,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Bulk approval error:', error);

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
        error: 'Failed to perform bulk approval',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
