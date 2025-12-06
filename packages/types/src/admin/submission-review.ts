/**
 * Submission Review API Types and Validation Schemas
 *
 * Provides type-safe validation schemas for admin submission review operations
 * (PDS and SALN review, approval, rejection, and bulk operations)
 */

import { z } from 'zod';

/**
 * Base types for PDS data sections
 * These represent the structured data from CSC forms
 */
export interface PDSPersonalInfo {
  surname?: string;
  firstName?: string;
  middleName?: string;
  nameExtension?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  sex?: string;
  civilStatus?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  gsisNo?: string;
  pagibigNo?: string;
  philhealthNo?: string;
  sssNo?: string;
  tinNo?: string;
  citizenship?: string;
  residentialAddress?: {
    houseNo?: string;
    street?: string;
    subdivision?: string;
    barangay?: string;
    city?: string;
    province?: string;
    zipCode?: string;
  };
  permanentAddress?: {
    houseNo?: string;
    street?: string;
    subdivision?: string;
    barangay?: string;
    city?: string;
    province?: string;
    zipCode?: string;
  };
  telephoneNo?: string;
  mobileNo?: string;
  emailAddress?: string;
}

export interface PDSFamilyBackground {
  spouse?: {
    surname?: string;
    firstName?: string;
    middleName?: string;
    nameExtension?: string;
    occupation?: string;
    employer?: string;
    businessAddress?: string;
    telephoneNo?: string;
  };
  father?: {
    surname?: string;
    firstName?: string;
    middleName?: string;
    nameExtension?: string;
  };
  mother?: {
    maidenName?: string;
    surname?: string;
    firstName?: string;
    middleName?: string;
  };
}

export interface PDSChild {
  fullName: string;
  dateOfBirth: string;
}

export interface PDSEducation {
  level: string;
  schoolName: string;
  degreeCourse?: string;
  periodFrom?: string;
  periodTo?: string;
  highestLevelEarned?: string;
  yearGraduated?: number;
  honorsReceived?: string;
}

export interface PDSCivilService {
  careerService?: string;
  rating?: number;
  dateOfExamination?: string;
  placeOfExamination?: string;
  licenseNumber?: string;
  validity?: string;
}

export interface PDSWorkExperience {
  positionTitle?: string;
  department?: string;
  monthlySalary?: number;
  salaryGrade?: string;
  statusOfAppointment?: string;
  govService?: boolean;
  periodFrom?: string;
  periodTo?: string;
}

export interface PDSVoluntaryWork {
  organizationName?: string;
  positionNature?: string;
  dateFrom?: string;
  dateTo?: string;
  numberOfHours?: number;
  organizationAddress?: string;
}

export interface PDSTraining {
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  hours?: number;
  typeOfLd?: string;
  conductedBy?: string;
}

export interface PDSOtherInfo {
  skills?: string[];
  recognitions?: Array<{
    recognition?: string;
    date?: string;
  }>;
  organizations?: Array<{
    organization?: string;
    role?: string;
  }>;
  references?: Array<{
    name?: string;
    address?: string;
    telephoneNo?: string;
  }>;
}

/**
 * Base types for SALN data sections
 */
export interface SALNRealProperty {
  description?: string;
  kind?: string;
  exactLocation?: string;
  assessedValue?: string;
  marketValue?: string;
  acquisitionYear?: number;
  acquisitionMode?: string;
  acquisitionCost?: string;
}

export interface SALNPersonalProperty {
  description?: string;
  acquisitionYear?: number;
  acquisitionCost?: string;
}

export interface SALNLiability {
  nature?: string;
  creditor?: string;
  amount?: string;
}

export interface SALNBusinessInterest {
  businessName?: string;
  businessAddress?: string;
  natureOfBusiness?: string;
  dateOfAcquisition?: string;
}

export interface SALNRelativeInGov {
  name?: string;
  relationship?: string;
  position?: string;
  agency?: string;
}

/**
 * Audit trail detail type - allows flexible structured data
 */
export type AuditTrailDetailValue =
  | string
  | number
  | boolean
  | null
  | Date
  | AuditTrailDetailValue[]
  | { [key: string]: AuditTrailDetailValue };

export type AuditTrailDetails = Record<string, AuditTrailDetailValue>;

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
  year?: number; // Calendar year for PDS (e.g., 2025 for "Annual PDS - CY 2025")
  version?: number; // Version within the year for PDS
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
    year: number; // Calendar year for this PDS
    version: number; // Version within the year
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
    personalInfo: PDSPersonalInfo;
    familyBackground: PDSFamilyBackground;
    children: PDSChild[];
    education: PDSEducation[];
    civilService: PDSCivilService[];
    workExperience: PDSWorkExperience[];
    voluntaryWork: PDSVoluntaryWork[];
    training: PDSTraining[];
    otherInfo: PDSOtherInfo;
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
    details?: AuditTrailDetails;
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
    realProperties: SALNRealProperty[];
    personalProperties: SALNPersonalProperty[];
    liabilities: SALNLiability[];
    businessInterests: SALNBusinessInterest[];
    relativesInGov: SALNRelativeInGov[];
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
    details?: AuditTrailDetails;
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
