/**
 * React Query Wrapper Hooks for Mock Data
 *
 * This module provides React Query-powered wrappers around the mock data hooks
 * from @tupsafe/mock-data/api. These wrappers add:
 *
 * - Automatic caching with configurable stale times
 * - Background refetching for fresh data
 * - Optimistic updates for instant UI feedback
 * - Error handling and retry logic
 * - Prefetching capabilities
 * - Query invalidation utilities
 *
 * @module hooks
 */

// Profile hooks
export {
  useProfileQuery,
  useInvalidateProfile,
  profileKeys,
} from './useProfileQuery';

// PDS hooks
export {
  usePdsQuery,
  useInvalidatePds,
  pdsKeys,
} from './usePdsQuery';

// SALN hooks
export {
  useSalnQuery,
  useInvalidateSaln,
  salnKeys,
} from './useSalnQuery';

// Dashboard hooks
export {
  useDashboardQuery,
  useInvalidateDashboard,
  useRefreshDashboard,
  dashboardKeys,
} from './useDashboardQuery';

/**
 * Query key factories
 *
 * Use these to manually interact with the query cache:
 *
 * @example
 * ```tsx
 * import { useQueryClient } from '@tanstack/react-query';
 * import { profileKeys } from '@/hooks';
 *
 * const queryClient = useQueryClient();
 *
 * // Get cached profile data
 * const cachedProfile = queryClient.getQueryData(profileKeys.user('user-123'));
 *
 * // Manually set profile data
 * queryClient.setQueryData(profileKeys.user('user-123'), newData);
 *
 * // Invalidate specific user's profile
 * queryClient.invalidateQueries({ queryKey: profileKeys.user('user-123') });
 *
 * // Invalidate all profiles
 * queryClient.invalidateQueries({ queryKey: profileKeys.all });
 * ```
 */

/**
 * Stale time configuration
 *
 * Different data types have different staleness characteristics:
 *
 * - Profile: 5 minutes (user profile data rarely changes)
 * - PDS: 3 minutes (submission data changes moderately)
 * - SALN: 3 minutes (submission data changes moderately)
 * - Dashboard: 1 minute (needs to be fresh for overview)
 *
 * These values balance:
 * - Data freshness requirements
 * - Network request reduction
 * - User experience (perceived performance)
 */

/**
 * Usage Examples
 *
 * @example Basic usage
 * ```tsx
 * import { useProfileQuery } from '@/hooks';
 *
 * function ProfilePage() {
 *   const { profile, department, isLoading, error } = useProfileQuery('user-123');
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <div>
 *       <h1>{profile?.firstName} {profile?.lastName}</h1>
 *       <p>{department?.name}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Optimistic updates
 * ```tsx
 * import { useProfileQuery } from '@/hooks';
 *
 * function EditProfileForm() {
 *   const { profile, updateProfile, isUpdating } = useProfileQuery('user-123');
 *
 *   const handleSubmit = (data: Partial<Profile>) => {
 *     // Optimistic update - UI updates immediately
 *     updateProfile(data);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 *
 * @example Prefetching for performance
 * ```tsx
 * import { useDashboardQuery } from '@/hooks';
 *
 * function Navigation() {
 *   const { prefetchRelatedData } = useDashboardQuery('user-123');
 *
 *   return (
 *     <nav>
 *       <Link
 *         href="/dashboard"
 *         onMouseEnter={() => prefetchRelatedData()}
 *       >
 *         Dashboard
 *       </Link>
 *     </nav>
 *   );
 * }
 * ```
 *
 * @example Manual cache invalidation
 * ```tsx
 * import { useInvalidateDashboard } from '@/hooks';
 *
 * function RefreshButton() {
 *   const invalidate = useInvalidateDashboard();
 *
 *   const handleRefresh = () => {
 *     // Invalidate and refetch dashboard + related data
 *     invalidate('user-123', { includeRelated: true });
 *   };
 *
 *   return <button onClick={handleRefresh}>Refresh</button>;
 * }
 * ```
 */
