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

  // STEP 1: Validate that data object exists
  if (!data) {
    errors.push({
      field: 'data',
      message: 'PDS data object is null or undefined',
    });
    // Return early since we can't validate further
    return { isValid: false, errors, warnings };
  }

  // STEP 2: Validate that personalInfo exists
  if (!data.personalInfo) {
    errors.push({
      field: 'personalInfo',
      message: 'Personal information object is missing',
    });
    // Return early since we can't validate personal info fields
    return { isValid: false, errors, warnings };
  }

  // STEP 3: CRITICAL FIELDS (block PDF generation if missing)
  if (!data.personalInfo.surname) {
    errors.push({
      field: 'personalInfo.surname',
      message: 'Last name is required',
    });
  }

  if (!data.personalInfo.firstName) {
    errors.push({
      field: 'personalInfo.firstName',
      message: 'First name is required',
    });
  }

  if (!data.personalInfo.dateOfBirth) {
    errors.push({
      field: 'personalInfo.dateOfBirth',
      message: 'Date of birth is required',
    });
  }

  if (!data.personalInfo.sex) {
    errors.push({
      field: 'personalInfo.sex',
      message: 'Sex is required',
    });
  }

  if (!data.personalInfo.civilStatus) {
    errors.push({
      field: 'personalInfo.civilStatus',
      message: 'Civil status is required',
    });
  }

  // STEP 4: WARNINGS (allow PDF but notify)
  if (!data.personalInfo.placeOfBirth) {
    warnings.push({
      field: 'personalInfo.placeOfBirth',
      message: 'Place of birth is recommended for complete CSC compliance',
    });
  }

  // Check for address objects (not critical but helpful)
  if (!data.personalInfo.residentialAddress || typeof data.personalInfo.residentialAddress !== 'object') {
    warnings.push({
      field: 'personalInfo.residentialAddress',
      message: 'Residential address should be provided',
    });
  }

  if (!data.personalInfo.permanentAddress || typeof data.personalInfo.permanentAddress !== 'object') {
    warnings.push({
      field: 'personalInfo.permanentAddress',
      message: 'Permanent address should be provided',
    });
  }

  // STEP 5: Validate nested structures exist (not their contents)
  if (!data.familyBackground) {
    warnings.push({
      field: 'familyBackground',
      message: 'Family background information is missing',
    });
  }

  if (!data.education) {
    warnings.push({
      field: 'education',
      message: 'Education information is missing',
    });
  }

  if (!data.questions) {
    warnings.push({
      field: 'questions',
      message: 'Questions section is missing',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
