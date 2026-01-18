/**
 * Type definitions for TUPSAFE Report PDF Generation
 * Used for generating compliance, user, registration, and submission reports
 */

/**
 * Report type enumeration
 */
export type ReportType = 'users' | 'registrations' | 'submissions' | 'compliance';

/**
 * Report metadata containing date ranges and filters
 */
export interface ReportMetadata {
  startDate: Date;
  endDate: Date;
  departmentName?: string;
  collegeName?: string;
  generatedAt: Date;
  generatedBy?: string;
  reportTitle: string;
}

/**
 * Main report data structure
 */
export interface ReportData {
  reportType: ReportType;
  headers: string[];
  data: Record<string, string | number>[];
  metadata: ReportMetadata;
}

/**
 * Props for ReportDocument component
 */
export interface ReportDocumentProps {
  data: ReportData;
}

/**
 * Props for ReportHeader component
 */
export interface ReportHeaderProps {
  metadata: ReportMetadata;
}

/**
 * Props for ReportTable component
 */
export interface ReportTableProps {
  headers: string[];
  data: Record<string, string | number>[];
  rowsPerPage?: number;
}

/**
 * Props for ReportFooter component
 */
export interface ReportFooterProps {
  pageNumber: number;
  totalPages: number;
}
