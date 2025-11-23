/**
 * Registration Detail API Route - GET /api/registrations/[id]
 * Retrieves detailed information about a specific registration request
 *
 * Features:
 * - Complete profile information
 * - Department and position details
 * - Pending registration status and history
 * - Email and contact information
 * - Approval/rejection metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  profiles,
  pendingRegistrations,
  departments,
  positions,
} from '@tupsafe/database/server';
import { eq, or } from 'drizzle-orm';
import { checkUserRoleFromSupabase, createServerClient } from '@tupsafe/auth/server';
import type { RegistrationDetail, ApiResponse } from '@tupsafe/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
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

    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid registration ID',
        },
        { status: 400 }
      );
    }

    // Fetch registration with all related data in a single query
    const [registration] = await db
      .select({
        // Profile fields
        userId: profiles.id,
        employeeId: profiles.employeeId,
        applicantId: profiles.applicantId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        middleName: profiles.middleName,
        phoneNumber: profiles.phoneNumber,
        userType: profiles.userType,
        employmentCategory: profiles.employmentCategory,
        accountStatus: profiles.accountStatus,
        role: profiles.role,
        academicRank: profiles.academicRank,
        tenureStatus: profiles.tenureStatus,
        employmentType: profiles.employmentType,
        campusAssignment: profiles.campusAssignment,
        hireDate: profiles.hireDate,
        emailVerifiedAt: profiles.emailVerifiedAt,
        approvedBy: profiles.approvedBy,
        approvedAt: profiles.approvedAt,
        isActive: profiles.isActive,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,

        // Department fields
        departmentId: departments.id,
        departmentName: departments.name,
        departmentCode: departments.code,

        // Position fields
        positionId: positions.id,
        positionTitle: positions.title,

        // Pending registration fields
        pendingRegId: pendingRegistrations.id,
        pendingRegStatus: pendingRegistrations.status,
        pendingRegAdminNotes: pendingRegistrations.adminNotes,
        pendingRegApprovedAt: pendingRegistrations.approvedAt,
        pendingRegRejectedAt: pendingRegistrations.rejectedAt,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(positions, eq(profiles.positionId, positions.id))
      .leftJoin(pendingRegistrations, eq(profiles.id, pendingRegistrations.userId))
      .where(
        or(
          eq(profiles.id, id),
          eq(pendingRegistrations.id, id)
        )
      )
      .limit(1);

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration not found',
        },
        { status: 404 }
      );
    }

    // Fetch email from Supabase Auth
    const supabase = await createServerClient('admin');
    let email: string | null = null;

    try {
      const { data: userData } = await supabase.auth.admin.getUserById(registration.userId);
      email = userData?.user?.email || null;
    } catch (error) {
      console.error(`Error fetching email for user ${registration.userId}:`, error);
    }

    // Transform data to match RegistrationDetail interface
    const detail: RegistrationDetail = {
      id: registration.pendingRegId || registration.userId,
      userId: registration.userId,
      email,
      employeeId: registration.employeeId,
      applicantId: registration.applicantId,
      firstName: registration.firstName,
      lastName: registration.lastName,
      middleName: registration.middleName,
      phoneNumber: registration.phoneNumber,
      userType: registration.userType,
      employmentCategory: registration.employmentCategory || 'not_applicable',
      accountStatus: registration.accountStatus,
      department: registration.departmentId ? {
        id: registration.departmentId,
        name: registration.departmentName || '',
        code: registration.departmentCode || '',
      } : null,
      position: registration.positionId ? {
        id: registration.positionId,
        title: registration.positionTitle || '',
      } : null,
      role: registration.role,
      requestedRole: registration.role,
      status: registration.pendingRegStatus || 'pending',
      requestedAt: registration.createdAt,
      reviewedBy: null, // TODO: Fetch reviewer details if needed
      reviewedAt: registration.approvedAt || registration.pendingRegRejectedAt,
      adminNotes: registration.pendingRegAdminNotes,
      academicRank: registration.academicRank,
      tenureStatus: registration.tenureStatus,
      employmentType: registration.employmentType,
      campusAssignment: registration.campusAssignment,
      hireDate: registration.hireDate,
      emailVerifiedAt: registration.emailVerifiedAt,
      approvedBy: registration.approvedBy,
      approvedAt: registration.approvedAt,
      isActive: registration.isActive,
      registrationDate: registration.createdAt,
      createdAt: registration.createdAt,
      updatedAt: registration.updatedAt,
      rejectedAt: registration.pendingRegRejectedAt,
      pendingRegistration: registration.pendingRegId ? {
        status: registration.pendingRegStatus || 'pending',
        adminNotes: registration.pendingRegAdminNotes,
        approvedAt: registration.pendingRegApprovedAt,
        rejectedAt: registration.pendingRegRejectedAt,
      } : null,
    };

    const response: ApiResponse<RegistrationDetail> = {
      success: true,
      data: detail,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching registration detail:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching registration details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
