/**
 * Employee Portal PDS Latest API - GET /api/pds/latest
 *
 * Returns the user's latest PDS submission with status and year information.
 * Used by the deadline section to determine if the deadline should be hidden.
 *
 * Features:
 * - Returns most recent PDS submission by updated date
 * - Includes status, year, and approval information
 * - Returns null if no submissions exist
 *
 * Security:
 * - Requires authenticated session
 * - Only returns current user's data
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db, pdsSubmissions } from '@tupsafe/database/server';
import { eq, desc } from 'drizzle-orm';

/**
 * Response type for latest PDS submission
 */
interface LatestPDSResponse {
  success: boolean;
  data: {
    id: string;
    status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
    year: number;
    version: number;
    approvedAt: string | null;
    updatedAt: string;
  } | null;
}

/**
 * GET /api/pds/latest
 * Fetch the user's latest PDS submission
 */
export async function GET() {
  try {
    // Verify authentication
    const supabase = await createServerClient('employee');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch the latest PDS submission for this user
    const latestSubmission = await db
      .select({
        id: pdsSubmissions.id,
        status: pdsSubmissions.status,
        year: pdsSubmissions.year,
        version: pdsSubmissions.version,
        approvedAt: pdsSubmissions.approvedAt,
        updatedAt: pdsSubmissions.updatedAt,
      })
      .from(pdsSubmissions)
      .where(eq(pdsSubmissions.userId, userId))
      .orderBy(desc(pdsSubmissions.updatedAt))
      .limit(1);

    // Return null if no submissions exist
    if (!latestSubmission || latestSubmission.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
      } as LatestPDSResponse);
    }

    const submission = latestSubmission[0];

    const response: LatestPDSResponse = {
      success: true,
      data: {
        id: submission.id,
        status: submission.status as 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected',
        year: submission.year,
        version: submission.version,
        approvedAt: submission.approvedAt ? submission.approvedAt.toISOString() : null,
        updatedAt: submission.updatedAt.toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Employee PDS Latest API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch latest PDS submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
