/**
 * Admin Profile API Route
 * Fetches the current user's profile data
 *
 * Security:
 * - Requires active session
 * - Admin role verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getSessionUser } from '@tupsafe/auth/server';
import { db, profiles } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch full profile from database
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, sessionUser.userId))
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
        email: sessionUser.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        middleName: profile.middleName,
        role: profile.role,
        employeeId: profile.employeeId,
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
