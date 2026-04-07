/**
 * Certifications API Route - List and Create
 * GET  /api/certifications - List all certifications for the authenticated user
 * POST /api/certifications - Create a new certification record
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
import { eq, desc, and, gte, lt, inArray } from 'drizzle-orm';
import type { ProfileCertificationData, CertificationFileData } from '@tupsafe/types';
import { createCertificationSchema } from '../../../lib/validations/certification-schema';

/**
 * GET /api/certifications
 * Returns all profile certifications for the authenticated user,
 * each with its attached files and fresh signed URLs.
 */
export async function GET(request: NextRequest) {
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

    const userId = user.id;

    // Optional year filter: ?year=2026
    const yearParam = request.nextUrl.searchParams.get('year');
    const yearFilter = yearParam ? parseInt(yearParam, 10) : null;

    // Build where conditions
    const conditions = [eq(profileCertifications.userId, userId)];
    if (yearFilter && !isNaN(yearFilter)) {
      conditions.push(gte(profileCertifications.dateFrom, `${yearFilter}-01-01`));
      conditions.push(lt(profileCertifications.dateFrom, `${yearFilter + 1}-01-01`));
    }

    // Fetch certifications for this user, newest first
    const certRows = await db
      .select()
      .from(profileCertifications)
      .where(and(...conditions))
      .orderBy(desc(profileCertifications.dateFrom));

    if (certRows.length === 0) {
      return NextResponse.json({ success: true, certifications: [] });
    }

    const adminClient = createAdminClient();

    // For each certification, load its files and generate signed URLs
    const certifications: ProfileCertificationData[] = await Promise.all(
      certRows.map(async (cert) => {
        const fileRows = await db
          .select()
          .from(profileCertificationFiles)
          .where(eq(profileCertificationFiles.certificationId, cert.id));

        const files: CertificationFileData[] = await Promise.all(
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

        return {
          id: cert.id,
          userId: cert.userId,
          title: cert.title,
          dateFrom: cert.dateFrom,
          dateTo: cert.dateTo,
          hours: cert.hours ?? null,
          typeOfLd: cert.typeOfLd ?? null,
          conductedBy: cert.conductedBy ?? null,
          verificationStatus: cert.verificationStatus,
          verificationNotes: cert.verificationNotes ?? null,
          verifiedBy: cert.verifiedBy ?? null,
          verifiedAt: cert.verifiedAt ? cert.verifiedAt.toISOString() : null,
          files,
          createdAt: cert.createdAt.toISOString(),
          updatedAt: cert.updatedAt.toISOString(),
        };
      })
    );

    console.log(
      `[GET /api/certifications] Returned ${certifications.length} certifications for user ${userId}`
    );

    return NextResponse.json({ success: true, certifications });
  } catch (error) {
    console.error('[GET /api/certifications] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch certifications',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certifications
 * Creates a new certification record for the authenticated user.
 * File uploads are handled separately via POST /api/certifications/[id]/files.
 */
export async function POST(request: NextRequest) {
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

    const userId = user.id;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = createCertificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed' },
        { status: 422 }
      );
    }

    const { title, dateFrom, dateTo, hours, typeOfLd, conductedBy } = parsed.data;

    const [cert] = await db
      .insert(profileCertifications)
      .values({
        userId,
        title,
        dateFrom,
        dateTo,
        hours: hours ?? null,
        typeOfLd: typeOfLd ?? null,
        conductedBy: conductedBy ?? null,
      })
      .returning();

    console.log(
      `[POST /api/certifications] Created certification ${cert.id} for user ${userId}`
    );

    const certification: ProfileCertificationData = {
      id: cert.id,
      userId: cert.userId,
      title: cert.title,
      dateFrom: cert.dateFrom,
      dateTo: cert.dateTo,
      hours: cert.hours ?? null,
      typeOfLd: cert.typeOfLd ?? null,
      conductedBy: cert.conductedBy ?? null,
      verificationStatus: cert.verificationStatus,
      verificationNotes: cert.verificationNotes ?? null,
      verifiedBy: cert.verifiedBy ?? null,
      verifiedAt: cert.verifiedAt ? cert.verifiedAt.toISOString() : null,
      files: [],
      createdAt: cert.createdAt.toISOString(),
      updatedAt: cert.updatedAt.toISOString(),
    };

    // Notify all admin/co_admin/hr users about the new certification
    const [employeeProfile] = await db
      .select({ firstName: profiles.firstName, lastName: profiles.lastName })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const adminUsers = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(inArray(profiles.role, ['admin', 'co_admin', 'hr']));

    if (adminUsers.length > 0) {
      const employeeName =
        `${employeeProfile?.firstName ?? ''} ${employeeProfile?.lastName ?? ''}`.trim() ||
        'An employee';

      await db.insert(notifications).values(
        adminUsers.map((admin) => ({
          userId: admin.id,
          type: 'submission_status' as const,
          title: 'New Certification Uploaded',
          message: `${employeeName} uploaded a new certification: "${title}"`,
          isRead: false,
        }))
      );
    }

    return NextResponse.json({ success: true, certification }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/certifications] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create certification',
      },
      { status: 500 }
    );
  }
}
