/**
 * Email Service Types
 * Shared types for email functionality
 */

import type { ApplicationStatus } from '@tupsafe/types';

// Import OTPType from the otp module to avoid duplication
import type { OTPType } from '../otp';

// Re-export for convenience
export type { OTPType };

/**
 * Result of an email send operation
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Generic email payload for the provider
 */
export interface SendEmailPayload {
  to: string;
  toName?: string;
  from?: string;
  fromName?: string;
  subject: string;
  html: string;
}

/**
 * Email types supported by the system
 */
export type EmailType =
  | 'otp'
  | 'welcome'
  | 'rejection'
  | 'credentials'
  | 'password_reset'
  | 'application_status'
  | 'pds_status'
  | 'saln_status'
  | 'bulk_approval';

/**
 * Submission status for PDS/SALN compliance emails
 */
export type SubmissionStatus = 'approved' | 'rejected' | 'changes_requested';

/**
 * Payload for application status emails
 */
export interface ApplicationStatusEmailPayload {
  to: string;
  applicantName: string;
  applicationNumber: string;
  positionTitle: string;
  status: ApplicationStatus;
  // Interview details (required for for_interview)
  interviewDate?: Date | string;
  interviewLocation?: string;
  interviewNotes?: string;
  // Rejection details (required for rejected)
  rejectionReason?: string;
  // Hired details (required for hired)
  employeeId?: string;
  hireDate?: Date | string;
  // Notes for other statuses
  notes?: string;
}

/**
 * Payload for PDS status emails
 */
export interface PDSStatusEmailPayload {
  to: string;
  employeeName: string;
  status: SubmissionStatus;
  version: number;
  notes?: string;
}

/**
 * Payload for SALN status emails
 */
export interface SALNStatusEmailPayload {
  to: string;
  employeeName: string;
  status: SubmissionStatus;
  year: number;
  notes?: string;
}

/**
 * Payload for bulk approval summary emails
 */
export interface BulkApprovalEmailPayload {
  to: string;
  employeeName: string;
  approvals: Array<{
    type: 'pds' | 'saln';
    identifier: string; // version for PDS, year for SALN
  }>;
  notes?: string;
}
