/**
 * User Management API Types and Validation Schemas
 *
 * Provides type-safe validation schemas for admin user management operations
 * using Zod for runtime validation.
 */

import { z } from 'zod';

/**
 * Role hierarchy for permission validation
 */
export const ROLE_HIERARCHY = {
  employee: 1,
  hr: 2,
  admin: 3,
  supervisor: 4,
  auditor: 5,
} as const;

/**
 * User update validation schema
 * Validates admin updates to user profiles
 */
export const updateUserSchema = z.object({
  role: z.enum(['employee', 'hr', 'admin', 'supervisor', 'auditor']).optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  accountStatus: z.enum(['pending', 'active', 'suspended', 'rejected']).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional().nullable(),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]*$/).max(20).optional().nullable(),
  academicRank: z.string().max(100).optional().nullable(),
  tenureStatus: z.string().max(50).optional().nullable(),
  employmentType: z.string().max(50).optional().nullable(),
  campusAssignment: z.string().max(100).optional().nullable(),
});

export type UpdateUserData = z.infer<typeof updateUserSchema>;

/**
 * User list query parameters
 * Supports pagination, search, filtering, and sorting
 */
export const userListQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Search
  search: z.string().max(200).optional(),

  // Filters
  role: z.enum(['employee', 'hr', 'admin', 'supervisor', 'auditor']).optional(),
  userType: z.enum(['employee', 'applicant']).optional(),
  accountStatus: z.enum(['pending', 'active', 'suspended', 'rejected']).optional(),
  isActive: z.boolean().optional(),
  departmentId: z.string().uuid().optional(),
  employmentCategory: z.enum(['faculty', 'administrative', 'contractual', 'not_applicable']).optional(),

  // Sorting
  sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'updatedAt', 'role']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  sendEmail: z.boolean().default(true),
  temporaryPassword: z.string().min(12).max(128).optional(),
});

export type PasswordResetData = z.infer<typeof passwordResetSchema>;

/**
 * Create user validation schema
 * Used by admin/HR to create new employee accounts
 *
 * Employee ID is auto-generated from dateOfBirth in format TUPM-MMDD-YY-###
 */
export const createUserSchema = z.object({
  // Required fields
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date of birth must be in YYYY-MM-DD format'
  ),
  role: z.enum(['employee', 'hr', 'admin', 'supervisor', 'auditor']),
  employmentCategory: z.enum(['faculty', 'administrative', 'contractual']),

  // Optional fields
  middleName: z.string().max(100).optional(),
  phoneNumber: z
    .string()
    .regex(/^[0-9+\-\s()]*$/)
    .max(20)
    .optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  positionId: z.string().uuid('Invalid position ID').optional(),
  academicRank: z.string().max(100).optional(),
  tenureStatus: z.string().max(50).optional(),
  employmentType: z.string().max(50).optional(),
  campusAssignment: z.string().max(100).optional(),

  // Email credentials option (defaults to true)
  sendCredentials: z.boolean().optional().default(true),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;

/**
 * Response from creating a user
 */
export interface CreateUserResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    employeeId: string;
    email: string;
    role: string;
    temporaryPassword?: string; // Only included if sendCredentials is true
    emailSent: boolean;
  };
}

/**
 * User response types
 */
export interface UserListItem {
  id: string;
  email: string | null;
  employeeId: string | null;
  applicantId: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  role: string;
  userType: 'employee' | 'applicant';
  employmentCategory: 'faculty' | 'administrative' | 'contractual' | 'not_applicable' | null;
  accountStatus: string;
  isActive: boolean;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  position?: {
    id: string;
    title: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerifiedAt: Date | null;
}

export interface UserDetail extends UserListItem {
  phoneNumber: string | null;
  academicRank: string | null;
  tenureStatus: string | null;
  employmentType: string | null;
  campusAssignment: string | null;
  hireDate: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  temporaryPassword: boolean;
  pdsSubmissionsCount?: number;
  salnSubmissionsCount?: number;
  lastPdsSubmission?: {
    id: string;
    status: string;
    submittedAt: Date | null;
  } | null;
  lastSalnSubmission?: {
    id: string;
    year: number;
    status: string;
    submittedAt: Date | null;
  } | null;
  recentAuditLogs?: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: Date;
  }>;
}

export interface UserListResponse {
  users: UserListItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  filters: {
    roles: Array<{ role: string; count: number }>;
    statuses: Array<{ status: string; count: number }>;
    userTypes: Array<{ type: string; count: number }>;
  };
}

export interface UserStatsResponse {
  total: number;
  activeUsers: number;
  pendingApprovals: number;
  suspendedUsers: number;
  byUserType: {
    employees: number;
    applicants: number;
  };
  byRole: {
    employee: number;
    hr: number;
    admin: number;
    supervisor: number;
    auditor: number;
  };
  byAccountStatus: {
    pending: number;
    active: number;
    suspended: number;
    rejected: number;
  };
  recentRegistrations: {
    last7Days: number;
    last30Days: number;
  };
  byEmploymentCategory: {
    faculty: number;
    administrative: number;
    contractual: number;
  };
}

// API Error and Success types are now exported from ./common.ts
