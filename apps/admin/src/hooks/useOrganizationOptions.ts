/**
 * useOrganizationOptions Hook
 *
 * Provides filtered organization options for the edit user form:
 * - College/Office options
 * - Department options (filtered by selected college)
 * - HR office detection flags
 * - Handles offices without sub-departments
 *
 * @module hooks/useOrganizationOptions
 */

'use client';

import { useMemo } from 'react';
import { useOrganizations } from './useOrganization';
import { isHROffice } from '@/lib/user-utils';
import type { OrganizationListResponse } from '@tupsafe/types';

/**
 * Option type for select components
 */
export interface OrganizationOption {
  /** Option value (ID or 'none') */
  value: string;
  /** Display label */
  label: string;
  /** Whether this is an HR office */
  isHR?: boolean;
  /** Whether this organization is active */
  isActive?: boolean;
  /** Whether this is the current user's assignment */
  isCurrent?: boolean;
}

/**
 * Parameters for the useOrganizationOptions hook
 */
export interface UseOrganizationOptionsParams {
  /** Currently selected college/office ID */
  selectedCollegeId: string | undefined;
  /** Currently selected department ID */
  selectedDepartmentId: string | undefined;
  /**
   * Whether the currently-selected role requires an HR-prefixed department
   * (true for `hr` and `admin`). When true and the selected college is not an
   * HR office, department options are filtered to HR departments only.
   */
  requiresHRDepartment: boolean;
  /** Current user's department ID (for ensuring it's in options) */
  currentUserDepartmentId?: string | null;
  /** Current user's department details */
  currentUserDepartment?: {
    id: string;
    name: string;
    code: string;
    parentCollegeId?: string | null;
    isActive?: boolean;
  } | null;
}

/**
 * Result of the useOrganizationOptions hook
 */
export interface UseOrganizationOptionsResult {
  /** Raw organizations data */
  organizationsData: OrganizationListResponse | undefined;
  /** Loading state */
  isLoading: boolean;

  /** College/Office options for select */
  collegeOptions: OrganizationOption[];
  /** Department options for select (filtered by college) */
  departmentOptions: OrganizationOption[];

  /** Whether the selected college/office is an HR office */
  selectedCollegeIsHR: boolean;
  /** Whether the selected department is an HR department */
  selectedDepartmentIsHR: boolean;
  /** Whether the selected college has no sub-departments */
  selectedCollegeHasNoDepartments: boolean;
  /** Whether the selected college is an administrative office (not academic) */
  selectedUnitIsOffice: boolean;
  /** Whether user is assigned to any HR unit (college OR department) */
  isInHROffice: boolean;
}

/**
 * Hook to provide organization options for user edit form
 *
 * Features:
 * - Combines colleges and offices into a single list
 * - Filters departments by selected college
 * - For co-admin users in non-HR colleges, only shows HR departments
 * - Ensures current user's assignments are always in options
 * - Detects HR offices for validation
 *
 * @example
 * ```tsx
 * const {
 *   collegeOptions,
 *   departmentOptions,
 *   selectedCollegeIsHR,
 *   isInHROffice,
 * } = useOrganizationOptions({
 *   selectedCollegeId: watch('collegeId'),
 *   selectedDepartmentId: watch('departmentId'),
 *   requiresHRDepartment: watch('role') === 'hr' || watch('role') === 'admin',
 *   currentUserDepartmentId: user?.departmentId,
 *   currentUserDepartment: user?.department,
 * });
 * ```
 */
export function useOrganizationOptions({
  selectedCollegeId,
  selectedDepartmentId,
  requiresHRDepartment,
  currentUserDepartmentId,
  currentUserDepartment,
}: UseOrganizationOptionsParams): UseOrganizationOptionsResult {
  // Fetch all organizations including inactive ones (for current user's assignments)
  const { data: organizationsData, isLoading } = useOrganizations({
    type: 'all',
    includeInactive: true,
  });

  // ============================================================================
  // College/Office Options
  // ============================================================================

  const collegeOptions = useMemo((): OrganizationOption[] => {
    if (!organizationsData) return [{ value: 'none', label: 'None' }];

    // Combine colleges (academic) and offices (administrative)
    const allUnits = [...organizationsData.colleges, ...organizationsData.offices];

    const options: OrganizationOption[] = allUnits.map((unit) => ({
      value: unit.id,
      label: `${unit.name} (${unit.code})${!unit.isActive ? ' [Inactive]' : ''}`,
      isHR: isHROffice(unit.code, unit.name),
      isActive: unit.isActive,
    }));

    // Ensure current user's parent college is in options
    if (currentUserDepartment?.parentCollegeId) {
      const exists = options.some(
        (o) => o.value === currentUserDepartment.parentCollegeId
      );
      if (!exists) {
        // Find the parent college from all units
        const parentCollege = allUnits.find(
          (u) => u.id === currentUserDepartment.parentCollegeId
        );
        if (parentCollege) {
          options.unshift({
            value: parentCollege.id,
            label: `${parentCollege.name} (${parentCollege.code}) [Current]`,
            isHR: isHROffice(parentCollege.code, parentCollege.name),
            isActive: parentCollege.isActive,
            isCurrent: true,
          });
        }
      }
    }

    // Sort by name, putting current first if exists
    options.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return a.label.localeCompare(b.label);
    });

    return [{ value: 'none', label: 'None' }, ...options];
  }, [organizationsData, currentUserDepartment?.parentCollegeId]);

  // ============================================================================
  // Selected College Flags
  // ============================================================================

  /** Check if selected college/office is an HR office */
  const selectedCollegeIsHR = useMemo(() => {
    if (!selectedCollegeId || selectedCollegeId === 'none') return false;
    const college = collegeOptions.find((c) => c.value === selectedCollegeId);
    return college?.isHR ?? false;
  }, [selectedCollegeId, collegeOptions]);

  /** Check if selected unit is an administrative office (not a college) */
  const selectedUnitIsOffice = useMemo(() => {
    if (!selectedCollegeId || selectedCollegeId === 'none' || !organizationsData)
      return false;
    // Check if the selected ID is in the offices list (administrative type)
    return organizationsData.offices.some((o) => o.id === selectedCollegeId);
  }, [selectedCollegeId, organizationsData]);

  // ============================================================================
  // Department Options
  // ============================================================================

  const departmentOptions = useMemo((): OrganizationOption[] => {
    if (!organizationsData) return [{ value: 'none', label: 'None' }];

    const allDepartments = organizationsData.departments;

    // Start with all departments or filter by selected college
    let filteredDepartments =
      selectedCollegeId && selectedCollegeId !== 'none'
        ? allDepartments.filter((d) => d.parentCollegeId === selectedCollegeId)
        : allDepartments;

    // If the selected role requires HR (hr/admin) AND the selected college is
    // NOT an HR office, filter to only HR departments.
    if (requiresHRDepartment && !selectedCollegeIsHR) {
      filteredDepartments = filteredDepartments.filter((dept) =>
        isHROffice(dept.code, dept.name)
      );
    }
    // If the role requires HR AND the college IS an HR office, show all
    // departments under that HR office (no filtering needed).

    const options: OrganizationOption[] = filteredDepartments.map((dept) => ({
      value: dept.id,
      label: `${dept.name} (${dept.code})${!dept.isActive ? ' [Inactive]' : ''}`,
      isHR: isHROffice(dept.code, dept.name),
      isActive: dept.isActive,
    }));

    // Ensure current user's department is in options
    if (currentUserDepartmentId && currentUserDepartment) {
      const exists = options.some((o) => o.value === currentUserDepartmentId);
      if (!exists) {
        // Check if it exists in the full list but was filtered out
        const deptInAllDepartments = allDepartments.find(
          (d) => d.id === currentUserDepartmentId
        );

        if (deptInAllDepartments) {
          options.unshift({
            value: deptInAllDepartments.id,
            label: `${deptInAllDepartments.name} (${deptInAllDepartments.code})${!deptInAllDepartments.isActive ? ' [Inactive - Current]' : ' [Current]'}`,
            isHR: isHROffice(deptInAllDepartments.code, deptInAllDepartments.name),
            isActive: deptInAllDepartments.isActive,
            isCurrent: true,
          });
        } else {
          // Department not in organizations data, use embedded department from API
          options.unshift({
            value: currentUserDepartment.id,
            label: `${currentUserDepartment.name} (${currentUserDepartment.code})${!currentUserDepartment.isActive ? ' [Inactive - Current]' : ' [Current]'}`,
            isHR: isHROffice(currentUserDepartment.code, currentUserDepartment.name),
            isActive: currentUserDepartment.isActive,
            isCurrent: true,
          });
        }
      }
    }

    // Sort by name, putting current first if exists
    options.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return a.label.localeCompare(b.label);
    });

    return [{ value: 'none', label: 'None' }, ...options];
  }, [
    organizationsData,
    selectedCollegeId,
    requiresHRDepartment,
    selectedCollegeIsHR,
    currentUserDepartmentId,
    currentUserDepartment,
  ]);

  // ============================================================================
  // Department Flags
  // ============================================================================

  /** Check if selected department is an HR department */
  const selectedDepartmentIsHR = useMemo(() => {
    if (!selectedDepartmentId || selectedDepartmentId === 'none') return false;
    const dept = departmentOptions.find((d) => d.value === selectedDepartmentId);
    return dept?.isHR ?? false;
  }, [selectedDepartmentId, departmentOptions]);

  /** Check if selected college has no sub-departments */
  const selectedCollegeHasNoDepartments = useMemo(() => {
    if (!selectedCollegeId || selectedCollegeId === 'none') return false;

    // If it's an office (administrative), it never requires a department
    if (selectedUnitIsOffice) return true;

    // Count departments (excluding 'none') that belong to this college
    const departmentCount = departmentOptions.filter(
      (d) => d.value !== 'none'
    ).length;

    return departmentCount === 0;
  }, [selectedCollegeId, departmentOptions, selectedUnitIsOffice]);

  /** Check if user is assigned to any HR unit (college OR department) */
  const isInHROffice = useMemo(() => {
    // Check currently selected values
    if (selectedCollegeIsHR || selectedDepartmentIsHR) return true;

    // Also check the current user's actual department assignment
    // so the HR gating applies correctly on first render.
    if (currentUserDepartment) {
      if (isHROffice(currentUserDepartment.code, currentUserDepartment.name)) {
        return true;
      }
    }

    // Check if the current department ID (from form) matches an HR department
    if (selectedDepartmentId && selectedDepartmentId !== 'none') {
      const dept = organizationsData?.departments.find(
        (d) => d.id === selectedDepartmentId
      );
      if (dept && isHROffice(dept.code, dept.name)) {
        return true;
      }
    }

    return false;
  }, [
    selectedCollegeIsHR,
    selectedDepartmentIsHR,
    currentUserDepartment,
    selectedDepartmentId,
    organizationsData,
  ]);

  // ============================================================================
  // Return Result
  // ============================================================================

  return {
    // Data
    organizationsData,
    isLoading,

    // Options
    collegeOptions,
    departmentOptions,

    // Computed flags
    selectedCollegeIsHR,
    selectedDepartmentIsHR,
    selectedCollegeHasNoDepartments,
    selectedUnitIsOffice,
    isInHROffice,
  };
}
