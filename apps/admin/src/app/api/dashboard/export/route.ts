import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tupsafe/database/server';
import {
  profiles,
  pendingRegistrations,
  pdsSubmissions,
  salnSubmissions,
  departments,
} from '@tupsafe/database/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { exportQuerySchema } from '@tupsafe/types';

/**
 * GET /api/dashboard/export
 *
 * Export dashboard data to CSV or JSON
 *
 * Query Parameters:
 * - reportType: 'users' | 'registrations' | 'submissions' | 'compliance'
 * - startDate: Start date for data range
 * - endDate: End date for data range
 * - format: 'csv' | 'json' (default: 'csv')
 * - departmentId: Optional filter by department
 *
 * Features:
 * - Generate CSV reports
 * - Support multiple report types
 * - Include filters and date ranges
 * - Secure download links
 *
 * Rate Limiting: Apply strict rate limits on this endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Verify admin/HR role and apply rate limiting
    // const session = await getServerSession();
    // if (!session || !['admin', 'hr'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = exportQuerySchema.parse({
      reportType: searchParams.get('reportType'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      format: searchParams.get('format') || 'csv',
      departmentId: searchParams.get('departmentId') || undefined,
    });

    const { reportType, startDate, endDate, format, departmentId } = params;

    // Fetch data based on report type
    let data: any[] = [];
    let headers: string[] = [];

    switch (reportType) {
      case 'users':
        ({ data, headers } = await exportUsersReport(startDate, endDate, departmentId));
        break;
      case 'registrations':
        ({ data, headers } = await exportRegistrationsReport(startDate, endDate));
        break;
      case 'submissions':
        ({ data, headers } = await exportSubmissionsReport(startDate, endDate, departmentId));
        break;
      case 'compliance':
        ({ data, headers } = await exportComplianceReport(startDate, endDate, departmentId));
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Return data in requested format
    if (format === 'json') {
      return NextResponse.json(
        { data, headers },
        {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${reportType}-${Date.now()}.json"`,
          },
        }
      );
    }

    // Convert to CSV
    const csv = convertToCSV(data, headers);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${reportType}-${Date.now()}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Dashboard Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

/**
 * Export users report
 */
async function exportUsersReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string
) {
  const conditions = [
    gte(profiles.createdAt, startDate),
    lte(profiles.createdAt, endDate),
  ];

  if (departmentId) {
    conditions.push(eq(profiles.departmentId, departmentId));
  }

  const users = await db
    .select({
      employeeId: profiles.employeeId,
      applicantId: profiles.applicantId,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      userType: profiles.userType,
      role: profiles.role,
      department: departments.name,
      accountStatus: profiles.accountStatus,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .leftJoin(departments, eq(profiles.departmentId, departments.id))
    .where(and(...conditions))
    .orderBy(profiles.createdAt);

  const headers = [
    'Employee ID',
    'Applicant ID',
    'First Name',
    'Last Name',
    'User Type',
    'Role',
    'Department',
    'Account Status',
    'Created At',
  ];

  const data = users.map((user) => ({
    employeeId: user.employeeId || 'N/A',
    applicantId: user.applicantId || 'N/A',
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    role: user.role,
    department: user.department || 'N/A',
    accountStatus: user.accountStatus,
    createdAt: user.createdAt.toISOString(),
  }));

  return { data, headers };
}

/**
 * Export registrations report
 */
async function exportRegistrationsReport(startDate: Date, endDate: Date) {
  const registrations = await db
    .select({
      userId: pendingRegistrations.userId,
      applicantName: sql<string>`CONCAT(applicant.first_name, ' ', applicant.last_name)`,
      userType: sql<string>`applicant.user_type`,
      status: pendingRegistrations.status,
      createdAt: pendingRegistrations.createdAt,
      approvedAt: pendingRegistrations.approvedAt,
      rejectedAt: pendingRegistrations.rejectedAt,
      approvedByName: sql<string>`CONCAT(approver.first_name, ' ', approver.last_name)`,
      adminNotes: pendingRegistrations.adminNotes,
    })
    .from(pendingRegistrations)
    .innerJoin(sql`profiles AS applicant`, eq(pendingRegistrations.userId, sql`applicant.id`))
    .leftJoin(sql`profiles AS approver`, eq(pendingRegistrations.approvedBy, sql`approver.id`))
    .where(
      and(
        gte(pendingRegistrations.createdAt, startDate),
        lte(pendingRegistrations.createdAt, endDate)
      )
    )
    .orderBy(pendingRegistrations.createdAt);

  const headers = [
    'User ID',
    'Applicant Name',
    'User Type',
    'Status',
    'Submitted At',
    'Approved At',
    'Rejected At',
    'Approved By',
    'Admin Notes',
  ];

  const data = registrations.map((reg) => ({
    userId: reg.userId,
    applicantName: reg.applicantName,
    userType: reg.userType,
    status: reg.status,
    createdAt: reg.createdAt.toISOString(),
    approvedAt: reg.approvedAt?.toISOString() || 'N/A',
    rejectedAt: reg.rejectedAt?.toISOString() || 'N/A',
    approvedByName: reg.approvedByName || 'N/A',
    adminNotes: reg.adminNotes || 'N/A',
  }));

  return { data, headers };
}

/**
 * Export submissions report
 */
async function exportSubmissionsReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string
) {
  const conditions = [
    gte(pdsSubmissions.createdAt, startDate),
    lte(pdsSubmissions.createdAt, endDate),
  ];

  if (departmentId) {
    conditions.push(eq(profiles.departmentId, departmentId));
  }

  // Get PDS submissions
  const pdsData = await db
    .select({
      employeeId: profiles.employeeId,
      employeeName: sql<string>`CONCAT(${profiles.firstName}, ' ', ${profiles.lastName})`,
      department: departments.name,
      submissionType: sql<string>`'PDS'`,
      status: pdsSubmissions.status,
      version: pdsSubmissions.version,
      submittedAt: pdsSubmissions.submittedAt,
      approvedAt: pdsSubmissions.approvedAt,
      approverName: sql<string>`CONCAT(approver.first_name, ' ', approver.last_name)`,
    })
    .from(pdsSubmissions)
    .innerJoin(profiles, eq(pdsSubmissions.userId, profiles.id))
    .leftJoin(departments, eq(profiles.departmentId, departments.id))
    .leftJoin(
      sql`profiles AS approver`,
      eq(pdsSubmissions.approvedBy, sql`approver.id`)
    )
    .where(and(...conditions))
    .orderBy(pdsSubmissions.createdAt);

  // Get SALN submissions
  const salnConditions = [
    gte(salnSubmissions.createdAt, startDate),
    lte(salnSubmissions.createdAt, endDate),
  ];

  if (departmentId) {
    salnConditions.push(eq(profiles.departmentId, departmentId));
  }

  const salnData = await db
    .select({
      employeeId: profiles.employeeId,
      employeeName: sql<string>`CONCAT(${profiles.firstName}, ' ', ${profiles.lastName})`,
      department: departments.name,
      submissionType: sql<string>`'SALN'`,
      status: salnSubmissions.status,
      year: salnSubmissions.year,
      submittedAt: salnSubmissions.submittedAt,
      approvedAt: salnSubmissions.approvedAt,
      approverName: sql<string>`CONCAT(approver.first_name, ' ', approver.last_name)`,
    })
    .from(salnSubmissions)
    .innerJoin(profiles, eq(salnSubmissions.userId, profiles.id))
    .leftJoin(departments, eq(profiles.departmentId, departments.id))
    .leftJoin(
      sql`profiles AS approver`,
      eq(salnSubmissions.approvedBy, sql`approver.id`)
    )
    .where(and(...salnConditions))
    .orderBy(salnSubmissions.createdAt);

  const headers = [
    'Employee ID',
    'Employee Name',
    'Department',
    'Submission Type',
    'Status',
    'Version',
    'Year',
    'Submitted At',
    'Approved At',
    'Approved By',
  ];

  const data = [
    ...pdsData.map((sub) => ({
      employeeId: sub.employeeId || 'N/A',
      employeeName: sub.employeeName,
      department: sub.department || 'N/A',
      submissionType: sub.submissionType,
      status: sub.status,
      version: sub.version,
      year: 'N/A',
      submittedAt: sub.submittedAt?.toISOString() || 'Not submitted',
      approvedAt: sub.approvedAt?.toISOString() || 'Pending',
      approvedBy: sub.approverName || 'N/A',
    })),
    ...salnData.map((sub) => ({
      employeeId: sub.employeeId || 'N/A',
      employeeName: sub.employeeName,
      department: sub.department || 'N/A',
      submissionType: sub.submissionType,
      status: sub.status,
      year: sub.year?.toString() || 'N/A',
      submittedAt: sub.submittedAt?.toISOString() || 'Not submitted',
      approvedAt: sub.approvedAt?.toISOString() || 'Pending',
      approvedBy: sub.approverName || 'N/A',
    })),
  ].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  return { data, headers };
}

/**
 * Export compliance report
 */
async function exportComplianceReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string
) {
  const currentYear = new Date().getFullYear();
  const conditions = [eq(profiles.userType, 'employee')];

  if (departmentId) {
    conditions.push(eq(profiles.departmentId, departmentId));
  }

  const complianceData = await db
    .select({
      employeeId: profiles.employeeId,
      employeeName: sql<string>`CONCAT(${profiles.firstName}, ' ', ${profiles.lastName})`,
      department: departments.name,
      pdsStatus: sql<string>`COALESCE(${pdsSubmissions.status}, 'not_submitted')`,
      pdsSubmittedAt: pdsSubmissions.submittedAt,
      salnStatus: sql<string>`COALESCE(${salnSubmissions.status}, 'not_submitted')`,
      salnYear: salnSubmissions.year,
      salnSubmittedAt: salnSubmissions.submittedAt,
    })
    .from(profiles)
    .leftJoin(departments, eq(profiles.departmentId, departments.id))
    .leftJoin(
      pdsSubmissions,
      and(
        eq(pdsSubmissions.userId, profiles.id),
        eq(pdsSubmissions.status, 'approved')
      )
    )
    .leftJoin(
      salnSubmissions,
      and(
        eq(salnSubmissions.userId, profiles.id),
        eq(salnSubmissions.year, currentYear),
        eq(salnSubmissions.status, 'approved')
      )
    )
    .where(and(...conditions))
    .orderBy(profiles.employeeId);

  const headers = [
    'Employee ID',
    'Employee Name',
    'Department',
    'PDS Status',
    'PDS Submitted At',
    'SALN Status',
    'SALN Year',
    'SALN Submitted At',
    'Overall Compliance',
  ];

  const data = complianceData.map((record) => {
    const pdsCompliant = record.pdsStatus === 'approved';
    const salnCompliant = record.salnStatus === 'approved';
    const overallCompliance = pdsCompliant && salnCompliant ? 'Compliant' : 'Non-Compliant';

    return {
      employeeId: record.employeeId || 'N/A',
      employeeName: record.employeeName,
      department: record.department || 'N/A',
      pdsStatus: record.pdsStatus,
      pdsSubmittedAt: record.pdsSubmittedAt?.toISOString() || 'N/A',
      salnStatus: record.salnStatus,
      salnYear: record.salnYear?.toString() || 'N/A',
      salnSubmittedAt: record.salnSubmittedAt?.toISOString() || 'N/A',
      overallCompliance,
    };
  });

  return { data, headers };
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(',');
  }

  // Escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV
  const headerRow = headers.join(',');
  const dataRows = data.map((row) => {
    return Object.values(row)
      .map((value) => escapeCSV(value))
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}
