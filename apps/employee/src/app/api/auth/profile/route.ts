/**
 * Employee Profile API Route
 * Fetches the current user's profile data
 *
 * Security:
 * - Requires active session
 * - Returns profile for both employees and applicants
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@tupsafe/auth/server';
import { db, profiles } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

export async function GET(_request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient('employee');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Fetch full profile from database
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
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
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
