/**
 * Deadline Management API Types and Validation Schemas
 *
 * Provides type-safe validation schemas for admin deadline management operations
 * (creating, updating, and listing PDS/SALN submission deadlines)
 */

import { z } from 'zod';

// ========================================
// Constants
// ========================================

/**
 * Form type values for deadline management
 */
export const FORM_TYPE = {
  PDS: 'pds',
  SALN: 'saln',
} as const;

export type FormType = (typeof FORM_TYPE)[keyof typeof FORM_TYPE];

/**
 * Default reminder days before deadline
 * These are the standard reminder intervals used across the system
 */
export const DEFAULT_REMINDER_DAYS = [30, 15, 7, 3, 1] as const;

// ========================================
// Zod Schemas
// ========================================

/**
 * Create Deadline Schema
 * Validates data for creating a new submission deadline
 */
export const createDeadlineSchema = z.object({
  formType: z.enum(['pds', 'saln'], {
    required_error: 'Form type is required',
    invalid_type_error: 'Form type must be either "pds" or "saln"',
  }),

  year: z
    .number({
      required_error: 'Year is required',
      invalid_type_error: 'Year must be a number',
    })
    .int('Year must be an integer')
    .min(2020, 'Year must be 2020 or later')
    .max(2100, 'Year must be 2100 or earlier'),

  deadlineDate: z
    .string({
      required_error: 'Deadline date is required',
    })
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid date format' }
    )
    .refine(
      (val) => {
        const date = new Date(val);
        return date > new Date();
      },
      { message: 'Deadline date must be in the future' }
    ),

  reminderDaysBefore: z
    .array(
      z
        .number()
        .int('Reminder days must be integers')
        .min(1, 'Reminder days must be at least 1')
        .max(365, 'Reminder days cannot exceed 365')
    )
    .min(1, 'At least one reminder day is required')
    .max(10, 'Cannot have more than 10 reminder days')
    .default([30, 15, 7, 3, 1])
    .transform((days) => [...new Set(days)].sort((a, b) => b - a)), // Remove duplicates and sort descending
});

export type CreateDeadlineInput = z.infer<typeof createDeadlineSchema>;

/**
 * Update Deadline Schema
 * Validates data for updating an existing deadline
 * All fields are optional for partial updates
 */
export const updateDeadlineSchema = z.object({
  deadlineDate: z
    .string()
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid date format' }
    )
    .optional(),

  reminderDaysBefore: z
    .array(
      z
        .number()
        .int('Reminder days must be integers')
        .min(1, 'Reminder days must be at least 1')
        .max(365, 'Reminder days cannot exceed 365')
    )
    .min(1, 'At least one reminder day is required')
    .max(10, 'Cannot have more than 10 reminder days')
    .transform((days) => [...new Set(days)].sort((a, b) => b - a))
    .optional(),

  isActive: z.boolean().optional(),
});

export type UpdateDeadlineInput = z.infer<typeof updateDeadlineSchema>;

/**
 * List Deadlines Query Schema
 * Validates query parameters for listing deadlines with filtering and pagination
 */
export const listDeadlinesSchema = z.object({
  // Filters
  formType: z.enum(['pds', 'saln', 'all']).default('all'),

  year: z.coerce
    .number()
    .int()
    .min(2020)
    .max(2100)
    .optional(),

  isActive: z
    .enum(['true', 'false', 'all'])
    .default('all')
    .transform((val) => {
      if (val === 'all') return undefined;
      return val === 'true';
    }),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Sorting
  sortBy: z
    .enum(['year', 'deadlineDate', 'formType', 'createdAt'])
    .default('deadlineDate'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListDeadlinesQuery = z.infer<typeof listDeadlinesSchema>;

// ========================================
// TypeScript Interfaces
// ========================================

/**
 * Deadline List Item
 * Represents a deadline entry in list views
 */
export interface DeadlineListItem {
  id: string;
  formType: FormType;
  year: number;
  deadlineDate: Date;
  reminderDaysBefore: number[];
  isActive: boolean;
  createdAt: Date;

  /**
   * Computed field: days remaining until deadline
   * Negative values indicate past deadlines
   */
  daysRemaining: number;
}

/**
 * Compliance Statistics
 * Aggregated compliance data for a deadline
 */
export interface DeadlineComplianceStats {
  totalEmployees: number;
  submitted: number;
  pending: number;
  approved: number;
  rejected: number;
  draft: number;

  /**
   * Compliance rate as percentage (0-100)
   */
  complianceRate: number;
}

/**
 * Deadline Detail
 * Extended deadline information including compliance statistics
 * Used for detail views and analytics
 */
export interface DeadlineDetail extends DeadlineListItem {
  updatedAt: Date;

  /**
   * User who created the deadline
   */
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;

  /**
   * Compliance statistics for this deadline
   */
  complianceStats: DeadlineComplianceStats;

  /**
   * Recent submissions for this deadline (preview)
   */
  recentSubmissions: Array<{
    id: string;
    employeeName: string;
    status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
    submittedAt: Date | null;
  }>;

  /**
   * Department-level breakdown
   */
  departmentBreakdown: Array<{
    departmentId: string;
    departmentName: string;
    totalEmployees: number;
    submitted: number;
    complianceRate: number;
  }>;
}

/**
 * Pagination Information
 */
export interface DeadlinePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Deadline List Response
 * API response for listing deadlines with pagination
 */
export interface DeadlineListResponse {
  deadlines: DeadlineListItem[];
  pagination: DeadlinePagination;

  /**
   * Summary statistics across all deadlines (filtered)
   */
  summary: {
    totalActive: number;
    totalInactive: number;
    upcomingCount: number;
    pastCount: number;
  };
}

/**
 * Create Deadline Response
 */
export interface CreateDeadlineResponse {
  success: boolean;
  message: string;
  deadline?: DeadlineListItem;
  error?: string;
}

/**
 * Update Deadline Response
 */
export interface UpdateDeadlineResponse {
  success: boolean;
  message: string;
  deadline?: DeadlineListItem;
  error?: string;
}

/**
 * Delete Deadline Response
 */
export interface DeleteDeadlineResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Deadline Statistics Response
 * Aggregated statistics for deadline analytics
 */
export interface DeadlineStatsResponse {
  overview: {
    totalDeadlines: number;
    activeDeadlines: number;
    upcomingDeadlines: number;
    overdueCount: number;
  };

  byFormType: {
    pds: {
      total: number;
      active: number;
      averageComplianceRate: number;
    };
    saln: {
      total: number;
      active: number;
      averageComplianceRate: number;
    };
  };

  byYear: Array<{
    year: number;
    pdsDeadlines: number;
    salnDeadlines: number;
    averageCompliance: number;
  }>;

  upcomingDeadlines: Array<{
    id: string;
    formType: FormType;
    year: number;
    deadlineDate: Date;
    daysRemaining: number;
    currentComplianceRate: number;
  }>;

  complianceTrends: Array<{
    month: string; // Format: 'YYYY-MM'
    pdsComplianceRate: number;
    salnComplianceRate: number;
    overallComplianceRate: number;
  }>;
}

/**
 * Bulk Deadline Operations
 */
export interface BulkUpdateDeadlinesData {
  deadlineIds: string[];
  updates: {
    isActive?: boolean;
    reminderDaysBefore?: number[];
  };
}

export interface BulkOperationResult {
  id: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface BulkUpdateDeadlinesResponse {
  success: boolean;
  results: BulkOperationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Send Reminder Request
 * Used for manually triggering deadline reminders
 */
export const sendReminderSchema = z.object({
  deadlineId: z.string().uuid('Invalid deadline ID'),
  recipientFilter: z
    .enum(['all', 'pending_only', 'department'])
    .default('pending_only'),
  departmentId: z.string().uuid().optional(),
  customMessage: z.string().max(500).optional(),
});

export type SendReminderInput = z.infer<typeof sendReminderSchema>;

export interface SendReminderResponse {
  success: boolean;
  message: string;
  recipientCount: number;
  error?: string;
}
