/**
 * SALN Validation Utilities
 *
 * Validates SALN data before PDF generation to ensure completeness and correctness.
 * Separates validation into errors (blocking) and warnings (non-blocking).
 *
 * @module lib/utils/saln-validation
 */

import type { SALNData, ValidationResult } from '@/components/saln/pdf';

/**
 * Validates SALN data before PDF generation
 *
 * Performs comprehensive validation of SALN data including:
 * - Required fields (declarant info, year, filing type)
 * - Joint filing requirements (spouse info)
 * - Data consistency (net worth calculation)
 * - Completeness checks (assets, liabilities)
 * - Age validation for children
 *
 * @param data - SALN data to validate
 * @returns ValidationResult with isValid flag, errors, and warnings
 *
 * @example
 * ```typescript
 * const validation = validateSALNData(salnData);
 * if (!validation.isValid) {
 *   console.error('Validation errors:', validation.errors);
 *   // Handle errors
 * }
 * if (validation.warnings.length > 0) {
 *   console.warn('Validation warnings:', validation.warnings);
 *   // Show warnings to user
 * }
 * ```
 */
export function validateSALNData(data: SALNData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ============================================================================
  // REQUIRED FIELD VALIDATIONS (errors - block PDF generation)
  // ============================================================================

  // Declarant Information Validation
  if (!data.declarantInfo?.surname || data.declarantInfo.surname.trim() === '') {
    errors.push('Declarant surname is required');
  }

  if (!data.declarantInfo?.firstName || data.declarantInfo.firstName.trim() === '') {
    errors.push('Declarant first name is required');
  }

  // Year Validation
  if (!data.year) {
    errors.push('Year is required');
  } else if (data.year < 2000 || data.year > new Date().getFullYear() + 1) {
    errors.push(`Year must be between 2000 and ${new Date().getFullYear() + 1}`);
  }

  // Filing Type Validation
  if (!data.filingType) {
    errors.push('Filing type is required');
  } else if (!['joint', 'separate', 'not_applicable'].includes(data.filingType)) {
    errors.push('Filing type must be joint, separate, or not_applicable');
  }

  // Joint Filing Validation
  if (data.filingType === 'joint') {
    if (!data.spouseInfo?.surname || data.spouseInfo.surname.trim() === '') {
      errors.push('Spouse surname is required for joint filing');
    }
    if (!data.spouseInfo?.firstName || data.spouseInfo.firstName.trim() === '') {
      errors.push('Spouse first name is required for joint filing');
    }
  }

  // ============================================================================
  // OPTIONAL FIELD WARNINGS (warnings - allow PDF but notify)
  // ============================================================================

  // Position and Agency Warnings
  if (!data.declarantInfo?.position || data.declarantInfo.position.trim() === '') {
    warnings.push('Declarant position is not specified');
  }

  if (!data.declarantInfo?.agency || data.declarantInfo.agency.trim() === '') {
    warnings.push('Declarant agency is not specified');
  }

  // Assets Warning - Check if any assets are declared
  const hasRealProperties = data.realProperties && data.realProperties.length > 0;
  const hasPersonalProperties = data.personalProperties && data.personalProperties.length > 0;

  if (!hasRealProperties && !hasPersonalProperties) {
    warnings.push('No assets declared - SALN appears to have zero assets');
  }

  // Net Worth Validation - Check calculation accuracy
  if (
    data.totalAssets !== undefined &&
    data.totalLiabilities !== undefined &&
    data.netWorth !== undefined
  ) {
    const calculatedNetWorth = data.totalAssets - data.totalLiabilities;
    // Allow small floating-point differences (0.01)
    if (Math.abs(calculatedNetWorth - data.netWorth) > 0.01) {
      warnings.push(
        `Net worth mismatch: calculated ${calculatedNetWorth.toFixed(2)} but stored ${data.netWorth.toFixed(2)}`
      );
    }
  }

  // Children Age Validation - Only children below 18 should be included
  if (data.children && data.children.length > 0) {
    data.children.forEach((child, index) => {
      if (child.dateOfBirth) {
        const age = calculateAge(child.dateOfBirth);
        if (age >= 18) {
          warnings.push(
            `Child ${child.name} (index ${index}) is ${age} years old - should only include children below 18`
          );
        }
      }
    });
  }

  // Liabilities Warning
  if (!data.liabilities || data.liabilities.length === 0) {
    warnings.push('No liabilities declared - confirm if accurate');
  }

  // Business Interests Warning
  if (!data.businessInterests || data.businessInterests.length === 0) {
    warnings.push('No business interests declared - confirm if accurate');
  }

  // Relatives in Government Warning
  if (!data.relativesInGov || data.relativesInGov.length === 0) {
    warnings.push('No relatives in government service declared - confirm if accurate');
  }

  // ============================================================================
  // DATA CONSISTENCY CHECKS (warnings)
  // ============================================================================

  // Real Properties Validation
  if (hasRealProperties) {
    data.realProperties!.forEach((property, index) => {
      // Check if current fair market value is less than assessed value
      if (property.currentFairMarketValue < property.assessedValue) {
        warnings.push(
          `Real property ${index + 1} (${property.description}): Current fair market value is less than assessed value`
        );
      }

      // Check if acquisition year is in the future
      const currentYear = new Date().getFullYear();
      if (property.acquisitionYear > currentYear) {
        warnings.push(
          `Real property ${index + 1} (${property.description}): Acquisition year cannot be in the future`
        );
      }

      // Check if acquisition year is unreasonably old (before 1900)
      if (property.acquisitionYear < 1900) {
        warnings.push(
          `Real property ${index + 1} (${property.description}): Acquisition year seems unreasonably old`
        );
      }
    });
  }

  // Personal Properties Validation
  if (hasPersonalProperties) {
    data.personalProperties!.forEach((property, index) => {
      const currentYear = new Date().getFullYear();

      // Check if year acquired is in the future
      if (property.yearAcquired > currentYear) {
        warnings.push(
          `Personal property ${index + 1} (${property.description}): Year acquired cannot be in the future`
        );
      }

      // Check if year acquired is unreasonably old (before 1900)
      if (property.yearAcquired < 1900) {
        warnings.push(
          `Personal property ${index + 1} (${property.description}): Year acquired seems unreasonably old`
        );
      }
    });
  }

  // ============================================================================
  // RETURN VALIDATION RESULT
  // ============================================================================

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate age from date of birth
 *
 * @param dateOfBirth - Date of birth as Date object or string
 * @returns Age in years
 *
 * @example
 * ```typescript
 * const age = calculateAge('2010-05-15'); // Returns current age
 * const age = calculateAge(new Date('2010-05-15')); // Same result
 * ```
 */
function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Validate individual real property data
 *
 * @param property - Real property to validate
 * @returns Array of validation error messages
 *
 * @example
 * ```typescript
 * const errors = validateRealProperty(realPropertyData);
 * if (errors.length > 0) {
 *   console.error('Property validation errors:', errors);
 * }
 * ```
 */
export function validateRealProperty(property: {
  description?: string;
  kind?: string;
  exactLocation?: string;
  assessedValue?: number;
  currentFairMarketValue?: number;
  acquisitionYear?: number;
  acquisitionMode?: string;
  acquisitionCost?: number;
}): string[] {
  const errors: string[] = [];

  if (!property.description || property.description.trim() === '') {
    errors.push('Property description is required');
  }

  if (!property.kind) {
    errors.push('Property kind is required');
  }

  if (!property.exactLocation || property.exactLocation.trim() === '') {
    errors.push('Property exact location is required');
  }

  if (property.assessedValue === undefined || property.assessedValue < 0) {
    errors.push('Valid assessed value is required');
  }

  if (property.currentFairMarketValue === undefined || property.currentFairMarketValue < 0) {
    errors.push('Valid current fair market value is required');
  }

  if (!property.acquisitionYear) {
    errors.push('Acquisition year is required');
  }

  if (!property.acquisitionMode || property.acquisitionMode.trim() === '') {
    errors.push('Acquisition mode is required');
  }

  if (property.acquisitionCost === undefined || property.acquisitionCost < 0) {
    errors.push('Valid acquisition cost is required');
  }

  return errors;
}

/**
 * Validate individual personal property data
 *
 * @param property - Personal property to validate
 * @returns Array of validation error messages
 *
 * @example
 * ```typescript
 * const errors = validatePersonalProperty(personalPropertyData);
 * if (errors.length > 0) {
 *   console.error('Property validation errors:', errors);
 * }
 * ```
 */
export function validatePersonalProperty(property: {
  description?: string;
  yearAcquired?: number;
  acquisitionCost?: number;
}): string[] {
  const errors: string[] = [];

  if (!property.description || property.description.trim() === '') {
    errors.push('Property description is required');
  }

  if (!property.yearAcquired) {
    errors.push('Year acquired is required');
  }

  if (property.acquisitionCost === undefined || property.acquisitionCost < 0) {
    errors.push('Valid acquisition cost is required');
  }

  return errors;
}

/**
 * Validate individual liability data
 *
 * @param liability - Liability to validate
 * @returns Array of validation error messages
 *
 * @example
 * ```typescript
 * const errors = validateLiability(liabilityData);
 * if (errors.length > 0) {
 *   console.error('Liability validation errors:', errors);
 * }
 * ```
 */
export function validateLiability(liability: {
  nature?: string;
  creditorName?: string;
  outstandingBalance?: number;
}): string[] {
  const errors: string[] = [];

  if (!liability.nature || liability.nature.trim() === '') {
    errors.push('Nature of liability is required');
  }

  if (!liability.creditorName || liability.creditorName.trim() === '') {
    errors.push('Creditor name is required');
  }

  if (liability.outstandingBalance === undefined || liability.outstandingBalance < 0) {
    errors.push('Valid outstanding balance is required');
  }

  return errors;
}
