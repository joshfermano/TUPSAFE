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

export type StoredRole = 'superadmin' | 'admin' | 'hr' | 'employee';

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

// =============================================================================
// Type Exports
// =============================================================================

export type SuffixOption = (typeof SUFFIX_OPTIONS)[number];
