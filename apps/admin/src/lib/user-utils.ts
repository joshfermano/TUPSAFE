/**
 * User utility functions for the admin portal
 * Handles HR office detection, role mapping, and form data transformations
 */

// =============================================================================
// HR Office Detection
// =============================================================================

/**
 * Check if department code indicates HR office
 */
export function isHRCode(code: string | undefined | null): boolean {
  if (!code) return false;
  const upperCode = code.toUpperCase();
  return (
    upperCode.startsWith('HR') ||
    upperCode.includes('HUMAN RESOURCE') ||
    upperCode.includes('HUMAN-RESOURCE')
  );
}

/**
 * Check if department/college name indicates HR office
 */
export function isHRName(name: string | undefined | null): boolean {
  if (!name) return false;
  const upperName = name.toUpperCase();
  return (
    upperName.includes('HUMAN RESOURCE') ||
    upperName.includes('HR OFFICE') ||
    upperName.includes('HR DEPARTMENT') ||
    upperName.includes('PERSONNEL')
  );
}

/**
 * Check if department code or name indicates HR office
 */
export function isHROffice(code?: string | null, name?: string | null): boolean {
  return isHRCode(code) || isHRName(name);
}

// =============================================================================
// Role Mapping
// =============================================================================

export type BaseRole = 'employee' | 'hr' | 'supervisor' | 'auditor';
export type StoredRole = 'employee' | 'hr' | 'admin' | 'co_admin' | 'supervisor' | 'auditor';

/**
 * Determine the base role from stored role
 * Maps admin/co_admin to hr if in HR department, otherwise to employee
 */
export function determineBaseRole(
  role: string,
  departmentCode?: string | null,
  collegeName?: string | null
): BaseRole {
  if (['admin', 'co_admin'].includes(role)) {
    const isInHR = isHRCode(departmentCode) || isHRName(collegeName);
    return isInHR ? 'hr' : 'employee';
  }
  return role as BaseRole;
}

/**
 * Compute the stored role from base role and co-admin flag
 */
export function computeStoredRole(baseRole: BaseRole, isCoAdmin: boolean): StoredRole {
  if (isCoAdmin) return 'co_admin';
  return baseRole;
}

// =============================================================================
// Form Options
// =============================================================================

/**
 * Name suffix options (Jr., Sr., II, III, etc.)
 */
export const SUFFIX_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'Jr.', label: 'Jr.' },
  { value: 'Sr.', label: 'Sr.' },
  { value: 'II', label: 'II' },
  { value: 'III', label: 'III' },
  { value: 'IV', label: 'IV' },
] as const;

// Re-export salary grade utilities from @tupsafe/types
import { getSalaryGradeOptions as getGradeOptions } from '@tupsafe/types';
export { SALARY_GRADES_2025, formatSalaryGrade, getSalaryGradeOptions } from '@tupsafe/types';

/**
 * Salary grade options for select dropdown
 * Includes "None" option and full salary info (e.g., "SG 15 - PHP 40,208")
 */
export const SALARY_GRADE_OPTIONS = [
  { value: 'none', label: 'None' },
  ...getGradeOptions().map((opt) => ({
    value: opt.value.toString(),
    label: opt.label,
  })),
];

/**
 * Role options for primary role select
 */
export const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee', description: 'Basic employee access' },
  { value: 'hr', label: 'HR Personnel', description: 'HR department access' },
  { value: 'supervisor', label: 'Supervisor', description: 'Department-level oversight' },
  { value: 'auditor', label: 'Auditor', description: 'Read-only audit access' },
] as const;

// =============================================================================
// Type Exports
// =============================================================================

export type SuffixOption = (typeof SUFFIX_OPTIONS)[number];
export type RoleOption = (typeof ROLE_OPTIONS)[number];
