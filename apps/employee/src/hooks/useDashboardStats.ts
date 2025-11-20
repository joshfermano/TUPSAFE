import { useQuery } from '@tanstack/react-query';

/**
 * Employee dashboard statistics
 */
interface EmployeeStats {
  userType: 'employee';
  stats: {
    pds: {
      status: string;
      submittedAt: string | null;
      approvedAt: string | null;
      isCompliant: boolean;
    };
    saln: {
      status: string;
      year: number;
      submittedAt: string | null;
      approvedAt: string | null;
      isCompliant: boolean;
    };
    compliance: {
      overall: boolean;
      pds: boolean;
      saln: boolean;
      status: 'compliant' | 'partial' | 'non_compliant';
    };
    deadlines: Array<{
      formType: string;
      year: number;
      deadlineDate: string;
      reminderDaysBefore: number;
      daysUntil: number;
      isUrgent: boolean;
    }>;
    notifications: {
      unread: number;
    };
  };
}

/**
 * Applicant dashboard statistics
 */
interface ApplicantStats {
  userType: 'applicant';
  stats: {
    applications: {
      active: number;
      total: number;
      breakdown: Array<{
        status: string;
        count: number;
      }>;
    };
    recentApplications: Array<{
      id: string;
      applicationNumber: string;
      status: string;
      applicationDate: string;
      position: {
        id: string;
        title: string;
        code: string;
      };
    }>;
    positions: {
      recommended: number;
    };
    pds: {
      status: string;
      submittedAt: string | null;
      hasSubmission: boolean;
    };
    notifications: {
      unread: number;
    };
  };
}

/**
 * Combined dashboard statistics type
 */
type DashboardStats = EmployeeStats | ApplicantStats;

interface DashboardStatsResponse {
  success: boolean;
  userType: 'employee' | 'applicant';
  stats: EmployeeStats['stats'] | ApplicantStats['stats'];
}

/**
 * Fetch dashboard statistics from API
 */
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats', {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch dashboard statistics');
  }

  const data: DashboardStatsResponse = await response.json();

  // Return data in the expected format
  return {
    userType: data.userType,
    stats: data.stats,
  } as DashboardStats;
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Type guard to check if stats are for employee
 */
export function isEmployeeStats(stats: DashboardStats): stats is EmployeeStats {
  return stats.userType === 'employee';
}

/**
 * Type guard to check if stats are for applicant
 */
export function isApplicantStats(stats: DashboardStats): stats is ApplicantStats {
  return stats.userType === 'applicant';
}

/**
 * Export types for use in components
 */
export type {
  DashboardStats,
  EmployeeStats,
  ApplicantStats,
};
