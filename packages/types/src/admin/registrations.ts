/**
 * Registration Approval API Validation Schemas
 * Zod schemas for type-safe validation of registration approval endpoints
 */

import { z } from 'zod';
import type { PaginationMeta } from './common';

/**
 * Schema for approving a registration
 * Allows optional role, department, and position assignment
 */
export const approveRegistrationSchema = z.object({
  assignedRole: z.enum(['employee', 'hr', 'admin', 'co_admin', 'supervisor', 'auditor']).optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  positionId: z.string().uuid('Invalid position ID').optional(),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
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
  sendEmail: z.boolean().optional().default(true),
});

export type RejectRegistrationInput = z.infer<typeof rejectRegistrationSchema>;

/**
 * Schema for requesting additional information from registrant
 */
export const requestInfoSchema = z.object({
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must not exceed 1000 characters'),
  requiredFields: z.array(z.string()).optional(),
  sendEmail: z.boolean().optional().default(true),
});

export type RequestInfoInput = z.infer<typeof requestInfoSchema>;

/**
 * Schema for listing registrations with filters
 */
export const listRegistrationsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  userType: z.enum(['employee', 'applicant']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListRegistrationsInput = z.infer<typeof listRegistrationsSchema>;

/**
 * Registration data shape for API responses
 */
export interface RegistrationListItem {
  id: string;
  userId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  userType: 'employee' | 'applicant';
  employeeId: string | null;
  applicantId: string | null;
  accountStatus: 'pending' | 'active' | 'suspended' | 'rejected';
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  position?: {
    id: string;
    title: string;
  } | null;
  requestedRole?: 'employee' | 'hr' | 'admin' | 'co_admin' | 'supervisor' | 'auditor';
  registrationDate: Date;
  phoneNumber: string | null;
  academicRank: string | null;
  tenureStatus: string | null;
  employmentType: string | null;
}

/**
 * Detailed registration data for single registration view
 */
export interface RegistrationDetail extends RegistrationListItem {
  emailVerifiedAt: Date | null;
  campusAssignment: string | null;
  employmentCategory: 'faculty' | 'administrative' | 'contractual' | 'not_applicable' | null;
  hireDate: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  approvedToday: number;
  approvedWeek: number;
  approvedMonth: number;
  rejectedToday: number;
  rejectedWeek: number;
  rejectedMonth: number;
  averageApprovalTimeHours: number;
  byUserType: {
    employee: number;
    applicant: number;
  };
  byDepartment: Array<{
    departmentId: string | null;
    departmentName: string;
    count: number;
  }>;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Paginated list response
 */
export interface PaginatedListResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}
