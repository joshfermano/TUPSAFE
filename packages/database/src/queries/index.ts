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
export * from './sessions';

// Export SALN queries with specific named exports to avoid conflicts
export {
  getSALNSubmissions,
  getSALNSubmissionById,
  getSALNByYear,
  getActiveDraft as getActiveSALNDraft,
  getEditableSALNForYear,
  createSALNSubmission,
  updateSALNSubmission,
  updateSALNCompletion,
  calculateSALNTotals,
  deleteSALNSubmission,
  deleteSALNSubmissionAsAdmin,
  submitSALNForApproval,
  approveSALN,
  rejectSALN,
  archiveSALNSubmission,
  getArchivedSALN,
  getSALNStatistics,
  compareSALNYears,
  // 2025 SALN Format helper functions
  filterByOwner,
  groupByOwner,
  calculateTotalsByOwner,
  getChildItems,
  is2025Format,
  getComplianceTypeLabel,
  getOwnerLabel,
} from './saln';

// Export PDS queries with specific named exports to avoid conflicts
export {
  getPDSSubmissions,
  getPDSSubmissionById,
  getActiveDraft as getActivePDSDraft,
  getLatestPDSSubmission,
  createPDSSubmission,
  updatePDSSubmission,
  updatePDSCompletion,
  submitPDSForApproval,
  approvePDS,
  rejectPDS,
  archivePDSSubmission,
  getArchivedPDS,
  deletePDSSubmission,
  deletePDSSubmissionAsAdmin,
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
  DependencyEmployee,
  DependencyPosition,
  DependencyChildDepartment,
  DepartmentDependencies,
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

// 2025 SALN Format types - re-exported from saln.ts (which imports from types.ts)
// Note: These are also available directly from '@tupsafe/database' via types.ts
export type { PropertyOwner, ComplianceType, UnmarriedChild } from './saln';
export type {
  CompletePDSSubmission,
  CreatePDSData,
  UpdatePDSData,
  PDSFilterOptions,
  PDSStatistics,
  PdsAttachmentData,
  PdsAttachmentsMap,
} from './pds';
