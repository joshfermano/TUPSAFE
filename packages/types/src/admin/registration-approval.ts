/**
 * Registration Approval API Validation Schemas and Types
 *
 * Provides comprehensive type-safe schemas for the registration approval system
 * including validation, request/response types, and database models.
 *
 * @module types/admin/registration-approval
 */

import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for approving a registration
 * Allows optional role, department, and position assignment overrides
 */
export const approveRegistrationSchema = z.object({
  role: z.enum(['employee', 'hr', 'admin', 'supervisor', 'auditor']).optional(),
  assignedDepartmentId: z.string().uuid('Invalid department ID').optional(),
  assignedPositionId: z.string().uuid('Invalid position ID').optional(),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  sendWelcomeEmail: z.boolean().optional().default(true),
});

export type ApproveRegistrationInput = z.infer<typeof approveRegistrationSchema>;

/**
 * Schema for rejecting a registration
 * Requires a reason with minimum 10 characters for accountability
 */
export const rejectRegistrationSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(1000, 'Rejection reason must not exceed 1000 characters'),
  notes: z.string().max(500, 'Internal notes (not sent to user)').optional(),
  sendEmail: z.boolean().optional().default(true),
});

export type RejectRegistrationInput = z.infer<typeof rejectRegistrationSchema>;

/**
 * Schema for bulk approving registrations
 */
export const bulkApproveRegistrationsSchema = z.object({
  registrationIds: z
    .array(z.string().uuid('Invalid registration ID'))
    .min(1, 'At least one registration ID required')
    .max(50, 'Cannot approve more than 50 registrations at once'),
  defaultRole: z.enum(['employee', 'hr', 'admin', 'supervisor', 'auditor']).optional(),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  sendWelcomeEmails: z.boolean().optional().default(true),
});

/**
 * Schema for requesting additional information from applicant
 */
export const requestInfoSchema = z.object({
  requestedInfo: z.array(z.string()).min(1, 'At least one field must be requested'),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  sendEmail: z.boolean().optional().default(true),
});

export type RequestInfoInput = z.infer<typeof requestInfoSchema>;

export type BulkApproveInput = z.infer<typeof bulkApproveRegistrationsSchema>;

/**
 * Schema for listing registrations with filters
 * Note: API route handles 'pageSize' alias by mapping it to 'limit' before validation
 */
export const listRegistrationsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  userType: z.enum(['employee', 'applicant']).optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['requestedAt', 'createdAt', 'firstName', 'lastName', 'email'])
    .optional()
    .default('requestedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListRegistrationsInput = z.infer<typeof listRegistrationsSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Basic registration item for list view
 */
export interface RegistrationListItem {
  id: string;
  userId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  employeeId: string | null;
  applicantId?: string | null;
  accountStatus: 'pending' | 'active' | 'suspended' | 'rejected';
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  position: {
    id: string;
    title: string;
  } | null;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedBy: {
    id: string;
    name: string;
  } | null;
  reviewedAt: Date | null;
  adminNotes: string | null;
}

/**
 * Detailed registration data for single registration view
 */
export interface RegistrationDetail extends RegistrationListItem {
  emailVerifiedAt: Date | null;
  phoneNumber: string | null;
  userType: 'employee' | 'applicant';
  employmentCategory: 'faculty' | 'administrative' | 'contractual' | 'not_applicable';
  role: 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor';
  requestedRole?: 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor';
  academicRank: string | null;
  tenureStatus: string | null;
  employmentType: string | null;
  campusAssignment: string | null;
  hireDate: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  isActive: boolean;
  registrationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  rejectedAt: Date | null;
  pendingRegistration?: {
    status: 'pending' | 'approved' | 'rejected';
    adminNotes: string | null;
    approvedAt: Date | null;
    rejectedAt: Date | null;
  } | null;
}

/**
 * Registration statistics for dashboard
 */
export interface RegistrationStats {
  pending: number;
  approved: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  approvedToday?: number;
  rejected: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  averageApprovalTime: string; // e.g., "2.5 days"
  averageApprovalTimeHours: number;
  byDepartment: Array<{
    departmentId: string | null;
    departmentName: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    email: string;
    action: 'approved' | 'rejected';
    timestamp: Date;
    reviewerName: string;
  }>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated list response
 */
export interface RegistrationListResponse {
  registrations: RegistrationListItem[];
  pagination: PaginationMeta;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

/**
 * Approval success response
 */
export interface ApprovalResponse {
  success: true;
  user: {
    id: string;
    email: string;
    employeeId: string;
    role: string;
  };
  message: string;
}

/**
 * Rejection success response
 */
export interface RejectionResponse {
  success: true;
  registrationId: string;
  message: string;
}

/**
 * Bulk approval response
 */
export interface BulkApprovalResponse {
  success: true;
  results: Array<{
    registrationId: string;
    userId: string | null;
    email: string;
    status: 'approved' | 'failed';
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  code?: string;
}
