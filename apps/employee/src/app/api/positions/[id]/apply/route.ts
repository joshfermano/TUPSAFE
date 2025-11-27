/**
 * Job Application Submission API Route
 * POST /api/positions/[id]/apply
 *
 * Handles job application submissions including:
 * - Application validation (deadline, duplicate check)
 * - Application number generation
 * - PDS linking
 * - Resume/document upload handling
 * - Status history tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db } from '@tupsafe/database/server';
import {
  openPositions,
  jobApplications,
  applicationStatusHistory,
  auditLogs,
} from '@tupsafe/database/server';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Generate unique application number
 * Format: APP-YYYYMMDD-XXXX
 */
function generateApplicationNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `APP-${year}${month}${day}-${random}`;
}

/**
 * POST /api/positions/[id]/apply
 * Submit a job application for a specific position
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: positionId } = await params;

    // 1. Authentication - Verify user is authenticated
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required. Please log in to apply.',
        },
        { status: 401 }
      );
    }

    // 2. Verify user is an applicant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, applicant_id, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'User profile not found.',
        },
        { status: 403 }
      );
    }

    if (profile.user_type !== 'applicant') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Only applicants can submit job applications.',
        },
        { status: 403 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Account is not active. Please verify your email.',
        },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { coverLetter, resumeUrl, pdsSubmissionId, additionalDocuments } = body;

    // Basic validation
    if (!coverLetter || coverLetter.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          message: 'Cover letter must be at least 50 characters long.',
        },
        { status: 400 }
      );
    }

    // 4. Verify position exists and is open
    const positionQuery = await db
      .select({
        id: openPositions.id,
        status: openPositions.status,
        applicationDeadline: openPositions.applicationDeadline,
        positionTitle: openPositions.positionTitle,
      })
      .from(openPositions)
      .where(eq(openPositions.id, positionId))
      .limit(1);

    if (positionQuery.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Position not found.',
        },
        { status: 404 }
      );
    }

    const position = positionQuery[0];

    if (position.status !== 'open') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Request',
          message: 'This position is no longer accepting applications.',
        },
        { status: 400 }
      );
    }

    // Check deadline
    const now = new Date();
    const deadline = new Date(position.applicationDeadline);
    if (now > deadline) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Request',
          message: 'Application deadline has passed.',
        },
        { status: 400 }
      );
    }

    // 5. Check for duplicate application
    const existingApplication = await db
      .select({ id: jobApplications.id })
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.applicantId, user.id),
          eq(jobApplications.positionId, positionId)
        )
      )
      .limit(1);

    if (existingApplication.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate Application',
          message: 'You have already applied to this position.',
        },
        { status: 409 }
      );
    }

    // 6. Generate application number
    const applicationNumber = generateApplicationNumber();

    // 7. Create application record
    const [newApplication] = await db
      .insert(jobApplications)
      .values({
        id: sql`gen_random_uuid()`,
        applicationNumber,
        applicantId: user.id,
        positionId,
        coverLetter: coverLetter.trim(),
        resumeUrl: resumeUrl || null,
        pdsSubmissionId: pdsSubmissionId || null,
        additionalDocuments: additionalDocuments || null,
        status: 'pending',
        applicationDate: sql`now()`,
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .returning();

    // 8. Create initial status history record
    await db.insert(applicationStatusHistory).values({
      id: sql`gen_random_uuid()`,
      applicationId: newApplication.id,
      previousStatus: null,
      newStatus: 'pending',
      changedAt: sql`now()`,
      changedBy: user.id,
      notes: 'Application submitted',
    });

    // 9. Update position applications count
    await db
      .update(openPositions)
      .set({
        applicationsReceived: sql`${openPositions.applicationsReceived} + 1`,
        updatedAt: sql`now()`,
      })
      .where(eq(openPositions.id, positionId));

    // 10. Create audit log
    await db.insert(auditLogs).values({
      id: sql`gen_random_uuid()`,
      userId: user.id,
      action: 'application_submitted',
      entityType: 'job_application',
      entityId: newApplication.id,
      changes: {
        positionId,
        positionTitle: position.positionTitle,
        applicationNumber,
        status: 'pending',
      },
      ipAddress: request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 null,
      userAgent: request.headers.get('user-agent') || null,
      createdAt: sql`now()`,
    });

    // 11. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationId: newApplication.id,
          applicationNumber: newApplication.applicationNumber,
          status: newApplication.status,
          applicationDate: newApplication.applicationDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/positions/[id]/apply] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your application.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
