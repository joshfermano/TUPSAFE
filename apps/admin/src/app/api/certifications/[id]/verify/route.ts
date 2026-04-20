/**
 * Certification Verification API Route
 * PATCH /api/certifications/[id]/verify
 *
 * Verifies or rejects a profile certification.
 * Requires admin, co_admin, or hr role.
 *
 * Workflow:
 * 1. Validate admin/HR has permission
 * 2. Verify certification exists
 * 3. Update verificationStatus, verificationNotes, verifiedBy, verifiedAt
 * 4. Create audit log entry
 * 5. Create notification for the employee
 * 6. Return updated certification
 *
 * @param {string} id - Certification ID (UUID)
 * @param {Object} body - { status: 'verified' | 'rejected', notes?: string }
 * @returns {Object} { success: true, certification: updated }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkUserRoleFromSupabase,
  getUserFromSupabase,
} from '@tupsafe/auth/server';
import {
  db,
  profileCertifications,
  notifications,
} from '@tupsafe/database/server';
import { createAuditLog } from '@tupsafe/database/utils/audit-log';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
interface VerifyRequestBody {
  status: 'verified' | 'rejected';
  notes?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin/HR permissions
    const hasPermission = await checkUserRoleFromSupabase(
      ['superadmin', 'admin', 'hr'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin, Co-Admin, or HR role required.' },
        { status: 403 }
      );
    }

    // Get current admin user
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid certification ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body: VerifyRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    if (!body.status || !['verified', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Must be "verified" or "rejected".',
        },
        { status: 400 }
      );
    }

    // Notes are required for rejection (min 10 chars)
    if (body.status === 'rejected') {
      if (!body.notes || body.notes.trim().length < 10) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Notes are required when rejecting a certification (minimum 10 characters).',
          },
          { status: 400 }
        );
      }
    }

    // Fetch the certification
    const [certification] = await db
      .select()
      .from(profileCertifications)
      .where(eq(profileCertifications.id, id))
      .limit(1);

    if (!certification) {
      return NextResponse.json(
        { success: false, error: 'Certification not found' },
        { status: 404 }
      );
    }

    // Update the certification verification fields
    const now = new Date();
    const [updated] = await db
      .update(profileCertifications)
      .set({
        verificationStatus: body.status,
        verificationNotes: body.notes?.trim() || null,
        verifiedBy: sessionUser.id,
        verifiedAt: now,
        updatedAt: now,
      })
      .where(eq(profileCertifications.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update certification' },
        { status: 500 }
      );
    }

    // Create audit log entry
    await createAuditLog({
      userId: sessionUser.id,
      action:
        body.status === 'verified'
          ? 'verify_certification'
          : 'reject_certification',
      entityType: 'profile_certification',
      entityId: id,
      changes: {
        certificationId: id,
        certificationTitle: certification.title,
        previousStatus: certification.verificationStatus,
        newStatus: body.status,
        notes: body.notes?.trim() || null,
        employeeUserId: certification.userId,
      },
      ipAddress:
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Create notification for the employee
    const notificationTitle =
      body.status === 'verified'
        ? 'Certification Verified'
        : 'Certification Rejected';
    const notificationMessage =
      body.status === 'verified'
        ? `Your certification "${certification.title}" has been verified.${body.notes ? ` Notes: ${body.notes.trim()}` : ''}`
        : `Your certification "${certification.title}" has been rejected.${body.notes ? ` Reason: ${body.notes.trim()}` : ''}`;

    await db.insert(notifications).values({
      userId: certification.userId,
      type: 'submission_status',
      title: notificationTitle,
      message: notificationMessage,
      isRead: false,
      createdAt: now,
    });

    console.log(
      `[PATCH /api/certifications/${id}/verify] Admin ${sessionUser.id} ${body.status} certification "${certification.title}" for user ${certification.userId}`
    );

    return NextResponse.json({
      success: true,
      certification: {
        id: updated.id,
        userId: updated.userId,
        title: updated.title,
        dateFrom: updated.dateFrom,
        dateTo: updated.dateTo,
        hours: updated.hours ?? null,
        typeOfLd: updated.typeOfLd ?? null,
        conductedBy: updated.conductedBy ?? null,
        verificationStatus: updated.verificationStatus,
        verificationNotes: updated.verificationNotes ?? null,
        verifiedBy: updated.verifiedBy ?? null,
        verifiedAt: updated.verifiedAt
          ? updated.verifiedAt.toISOString()
          : null,
        files: [],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[PATCH /api/certifications/[id]/verify] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to verify certification',
      },
      { status: 500 }
    );
  }
}
