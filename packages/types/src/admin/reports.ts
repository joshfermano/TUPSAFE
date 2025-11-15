import { z } from 'zod';

/**
 * Reports Page Type Definitions
 *
 * Comprehensive types for the admin reports page analytics and data visualization
 */

// Query parameter validation schema
export const reportsQuerySchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    departmentId: z.string().uuid().optional(),
  })
  .optional();

export type ReportsQueryParams = z.infer<typeof reportsQuerySchema>;

/**
 * Submission trend data point for time-series charts (6-month view)
 */
export interface SubmissionTrendDataPoint {
  month: string; // Format: 'YYYY-MM'
  pdsCount: number;
  salnCount: number;
}

/**
 * Department compliance metrics
 */
export interface DepartmentComplianceData {
  id: string;
  name: string;
  code: string;
  rate: number; // Compliance rate as percentage (0-100)
  pdsCount: number;
  salnCount: number;
  totalEmployees: number;
}

/**
 * Recent activity log entry
 */
export interface RecentActivityData {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  type: 'pds' | 'saln' | 'user' | 'system';
}

/**
 * Compliance overview metrics
 */
export interface ComplianceOverview {
  overallRate: number; // Overall compliance rate as percentage
  trendPercentage: number; // 7-day trend vs previous period (positive = improving, negative = declining)
  pdsCompliance: number; // PDS compliance rate as percentage
  salnCompliance: number; // SALN compliance rate as percentage
}

/**
 * Submission statistics
 */
export interface SubmissionStats {
  pdsTotal: number; // Total PDS submissions (all time)
  salnTotal: number; // Total SALN submissions (current year)
  pdsRecent: number; // PDS submissions in last 30 days
  salnRecent: number; // SALN submissions in last 30 days
}

/**
 * Submission status distribution
 * Maps to submission_status enum: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected'
 */
export interface StatusDistribution {
  approved: number;
  pending: number; // Maps to 'submitted' status
  inReview: number; // Maps to 'reviewing' status
  rejected: number;
}

/**
 * Main reports overview response
 *
 * This is the complete response structure for the reports page
 * containing all metrics, charts, and analytics data
 */
export interface ReportsOverviewResponse {
  /** Overall compliance metrics */
  complianceOverview: ComplianceOverview;

  /** Submission count statistics */
  submissionStats: SubmissionStats;

  /** 6-month submission trend data for charts */
  submissionTrends: SubmissionTrendDataPoint[];

  /** Department-level compliance rankings */
  departmentCompliance: DepartmentComplianceData[];

  /** Status distribution across all submissions */
  statusDistribution: StatusDistribution;

  /** Recent activity feed (last 10 events) */
  recentActivity: RecentActivityData[];
}

/**
 * Export query parameters inference
 */
export type ReportsExportParams = z.infer<typeof reportsQuerySchema>;
