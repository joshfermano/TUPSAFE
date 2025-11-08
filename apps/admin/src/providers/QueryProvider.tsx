'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

/**
 * QueryProvider Component
 *
 * Provides React Query (TanStack Query) functionality for the TUPSAFE admin portal.
 * Handles data fetching, caching, and synchronization with optimized defaults.
 *
 * Configuration:
 * - Stale time: 5 minutes (data considered fresh)
 * - Garbage collection: 10 minutes (unused data kept in cache)
 * - Refetch on window focus: Enabled (ensures fresh data)
 * - Retry: 2 attempts on failure
 * - Refetch on mount: Disabled (reduces server load)
 *
 * Features:
 * - Automatic background refetching
 * - Optimistic updates support
 * - React Query DevTools in development mode
 * - Type-safe query/mutation patterns
 *
 * Usage:
 * - Wrap the root layout with this provider
 * - Use useQuery/useMutation hooks throughout the admin app
 *
 * @example
 * ```tsx
 * import { useQuery } from '@tanstack/react-query';
 *
 * function SubmissionsPage() {
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['submissions'],
 *     queryFn: fetchSubmissions,
 *   });
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   return <SubmissionsTable data={data} />;
 * }
 * ```
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // Create a client with optimized defaults for admin portal
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Refetch on window focus (useful for admin dashboard monitoring)
            refetchOnWindowFocus: true,
            // Retry failed requests twice (more resilient for admin operations)
            retry: 2,
            // Disable automatic background refetching to reduce load
            refetchOnMount: false,
            // Refetch when reconnecting to network
            refetchOnReconnect: 'always',
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
