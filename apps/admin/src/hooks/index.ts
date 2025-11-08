/**
 * Admin Portal React Query Hooks
 *
 * Barrel export file for all admin-specific React Query hooks.
 * These hooks wrap the mock-data package with React Query for caching, optimistic updates,
 * and automatic refetching.
 */

// Dashboard Query Hook
export {
  useDashboardQuery,
  useInvalidateDashboard,
  useRefreshDashboard,
  dashboardKeys,
} from './useDashboardQuery';
export type { DashboardStats } from './useDashboardQuery';

// Users Query Hook
export {
  useUsersQuery,
  useInvalidateUsers,
  usersKeys,
} from './useUsersQuery';
export type { UsersFilters, UserWithDetails } from './useUsersQuery';

// PDS Submissions Query Hook
export {
  usePdsSubmissionsQuery,
  useInvalidatePdsSubmissions,
  pdsSubmissionsKeys,
} from './usePdsSubmissionsQuery';
export type {
  PdsSubmissionsFilters,
  PdsSubmissionWithDetails,
} from './usePdsSubmissionsQuery';

// SALN Submissions Query Hook
export {
  useSalnSubmissionsQuery,
  useInvalidateSalnSubmissions,
  salnSubmissionsKeys,
} from './useSalnSubmissionsQuery';
export type {
  SalnSubmissionsFilters,
  SalnSubmissionWithDetails,
} from './useSalnSubmissionsQuery';

// Audit Logs Query Hook
export {
  useAuditLogsQuery,
  useInvalidateAuditLogs,
  usePrefetchAuditLogs,
  auditLogsKeys,
} from './useAuditLogsQuery';
export type { AuditLogsFilters, AuditLogsResult } from './useAuditLogsQuery';
