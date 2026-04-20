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
/**
 * PDS Personal Info
 * Note: API may use canonical DB field names (heightM, weightKg) or display names (height, weight)
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
  height?: number | string;
  heightM?: string; // Canonical DB field name
  weight?: number | string;
  weightKg?: string; // Canonical DB field name
  bloodType?: string;
  gsisNo?: string;
  pagibigNo?: string;
  philhealthNo?: string;
  philsysNo?: string;
  sssNo?: string;
  tinNo?: string;
  agencyEmployeeNo?: string; // Canonical DB field name
  citizenship?: string | unknown; // Can be JSONB from DB
  residentialAddress?:
    | {
        houseNo?: string;
        street?: string;
        subdivision?: string;
        barangay?: string;
        city?: string;
        province?: string;
        zipCode?: string;
      }
    | unknown;
  permanentAddress?:
    | {
        houseNo?: string;
        street?: string;
        subdivision?: string;
        barangay?: string;
        city?: string;
        province?: string;
        zipCode?: string;
      }
    | unknown;
  telephoneNo?: string;
  mobileNo?: string;
  emailAddress?: string;
}

/**
 * PDS Family Background - UI Display Format (nested)
 * Used for admin view components that expect nested spouse/father/mother objects
 */
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

/**
 * PDS Family Background - Canonical API Format (flat DB fields)
 * API returns this format; UI adapts to nested format for display
 * PDF generation uses this canonical format directly
 */
export interface PDSFamilyBackgroundCanonical {
  spouseSurname?: string;
  spouseFirstName?: string;
  spouseMiddleName?: string;
  spouseNameExtension?: string;
  spouseOccupation?: string;
  spouseEmployer?: string;
  spouseBusinessAddress?: string;
  spouseTelephoneNo?: string;
  fatherSurname?: string;
  fatherFirstName?: string;
  fatherMiddleName?: string;
  fatherNameExtension?: string;
  motherMaidenSurname?: string;
  motherFirstName?: string;
  motherMiddleName?: string;
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

/**
 * PDS Attachment for training or civil service entries
 * Note: Some fields are optional when using simplified attachment format in API
 */
export interface PdsAttachment {
  id: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  filePath?: string;
  fileUrl: string | null;
  trainingId?: string | null;
  civilServiceId?: string | null;
  createdAt?: Date | string;
}

/**
 * PDS Civil Service entry
 * Note: API may use canonical DB field names (eligibilityName) or display names (careerService)
 * Rating can be string, number, or null depending on source
 */
export interface PDSCivilService {
  id?: string;
  careerService?: string;
  eligibilityName?: string; // Canonical DB field name
  rating?: number | string | null;
  dateOfExamination?: string;
  dateOfExam?: string; // Canonical DB field name
  placeOfExamination?: string;
  placeOfExam?: string; // Canonical DB field name
  licenseNumber?: string;
  licenseNo?: string; // Canonical DB field name
  validity?: string;
  licenseValidityDate?: string; // Canonical DB field name
  attachments?: PdsAttachment[];
}

/**
 * PDS Work Experience entry
 * Note: API may use canonical DB field names or display names
 * MonthlySalary can be string or number depending on source
 */
export interface PDSWorkExperience {
  id?: string;
  positionTitle?: string;
  department?: string;
  departmentAgency?: string; // Canonical DB field name
  monthlySalary?: number | string;
  salaryGrade?: string;
  statusOfAppointment?: string;
  govService?: boolean;
  isGovernment?: boolean; // Canonical DB field name
  periodFrom?: string;
  dateFrom?: string; // Canonical DB field name
  periodTo?: string;
  dateTo?: string; // Canonical DB field name
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
  id?: string;
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  hours?: number;
  typeOfLd?: string;
  conductedBy?: string;
  attachments?: PdsAttachment[];
}

/**
 * PDS Other Info section
 * Note: API may use canonical DB field names (associations) or display names (organizations)
 * All fields use unknown to accept any JSONB structure from DB
 */
export interface PDSOtherInfo {
  skills?: string[] | unknown;
  recognitions?:
    | Array<{
        recognition?: string;
        date?: string;
      }>
    | unknown;
  organizations?:
    | Array<{
        organization?: string;
        role?: string;
      }>
    | unknown;
  associations?: unknown; // Canonical DB field name for organizations
  references?:
    | Array<{
        name?: string;
        address?: string;
        telephoneNo?: string;
      }>
    | unknown;
  questions?:
    | {
        // New 2025 question fields
        Q34_related_to_authority?: boolean;
        Q34_related_to_authority_details?: string;
        Q35a_admin_offense?: boolean;
        Q35a_admin_offense_details?: string;
        Q35b_criminal_charged?: boolean;
        Q35b_criminal_charged_details?: string;
        Q36_convicted_of_crime?: boolean;
        Q36_convicted_of_crime_details?: string;
        Q37_separated_from_service?: boolean;
        Q37_separated_from_service_details?: string;
        Q38a_candidate_for_election?: boolean;
        Q38a_candidate_for_election_details?: string;
        Q38b_resigned_to_campaign?: boolean;
        Q38b_resigned_to_campaign_details?: string;
        Q39_immigrant_status?: boolean;
        Q39_immigrant_status_details?: string;
        Q40a_indigenous_group?: boolean;
        Q40a_indigenous_group_details?: string;
        Q40b_disabled?: boolean;
        Q40b_disabled_details?: string;
        Q40c_solo_parent?: boolean;
        Q40c_solo_parent_details?: string;
        // Backward compat: old field names from existing submissions
        Q34_criminal_charged?: boolean;
        Q34_criminal_charged_details?: string;
        Q35_criminal_convicted?: boolean;
        Q35_criminal_convicted_details?: string;
        Q36_separated_from_service?: boolean;
        Q36_separated_from_service_details?: string;
        Q37_candidate_for_election?: boolean;
        Q37_candidate_for_election_details?: string;
        Q38_resigned_from_government?: boolean;
        Q38_resigned_from_government_details?: string;
        Q39_immigrant_or_acquired_residence?: boolean;
        Q39_immigrant_or_acquired_residence_details?: string;
        Q40_indigenous_group?: boolean;
        Q40_indigenous_group_details?: string;
        Q41_disabled?: boolean;
        Q41_disabled_details?: string;
        Q42_solo_parent?: boolean;
        Q42_solo_parent_details?: string;
      }
    | unknown;
  governmentId?:
    | {
        idType?: string;
        idNumber?: string;
        dateIssued?: string | Date;
        placeIssued?: string;
      }
    | unknown;
}

/**
 * Base types for SALN data sections
 * Note: Financial fields accept both string and number for API flexibility
 * API returns numbers (canonical), UI may display as formatted strings
 */
export interface SALNRealProperty {
  id?: string;
  description?: string;
  kind?: string;
  exactLocation?: string;
  assessedValue?: string | number;
  currentFairMarketValue?: string | number;
  marketValue?: string | number; // Alias for currentFairMarketValue
  acquisitionYear?: number;
  acquisitionMode?: string;
  acquisitionCost?: string | number;
  owner?: string;
  childName?: string | null;
}

export interface SALNPersonalProperty {
  id?: string;
  description?: string;
  yearAcquired?: number;
  acquisitionYear?: number; // Alias for yearAcquired
  acquisitionCost?: string | number;
  owner?: string;
  childName?: string | null;
}

export interface SALNLiability {
  id?: string;
  nature?: string;
  creditorName?: string;
  creditor?: string; // Alias for creditorName
  outstandingBalance?: string | number;
  amount?: string | number; // Alias for outstandingBalance
  owner?: string;
  childName?: string | null;
}

export interface SALNBusinessInterest {
  id?: string;
  entityName?: string;
  businessName?: string; // Alias for entityName
  businessAddress?: string;
  natureOfBusiness?: string;
  dateOfAcquisition?: string | Date;
  owner?: string;
  childName?: string | null;
}

export interface SALNRelativeInGov {
  id?: string;
  name?: string;
  relationship?: string;
  position?: string;
  agencyAddress?: string;
  agency?: string; // Alias for agencyAddress
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
  sortBy: z
    .enum(['submittedAt', 'reviewedAt', 'employeeName'])
    .default('submittedAt'),
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
  reason: z
    .string()
    .min(20, 'Rejection reason must be at least 20 characters')
    .max(1000),
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
 * Admin delete submission schema
 * Reason is required for compliance, audit trail, and owner notification.
 */
export const deleteSubmissionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
});

export type DeleteSubmissionData = z.infer<typeof deleteSubmissionSchema>;

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
  pdsData: {
    personalInfo: PDSPersonalInfo | null;
    familyBackground: PDSFamilyBackground | PDSFamilyBackgroundCanonical | null;
    children: PDSChild[];
    education: PDSEducation[];
    civilService: PDSCivilService[];
    workExperience: PDSWorkExperience[];
    voluntaryWork: PDSVoluntaryWork[];
    training: PDSTraining[];
    otherInfo: PDSOtherInfo | null;
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
    filingType?: string | null;
    spouseName?: string | null;
    position?: string | null;
    agency?: string | null;
    officeAddress?: string | null;
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
    middleName?: string | null;
    email: string | null;
    avatarUrl?: string | null;
    officeAddress?: string | null;
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
    spouseName?: string | null;
    realProperties: SALNRealProperty[];
    personalProperties: SALNPersonalProperty[];
    liabilities: SALNLiability[];
    businessInterests: SALNBusinessInterest[];
    relativesInGov: SALNRelativeInGov[];
    // Financial totals: API returns numbers (canonical), legacy may return strings
    totalAssets: string | number | null;
    totalLiabilities: string | number | null;
    netWorth: string | number | null;
    // 2025 SALN format fields
    complianceType?: string | null;
    complianceDate?: string | Date | null;
    hasMultipleMarriages?: boolean;
    previousSpouseNames?: string | null;
    spouseIsPublicOfficial?: boolean;
    spousePosition?: string | null;
    spouseAgency?: string | null;
    spouseOfficeAddress?: string | null;
    unmarriedChildren?: Array<{ name: string; dateOfBirth?: string; age: number }> | null;
    hasNoBusinessInterests?: boolean;
    hasNoRelativesInGov?: boolean;
    governmentIdType?: string | null;
    governmentIdNumber?: string | null;
    governmentIdDateIssued?: string | Date | null;
    governmentIdType2?: string | null;
    governmentIdNumber2?: string | null;
    governmentIdDateIssued2?: string | Date | null;
    declarantTin?: string | null;
    spouseTin?: string | null;
    spouseDateOfBirth?: string | Date | null;
    salnFormatVersion?: number;
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
