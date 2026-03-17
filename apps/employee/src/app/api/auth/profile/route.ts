/**
 * Employee Profile API Route
 * Fetches the current user's profile data
 *
 * Security:
 * - Requires active session
 * - Returns profile for both employees and applicants
 */

import { NextRequest } from 'next/server';
import { createServerClient, getProfilePicturePublicUrl } from '@tupsafe/auth/server';
import { db, profiles } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '../../../../lib/api-helpers';

export async function GET(_request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('Not authenticated', 401);
    }

    const userId = user.id;

    // Fetch full profile from database
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return apiError('Profile not found', 404);
    }

    // Build avatar URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const avatarUrl = getProfilePicturePublicUrl(supabaseUrl, profile.avatarPath);

    return apiSuccess({
      id: profile.id,
      email: user.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName,
      userType: profile.userType,
      role: profile.role,
      employeeId: profile.employeeId,
      applicantId: profile.applicantId,
      departmentId: profile.departmentId,
      positionId: profile.positionId,
      accountStatus: profile.accountStatus,
      isActive: profile.isActive,
      temporaryPassword: profile.temporaryPassword,
      avatarPath: profile.avatarPath,
      avatarUrl,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return apiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500
    );
  }
}
