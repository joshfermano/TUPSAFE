/**
 * PDS Validation Utilities
 * Provides validation functions for PDS submission data
 */

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
}

export interface PersonalInfoData {
  surname?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  sex?: string | null;
  civilStatus?: string | null;
  citizenship?: unknown;
  residentialAddress?: unknown;
  permanentAddress?: unknown;
  mobileNo?: string | null;
  emailAddress?: string | null;
}

/**
 * Validates personal information section of PDS
 * Checks for required fields according to CSC Form 212 requirements
 */
export function validatePersonalInfo(
  personalInfo: PersonalInfoData | null | undefined
): ValidationResult {
  const missingFields: string[] = [];
  const errors: string[] = [];

  if (!personalInfo) {
    return {
      isValid: false,
      missingFields: ['personalInfo'],
      errors: ['Personal information section is required'],
    };
  }

  // Required fields per CSC Form 212
  const requiredFields: Array<{
    key: keyof PersonalInfoData;
    label: string;
  }> = [
    { key: 'surname', label: 'Surname' },
    { key: 'firstName', label: 'First Name' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'placeOfBirth', label: 'Place of Birth' },
    { key: 'sex', label: 'Sex' },
    { key: 'civilStatus', label: 'Civil Status' },
  ];

  for (const field of requiredFields) {
    const value = personalInfo[field.key];
    if (value === null || value === undefined || value === '') {
      missingFields.push(field.label);
    }
  }

  // Validate citizenship (should be present)
  if (!personalInfo.citizenship) {
    missingFields.push('Citizenship');
  }

  // Validate at least one address is present
  if (!personalInfo.residentialAddress && !personalInfo.permanentAddress) {
    missingFields.push('Address (Residential or Permanent)');
  }

  // Validate contact information
  if (!personalInfo.mobileNo && !personalInfo.emailAddress) {
    errors.push(
      'At least one contact method (mobile number or email) is required'
    );
  }

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors,
  };
}

/**
 * Formats validation result into a user-friendly error message
 */
export function formatValidationError(
  result: ValidationResult,
  sectionName: string = 'data'
): string {
  const messages: string[] = [];

  if (result.missingFields.length > 0) {
    messages.push(
      `Missing required fields in ${sectionName}: ${result.missingFields.join(
        ', '
      )}`
    );
  }

  if (result.errors.length > 0) {
    messages.push(...result.errors);
  }

  return messages.join('. ');
}
