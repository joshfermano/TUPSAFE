/**
 * Sync User Metadata API Route - POST /api/users/[id]/sync-metadata
 *
 * Syncs user authentication metadata with database profile data.
 * Useful for fixing users whose metadata is out of sync (e.g., approved in DB but metadata still shows pending).
 *
 * Features:
 * - Reads current profile from database
 * - Updates Supabase auth metadata to match
 * - Admin/HR only
 * - Detailed logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkUserRoleFromSupabase, createServerClient } from '@tupsafe/auth/server';
import { db, profiles } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authorization check - HR or Admin only
    const hasPermission = await checkUserRoleFromSupabase(['hr', 'admin'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.',
        },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Validate user ID
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID',
        },
        { status: 400 }
      );
    }

    console.log(`[Sync Metadata] Starting sync for user ${userId}`);

    // Get user profile from database
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User profile not found in database',
        },
        { status: 404 }
      );
    }

    console.log(`[Sync Metadata] Found profile:`, {
      userId,
      accountStatus: profile.accountStatus,
      userType: profile.userType,
      employeeId: profile.employeeId,
      isActive: profile.isActive,
    });

    // Create admin Supabase client
    const supabase = await createServerClient('admin');

    // Get current auth metadata
    const { data: userData, error: userDataError } = await supabase.auth.admin.getUserById(userId);

    if (userDataError || !userData?.user) {
      console.error(`[Sync Metadata] Error fetching user auth data:`, userDataError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch user authentication data',
          details: userDataError?.message,
        },
        { status: 500 }
      );
    }

    console.log(`[Sync Metadata] Current auth metadata:`, userData.user.user_metadata);

    // Prepare updated metadata based on database profile
    const updatedMetadata = {
      ...userData.user.user_metadata,
      account_status: profile.accountStatus,
      user_type: profile.userType,
      employee_id: profile.employeeId || undefined,
      applicant_id: profile.applicantId || undefined,
      is_active: profile.isActive,
      synced_at: new Date().toISOString(),
    };

    console.log(`[Sync Metadata] Updating metadata to:`, updatedMetadata);

    // Update auth metadata to match database
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata,
    });

    if (updateError) {
      console.error(`[Sync Metadata] Error updating metadata:`, updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update user authentication metadata',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log(`[Sync Metadata] ✅ Successfully synced metadata for user ${userId}`);
    console.log(`[Sync Metadata] New metadata:`, updateData?.user?.user_metadata);

    return NextResponse.json({
      success: true,
      message: 'User metadata synced successfully',
      data: {
        userId,
        profile: {
          accountStatus: profile.accountStatus,
          userType: profile.userType,
          employeeId: profile.employeeId,
          isActive: profile.isActive,
        },
        metadata: updateData?.user?.user_metadata,
      },
    });
  } catch (error) {
    console.error('[Sync Metadata] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
