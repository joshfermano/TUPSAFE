/**
 * PDS Submissions API Types and Validation Schemas
 *
 * Provides type-safe validation schemas for admin PDS submissions management
 * using Zod for runtime validation.
 */

import { z } from 'zod';

/**
 * PDS Submissions list query parameters
 * Supports pagination, search, filtering, and sorting
 */
export const pdsSubmissionsQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Filters
  status: z
    .enum(['draft', 'submitted', 'reviewing', 'approved', 'rejected', 'all'])
    .default('all'),
  department: z.string().uuid().optional(),

  // Search (across employee name and employee ID)
  search: z.string().max(200).optional(),

  // Sorting
  sortBy: z
    .enum(['submittedAt', 'updatedAt', 'employeeName'])
    .default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PdsSubmissionsQuery = z.infer<typeof pdsSubmissionsQuerySchema>;

/**
 * Request changes validation schema
 * Used when HR/admin requests changes to a submitted PDS
 */
export const requestChangesSchema = z.object({
  notes: z.string().min(10, 'Notes must be at least 10 characters').max(1000),
});

export type RequestChangesData = z.infer<typeof requestChangesSchema>;

/**
 * PDS submission list item (for table display)
 */
export interface PdsSubmissionListItem {
  id: string;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  version: number;
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
 * PDS submissions list response
 */
export interface PdsSubmissionsListResponse {
  submissions: PdsSubmissionListItem[];
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
export interface PdsMonthlyDataPoint {
  month: string; // Format: 'YYYY-MM'
  submitted: number;
  approved: number;
  rejected: number;
}

/**
 * Department compliance data for PDS submissions
 */
export interface PdsDepartmentCompliance {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalEmployees: number;
  totalSubmissions: number;
  pendingSubmissions: number;
}

/**
 * PDS timeline statistics response
 * Used for analytics charts on the PDS submissions page
 */
export interface PdsTimelineStats {
  // 6-month submission trend
  monthlyData: PdsMonthlyDataPoint[];

  // Department breakdown
  departmentCompliance: PdsDepartmentCompliance[];
}
