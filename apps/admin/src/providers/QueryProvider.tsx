'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * Query Client Configuration for TUPSAFE Admin Portal
 *
 * Performance Optimizations:
 * - 5-minute stale time: Data considered fresh for 5 minutes
 * - 10-minute cache time: Inactive data cached for 10 minutes
 * - Automatic background refetching when window regains focus
 * - Retry failed requests 3 times with exponential backoff
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,

            // Inactive queries cached for 10 minutes
            gcTime: 10 * 60 * 1000,

            // Retry failed requests
            retry: 3,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),

            // Refetch on window focus (for real-time feel)
            refetchOnWindowFocus: true,

            // Don't refetch on mount if data is fresh
            refetchOnMount: false,

            // Refetch stale data in background
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry mutations once on network error
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}
