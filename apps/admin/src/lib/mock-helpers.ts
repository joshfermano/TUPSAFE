/**
 * Mock Data Helper Utilities for Admin Portal
 *
 * This file provides utility functions for working with mock data in the admin portal.
 * These helpers aggregate, filter, and transform mock data for dashboard displays and reporting.
 */

import { MockDatabase, type PdsSubmission, type SalnSubmission } from '@tupsafe/mock-data';
import type { Profile } from '@tupsafe/mock-data';

/**
 * Calculate comprehensive dashboard statistics
 *
 * @returns Aggregated stats for admin dashboard
 */
export function calculateDashboardStats() {
  const stats = MockDatabase.getSystemStats();
  const pendingApprovals = MockDatabase.getPendingApprovals();

  // Calculate compliance rates
  const activeUsers = stats.users.active;
  const pdsApproved = stats.pds.statuses.approved || 0;
  const salnCurrentYear = MockDatabase.salnSubmissions.filter(
    (s) => s.year === new Date().getFullYear()
  ).length;

  const pdsComplianceRate = activeUsers > 0 ? Math.round((pdsApproved / activeUsers) * 100) : 0;
  const salnComplianceRate = activeUsers > 0 ? Math.round((salnCurrentYear / activeUsers) * 100) : 0;
  const avgComplianceRate = Math.round((pdsComplianceRate + salnComplianceRate) / 2);

  // Get recent activity (last 10 audit logs)
  const recentActivity = MockDatabase.profiles
    .slice(0, 5)
    .map((profile, i) => ({
      id: `activity-${i}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      user: `${profile.firstName} ${profile.lastName}`,
      action: i % 3 === 0 ? 'Submitted PDS' : i % 3 === 1 ? 'Approved SALN' : 'Updated Profile',
      resource: i % 3 === 0 ? 'PDS' : i % 3 === 1 ? 'SALN' : 'Profile',
      details: null,
    }));

  // Get pending submissions (combining PDS and SALN)
  const pendingPds = pendingApprovals.pds.slice(0, 3).map((item) => {
    const pds = item.submission;
    const user = item.user;
    const dept = user?.departmentId ? MockDatabase.getDepartment(user.departmentId) : null;
    return {
      id: pds.id,
      type: 'PDS' as const,
      employee: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      department: dept?.name || 'N/A',
      submittedAt: pds.createdAt.toISOString(),
      status: pds.status,
    };
  });

  const pendingSaln = pendingApprovals.saln.slice(0, 2).map((item) => {
    const saln = item.submission;
    const user = item.user;
    const dept = user?.departmentId ? MockDatabase.getDepartment(user.departmentId) : null;
    return {
      id: saln.id,
      type: 'SALN' as const,
      employee: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      department: dept?.name || 'N/A',
      submittedAt: saln.createdAt.toISOString(),
      status: saln.status,
    };
  });

  const pendingSubmissions = [...pendingPds, ...pendingSaln].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return {
    users: {
      total: stats.users.total,
      active: stats.users.active,
      inactive: stats.users.total - stats.users.active,
      byRole: stats.users.byRole,
    },
    pds: {
      total: stats.pds.submissions,
      pending: pendingApprovals.pds.length,
      approved: pdsApproved,
      rejected: stats.pds.statuses.rejected || 0,
      draft: stats.pds.statuses.draft || 0,
      complianceRate: pdsComplianceRate,
    },
    saln: {
      total: stats.saln.submissions,
      pending: pendingApprovals.saln.length,
      approved: stats.saln.statuses.approved || 0,
      rejected: stats.saln.statuses.rejected || 0,
      draft: stats.saln.statuses.draft || 0,
      currentYear: salnCurrentYear,
      complianceRate: salnComplianceRate,
    },
    departments: stats.departments,
    positions: stats.positions,
    pendingApprovals: {
      total: pendingApprovals.pds.length + pendingApprovals.saln.length,
      pds: pendingApprovals.pds.length,
      saln: pendingApprovals.saln.length,
    },
    // Additional fields for dashboard cards and tables
    totalUsers: stats.users.total,
    totalPendingApprovals: pendingApprovals.pds.length + pendingApprovals.saln.length,
    pdsSubmissions: stats.pds.submissions,
    salnSubmissions: stats.saln.submissions,
    complianceRate: avgComplianceRate,
    systemHealth: avgComplianceRate >= 80 ? 'Healthy' : avgComplianceRate >= 60 ? 'Warning' : 'Critical',
    trends: {
      users: 5.2, // Mock trend data
      pds: 12.5,
      saln: -2.3,
    },
    recentActivity,
    pendingSubmissions,
  };
}

/**
 * Filter submissions by status
 *
 * @param submissions - Array of PDS or SALN submissions
 * @param status - Status to filter by
 * @returns Filtered submissions
 */
export function filterSubmissionsByStatus<T extends PdsSubmission | SalnSubmission>(
  submissions: T[],
  status: string | null
): T[] {
  if (!status || status === 'all') {
    return submissions;
  }
  return submissions.filter((s) => s.status === status);
}

/**
 * Filter submissions by department
 *
 * @param submissions - Array of submissions with user profiles
 * @param departmentId - Department ID to filter by
 * @returns Filtered submissions
 */
export function filterSubmissionsByDepartment<T extends PdsSubmission | SalnSubmission>(
  submissions: T[],
  departmentId: string | null
): T[] {
  if (!departmentId || departmentId === 'all') {
    return submissions;
  }

  return submissions.filter((submission) => {
    const user = MockDatabase.getProfile(submission.userId);
    return user?.departmentId === departmentId;
  });
}

/**
 * Filter submissions by date range
 *
 * @param submissions - Array of submissions
 * @param startDate - Start date of range
 * @param endDate - End date of range
 * @returns Filtered submissions
 */
export function filterSubmissionsByDateRange<T extends PdsSubmission | SalnSubmission>(
  submissions: T[],
  startDate: Date | null,
  endDate: Date | null
): T[] {
  if (!startDate && !endDate) {
    return submissions;
  }

  return submissions.filter((submission) => {
    const createdAt = new Date(submission.createdAt);

    if (startDate && createdAt < startDate) {
      return false;
    }

    if (endDate && createdAt > endDate) {
      return false;
    }

    return true;
  });
}

/**
 * Search users by query string
 *
 * Enhanced search that includes employee ID, email, and name fields
 *
 * @param query - Search query string
 * @returns Filtered users with related data
 */
export function searchUsers(query: string) {
  if (!query || query.trim() === '') {
    return MockDatabase.profiles.map((profile) => ({
      profile,
      department: profile.departmentId ? MockDatabase.getDepartment(profile.departmentId) : null,
      position: profile.positionId ? MockDatabase.getPosition(profile.positionId) : null,
    }));
  }

  const lowercaseQuery = query.toLowerCase().trim();

  return MockDatabase.profiles
    .filter(
      (profile) =>
        profile.firstName.toLowerCase().includes(lowercaseQuery) ||
        profile.lastName.toLowerCase().includes(lowercaseQuery) ||
        (profile.employeeId && profile.employeeId.toLowerCase().includes(lowercaseQuery)) ||
        (profile.middleName && profile.middleName.toLowerCase().includes(lowercaseQuery))
    )
    .map((profile) => ({
      profile,
      department: profile.departmentId ? MockDatabase.getDepartment(profile.departmentId) : null,
      position: profile.positionId ? MockDatabase.getPosition(profile.positionId) : null,
    }));
}

/**
 * Filter users by role
 *
 * @param users - Array of user profiles
 * @param role - Role to filter by
 * @returns Filtered users
 */
export function filterUsersByRole(users: Profile[], role: string | null): Profile[] {
  if (!role || role === 'all') {
    return users;
  }
  return users.filter((u) => u.role === role);
}

/**
 * Filter users by department
 *
 * @param users - Array of user profiles
 * @param departmentId - Department ID to filter by
 * @returns Filtered users
 */
export function filterUsersByDepartment(users: Profile[], departmentId: string | null): Profile[] {
  if (!departmentId || departmentId === 'all') {
    return users;
  }
  return users.filter((u) => u.departmentId === departmentId);
}

/**
 * Filter users by active status
 *
 * @param users - Array of user profiles
 * @param activeOnly - Whether to show only active users
 * @returns Filtered users
 */
export function filterUsersByActiveStatus(users: Profile[], activeOnly: boolean): Profile[] {
  if (!activeOnly) {
    return users;
  }
  return users.filter((u) => u.isActive);
}

/**
 * Search submissions by employee name or employee ID
 *
 * Searches through firstName, lastName, full name, and employee ID fields
 *
 * @param submissions - Array of submissions with userId
 * @param query - Search query string
 * @returns Filtered submissions matching the search query
 */
export function searchSubmissionsByName<T extends PdsSubmission | SalnSubmission>(
  submissions: T[],
  query: string | null | undefined
): T[] {
  if (!query || query.trim() === '') {
    return submissions;
  }

  const lowercaseQuery = query.toLowerCase().trim();

  return submissions.filter((submission) => {
    const user = MockDatabase.getProfile(submission.userId);
    if (!user) return false;

    // Search in multiple fields for better user experience
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const firstName = user.firstName.toLowerCase();
    const lastName = user.lastName.toLowerCase();
    const employeeId = user.employeeId?.toLowerCase() ?? '';

    return (
      firstName.includes(lowercaseQuery) ||
      lastName.includes(lowercaseQuery) ||
      fullName.includes(lowercaseQuery) ||
      employeeId.includes(lowercaseQuery)
    );
  });
}

/**
 * Sort submissions by date
 *
 * @param submissions - Array of submissions
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted submissions
 */
export function sortSubmissionsByDate<T extends PdsSubmission | SalnSubmission>(
  submissions: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...submissions].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Get submission summary with user details
 *
 * @param submission - PDS or SALN submission
 * @returns Submission with user details
 */
export function getSubmissionWithUserDetails<T extends PdsSubmission | SalnSubmission>(
  submission: T
) {
  const user = MockDatabase.getProfile(submission.userId);
  const department = user?.departmentId ? MockDatabase.getDepartment(user.departmentId) : null;
  const position = user?.positionId ? MockDatabase.getPosition(user.positionId) : null;

  return {
    submission,
    user,
    department,
    position,
  };
}

/**
 * Calculate department statistics
 *
 * @param departmentId - Department ID
 * @returns Department statistics
 */
export function calculateDepartmentStats(departmentId: string) {
  const users = MockDatabase.getProfilesByDepartment(departmentId);
  const pdsSubmissions = MockDatabase.pdsSubmissions.filter((s) =>
    users.some((u) => u.id === s.userId)
  );
  const salnSubmissions = MockDatabase.salnSubmissions.filter((s) =>
    users.some((u) => u.id === s.userId)
  );

  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    pdsSubmissions: {
      total: pdsSubmissions.length,
      approved: pdsSubmissions.filter((s) => s.status === 'approved').length,
      pending: pdsSubmissions.filter((s) => s.status === 'submitted' || s.status === 'reviewing')
        .length,
      draft: pdsSubmissions.filter((s) => s.status === 'draft').length,
    },
    salnSubmissions: {
      total: salnSubmissions.length,
      approved: salnSubmissions.filter((s) => s.status === 'approved').length,
      pending: salnSubmissions.filter((s) => s.status === 'submitted' || s.status === 'reviewing')
        .length,
      draft: salnSubmissions.filter((s) => s.status === 'draft').length,
    },
  };
}

/**
 * Get compliance overview for all departments
 *
 * @returns Array of department compliance data
 */
export function getDepartmentComplianceOverview() {
  return MockDatabase.departments.map((dept) => {
    const stats = calculateDepartmentStats(dept.id);
    const pdsComplianceRate =
      stats.activeUsers > 0
        ? Math.round((stats.pdsSubmissions.approved / stats.activeUsers) * 100)
        : 0;
    const salnComplianceRate =
      stats.activeUsers > 0
        ? Math.round((stats.salnSubmissions.approved / stats.activeUsers) * 100)
        : 0;

    return {
      department: dept,
      stats,
      complianceRates: {
        pds: pdsComplianceRate,
        saln: salnComplianceRate,
        overall: Math.round((pdsComplianceRate + salnComplianceRate) / 2),
      },
    };
  });
}
