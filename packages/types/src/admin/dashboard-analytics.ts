import { z } from 'zod';

/**
 * Dashboard Analytics Validation Schemas
 *
 * Type-safe validation for admin dashboard analytics endpoints
 */

// Query parameter schemas
export const trendsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  metric: z.enum(['users', 'registrations', 'submissions', 'compliance']),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export const activityQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  type: z.string().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const exportQuerySchema = z.object({
  reportType: z.enum(['users', 'registrations', 'submissions', 'compliance']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  format: z.enum(['csv', 'json']).default('csv'),
  departmentId: z.string().uuid().optional(),
});

// Response type definitions
export interface DashboardOverviewResponse {
  users: {
    total: number;
    employees: number;
    applicants: number;
    activeLastMonth: number;
    newThisWeek: number;
    newThisMonth: number;
    growth: {
      value: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  registrations: {
    pending: number;
    approvedThisWeek: number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
    averageApprovalTime: string;
  };
  submissions: {
    pending: {
      pds: number;
      saln: number;
      total: number;
    };
    approvedThisWeek: number;
    approvedThisMonth: number;
    complianceRate: number;
  };
  compliance: {
    pds: {
      submitted: number;
      expected: number;
      rate: number;
      overdue: number;
    };
    saln: {
      submitted: number;
      expected: number;
      rate: number;
      overdue: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: 'user_created' | 'registration_approved' | 'submission_approved' | 'submission_rejected';
    description: string;
    timestamp: Date;
    user?: {
      name: string;
      role: string;
    };
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    count?: number;
    action?: {
      label: string;
      url: string;
    };
  }>;
}

export interface TrendDataPoint {
  date: Date | string;
  value: number;
  comparison?: number;
  breakdown?: Record<string, number>;
}

export interface DashboardTrendsResponse {
  period: string;
  metric: string;
  data: TrendDataPoint[];
  summary: {
    total: number;
    average: number;
    peak: {
      value: number;
      date: Date;
    };
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
  };
}

export interface DepartmentMetrics {
  id: string;
  name: string;
  code: string;
  users: {
    total: number;
    active: number;
  };
  submissions: {
    pdsCompliance: number;
    salnCompliance: number;
    pending: number;
    overdue: number;
  };
  rank: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface DashboardDepartmentsResponse {
  departments: DepartmentMetrics[];
  summary: {
    totalDepartments: number;
    averageCompliance: number;
    bestPerforming: {
      name: string;
      compliance: number;
    };
    needsAttention: Array<{
      name: string;
      compliance: number;
    }>;
  };
}

export interface ComplianceDeadline {
  next: Date | null;
  daysRemaining: number;
  submitted: number;
  expected: number;
  status: 'on-track' | 'at-risk' | 'overdue';
}

export interface DashboardComplianceResponse {
  deadlines: {
    pds: ComplianceDeadline;
    saln: ComplianceDeadline & {
      fiscalYear: number;
      deadline: Date;
    };
  };
  byDepartment: Array<{
    department: string;
    pdsRate: number;
    salnRate: number;
    overdue: number;
  }>;
  overdue: {
    pds: Array<{
      employeeId: string;
      name: string;
      daysOverdue: number;
    }>;
    saln: Array<{
      employeeId: string;
      name: string;
      fiscalYear: number;
      daysOverdue: number;
    }>;
  };
  overall: {
    complianceRate: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    comparison: {
      lastMonth: number;
      percentageChange: number;
    };
  };
}

/**
 * Metadata value types allowed in activity logs
 * Uses a union of primitive types and nested structures for type safety
 */
export type ActivityMetadataValue =
  | string
  | number
  | boolean
  | null
  | Date
  | ActivityMetadataValue[]
  | { [key: string]: ActivityMetadataValue };

export interface ActivityLogEntry {
  id: string;
  type: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  userRole: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, ActivityMetadataValue>;
  ipAddress?: string;
  timestamp: Date;
}

export interface DashboardActivityResponse {
  activities: ActivityLogEntry[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Type exports
export type TrendsQueryParams = z.infer<typeof trendsQuerySchema>;
export type ActivityQueryParams = z.infer<typeof activityQuerySchema>;
export type ExportQueryParams = z.infer<typeof exportQuerySchema>;
