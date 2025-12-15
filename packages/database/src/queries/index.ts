/**
 * Database Queries Index
 *
 * Centralized exports for all database query functions.
 * Import from this file to access pre-built, optimized queries.
 *
 * @module queries
 */

export * from './departments';
export * from './settings';

// Export SALN queries with specific named exports to avoid conflicts
export {
  getSALNSubmissions,
  getSALNSubmissionById,
  getSALNByYear,
  getActiveDraft as getActiveSALNDraft,
  createSALNSubmission,
  updateSALNSubmission,
  calculateSALNTotals,
  deleteSALNSubmission,
  submitSALNForApproval,
  approveSALN,
  rejectSALN,
  archiveSALNSubmission,
  getArchivedSALN,
  getSALNStatistics,
  compareSALNYears,
} from './saln';

// Export PDS queries with specific named exports to avoid conflicts
export {
  getPDSSubmissions,
  getPDSSubmissionById,
  getActiveDraft as getActivePDSDraft,
  getLatestPDSSubmission,
  createPDSSubmission,
  updatePDSSubmission,
  submitPDSForApproval,
  approvePDS,
  rejectPDS,
  archivePDSSubmission,
  getArchivedPDS,
  deletePDSSubmission,
  getPDSStatistics,
} from './pds';

// Export types for convenience
export type {
  DepartmentWithChildren,
  DepartmentDetail,
  DepartmentWithStats,
  CollegeWithDepartments,
  HierarchyValidation,
  PaginationOptions,
  InactiveDepartmentOptions,
} from './departments';
export type {
  NotificationSettings,
  UIPreferences,
  PreferencesUpdate,
  BulkPreferenceUpdate,
} from './settings';
export type {
  CompleteSaln,
  CreateSalnInput,
  UpdateSalnInput,
  SalnFilterOptions,
  SalnStatistics,
  SalnComparison,
} from './saln';
export type {
  CompletePDSSubmission,
  CreatePDSData,
  UpdatePDSData,
  PDSFilterOptions,
  PDSStatistics,
} from './pds';
