'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  paginationParams: {
    page: number;
    limit: number;
  };
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetPagination: () => void;
}

/**
 * Custom hook for URL-based pagination state management
 *
 * Manages pagination state through URL query parameters, enabling:
 * - Direct URL sharing with pagination state
 * - Browser back/forward navigation
 * - Persistent state across page refreshes
 *
 * @param defaultPageSize - Default number of items per page (default: 20)
 * @returns Pagination state and control functions
 *
 * @example
 * ```tsx
 * function ApplicationsList() {
 *   const { page, pageSize, paginationParams, setPage, setPageSize } = usePagination();
 *   const { data } = useQuery(['applications', paginationParams], () => fetchApplications(paginationParams));
 *
 *   return (
 *     <DataTablePagination
 *       currentPage={page}
 *       pageSize={pageSize}
 *       onPageChange={setPage}
 *       onPageSizeChange={setPageSize}
 *       {...data}
 *     />
 *   );
 * }
 * ```
 */
export function usePagination(defaultPageSize: number = 20): UsePaginationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current page from URL (default: 1)
  const page = useMemo(() => {
    const pageParam = searchParams.get('page');
    const parsedPage = pageParam ? parseInt(pageParam, 10) : 1;
    return parsedPage > 0 ? parsedPage : 1;
  }, [searchParams]);

  // Parse current page size from URL (default: defaultPageSize)
  const pageSize = useMemo(() => {
    const limitParam = searchParams.get('limit');
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : defaultPageSize;
    return parsedLimit > 0 ? parsedLimit : defaultPageSize;
  }, [searchParams, defaultPageSize]);

  // Memoized pagination params for API calls
  const paginationParams = useMemo(() => ({
    page,
    limit: pageSize,
  }), [page, pageSize]);

  /**
   * Updates the current page in URL
   * Uses scroll: false for smooth navigation without page jump
   */
  const setPage = useCallback((newPage: number) => {
    if (newPage < 1) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  /**
   * Updates the page size in URL and resets to page 1
   * Resetting to page 1 prevents landing on non-existent pages
   */
  const setPageSize = useCallback((newSize: number) => {
    if (newSize < 1) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', newSize.toString());
    params.set('page', '1'); // Reset to first page when changing page size
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  /**
   * Resets pagination to initial state (page 1, default page size)
   */
  const resetPagination = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    params.delete('limit');
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  return {
    page,
    pageSize,
    paginationParams,
    setPage,
    setPageSize,
    resetPagination,
  };
}
