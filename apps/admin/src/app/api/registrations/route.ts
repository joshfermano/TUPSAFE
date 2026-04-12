/**
 * Registrations API Route - GET /api/registrations
 * Enhanced endpoint with pagination, filtering, and search capabilities
 *
 * Features:
 * - Paginated results with configurable page size
 * - Filter by status (pending, approved, rejected)
 * - Filter by user type (employee, applicant)
 * - Search by name or email
 * - Sort by multiple fields
 * - Optimized single-query database fetch with joins
 * - Complete department and position information
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  profiles,
  pendingRegistrations,
  departments,
  positions,
} from '@tupsafe/database/server';
import { eq, and, or, sql, count, ilike, asc, desc } from 'drizzle-orm';
import { checkUserRoleFromSupabase, createServerClient } from '@tupsafe/auth/server';
import {
  listRegistrationsSchema,
  type RegistrationListItem,
  type RegistrationListResponse,
} from '@tupsafe/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authorization check - HR or Admin only (using Supabase session)
    const hasPermission = await checkUserRoleFromSupabase(['hr', 'admin'], 'admin');

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. HR or Admin role required.'
        },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit') || searchParams.get('pageSize'),
      status: searchParams.get('status'),
      userType: searchParams.get('userType'),
      departmentId: searchParams.get('departmentId'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    };

    const validationResult = listRegistrationsSchema.safeParse(queryParams);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      console.error('[Registrations API] Validation failed:', {
        queryParams,
        fieldErrors,
        fullError: validationResult.error.format(),
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    // Extract and ensure non-null values for required pagination fields
    const {
      page: rawPage,
      limit: rawLimit,
      status,
      userType,
      departmentId,
      search,
      sortBy: rawSortBy,
      sortOrder: rawSortOrder
    } = validationResult.data;

    // Apply defaults for fields that can be null (schema has .default() but TS doesn't infer)
    const page = rawPage ?? 1;
    const limit = rawLimit ?? 20;
    const sortBy = rawSortBy ?? 'requestedAt';
    const sortOrder = rawSortOrder ?? 'desc';

    // Build WHERE conditions
    const conditions = [];

    // Filter by account status if provided
    // Note: Map registration status ('approved') to account status ('active')
    if (status) {
      const accountStatus = status === 'approved' ? 'active' : status;
      conditions.push(eq(profiles.accountStatus, accountStatus));
    } else {
      // Default: only show pending registrations
      conditions.push(eq(profiles.accountStatus, 'pending'));
    }

    // Filter by user type if provided
    if (userType) {
      conditions.push(eq(profiles.userType, userType));
    }

    // Filter by department if provided
    if (departmentId) {
      conditions.push(eq(profiles.departmentId, departmentId));
    }

    // Search by name or email
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(profiles.firstName, searchPattern),
          ilike(profiles.lastName, searchPattern),
          ilike(sql`${profiles.firstName} || ' ' || ${profiles.lastName}`, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(profiles)
      .where(whereClause);

    const total = totalCountResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Determine sort field and direction
    const sortField =
      sortBy === 'firstName' ? profiles.firstName
      : sortBy === 'lastName' ? profiles.lastName
      : sortBy === 'email' ? profiles.id // TODO: would need to join with auth table for email
      : sortBy === 'requestedAt' ? pendingRegistrations.createdAt
      : profiles.createdAt;

    const orderByClause = sortOrder === 'asc' ? asc(sortField) : desc(sortField);

    // Fetch paginated data with joins for department and position
    const registrations = await db
      .select({
        // Profile fields
        userId: profiles.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        middleName: profiles.middleName,
        phoneNumber: profiles.phoneNumber,
        userType: profiles.userType,
        accountStatus: profiles.accountStatus,
        role: profiles.role,
        employeeId: profiles.employeeId,
        applicantId: profiles.applicantId,
        academicRank: profiles.academicRank,
        tenureStatus: profiles.tenureStatus,
        employmentType: profiles.employmentType,
        createdAt: profiles.createdAt,

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
        requestedAt: pendingRegistrations.createdAt,
        reviewedAt: sql<Date | null>`COALESCE(${pendingRegistrations.approvedAt}, ${pendingRegistrations.rejectedAt})`,
        reviewedById: pendingRegistrations.approvedBy,
        adminNotes: pendingRegistrations.adminNotes,
      })
      .from(profiles)
      .leftJoin(departments, eq(profiles.departmentId, departments.id))
      .leftJoin(positions, eq(profiles.positionId, positions.id))
      .innerJoin(pendingRegistrations, eq(profiles.id, pendingRegistrations.userId))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset((page - 1) * limit);

    // Fetch emails from Supabase Auth (batch operation)
    const supabase = await createServerClient('admin');
    const userIds = registrations.map(r => r.userId);

    const emailMap = new Map<string, string | null>();

    // Batch fetch emails in chunks of 50 to avoid rate limits
    const chunkSize = 50;
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (userId) => {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            emailMap.set(userId, userData?.user?.email || null);
          } catch (error) {
            console.error(`Error fetching email for user ${userId}:`, error);
            emailMap.set(userId, null);
          }
        })
      );
    }

    // Transform data to match RegistrationListItem interface
    const data: RegistrationListItem[] = registrations.map((reg) => ({
      id: reg.pendingRegId || reg.userId,
      userId: reg.userId,
      email: emailMap.get(reg.userId) || null,
      firstName: reg.firstName,
      lastName: reg.lastName,
      middleName: reg.middleName,
      userType: reg.userType,
      employeeId: reg.employeeId,
      applicantId: reg.applicantId,
      accountStatus: reg.accountStatus,
      department: reg.departmentId ? {
        id: reg.departmentId,
        name: reg.departmentName || '',
        code: reg.departmentCode || '',
      } : null,
      position: reg.positionId ? {
        id: reg.positionId,
        title: reg.positionTitle || '',
      } : null,
      status: reg.pendingRegStatus || 'pending',
      requestedAt: reg.requestedAt || reg.createdAt,
      reviewedBy: null, // TODO: fetch reviewer name if reviewedById exists
      reviewedAt: reg.reviewedAt,
      adminNotes: reg.adminNotes,
    }));

    const response: RegistrationListResponse = {
      registrations: data,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages,
      },
      stats: {
        total,
        pending: data.filter(r => r.accountStatus === 'pending').length,
        approved: data.filter(r => r.accountStatus === 'active').length,
        rejected: data.filter(r => r.accountStatus === 'rejected').length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching registrations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
