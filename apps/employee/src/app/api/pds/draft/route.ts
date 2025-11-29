/**
 * PDS Draft API - Save and retrieve drafts
 * POST /api/pds/draft - Save draft to server
 * GET /api/pds/draft - Retrieve latest draft
 * DELETE /api/pds/draft - Clear draft
 *
 * This endpoint provides server-side draft persistence for the PDS form.
 * It complements the client-side localStorage auto-save functionality.
 *
 * Draft storage approach:
 * - Uses the notifications table with a special type for draft storage
 * - Alternative: Could be refactored to use a dedicated pdsDrafts table
 *
 * Note: This is a lightweight implementation that stores draft data
 * in the user's own context. For a more robust solution, consider
 * adding a dedicated pdsDrafts table to the schema.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db, notifications } from '@tupsafe/database/server';
import { eq, and, desc } from 'drizzle-orm';

// Draft storage key for identification
const DRAFT_TITLE = 'PDS Draft Data';

/**
 * POST /api/pds/draft
 * Save or update the PDS draft for the current user
 *
 * Body: PdsDraftData
 * {
 *   formData: Partial<CompletePdsData>,
 *   completedSteps: number[],
 *   currentStep: number,
 *   savedAt: string
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[POST /api/pds/draft] Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Parse request body
    let draftData: unknown;
    try {
      draftData = await request.json();
    } catch (parseError) {
      console.error('[POST /api/pds/draft] Invalid JSON body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected valid JSON.' },
        { status: 400 }
      );
    }

    // Validate that we have some data to save
    if (!draftData || typeof draftData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Draft data is required.' },
        { status: 400 }
      );
    }

    // Check if a draft notification already exists for this user
    const existingDrafts = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.title, DRAFT_TITLE)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(1);

    if (existingDrafts.length > 0) {
      // Update existing draft by deleting old and creating new
      // (notifications table doesn't have an update-friendly structure for this)
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.title, DRAFT_TITLE)
          )
        );
    }

    // Create new draft notification entry
    await db.insert(notifications).values({
      userId: session.user.id,
      type: 'system_update', // Using system_update as closest match
      title: DRAFT_TITLE,
      message: JSON.stringify(draftData),
      isRead: true, // Mark as read so it doesn't show in notifications
    });

    console.log(
      `[POST /api/pds/draft] Saved draft for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully',
    });
  } catch (error) {
    console.error('[POST /api/pds/draft] Error saving draft:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to save draft',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pds/draft
 * Retrieve the latest PDS draft for the current user
 *
 * Returns:
 * {
 *   success: true,
 *   data: PdsDraftData | null
 * }
 */
export async function GET() {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[GET /api/pds/draft] Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Fetch the latest draft for this user
    const drafts = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.title, DRAFT_TITLE)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(1);

    if (drafts.length === 0) {
      console.log(
        `[GET /api/pds/draft] No draft found for user ${session.user.id}`
      );
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Parse the stored draft data
    let draftData = null;
    try {
      draftData = JSON.parse(drafts[0].message);
    } catch (parseError) {
      console.error(
        '[GET /api/pds/draft] Failed to parse draft data:',
        parseError
      );
      // Return null if parsing fails - the draft is corrupted
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    console.log(
      `[GET /api/pds/draft] Retrieved draft for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      data: draftData,
    });
  } catch (error) {
    console.error('[GET /api/pds/draft] Error retrieving draft:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to retrieve draft',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pds/draft
 * Clear the PDS draft for the current user
 *
 * Returns:
 * {
 *   success: true,
 *   message: string
 * }
 */
export async function DELETE() {
  try {
    // Authenticate user
    const supabase = await createServerClient('employee');
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error(
        '[DELETE /api/pds/draft] Authentication failed:',
        authError
      );
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Delete all draft notifications for this user
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.title, DRAFT_TITLE)
        )
      );

    console.log(
      `[DELETE /api/pds/draft] Cleared draft for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Draft cleared successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/pds/draft] Error clearing draft:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to clear draft',
      },
      { status: 500 }
    );
  }
}
