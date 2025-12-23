/**
 * Jobs Management API Types and Validation Schemas
 *
 * Provides type-safe validation schemas for admin job management operations
 * (creating positions, managing applications, status updates, and applicant-to-employee conversion)
 */

import { z } from 'zod';

/**
 * Position status values from database schema
 */
export const POSITION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
} as const;

export type PositionStatus =
  (typeof POSITION_STATUS)[keyof typeof POSITION_STATUS];

/**
 * Application status values from database schema
 */
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  SHORTLISTED: 'shortlisted',
  FOR_INTERVIEW: 'for_interview',
  INTERVIEWED: 'interviewed',
  FOR_FINAL_REVIEW: 'for_final_review',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  HIRED: 'hired',
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

/**
 * Employment category values from database schema
 */
export const EMPLOYMENT_CATEGORY = {
  FACULTY: 'faculty',
  ADMINISTRATIVE: 'administrative',
  CONTRACTUAL: 'contractual',
  NOT_APPLICABLE: 'not_applicable',
} as const;

export type EmploymentCategory =
  (typeof EMPLOYMENT_CATEGORY)[keyof typeof EMPLOYMENT_CATEGORY];

/**
 * Position requirements structure
 */
export interface PositionRequirements {
  education: string[];
  experience: string[];
  skills: string[];
}

/**
 * Create Open Position Schema
 */
export const createOpenPositionSchema = z.object({
  positionTitle: z
    .string()
    .min(3, 'Position title must be at least 3 characters')
    .max(200),
  positionCode: z
    .string()
    .min(2, 'Position code must be at least 2 characters')
    .max(50)
    .regex(
      /^[A-Z0-9-]+$/,
      'Position code must contain only uppercase letters, numbers, and hyphens'
    ),
  departmentId: z.string().uuid('Invalid department ID'),
  employmentCategory: z.enum([
    'faculty',
    'administrative',
    'contractual',
    'not_applicable',
  ]),

  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000),
  qualifications: z.array(z.string().min(5).max(500)).optional().default([]),
  responsibilities: z.array(z.string().min(5).max(500)).optional().default([]),
  requirements: z
    .object({
      education: z.array(z.string().min(3).max(200)),
      experience: z.array(z.string().min(3).max(500)),
      skills: z.array(z.string().min(2).max(100)),
    })
    .optional()
    .default({ education: [], experience: [], skills: [] }),

  salaryGrade: z.string().max(50).optional(),
  salaryRangeMin: z.coerce.number().positive().optional(),
  salaryRangeMax: z.coerce.number().positive().optional(),
  employmentType: z.string().max(100).optional(),

  applicationDeadline: z.coerce.date(),
  numberOfOpenings: z.coerce.number().int().positive().default(1),

  isFeatured: z.boolean().default(false),
});

export type CreateOpenPositionData = z.infer<typeof createOpenPositionSchema>;

/**
 * Update Open Position Schema
 */
export const updateOpenPositionSchema = z.object({
  positionTitle: z.string().min(3).max(200).optional(),
  departmentId: z.string().uuid().optional(),
  employmentCategory: z
    .enum(['faculty', 'administrative', 'contractual', 'not_applicable'])
    .optional(),

  description: z.string().min(50).max(5000).optional(),
  qualifications: z.array(z.string().min(5).max(500)).optional(),
  responsibilities: z.array(z.string().min(5).max(500)).optional(),
  requirements: z
    .object({
      education: z.array(z.string().min(3).max(200)),
      experience: z.array(z.string().min(3).max(500)),
      skills: z.array(z.string().min(2).max(100)),
    })
    .optional(),

  salaryGrade: z.string().max(50).optional(),
  salaryRangeMin: z.coerce.number().positive().optional(),
  salaryRangeMax: z.coerce.number().positive().optional(),
  employmentType: z.string().max(100).optional(),

  status: z.enum(['open', 'closed', 'filled', 'cancelled']).optional(),
  applicationDeadline: z.coerce.date().optional(),
  numberOfOpenings: z.coerce.number().int().positive().optional(),

  isFeatured: z.boolean().optional(),
});

export type UpdateOpenPositionData = z.infer<typeof updateOpenPositionSchema>;

/**
 * Update Application Status Schema
 */
export const updateApplicationStatusSchema = z.object({
  status: z.enum([
    'pending',
    'under_review',
    'shortlisted',
    'for_interview',
    'interviewed',
    'for_final_review',
    'accepted',
    'rejected',
    'withdrawn',
    'hired',
  ]),
  notes: z.string().max(1000).optional(),

  // Interview-specific fields
  interviewDate: z.coerce.date().optional(),
  interviewLocation: z.string().max(500).optional(),
  interviewNotes: z.string().max(1000).optional(),

  // Rejection-specific fields
  rejectionReason: z
    .string()
    .min(20, 'Rejection reason must be at least 20 characters')
    .max(1000)
    .optional(),

  // Final decision fields
  finalDecision: z.string().max(500).optional(),
});

export type UpdateApplicationStatusData = z.infer<
  typeof updateApplicationStatusSchema
>;

/**
 * Job positions query schema (for filtering and pagination)
 */
export const jobsQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Filters
  status: z
    .enum(['open', 'closed', 'filled', 'cancelled', 'all'])
    .default('all'),
  departmentId: z.string().uuid().optional(),
  employmentCategory: z
    .enum(['faculty', 'administrative', 'contractual', 'not_applicable', 'all'])
    .default('all'),
  isFeatured: z.coerce.boolean().optional(),

  // Search
  search: z.string().max(200).optional(), // Position title or code

  // Sorting
  sortBy: z
    .enum([
      'postedAt',
      'applicationDeadline',
      'positionTitle',
      'applicationsReceived',
    ])
    .default('postedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type JobsQuery = z.infer<typeof jobsQuerySchema>;

/**
 * Applications query schema (for filtering and pagination)
 */
export const applicationsQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Filters
  status: z
    .enum([
      'pending',
      'under_review',
      'shortlisted',
      'for_interview',
      'interviewed',
      'for_final_review',
      'accepted',
      'rejected',
      'withdrawn',
      'hired',
      'all',
    ])
    .default('all'),
  positionId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),

  // Search
  search: z.string().max(200).optional(), // Applicant name or application number

  // Sorting
  sortBy: z
    .enum(['applicationDate', 'applicantName', 'status', 'reviewedAt'])
    .default('applicationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ApplicationsQuery = z.infer<typeof applicationsQuerySchema>;

/**
 * Convert applicant to employee schema
 */
export const convertApplicantToEmployeeSchema = z.object({
  hireDate: z.coerce.date(),
  employeeId: z
    .string()
    .min(5, 'Employee ID must be at least 5 characters')
    .max(50)
    .regex(/^TUP-[\w-]+$/, 'Employee ID must start with "TUP-"'),
  departmentId: z.string().uuid('Invalid department ID'),
  positionId: z.string().uuid('Invalid position ID'),
  employmentCategory: z.enum(['faculty', 'administrative', 'contractual']),
  employmentType: z.string().max(100).optional(),
  academicRank: z.string().max(100).optional(),
  tenureStatus: z.string().max(100).optional(),
  campusAssignment: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export type ConvertApplicantToEmployeeData = z.infer<
  typeof convertApplicantToEmployeeSchema
>;

/**
 * Open Position List Item (for list view)
 */
export interface OpenPositionListItem {
  id: string;
  positionTitle: string;
  positionCode: string;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  employmentCategory: string;
  status: PositionStatus;
  applicationDeadline: Date;
  numberOfOpenings: number;
  applicationsReceived: number;
  isFeatured: boolean;
  postedAt: Date | null;
  postedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * Open Position Detail (full details)
 */
export interface OpenPositionDetail {
  id: string;
  positionTitle: string;
  positionCode: string;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  employmentCategory: string;

  description: string;
  qualifications: string[];
  responsibilities: string[];
  requirements: PositionRequirements;

  salaryGrade: string | null;
  salaryRangeMin: string | null;
  salaryRangeMax: string | null;
  employmentType: string | null;

  status: PositionStatus;
  applicationDeadline: Date;
  numberOfOpenings: number;
  applicationsReceived: number;

  isActive: boolean | null;
  isFeatured: boolean | null;

  postedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  postedAt: Date | null;
  updatedAt: Date | null;
  closedAt: Date | null;

  // Recent applications preview
  recentApplications: Array<{
    id: string;
    applicationNumber: string;
    applicantName: string;
    status: ApplicationStatus;
    applicationDate: Date;
  }>;

  // Application statistics
  applicationStats: {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
  };
}

/**
 * Job Application List Item (for list view)
 */
export interface JobApplicationListItem {
  id: string;
  applicationNumber: string;
  applicant: {
    id: string;
    applicantId: string | null;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  };
  position: {
    id: string;
    positionTitle: string;
    positionCode: string;
    department: {
      id: string;
      name: string;
    } | null;
  };
  status: ApplicationStatus;
  applicationDate: Date;
  reviewedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  reviewedAt: Date | null;
  interviewDate: Date | null;
  /** PDS submission ID linked to this application */
  pdsSubmissionId: string | null;
  /** Whether the application has a linked PDS */
  hasPds: boolean;
}

/**
 * Job Application Detail (full details with applicant info)
 */
export interface JobApplicationDetail {
  application: {
    id: string;
    applicationNumber: string;
    status: ApplicationStatus;
    applicationDate: Date;

    // PDS-related
    pdsSubmissionId: string | null;

    // Application materials
    coverLetter: string | null;
    resumeUrl: string | null;
    additionalDocuments: string[];

    // Review information
    reviewedBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    reviewedAt: Date | null;
    reviewerNotes: string | null;

    // Interview information
    interviewDate: Date | null;
    interviewLocation: string | null;
    interviewNotes: string | null;

    // Final decision
    finalDecision: string | null;
    decisionBy: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
    decisionAt: Date | null;
    rejectionReason: string | null;

    // Conversion information (if hired)
    convertedToEmployeeId: string | null;
    convertedHireDate: string | null;
    conversionDate: Date | null;

    createdAt: Date;
    updatedAt: Date;
  };

  applicant: {
    id: string;
    applicantId: string | null;
    firstName: string;
    lastName: string;
    middleName: string | null;
    email: string;
    phoneNumber: string | null;
    accountStatus: string;
    createdAt: Date;
  };

  position: {
    id: string;
    positionTitle: string;
    positionCode: string;
    description: string;
    employmentCategory: string;
    department: {
      id: string;
      name: string;
      code: string;
    } | null;
    applicationDeadline: Date;
    status: PositionStatus;
  };

  // PDS data preview (if linked)
  pdsData?: {
    id: string;
    version: number;
    personalInfo: {
      fullName: string;
      dateOfBirth: string;
      email: string;
      phoneNumber: string;
    };
    education: Array<{
      level: string;
      schoolName: string;
      degreeCourse: string | null;
      yearGraduated: number | null;
    }>;
    workExperience: Array<{
      positionTitle: string;
      departmentAgency: string;
      dateFrom: string;
      dateTo: string | null;
    }>;
  };

  // Status history
  statusHistory: Array<{
    id: string;
    previousStatus: ApplicationStatus | null;
    newStatus: ApplicationStatus;
    changedBy: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
    changedAt: Date;
    notes: string | null;
  }>;

  // Other applications by this applicant
  otherApplications: Array<{
    id: string;
    applicationNumber: string;
    positionTitle: string;
    status: ApplicationStatus;
    applicationDate: Date;
  }>;
}

/**
 * Open Position List Response (API response with pagination)
 */
export interface OpenPositionListResponse {
  positions: OpenPositionListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    open: number;
    closed: number;
    filled: number;
    cancelled: number;
  };
}

/**
 * Job Application List Response (API response)
 */
export interface JobApplicationListResponse {
  applications: JobApplicationListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    pending: number;
    underReview: number;
    shortlisted: number;
    forInterview: number;
    interviewed: number;
    forFinalReview: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
    hired: number;
  };
}

/**
 * Jobs Statistics Response
 */
export interface JobsStatsResponse {
  overview: {
    totalActivePositions: number;
    totalApplicationsReceived: number;
    positionsFilled: number;
    averageApplicationsPerPosition: number;
  };
  byStatus: {
    open: number;
    closed: number;
    filled: number;
    cancelled: number;
  };
  byCategory: {
    faculty: number;
    administrative: number;
    contractual: number;
  };
  upcomingDeadlines: Array<{
    positionId: string;
    positionTitle: string;
    deadline: Date;
    daysRemaining: number;
    applicationsReceived: number;
  }>;
  recentActivity: Array<{
    type: 'position_posted' | 'position_closed' | 'position_filled';
    positionId: string;
    positionTitle: string;
    timestamp: Date;
  }>;
  topPositions: Array<{
    positionId: string;
    positionTitle: string;
    applicationsReceived: number;
    status: PositionStatus;
  }>;
}

/**
 * Applications Statistics Response
 */
export interface ApplicationsStatsResponse {
  overview: {
    totalApplications: number;
    pendingReview: number;
    interviewed: number;
    hired: number;
    averageTimeToHire: string; // e.g., "45 days"
    conversionRate: number; // percentage
  };
  byStatus: Record<ApplicationStatus, number>;
  byPosition: Array<{
    positionId: string;
    positionTitle: string;
    applicationsCount: number;
    hiredCount: number;
  }>;
  byMonth: Array<{
    month: string; // e.g., "2025-01"
    applications: number;
    hired: number;
  }>;
  pipeline: {
    pending: number;
    screening: number; // under_review + shortlisted
    interviewing: number; // for_interview + interviewed
    finalReview: number; // for_final_review
    offers: number; // accepted
  };
  recentActivity: Array<{
    type: 'application_submitted' | 'status_changed' | 'applicant_hired';
    applicationId: string;
    applicantName: string;
    positionTitle: string;
    timestamp: Date;
    details?: string;
  }>;
}

/**
 * Applicant Conversion Response
 */
export interface ApplicantConversionResponse {
  success: boolean;
  employeeId: string;
  userId: string;
  message: string;
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    departmentId: string;
    positionId: string;
    hireDate: string;
  };
}

/**
 * Bulk operations types
 */
export interface BulkUpdatePositionStatusData {
  positionIds: string[];
  status: PositionStatus;
  notes?: string;
}

export interface BulkUpdateApplicationStatusData {
  applicationIds: string[];
  status: ApplicationStatus;
  notes?: string;
}

export interface BulkOperationResponse {
  success: boolean;
  results: Array<{
    id: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
