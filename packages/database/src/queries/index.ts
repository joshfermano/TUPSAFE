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
export * from './saln';
export * from './pds';

// Export types for convenience
export type {
  DepartmentWithChildren,
  DepartmentDetail,
  PaginationOptions,
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
