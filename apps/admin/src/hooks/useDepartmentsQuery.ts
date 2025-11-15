'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Department data from API
 */
export interface Department {
  id: string;
  name: string;
  code: string;
}

/**
 * React Query hook for fetching departments list
 *
 * Used for populating department filter dropdowns across the admin portal.
 * Departments rarely change, so we cache for 10 minutes.
 *
 * @returns Query result with departments array
 *
 * @example
 * ```tsx
 * const { data: departments, isLoading } = useDepartmentsQuery();
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <Select>
 *     {departments?.map(dept => (
 *       <SelectItem key={dept.id} value={dept.id}>
 *         {dept.name}
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useDepartmentsQuery() {
  return useQuery<Department[], Error>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await fetch('/api/departments');

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch departments: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.departments || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - departments rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
