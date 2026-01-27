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
export type {
  UsersFilters,
  CreateUserData,
  PasswordResetData,
} from './useUsersQuery';

// PDS Submissions Query Hook
export {
  usePdsSubmissionsQuery,
  useInvalidatePdsSubmissions,
  pdsSubmissionsKeys,
} from './usePdsSubmissionsQuery';
export type {
  PdsSubmissionsFilters,
} from './usePdsSubmissionsQuery';

// Departments Query Hook
export { useDepartmentsQuery } from './useDepartmentsQuery';
export type { Department } from './useDepartmentsQuery';

// PDS Stats Query Hook
export { usePdsStatsQuery } from './usePdsStatsQuery';

// SALN Submissions Query Hook
export {
  useSalnSubmissionsQuery,
  useInvalidateSalnSubmissions,
  salnSubmissionsKeys,
} from './useSalnSubmissionsQuery';
export type {
  SalnSubmissionsFilters,
} from './useSalnSubmissionsQuery';

// SALN Stats Query Hook
export { useSalnStatsQuery } from './useSalnStatsQuery';

// Audit Logs Query Hook
export {
  useAuditLogsQuery,
  useInvalidateAuditLogs,
  usePrefetchAuditLogs,
  auditLogsKeys,
} from './useAuditLogsQuery';
export type { AuditLogsFilters } from './useAuditLogsQuery';

// Settings - User Profile Query Hook
export {
  useUserProfileQuery,
  useInvalidateUserProfile,
  userProfileKeys,
} from './useUserProfileQuery';

// Settings - User Preferences Query Hook
export {
  useUserPreferencesQuery,
  useInvalidateUserPreferences,
  userPreferencesKeys,
} from './useUserPreferencesQuery';

// Settings - Password Change Query Hook
export { usePasswordChangeQuery } from './usePasswordChangeQuery';

// Settings - Active Sessions Query Hook
export {
  useActiveSessionsQuery,
  useInvalidateActiveSessions,
  usePrefetchActiveSessions,
  activeSessionsKeys,
} from './useActiveSessionsQuery';

// Jobs Management Query Hooks
export {
  useOpenPositions,
  useOpenPositionDetails,
  usePositionApplications,
  useApplicationDetails,
  useJobApplications,
  useInvalidateJobs,
  jobsKeys,
} from './useJobsQuery';
export type {
  OpenPositionsFilters,
  ApplicationsFilters,
  PositionApplicationsFilters,
} from './useJobsQuery';

// Deadlines Management Query Hooks
export {
  useDeadlines,
  useDeadlineById,
  useDeadlineByFormType,
  useCreateDeadline,
  useUpdateDeadline,
  useDeleteDeadline,
  useToggleDeadlineStatus,
  useInvalidateDeadlines,
  usePrefetchDeadline,
  deadlineKeys,
} from './useDeadlines';
export type {
  DeadlinesListParams,
  FormType,
} from '@/lib/api/deadlines';

// Media Query Hooks
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsSmall,
  useIsLarge,
} from './useMediaQuery';

// Organization Options Hook (for user edit form)
export {
  useOrganizationOptions,
} from './useOrganizationOptions';
export type {
  OrganizationOption,
  UseOrganizationOptionsParams,
  UseOrganizationOptionsResult,
} from './useOrganizationOptions';
