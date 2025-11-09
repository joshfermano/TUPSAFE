/**
 * Pending Registrations API Route
 * Lists all pending employee registrations for admin approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tupsafe/database';
import { pendingRegistrations, profiles } from '@tupsafe/database';
import { eq } from 'drizzle-orm';
import { checkUserRole } from '@tupsafe/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user has HR or admin role
    const hasPermission = await checkUserRole(['hr', 'admin']);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized. HR or Admin role required.' },
        { status: 403 }
      );
    }

    // Fetch all pending registrations with user profile data
    const pendingUsers = await db
      .select({
        registrationId: pendingRegistrations.id,
        userId: pendingRegistrations.userId,
        status: pendingRegistrations.status,
        adminNotes: pendingRegistrations.adminNotes,
        createdAt: pendingRegistrations.createdAt,
        // Profile data
        employeeId: profiles.employeeId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        middleName: profiles.middleName,
        phoneNumber: profiles.phoneNumber,
        departmentId: profiles.departmentId,
        positionId: profiles.positionId,
        academicRank: profiles.academicRank,
        tenureStatus: profiles.tenureStatus,
        employmentType: profiles.employmentType,
        campusAssignment: profiles.campusAssignment,
        emailVerifiedAt: profiles.emailVerifiedAt,
      })
      .from(pendingRegistrations)
      .innerJoin(profiles, eq(pendingRegistrations.userId, profiles.id))
      .where(eq(pendingRegistrations.status, 'pending'))
      .orderBy(pendingRegistrations.createdAt);

    // Get email addresses from Supabase for each user
    // Note: In production, you might want to cache this or optimize the queries
    const usersWithEmails = await Promise.all(
      pendingUsers.map(async (user) => {
        try {
          const { createServerClient } = await import('@tupsafe/auth');
          const supabase = await createServerClient();
          const { data: userData } = await supabase.auth.admin.getUserById(user.userId);

          return {
            ...user,
            email: userData?.user?.email || null,
          };
        } catch (error) {
          console.error(`Error fetching email for user ${user.userId}:`, error);
          return {
            ...user,
            email: null,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithEmails,
      count: usersWithEmails.length,
    });
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while fetching pending registrations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
