/**
 * Organization Management React Query Hooks
 *
 * Provides type-safe React Query hooks for all organization management operations.
 * Includes automatic caching, optimistic updates, and error handling.
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  OrganizationQuery,
  OrganizationListResponse,
  DepartmentWithStats,
  CollegeWithDepartments,
  CreateCollegeInput,
  CreateDepartmentInput,
  CreateOfficeInput,
  UpdateDepartmentInput,
  DepartmentDependencies,
} from '@tupsafe/types';
import {
  fetchOrganizations,
  fetchOrganizationDetail,
  fetchCollegeWithDepartments,
  fetchDepartmentsByCollege,
  createCollege,
  createDepartment,
  createOffice,
  updateOrganization,
  deleteOrganization,
  reactivateOrganization,
  fetchDepartmentDependencies,
  reassignAndDelete,
} from '@/lib/api/organization';

/**
 * Query key factory for organization-related queries
 */
export const organizationKeys = {
  all: ['organization'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (filters: Partial<OrganizationQuery>) =>
    [...organizationKeys.lists(), filters] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  colleges: () => [...organizationKeys.all, 'colleges'] as const,
  college: (id: string) => [...organizationKeys.colleges(), id] as const,
  departments: (collegeId?: string) =>
    collegeId
      ? ([...organizationKeys.all, 'departments', collegeId] as const)
      : ([...organizationKeys.all, 'departments'] as const),
  offices: () => [...organizationKeys.all, 'offices'] as const,
  dependencies: (id?: string | null) =>
    id
      ? ([...organizationKeys.details(), id, 'dependencies'] as const)
      : ([...organizationKeys.all, 'dependencies'] as const),
};

/**
 * Hook to fetch list of organizational units with filters
 */
export function useOrganizations(params: Partial<OrganizationQuery> = {}) {
  return useQuery<OrganizationListResponse, Error>({
    queryKey: organizationKeys.list(params),
    queryFn: () => fetchOrganizations(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData, // Keep previous data while fetching new
  });
}

/**
 * Hook to fetch detailed information about a specific organizational unit
 */
export function useOrganizationDetail(id: string | null) {
  return useQuery<DepartmentWithStats, Error>({
    queryKey: organizationKeys.detail(id || ''),
    queryFn: () => fetchOrganizationDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch college with nested departments
 */
export function useCollegeWithDepartments(collegeId: string | null) {
  return useQuery<CollegeWithDepartments, Error>({
    queryKey: organizationKeys.college(collegeId || ''),
    queryFn: () => fetchCollegeWithDepartments(collegeId!),
    enabled: !!collegeId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch departments under a specific college
 */
export function useDepartmentsByCollege(collegeId: string | null) {
  return useQuery<DepartmentWithStats[], Error>({
    queryKey: organizationKeys.departments(collegeId || undefined),
    queryFn: () => fetchDepartmentsByCollege(collegeId!),
    enabled: !!collegeId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to create a new college
 */
export function useCreateCollege() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCollegeInput) => createCollege(data),
    onMutate: async (newCollege) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.lists() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<OrganizationListResponse>(
        organizationKeys.lists()
      );

      // Optimistically update with temporary ID
      if (previousData) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              colleges: [
                ...old.colleges,
                {
                  id: `temp-${Date.now()}`,
                  name: newCollege.name,
                  code: newCollege.code,
                  officeType: 'academic' as const,
                  parentId: null,
                  parentCollegeId: null,
                  isActive: true,
                  createdAt: new Date(),
                  employeeCount: 0,
                  positionCount: 0,
                  childDepartmentCount: 0,
                } as DepartmentWithStats,
              ],
              total: old.total + 1,
            };
          }
        );
      }

      return { previousData };
    },
    onError: (error, _newCollege, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          context.previousData
        );
      }

      toast.error('Failed to create college', {
        description: error.message,
      });
    },
    onSuccess: (newCollege) => {
      // Invalidate all organization queries to refetch with real data
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.colleges() });

      toast.success('College created successfully', {
        description: `${newCollege.name} (${newCollege.code}) has been added.`,
      });
    },
  });
}

/**
 * Hook to create a new department
 */
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentInput) => createDepartment(data),
    onMutate: async (newDepartment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.lists() });
      await queryClient.cancelQueries({
        queryKey: organizationKeys.departments(newDepartment.parentCollegeId),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<OrganizationListResponse>(
        organizationKeys.lists()
      );

      // Optimistically update with temporary ID
      if (previousData) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              departments: [
                ...old.departments,
                {
                  id: `temp-${Date.now()}`,
                  name: newDepartment.name,
                  code: newDepartment.code,
                  officeType: 'academic' as const,
                  parentId: null,
                  parentCollegeId: newDepartment.parentCollegeId,
                  isActive: true,
                  createdAt: new Date(),
                  employeeCount: 0,
                  positionCount: 0,
                  childDepartmentCount: 0,
                } as DepartmentWithStats,
              ],
              total: old.total + 1,
            };
          }
        );
      }

      return { previousData };
    },
    onError: (error, _newDepartment, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          context.previousData
        );
      }

      toast.error('Failed to create department', {
        description: error.message,
      });
    },
    onSuccess: (newDepartment) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.departments(newDepartment.parentCollegeId || undefined),
      });

      // Invalidate parent college detail if it has parentCollegeId
      if (newDepartment.parentCollegeId) {
        queryClient.invalidateQueries({
          queryKey: organizationKeys.detail(newDepartment.parentCollegeId),
        });
        queryClient.invalidateQueries({
          queryKey: organizationKeys.college(newDepartment.parentCollegeId),
        });
      }

      toast.success('Department created successfully', {
        description: `${newDepartment.name} (${newDepartment.code}) has been added.`,
      });
    },
  });
}

/**
 * Hook to create a new office
 */
export function useCreateOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOfficeInput) => createOffice(data),
    onMutate: async (newOffice) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.lists() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<OrganizationListResponse>(
        organizationKeys.lists()
      );

      // Optimistically update with temporary ID
      if (previousData) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              offices: [
                ...old.offices,
                {
                  id: `temp-${Date.now()}`,
                  name: newOffice.name,
                  code: newOffice.code,
                  officeType: 'administrative' as const,
                  parentId: null,
                  parentCollegeId: null,
                  isActive: true,
                  createdAt: new Date(),
                  employeeCount: 0,
                  positionCount: 0,
                  childDepartmentCount: 0,
                } as DepartmentWithStats,
              ],
              total: old.total + 1,
            };
          }
        );
      }

      return { previousData };
    },
    onError: (error, _newOffice, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          context.previousData
        );
      }

      toast.error('Failed to create office', {
        description: error.message,
      });
    },
    onSuccess: (newOffice) => {
      // Invalidate all organization queries
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.offices() });

      toast.success('Office created successfully', {
        description: `${newOffice.name} (${newOffice.code}) has been added.`,
      });
    },
  });
}

/**
 * Hook to update an organizational unit
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentInput }) =>
      updateOrganization(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.details() });
      await queryClient.cancelQueries({ queryKey: organizationKeys.lists() });

      // Snapshot previous value
      const previousDetail = queryClient.getQueryData<DepartmentWithStats>(
        organizationKeys.detail(id)
      );

      // Optimistically update detail cache
      if (previousDetail) {
        queryClient.setQueryData<DepartmentWithStats>(
          organizationKeys.detail(id),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              ...data,
              updatedAt: new Date(),
            };
          }
        );
      }

      return { previousDetail };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(
          organizationKeys.detail(id),
          context.previousDetail
        );
      }

      toast.error('Failed to update organization', {
        description: error.message,
      });
    },
    onSuccess: (updatedOrg, { id }) => {
      // Update detail cache with real data
      queryClient.setQueryData(organizationKeys.detail(id), updatedOrg);

      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });

      // Invalidate related queries based on officeType and structure
      if (updatedOrg.officeType === 'academic' && !updatedOrg.parentCollegeId) {
        // College
        queryClient.invalidateQueries({ queryKey: organizationKeys.colleges() });
        queryClient.invalidateQueries({ queryKey: organizationKeys.college(id) });
      } else if (updatedOrg.officeType === 'academic' && updatedOrg.parentCollegeId) {
        // Department
        queryClient.invalidateQueries({
          queryKey: organizationKeys.departments(updatedOrg.parentCollegeId || undefined),
        });
      } else if (updatedOrg.officeType === 'administrative') {
        // Office
        queryClient.invalidateQueries({ queryKey: organizationKeys.offices() });
      }

      toast.success('Organization updated successfully', {
        description: `${updatedOrg.name} (${updatedOrg.code}) has been updated.`,
      });
    },
  });
}

/**
 * Hook to delete an organizational unit (soft or hard delete)
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hard = true }: { id: string; hard?: boolean }) =>
      deleteOrganization(id, hard),
    onMutate: async ({ id, hard }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.lists() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<OrganizationListResponse>(
        organizationKeys.lists()
      );

      // Optimistically update based on delete type
      if (previousData && !hard) {
        // For soft delete, mark as inactive
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          (old) => {
            if (!old) return old;

            const updateInactiveStatus = (
              items: DepartmentWithStats[]
            ): DepartmentWithStats[] =>
              items.map((item) =>
                item.id === id ? { ...item, isActive: false } : item
              );

            return {
              ...old,
              colleges: updateInactiveStatus(old.colleges),
              departments: updateInactiveStatus(old.departments),
              offices: updateInactiveStatus(old.offices),
            };
          }
        );
      }

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          context.previousData
        );
      }

      // Enhanced error handling
      const errorMessage = error.message;
      
      if (errorMessage.includes('already inactive')) {
        toast.error('Organization is already inactive', {
          description: 'Click "Delete" again to see the reactivate option.',
        });
      } else {
        toast.error('Failed to delete organization', {
          description: errorMessage,
        });
      }
    },
    onSuccess: (_, { hard }) => {
      // Invalidate all organization queries
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });

      const action = hard ? 'permanently deleted' : 'deactivated';
      toast.success(`Organization ${action}`, {
        description: hard
          ? 'The organizational unit has been permanently removed.'
          : 'The organizational unit has been deactivated and hidden.',
      });
    },
  });
}

/**
 * Hook to bulk delete multiple organizational units (soft delete)
 */
export function useBulkDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Process deletes in parallel
      const results = await Promise.allSettled(
        ids.map((id) => deleteOrganization(id, false))
      );

      // Separate successes and failures
      const successes = results.filter(
        (result) => result.status === 'fulfilled'
      );
      const failures = results.filter(
        (result) => result.status === 'rejected'
      );

      // Return detailed results
      return {
        successCount: successes.length,
        failureCount: failures.length,
        total: ids.length,
        failures: failures.map((f) => ({
          error: f.reason instanceof Error ? f.reason.message : String(f.reason),
        })),
      };
    },
    onMutate: async (ids) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.lists() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<OrganizationListResponse>(
        organizationKeys.lists()
      );

      // Optimistically mark items as inactive
      if (previousData) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          (old) => {
            if (!old) return old;

            const markInactive = (
              items: DepartmentWithStats[]
            ): DepartmentWithStats[] =>
              items.map((item) =>
                ids.includes(item.id) ? { ...item, isActive: false } : item
              );

            return {
              ...old,
              colleges: markInactive(old.colleges),
              departments: markInactive(old.departments),
              offices: markInactive(old.offices),
            };
          }
        );
      }

      return { previousData };
    },
    onError: (error, _ids, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          context.previousData
        );
      }

      toast.error('Bulk delete failed', {
        description: error.message,
      });
    },
    onSuccess: (result) => {
      // Invalidate all organization queries
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });

      // Show appropriate message based on results
      if (result.failureCount === 0) {
        // All succeeded
        toast.success(`${result.successCount} organization(s) deleted`, {
          description: 'The selected units have been deactivated.',
        });
      } else if (result.successCount === 0) {
        // All failed - show specific error for single deletion
        if (result.total === 1 && result.failures.length > 0) {
          const specificError = result.failures[0].error;
          toast.error('Failed to delete organization', {
            description: specificError || 'An error occurred while deleting the organization.',
          });
        } else {
          toast.error('Bulk delete failed', {
            description: `Could not delete any of the ${result.total} selected item(s). ${result.failures.length > 0 ? result.failures[0].error : 'Some units may have active employees or positions.'}`,
          });
        }
      } else {
        // Partial success - show which failed
        const failedReasons = result.failures.slice(0, 2).map(f => f.error).join('; ');
        toast.warning('Partial success', {
          description: `Deleted ${result.successCount} of ${result.total} unit(s). ${result.failureCount} failed: ${failedReasons}${result.failures.length > 2 ? '...' : ''}`,
        });
      }
    },
  });
}

/**
 * Hook to reactivate a soft-deleted organizational unit
 */
export function useReactivateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reactivateOrganization(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: organizationKeys.details() });

      // Snapshot previous values
      const previousList = queryClient.getQueryData<OrganizationListResponse>(
        organizationKeys.lists()
      );
      const previousDetail = queryClient.getQueryData<DepartmentWithStats>(
        organizationKeys.detail(id)
      );

      // Optimistically update to active
      if (previousList) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          (old) => {
            if (!old) return old;

            const reactivateItem = (
              items: DepartmentWithStats[]
            ): DepartmentWithStats[] =>
              items.map((item) =>
                item.id === id ? { ...item, isActive: true } : item
              );

            return {
              ...old,
              colleges: reactivateItem(old.colleges),
              departments: reactivateItem(old.departments),
              offices: reactivateItem(old.offices),
            };
          }
        );
      }

      if (previousDetail) {
        queryClient.setQueryData<DepartmentWithStats>(
          organizationKeys.detail(id),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              isActive: true,
            };
          }
        );
      }

      return { previousList, previousDetail };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousList) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          context.previousList
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          organizationKeys.detail(id),
          context.previousDetail
        );
      }

      toast.error('Failed to reactivate organization', {
        description: error.message,
      });
    },
    onSuccess: (reactivatedOrg, id) => {
      // Update with real data
      queryClient.setQueryData(organizationKeys.detail(id), reactivatedOrg);

      // Invalidate all organization queries
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });

      toast.success('Organization reactivated', {
        description: `${reactivatedOrg.name} (${reactivatedOrg.code}) is now active.`,
      });
    },
  });
}

/**
 * Hook to fetch dependencies for a department
 *
 * Fetches employees, positions, and child departments that are blocking
 * department deletion. Also provides flags indicating if soft delete
 * or hard delete are possible.
 *
 * @param id - Department ID to fetch dependencies for
 * @returns Query result with dependency information
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDepartmentDependencies(deptId);
 *
 * if (data?.canSoftDelete) {
 *   // Show soft delete option
 * } else {
 *   // Show reassignment option
 *   console.log('Blocking reasons:', data?.blockingReasons);
 * }
 * ```
 */
export function useDepartmentDependencies(id: string | null) {
  return useQuery<DepartmentDependencies, Error>({
    queryKey: organizationKeys.dependencies(id),
    queryFn: () => fetchDepartmentDependencies(id!),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute - dependencies change frequently
  });
}

/**
 * Hook to reassign employees and positions to another department, then delete
 *
 * This mutation performs a transactional reassignment and deletion operation.
 * All employees and/or positions are moved to the target department before
 * the source department is deleted.
 *
 * @returns Mutation result with reassignment statistics
 *
 * @example
 * ```tsx
 * const reassign = useReassignAndDelete();
 *
 * await reassign.mutateAsync({
 *   id: sourceDeptId,
 *   targetDeptId: targetDeptId,
 *   options: {
 *     reassignEmployees: true,
 *     reassignPositions: true
 *   }
 * });
 * ```
 */
export function useReassignAndDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      targetDeptId,
      options,
    }: {
      id: string;
      targetDeptId: string;
      options?: {
        reassignEmployees?: boolean;
        reassignPositions?: boolean;
      };
    }) =>
      reassignAndDelete(id, {
        targetDepartmentId: targetDeptId,
        reassignEmployees: options?.reassignEmployees ?? true,
        reassignPositions: options?.reassignPositions ?? true,
      }),
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKeys.lists() });
      await queryClient.cancelQueries({ queryKey: organizationKeys.details() });

      // Snapshot previous values
      const previousList = queryClient.getQueryData<OrganizationListResponse>(
        organizationKeys.lists()
      );

      // Optimistically mark source as inactive
      if (previousList) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          (old) => {
            if (!old) return old;

            const markInactive = (
              items: DepartmentWithStats[]
            ): DepartmentWithStats[] =>
              items.map((item) =>
                item.id === id ? { ...item, isActive: false } : item
              );

            return {
              ...old,
              colleges: markInactive(old.colleges),
              departments: markInactive(old.departments),
              offices: markInactive(old.offices),
            };
          }
        );
      }

      return { previousList };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousList) {
        queryClient.setQueriesData<OrganizationListResponse>(
          { queryKey: organizationKeys.lists() },
          context.previousList
        );
      }

      toast.error('Failed to reassign and delete', {
        description: error.message,
      });
    },
    onSuccess: (result, { id, targetDeptId }) => {
      // Invalidate all organization queries to refetch with new data
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });

      // Invalidate target department to refresh employee/position counts
      queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(targetDeptId),
      });

      // Invalidate dependencies for the deleted department
      queryClient.invalidateQueries({
        queryKey: organizationKeys.dependencies(id),
      });

      const { employeesReassigned, positionsReassigned } = result;

      // Build success message
      const parts: string[] = [];
      if (employeesReassigned > 0) {
        parts.push(`${employeesReassigned} employee${employeesReassigned !== 1 ? 's' : ''}`);
      }
      if (positionsReassigned > 0) {
        parts.push(`${positionsReassigned} position${positionsReassigned !== 1 ? 's' : ''}`);
      }

      const reassignedText =
        parts.length > 0 ? `Reassigned ${parts.join(' and ')}.` : '';

      toast.success('Department deleted successfully', {
        description: reassignedText || 'The department has been removed.',
      });
    },
  });
}

/**
 * Hook to get eligible target departments for reassignment
 *
 * Fetches all active departments excluding the source department.
 * Used to populate the target department selector when reassigning.
 *
 * @param id - Source department ID to exclude from results
 * @returns Query result with eligible target departments
 *
 * @example
 * ```tsx
 * const { data: targets } = useReassignmentTargets(sourceDeptId);
 *
 * <Select>
 *   {targets?.map(dept => (
 *     <SelectItem key={dept.id} value={dept.id}>
 *       {dept.name} ({dept.code})
 *     </SelectItem>
 *   ))}
 * </Select>
 * ```
 */
export function useReassignmentTargets(id: string | null) {
  return useQuery<DepartmentWithStats[], Error>({
    queryKey: organizationKeys.list({
      type: 'all',
      includeInactive: false,
    }),
    queryFn: async () => {
      const result = await fetchOrganizations({
        type: 'all',
        includeInactive: false,
      });

      // Flatten all departments and filter out the source department
      const allDepts = [
        ...result.colleges,
        ...result.departments,
        ...result.offices,
      ];

      return allDepts.filter((dept) => dept.id !== id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes - organizational structure changes slowly
  });
}
