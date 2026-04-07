/**
 * Certifications API Route - Single Resource Operations
 * GET    /api/certifications/[id] - Retrieve a certification with its files
 * PATCH  /api/certifications/[id] - Update a pending certification
 * DELETE /api/certifications/[id] - Delete a pending certification and all its files
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@tupsafe/auth/server';
import {
  SIGNED_URL_EXPIRY_SECONDS,
  PDS_ATTACHMENTS_BUCKET,
} from '@tupsafe/auth/server';
import {
  db,
  profileCertifications,
  profileCertificationFiles,
  profiles,
  notifications,
} from '@tupsafe/database/server';
import { eq, and, inArray } from 'drizzle-orm';
import type { ProfileCertificationData, CertificationFileData } from '@tupsafe/types';
import { updateCertificationSchema } from '../../../../lib/validations/certification-schema';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Helper – fetch a certification row and verify ownership, returns null on
// not-found / mismatch so callers can return a 404.
// ---------------------------------------------------------------------------
async function getOwnedCertification(certId: string, userId: string) {
  const [cert] = await db
    .select()
    .from(profileCertifications)
    .where(
      and(
        eq(profileCertifications.id, certId),
        eq(profileCertifications.userId, userId)
      )
    )
    .limit(1);

  return cert ?? null;
}

// ---------------------------------------------------------------------------
// Helper – fetch all files for a certification and generate signed URLs.
// ---------------------------------------------------------------------------
async function getFilesWithUrls(certId: string): Promise<CertificationFileData[]> {
  const fileRows = await db
    .select()
    .from(profileCertificationFiles)
    .where(eq(profileCertificationFiles.certificationId, certId));

  if (fileRows.length === 0) return [];

  const adminClient = createAdminClient();

  return Promise.all(
    fileRows.map(async (f) => {
      let fileUrl: string | null = null;
      if (f.filePath) {
        const { data: signedUrlData } = await adminClient.storage
          .from(PDS_ATTACHMENTS_BUCKET)
          .createSignedUrl(f.filePath, SIGNED_URL_EXPIRY_SECONDS);
        fileUrl = signedUrlData?.signedUrl ?? null;
      }
      return {
        id: f.id,
        certificationId: f.certificationId,
        filePath: f.filePath,
        fileName: f.fileName,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        fileUrl,
        createdAt: f.createdAt.toISOString(),
      };
    })
  );
}

// ---------------------------------------------------------------------------
// Helper – map a DB row + files to the shared response shape.
// ---------------------------------------------------------------------------
function toCertificationData(
  cert: Awaited<ReturnType<typeof getOwnedCertification>> & object,
  files: CertificationFileData[]
): ProfileCertificationData {
  return {
    id: (cert as { id: string }).id,
    userId: (cert as { userId: string }).userId,
    title: (cert as { title: string }).title,
    dateFrom: (cert as { dateFrom: string }).dateFrom,
    dateTo: (cert as { dateTo: string }).dateTo,
    hours: (cert as { hours: number | null }).hours ?? null,
    typeOfLd: (cert as { typeOfLd: string | null }).typeOfLd ?? null,
    conductedBy: (cert as { conductedBy: string | null }).conductedBy ?? null,
    verificationStatus: (cert as { verificationStatus: ProfileCertificationData['verificationStatus'] }).verificationStatus,
    verificationNotes: (cert as { verificationNotes: string | null }).verificationNotes ?? null,
    verifiedBy: (cert as { verifiedBy: string | null }).verifiedBy ?? null,
    verifiedAt: (cert as { verifiedAt: Date | null }).verifiedAt
      ? (cert as { verifiedAt: Date }).verifiedAt.toISOString()
      : null,
    files,
    createdAt: (cert as { createdAt: Date }).createdAt.toISOString(),
    updatedAt: (cert as { updatedAt: Date }).updatedAt.toISOString(),
  };
}

/**
 * GET /api/certifications/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const cert = await getOwnedCertification(id, user.id);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Certification not found or access denied' },
        { status: 404 }
      );
    }

    const files = await getFilesWithUrls(id);

    return NextResponse.json({
      success: true,
      certification: toCertificationData(cert, files),
    });
  } catch (error) {
    console.error('[GET /api/certifications/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch certification',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/certifications/[id]
 * Only certifications with verificationStatus = 'pending' may be edited.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const cert = await getOwnedCertification(id, user.id);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Certification not found or access denied' },
        { status: 404 }
      );
    }

    if (cert.verificationStatus !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot edit a certification with status '${cert.verificationStatus}'. Only pending certifications can be modified.`,
        },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = updateCertificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed' },
        { status: 422 }
      );
    }

    const updates = parsed.data;

    const [updated] = await db
      .update(profileCertifications)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(profileCertifications.id, id))
      .returning();

    const files = await getFilesWithUrls(id);

    console.log(
      `[PATCH /api/certifications/[id]] Updated certification ${id} for user ${user.id}`
    );

    // Notify all admin/co_admin/hr users about the updated certification
    const [employeeProfile] = await db
      .select({ firstName: profiles.firstName, lastName: profiles.lastName })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const adminUsers = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(inArray(profiles.role, ['admin', 'co_admin', 'hr']));

    if (adminUsers.length > 0) {
      const employeeName =
        `${employeeProfile?.firstName ?? ''} ${employeeProfile?.lastName ?? ''}`.trim() ||
        'An employee';
      const updatedTitle = (updated as { title: string }).title;

      await db.insert(notifications).values(
        adminUsers.map((admin) => ({
          userId: admin.id,
          type: 'submission_status' as const,
          title: 'Certification Updated',
          message: `${employeeName} updated their certification: "${updatedTitle}"`,
          isRead: false,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      certification: toCertificationData(updated, files),
    });
  } catch (error) {
    console.error('[PATCH /api/certifications/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update certification',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certifications/[id]
 * Deletes storage objects first, then removes the DB row (cascade handles the
 * files join table). Any certification owned by the user may be deleted.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const cert = await getOwnedCertification(id, user.id);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Certification not found or access denied' },
        { status: 404 }
      );
    }

    // Collect file paths for storage deletion before removing DB rows
    const fileRows = await db
      .select({ filePath: profileCertificationFiles.filePath })
      .from(profileCertificationFiles)
      .where(eq(profileCertificationFiles.certificationId, id));

    if (fileRows.length > 0) {
      const adminClient = createAdminClient();
      const paths = fileRows.map((f) => f.filePath);

      const { error: storageError } = await adminClient.storage
        .from(PDS_ATTACHMENTS_BUCKET)
        .remove(paths);

      if (storageError) {
        // Log but do not abort — the DB deletion is the source of truth
        console.error(
          `[DELETE /api/certifications/[id]] Storage removal partial failure for cert ${id}:`,
          storageError
        );
      }
    }

    // Delete certification row — cascade removes the files rows automatically
    await db
      .delete(profileCertifications)
      .where(eq(profileCertifications.id, id));

    console.log(
      `[DELETE /api/certifications/[id]] Deleted certification ${id} for user ${user.id}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/certifications/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete certification',
      },
      { status: 500 }
    );
  }
}
