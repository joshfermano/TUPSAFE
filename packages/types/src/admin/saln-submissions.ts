/**
 * SALN Submissions API Types and Validation Schemas
 *
 * Provides type-safe validation schemas for admin SALN submissions management
 * using Zod for runtime validation.
 */

import { z } from 'zod';

/**
 * SALN Submissions list query parameters
 * Supports pagination, search, filtering (by year), and sorting
 */
export const salnSubmissionsQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Filters
  status: z
    .enum(['draft', 'submitted', 'reviewing', 'approved', 'rejected', 'all'])
    .default('all'),
  department: z.string().uuid().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(), // Fiscal year filter

  // Search (across employee name and employee ID)
  search: z.string().max(200).optional(),

  // Sorting
  sortBy: z
    .enum(['submittedAt', 'updatedAt', 'employeeName', 'netWorth'])
    .default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SalnSubmissionsQuery = z.infer<typeof salnSubmissionsQuerySchema>;

/**
 * Request changes validation schema for SALN submissions
 * Used when HR/admin requests changes to a submitted SALN
 */
export const salnRequestChangesSchema = z.object({
  notes: z.string().min(10, 'Notes must be at least 10 characters').max(1000),
});

export type SalnRequestChangesData = z.infer<typeof salnRequestChangesSchema>;

/**
 * SALN submission list item (for table display)
 */
export interface SalnSubmissionListItem {
  id: string;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  year: number;
  netWorth: string; // Decimal as string for precision
  totalAssets: string; // Decimal as string for precision
  totalLiabilities: string; // Decimal as string for precision
  submittedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason: string | null;
  pdfFilePath: string | null;

  // Employee details
  employee: {
    id: string;
    employeeId: string | null;
    firstName: string;
    lastName: string;
    middleName: string | null;
    avatarUrl?: string | null;
    department: {
      id: string;
      name: string;
      code: string;
    } | null;
    position: {
      id: string;
      title: string;
    } | null;
  };

  // Reviewer details (if reviewed)
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

/**
 * SALN submissions list response
 */
export interface SalnSubmissionsListResponse {
  submissions: SalnSubmissionListItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  stats: {
    total: number;
    draft: number;
    submitted: number;
    reviewing: number;
    approved: number;
    rejected: number;
  };
}

/**
 * Monthly submission data point for timeline charts
 */
export interface SalnMonthlyDataPoint {
  month: string; // Format: 'YYYY-MM'
  submitted: number;
  approved: number;
  rejected: number;
}

/**
 * Department compliance data for SALN submissions
 * Includes financial aggregations (average net worth)
 */
export interface SalnDepartmentCompliance {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalEmployees: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  avgNetWorth: string; // Average net worth as string (decimal precision)
}

/**
 * Yearly comparison data for SALN submissions
 * Tracks submission trends and net worth changes over time
 */
export interface SalnYearlyComparison {
  year: number;
  totalSubmissions: number;
  avgNetWorth: string; // Average net worth as string (decimal precision)
  medianNetWorth: string; // Median net worth as string (decimal precision)
}

/**
 * SALN timeline statistics response
 * Used for analytics charts on the SALN submissions page
 */
export interface SalnTimelineStats {
  // 6-month submission trend
  monthlyData: SalnMonthlyDataPoint[];

  // Department breakdown with financial metrics
  departmentCompliance: SalnDepartmentCompliance[];

  // Yearly comparison with net worth aggregations
  yearlyComparison: SalnYearlyComparison[];
}
