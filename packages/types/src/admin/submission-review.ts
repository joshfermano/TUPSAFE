/**
 * Submission Review API Types and Validation Schemas
 *
 * Provides type-safe validation schemas for admin submission review operations
 * (PDS and SALN review, approval, rejection, and bulk operations)
 */

import { z } from 'zod';

/**
 * Submission status values from database schema
 */
export const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/**
 * Submission type enum
 */
export const SUBMISSION_TYPE = {
  PDS: 'pds',
  SALN: 'saln',
} as const;

/**
 * Query parameters for listing submissions
 */
export const submissionListQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Filters
  type: z.enum(['pds', 'saln', 'all']).default('all'),
  status: z
    .enum(['draft', 'submitted', 'reviewing', 'approved', 'rejected', 'all'])
    .default('all'),
  departmentId: z.string().uuid().optional(),
  fiscalYear: z.coerce.number().int().min(2000).max(2100).optional(), // For SALN only

  // Search
  search: z.string().max(200).optional(), // Employee name or ID

  // Sorting
  sortBy: z.enum(['submittedAt', 'reviewedAt', 'employeeName']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SubmissionListQuery = z.infer<typeof submissionListQuerySchema>;

/**
 * Approve submission schema
 */
export const approveSubmissionSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export type ApproveSubmissionData = z.infer<typeof approveSubmissionSchema>;

/**
 * Reject submission schema
 * Rejection reason is required for compliance and audit trail
 */
export const rejectSubmissionSchema = z.object({
  reason: z.string().min(20, 'Rejection reason must be at least 20 characters').max(1000),
  notes: z.string().max(1000).optional(),
});

export type RejectSubmissionData = z.infer<typeof rejectSubmissionSchema>;

/**
 * Return for revision schema
 */
export const returnForRevisionSchema = z.object({
  revisionRequests: z
    .string()
    .min(20, 'Revision requests must be at least 20 characters')
    .max(1000),
  notes: z.string().max(1000).optional(),
});

export type ReturnForRevisionData = z.infer<typeof returnForRevisionSchema>;

/**
 * Bulk approve schema
 */
export const bulkApproveSubmissionsSchema = z.object({
  submissionIds: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: z.enum(['pds', 'saln']),
      })
    )
    .min(1, 'At least one submission is required')
    .max(50, 'Maximum 50 submissions can be approved at once'),
  notes: z.string().max(1000).optional(),
});

// Alias for backward compatibility
export const bulkApproveSchema = bulkApproveSubmissionsSchema;

export type BulkApproveData = z.infer<typeof bulkApproveSubmissionsSchema>;

/**
 * Submission list response types
 */
export interface SubmissionListItem {
  id: string;
  type: 'pds' | 'saln';
  employee: {
    id: string;
    employeeId: string | null;
    firstName: string;
    lastName: string;
    department: {
      id: string;
      name: string;
    } | null;
    position: {
      id: string;
      title: string;
    } | null;
  };
  status: string;
  submittedAt: Date | null;
  reviewedBy?: {
    id: string;
    name: string;
  } | null;
  reviewedAt?: Date | null;
  fiscalYear?: number; // for SALN only
  version?: number; // for PDS only
}

export interface SubmissionListResponse {
  submissions: SubmissionListItem[];
  pagination: {
    total: number;
    submitted: number; // pending review
    reviewing: number;
    approved: number;
    rejected: number;
  };
}

/**
 * PDS submission detail response
 */
export interface PDSSubmissionDetail {
  submission: {
    id: string;
    status: string;
    submittedAt: Date | null;
    reviewedBy?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
    reviewedAt?: Date | null;
    reviewNotes?: string | null;
    rejectionReason?: string | null;
    version: number;
  };
  employee: {
    id: string;
    employeeId: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
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
  pdsData: {
    personalInfo: any;
    familyBackground: any;
    children: any[];
    education: any[];
    civilService: any[];
    workExperience: any[];
    voluntaryWork: any[];
    training: any[];
    otherInfo: any;
  };
  previousVersions: Array<{
    id: string;
    version: number;
    submittedAt: Date | null;
    status: string;
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    performedBy: string;
    performedAt: Date;
    details?: any;
  }>;
}

/**
 * SALN submission detail response
 */
export interface SALNSubmissionDetail {
  submission: {
    id: string;
    fiscalYear: number;
    status: string;
    submittedAt: Date | null;
    reviewedBy?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
    reviewedAt?: Date | null;
    reviewNotes?: string | null;
    rejectionReason?: string | null;
    netWorth: string;
  };
  employee: {
    id: string;
    employeeId: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
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
  salnData: {
    realProperties: any[];
    personalProperties: any[];
    liabilities: any[];
    businessInterests: any[];
    relativesInGov: any[];
    totalAssets: string | null;
    totalLiabilities: string | null;
    netWorth: string | null;
  };
  previousYear?: {
    fiscalYear: number;
    netWorth: string;
    netWorthChange: string;
    netWorthChangePercent: number;
  } | null;
  auditTrail: Array<{
    id: string;
    action: string;
    performedBy: string;
    performedAt: Date;
    details?: any;
  }>;
}

/**
 * Submission statistics response
 */
export interface SubmissionStatsResponse {
  pending: {
    total: number;
    pds: number;
    saln: number;
  };
  approved: {
    thisWeek: number;
    thisMonth: number;
  };
  rejected: {
    thisWeek: number;
    thisMonth: number;
  };
  averageReviewTime: string; // e.g., "1.5 days"
  byType: {
    pds: {
      total: number;
      submitted: number;
      reviewing: number;
      approved: number;
      rejected: number;
    };
    saln: {
      total: number;
      submitted: number;
      reviewing: number;
      approved: number;
      rejected: number;
    };
  };
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    pending: number;
    approved: number;
    rejected: number;
  }>;
  upcomingDeadlines: Array<{
    type: 'pds' | 'saln';
    deadline: Date;
    daysRemaining: number;
    submitted: number;
    total: number; // expected submissions
  }>;
  complianceRate: number; // percentage
}

/**
 * Bulk approve response
 */
export interface BulkApproveResponse {
  success: boolean;
  results: Array<{
    id: string;
    type: 'pds' | 'saln';
    status: 'approved' | 'failed';
    error?: string;
  }>;
  summary: {
    total: number;
    approved: number;
    failed: number;
  };
}

// API Error and Success types are now exported from ./common.ts
