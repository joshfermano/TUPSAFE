/**
 * User Profile Settings API - GET/PUT /api/settings/profile
 *
 * Provides user profile management for the admin portal settings page.
 * Allows users to view and update their personal information.
 *
 * Features:
 * - GET: Fetch current user's profile with joined department and position data
 * - PUT: Update user profile (first name, last name, middle name, phone number)
 * - Audit logging for profile updates with before/after state
 * - Validation using Zod schemas from @tupsafe/types
 *
 * Security:
 * - Requires active session
 * - Users can only access/update their own profile
 * - Role, employeeId, departmentId, positionId are immutable (HR-only fields)
 * - Performance logging for optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSupabase, createServerClient } from '@tupsafe/auth/server';
import { db, profiles, departments, positions, auditLogs } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';
import {
  updateProfileRequestSchema,
  type UpdateProfileResponse,
  type UserProfile,
} from '@tupsafe/types';

/**
 * GET /api/settings/profile
 * Fetch current user's profile with department and position details
 */
export async function GET() {
  const startTime = Date.now();

  try {
    console.log('[Profile Settings API] GET request received');

    // Get current user from Supabase session
    const user = await getUserFromSupabase();
    if (!user) {
      console.log('[Profile Settings API] No authenticated session');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`[Profile Settings API] Fetching profile for user: ${user.userId}`);

    // Get Supabase client for email
    const supabase = await createServerClient('admin');
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Fetch profile with joined department and position
    const profileData = await db
      .select({
        // Profile fields
        id: profiles.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        middleName: profiles.middleName,
        employeeId: profiles.employeeId,
        departmentId: profiles.departmentId,
        positionId: profiles.positionId,
        phoneNumber: profiles.phoneNumber,
        role: profiles.role,
        accountStatus: profiles.accountStatus,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,

        // Department fields
        departmentName: departments.name,
        departmentCode: departments.code,

        // Position fields
        positionTitle: positions.title,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(positions, eq(profiles.positionId, positions.id))
      .where(eq(profiles.id, user.userId))
      .limit(1);

    if (!profileData || profileData.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const data = profileData[0];

    // Transform to UserProfile type
    const profile: UserProfile = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      email: session.user.email || '',
      employeeId: data.employeeId,
      departmentId: data.departmentId,
      positionId: data.positionId,
      phoneNumber: data.phoneNumber,
      role: data.role,
      accountStatus: data.accountStatus,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,

      // Include department details if exists
      department: data.departmentId
        ? {
            id: data.departmentId,
            name: data.departmentName || '',
            code: data.departmentCode || '',
          }
        : null,

      // Include position details if exists
      position: data.positionId
        ? {
            id: data.positionId,
            title: data.positionTitle || '',
          }
        : null,
    };

    const duration = Date.now() - startTime;
    console.log(`[Profile Settings API] Profile fetched successfully in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        message: 'Profile fetched successfully',
        profile,
      },
      {
        status: 200,
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[Profile Settings API] GET error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as UpdateProfileResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/profile
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Profile Settings API] PUT request received');

    // Get current user from Supabase session
    const user = await getUserFromSupabase();
    if (!user) {
      console.log('[Profile Settings API] No authenticated session');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`[Profile Settings API] Updating profile for user: ${user.userId}`);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileRequestSchema.parse(body);

    // Get current profile for audit logging
    const [currentProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.userId))
      .limit(1);

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Update profile
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        middleName: validatedData.middleName || null,
        phoneNumber: validatedData.phoneNumber || null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.userId))
      .returning();

    if (!updatedProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update profile',
        } as UpdateProfileResponse,
        { status: 500 }
      );
    }

    // Get client IP and user agent for audit log
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit log entry with before/after state
    await db.insert(auditLogs).values({
      userId: user.userId,
      action: 'update_profile',
      entityType: 'profile',
      entityId: user.userId,
      changes: {
        before: {
          firstName: currentProfile.firstName,
          lastName: currentProfile.lastName,
          middleName: currentProfile.middleName,
          phoneNumber: currentProfile.phoneNumber,
        },
        after: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          middleName: validatedData.middleName,
          phoneNumber: validatedData.phoneNumber,
        },
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    // Fetch updated profile with department and position
    const supabase = await createServerClient('admin');
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const profileData = await db
      .select({
        id: profiles.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        middleName: profiles.middleName,
        employeeId: profiles.employeeId,
        departmentId: profiles.departmentId,
        positionId: profiles.positionId,
        phoneNumber: profiles.phoneNumber,
        role: profiles.role,
        accountStatus: profiles.accountStatus,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
        departmentName: departments.name,
        departmentCode: departments.code,
        positionTitle: positions.title,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(positions, eq(profiles.positionId, positions.id))
      .where(eq(profiles.id, user.userId))
      .limit(1);

    const data = profileData[0];

    const profile: UserProfile = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      email: session?.user.email || '',
      employeeId: data.employeeId,
      departmentId: data.departmentId,
      positionId: data.positionId,
      phoneNumber: data.phoneNumber,
      role: data.role,
      accountStatus: data.accountStatus,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      department: data.departmentId
        ? {
            id: data.departmentId,
            name: data.departmentName || '',
            code: data.departmentCode || '',
          }
        : null,
      position: data.positionId
        ? {
            id: data.positionId,
            title: data.positionTitle || '',
          }
        : null,
    };

    const duration = Date.now() - startTime;
    console.log(`[Profile Settings API] Profile updated successfully in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        profile,
      } as UpdateProfileResponse,
      {
        status: 200,
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[Profile Settings API] PUT error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          error: error.message,
        } as UpdateProfileResponse,
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as UpdateProfileResponse,
      { status: 500 }
    );
  }
}
