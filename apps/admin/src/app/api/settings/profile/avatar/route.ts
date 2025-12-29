/**
 * Admin Portal Avatar API Route
 * Handles profile picture upload and deletion
 *
 * Security:
 * - Requires active session with admin portal roles
 * - Users can only modify their own avatar
 * - File validation (size, type)
 *
 * Endpoints:
 * - POST: Upload new profile picture
 * - DELETE: Remove profile picture
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient, checkUserRoleFromSupabase } from '@tupsafe/auth/server';
import { db, profiles } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import {
  validateProfilePictureFile,
  buildProfilePicturePath,
  getProfilePicturePublicUrl,
  PROFILE_PICTURES_BUCKET,
} from '@tupsafe/auth/server';

/**
 * POST /api/settings/profile/avatar
 * Upload a new profile picture
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication with admin portal roles
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'hr', 'supervisor', 'employee'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get authenticated user
    const supabase = await createServerClient('admin');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateProfilePictureFile({
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Get current avatar path to delete later
    const [currentProfile] = await db
      .select({ avatarPath: profiles.avatarPath })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const previousAvatarPath = currentProfile?.avatarPath;

    // Build new storage path
    const newAvatarPath = buildProfilePicturePath(userId, file.type);

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Use admin client for storage operations (bypasses RLS)
    // This is safe because we've already validated the user session above
    const adminSupabase = createAdminClient();

    // Upload to Supabase Storage using admin client
    const { error: uploadError } = await adminSupabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .upload(newAvatarPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Avatar API] Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Update profile with new avatar path
    await db
      .update(profiles)
      .set({
        avatarPath: newAvatarPath,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId));

    // Delete previous avatar if it existed
    if (previousAvatarPath) {
      const { error: deleteError } = await adminSupabase.storage
        .from(PROFILE_PICTURES_BUCKET)
        .remove([previousAvatarPath]);

      if (deleteError) {
        // Log but don't fail - the new avatar is already set
        console.warn('[Avatar API] Failed to delete previous avatar:', deleteError);
      }
    }

    // Build public URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const avatarUrl = getProfilePicturePublicUrl(supabaseUrl, newAvatarPath);

    return NextResponse.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      avatarPath: newAvatarPath,
      avatarUrl,
    });
  } catch (error) {
    console.error('[Avatar API] POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload profile picture',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/profile/avatar
 * Remove profile picture
 */
export async function DELETE(_request: NextRequest) {
  try {
    // Verify authentication with admin portal roles
    const hasPermission = await checkUserRoleFromSupabase(
      ['admin', 'hr', 'supervisor', 'employee'],
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get authenticated user
    const supabase = await createServerClient('admin');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;

    // Get current avatar path
    const [currentProfile] = await db
      .select({ avatarPath: profiles.avatarPath })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const avatarPath = currentProfile?.avatarPath;

    if (!avatarPath) {
      return NextResponse.json({
        success: true,
        message: 'No profile picture to remove',
        avatarPath: null,
        avatarUrl: null,
      });
    }

    // Use admin client for storage operations (bypasses RLS)
    // This is safe because we've already validated the user session above
    const adminSupabase = createAdminClient();

    // Delete from storage using admin client
    const { error: deleteError } = await adminSupabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .remove([avatarPath]);

    if (deleteError) {
      console.error('[Avatar API] Delete error:', deleteError);
      // Continue anyway - we want to clear the DB reference
    }

    // Clear avatar path in profile
    await db
      .update(profiles)
      .set({
        avatarPath: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId));

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully',
      avatarPath: null,
      avatarUrl: null,
    });
  } catch (error) {
    console.error('[Avatar API] DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove profile picture',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

