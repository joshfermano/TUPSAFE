/**
 * PDS Validation Utilities
 *
 * Validates PDS data before PDF generation to ensure all critical fields are present.
 * Separates validation into errors (blocking) and warnings (non-blocking).
 */

import type { PDSData } from '../../components/pds/pdf/types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates PDS data before PDF generation
 * Returns validation result with errors and warnings
 *
 * @param data - The complete PDS data to validate
 * @returns ValidationResult with isValid flag, errors, and warnings
 *
 * @example
 * ```typescript
 * const validation = validatePDSForPDF(pdsData);
 * if (!validation.isValid) {
 *   throw new Error(`Cannot generate PDF: ${validation.errors.map(e => e.message).join(', ')}`);
 * }
 * ```
 */
export function validatePDSForPDF(data: PDSData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // CRITICAL FIELDS (block PDF generation if missing)
  if (!data.personalInfo?.surname) {
    errors.push({
      field: 'surname',
      message: 'Last name is required'
    });
  }

  if (!data.personalInfo?.firstName) {
    errors.push({
      field: 'firstName',
      message: 'First name is required'
    });
  }

  if (!data.personalInfo?.dateOfBirth) {
    errors.push({
      field: 'dateOfBirth',
      message: 'Date of birth is required'
    });
  }

  if (!data.personalInfo?.sex) {
    errors.push({
      field: 'sex',
      message: 'Sex is required'
    });
  }

  if (!data.personalInfo?.civilStatus) {
    errors.push({
      field: 'civilStatus',
      message: 'Civil status is required'
    });
  }

  // WARNINGS (allow PDF but notify)
  if (!data.personalInfo?.placeOfBirth) {
    warnings.push({
      field: 'placeOfBirth',
      message: 'Place of birth is recommended for complete CSC compliance'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
