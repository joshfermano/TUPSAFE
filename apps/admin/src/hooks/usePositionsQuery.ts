'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Position data from API
 */
export interface Position {
  id: string;
  title: string;
  departmentId: string | null;
}

/**
 * React Query hook for fetching positions list
 *
 * Used for populating position filter dropdowns across the admin portal.
 * Positions rarely change, so we cache for 10 minutes.
 *
 * @returns Query result with positions array
 *
 * @example
 * ```tsx
 * const { data: positions, isLoading } = usePositionsQuery();
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <Select>
 *     {positions?.map(position => (
 *       <SelectItem key={position.id} value={position.id}>
 *         {position.title}
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function usePositionsQuery() {
  return useQuery<Position[], Error>({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await fetch('/api/positions');

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch positions: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.positions || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - positions rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
