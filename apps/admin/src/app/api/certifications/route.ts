/**
 * Admin Certifications API Route - List certifications for a user
 * GET /api/certifications?userId=XXX
 *
 * Lists all profile certifications for a specific user.
 * Requires admin, co_admin, or hr role.
 *
 * Response includes:
 * - All certification records ordered by dateFrom DESC
 * - Attached files with fresh signed URLs
 *
 * @param {string} userId - Target user ID (query parameter)
 * @returns {Object} { success: true, certifications: ProfileCertificationData[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkUserRoleFromSupabase,
  getUserFromSupabase,
  createAdminClient,
  SIGNED_URL_EXPIRY_SECONDS,
  PDS_ATTACHMENTS_BUCKET,
} from '@tupsafe/auth/server';
import {
  db,
  profileCertifications,
  profileCertificationFiles,
} from '@tupsafe/database/server';
import { eq, desc } from 'drizzle-orm';
import type {
  ProfileCertificationData,
  CertificationFileData,
} from '@tupsafe/types';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
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

    // Get current admin user for logging
    const sessionUser = await getUserFromSupabase('admin');
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Extract userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid userId format' },
        { status: 400 }
      );
    }

    // Fetch all certifications for the target user, newest first
    const certRows = await db
      .select()
      .from(profileCertifications)
      .where(eq(profileCertifications.userId, userId))
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
      `[GET /api/certifications] Admin ${sessionUser.id} fetched ${certifications.length} certifications for user ${userId}`
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
