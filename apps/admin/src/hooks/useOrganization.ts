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
    mutationFn: ({ id, hard = false }: { id: string; hard?: boolean }) =>
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

      toast.error('Failed to delete organization', {
        description: error.message,
      });
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
