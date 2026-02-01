/**
 * PDS Data Transformation Utilities
 *
 * Comprehensive transformations for PDS data across different formats:
 * 1. Frontend ↔ Backend (API submission/retrieval)
 * 2. Backend → PDF (PDF generation)
 *
 * Key transformations:
 * 1. Type conversions for serialized data (fixes validation errors):
 *    - dateOfBirth: string → Date (personalInfo, children)
 *    - heightM: string → number (personalInfo)
 *    - weightKg: string → number (personalInfo)
 *    - All date fields: string → Date (eligibility, workExperience, voluntaryWork, learningDevelopment)
 *    - All numeric fields: string → number (monthlySalary, numberOfHours, hours)
 * 2. Field mappings (frontend ↔ backend):
 *    - family ↔ familyBackground
 *    - eligibility ↔ civilService
 *    - learningDevelopment ↔ training
 * 3. education: object ↔ array format
 * 4. unitsEarned ↔ highestLevelEarned (field rename)
 * 5. honors ↔ honorsReceived (field rename)
 * 6. Year numbers ↔ ISO date strings for periodFrom/periodTo
 * 7. Filter out empty references
 */

import type { CompletePdsData } from '../validations/pds-schema';
import type { PDSData } from '@tupsafe/shared-ui/pds-pdf';

/**
 * Helper function to convert Date object to a date-only string (YYYY-MM-DD)
 * Uses LOCAL timezone components to prevent date shifts when serializing.
 * 
 * This is critical for date-only fields like dateOfBirth where we don't want
 * timezone conversion to change the date.
 * 
 * @param value - Date object, date string, or null/undefined
 * @returns String in 'YYYY-MM-DD' format using local date components, or null
 */
function toDateOnlyString(value: any): string | null {
  if (!value) return null;
  
  let date: Date;
  
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    // If already a date-only string, return as-is
    const dateOnlyRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (dateOnlyRegex.test(value)) {
      return value;
    }
    // Parse the string to a Date first
    date = stringToDate(value) as Date;
    if (!date) return null;
  } else {
    return null;
  }
  
  // Check for invalid date
  if (isNaN(date.getTime())) return null;
  
  // Format using LOCAL timezone components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Helper function to convert string to Date
 * Handles ISO date strings (YYYY-MM-DD) and ISO datetime strings using LOCAL timezone
 * to prevent -1 day shift from UTC conversion.
 * 
 * IMPORTANT: For ISO datetime strings like '2004-05-13T00:00:00.000Z', we extract
 * the date portion and parse it as local time, NOT as UTC. This prevents the date
 * from shifting backwards when the user is in a timezone ahead of UTC.
 */
function stringToDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    // Check if it's an ISO date-only string (YYYY-MM-DD) - parse as LOCAL time
    const dateOnlyRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const dateOnlyMatch = value.match(dateOnlyRegex);
    if (dateOnlyMatch) {
      // Parse as local timezone to prevent -1 day shift from UTC conversion
      const year = parseInt(dateOnlyMatch[1], 10);
      const month = parseInt(dateOnlyMatch[2], 10) - 1; // JS months are 0-indexed
      const day = parseInt(dateOnlyMatch[3], 10);
      const date = new Date(year, month, day);
      // Validate the date components match (handles invalid dates like Feb 30)
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
      return null;
    }
    
    // Check if it's an ISO datetime string (e.g., '2004-05-13T00:00:00.000Z')
    // Extract the YYYY-MM-DD portion and parse as LOCAL time
    const isoDatetimeRegex = /^(\d{4})-(\d{2})-(\d{2})T/;
    const isoDatetimeMatch = value.match(isoDatetimeRegex);
    if (isoDatetimeMatch) {
      // Extract date components and parse as LOCAL timezone
      const year = parseInt(isoDatetimeMatch[1], 10);
      const month = parseInt(isoDatetimeMatch[2], 10) - 1; // JS months are 0-indexed
      const day = parseInt(isoDatetimeMatch[3], 10);
      const date = new Date(year, month, day);
      // Validate the date components match
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
      return null;
    }
    
    // For other date formats, use standard parsing (but this may cause timezone issues)
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/**
 * Helper function to convert string to number
 */
function stringToNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Transforms PDS data from frontend format to backend format
 *
 * @param data - Form data in frontend format
 * @returns Transformed data ready for backend API
 */
export function transformPdsForSubmission(data: Partial<CompletePdsData>): any {
  // ========================================================================
  // STEP 0: Type conversions for serialized data
  // ========================================================================
  // Handle cases where data may have been serialized/deserialized (e.g., from localStorage)
  // IMPORTANT: Convert all date-only fields to YYYY-MM-DD strings using toDateOnlyString()
  // to prevent timezone shifts when the backend stores/retrieves these dates.
  const transformedData = { ...data };

  // Convert Personal Info date/number fields
  // NOTE: dateOfBirth is converted to YYYY-MM-DD string to prevent timezone issues
  if (transformedData.personalInfo) {
    transformedData.personalInfo = {
      ...transformedData.personalInfo,
      dateOfBirth: toDateOnlyString(transformedData.personalInfo.dateOfBirth),
      heightM: stringToNumber(transformedData.personalInfo.heightM),
      weightKg: stringToNumber(transformedData.personalInfo.weightKg),
    } as any;
  }

  // Convert Family Background - Children dateOfBirth
  // NOTE: dateOfBirth is converted to YYYY-MM-DD string to prevent timezone issues
  if (transformedData.family?.children) {
    transformedData.family.children = transformedData.family.children.map((child: any) => ({
      ...child,
      dateOfBirth: toDateOnlyString(child.dateOfBirth),
    }));
  }

  // Convert Civil Service Eligibility dates and rating
  // NOTE: All date fields converted to YYYY-MM-DD strings
  if (transformedData.eligibility) {
    transformedData.eligibility = transformedData.eligibility.map((item: any) => ({
      ...item,
      id: item.id, // CRITICAL: Preserve ID for attachment linking (upsert-by-id logic)
      dateOfExam: toDateOnlyString(item.dateOfExam),
      licenseValidityDate: toDateOnlyString(item.licenseValidityDate),
      rating: stringToNumber(item.rating),
      _attachmentIds: item._attachmentIds || [], // Preserve for draft metadata
    }));

    // Log civil service data for debugging
    console.log('[transformPdsForSubmission] Civil Service entries:', {
      count: transformedData.eligibility.length,
      entries: transformedData.eligibility.map((cs: any) => ({
        id: cs.id,
        eligibilityName: cs.eligibilityName,
        hasDateOfExam: !!cs.dateOfExam,
      })),
    });

    // Filter out completely empty entries (but preserve entries with IDs for upsert)
    // IMPORTANT: Preserve entries that have IDs AND at least one meaningful field
    // This allows users to upload attachments even if other fields aren't filled yet
    transformedData.eligibility = transformedData.eligibility.filter(
      (cs: any) => {
        // Check if entry has any meaningful data filled in
        const hasEligibilityName = cs.eligibilityName && cs.eligibilityName.trim() !== '';
        const hasRating = cs.rating !== null && cs.rating !== undefined;
        const hasDateOfExam = cs.dateOfExam !== null && cs.dateOfExam !== undefined;
        const hasPlaceOfExam = cs.placeOfExam && cs.placeOfExam.trim() !== '';
        const hasLicenseNo = cs.licenseNo && cs.licenseNo.trim() !== '';

        // Keep if entry has an ID AND at least one meaningful field filled
        if (cs.id && (hasEligibilityName || hasRating || hasDateOfExam || hasPlaceOfExam || hasLicenseNo)) {
          return true;
        }

        // For entries without IDs, require at least eligibilityName
        if (!cs.id) {
          return hasEligibilityName;
        }

        // Filter out completely empty entries (only have ID, no data)
        return false;
      }
    );
  }

  // Convert Work Experience dates and filter empty entries
  // NOTE: All date fields converted to YYYY-MM-DD strings
  if (transformedData.workExperience) {
    transformedData.workExperience = transformedData.workExperience.map((item: any) => ({
      ...item,
      dateFrom: toDateOnlyString(item.dateFrom),
      dateTo: toDateOnlyString(item.dateTo),
      monthlySalary: stringToNumber(item.monthlySalary),
    }));
    // Filter out empty/incomplete work experience entries
    // dateFrom is NOT NULL in database - only keep entries with valid dateFrom
    transformedData.workExperience = transformedData.workExperience.filter(
      (work: any) => work.dateFrom !== null && work.dateFrom !== undefined
    );
  }

  // Convert Voluntary Work dates and filter empty entries
  // NOTE: All date fields converted to YYYY-MM-DD strings
  if (transformedData.voluntaryWork) {
    transformedData.voluntaryWork = transformedData.voluntaryWork.map((item: any) => ({
      ...item,
      dateFrom: toDateOnlyString(item.dateFrom),
      dateTo: toDateOnlyString(item.dateTo),
      numberOfHours: stringToNumber(item.numberOfHours),
    }));
    // Filter out empty/incomplete voluntary work entries
    // dateFrom is NOT NULL in database - only keep entries with valid dateFrom
    transformedData.voluntaryWork = transformedData.voluntaryWork.filter(
      (vol: any) => vol.dateFrom !== null && vol.dateFrom !== undefined
    );
  }

  // Convert Learning Development dates and filter empty entries
  // NOTE: All date fields converted to YYYY-MM-DD strings
  if (transformedData.learningDevelopment) {
    transformedData.learningDevelopment = transformedData.learningDevelopment.map((item: any) => ({
      ...item,
      id: item.id, // CRITICAL: Preserve ID for attachment linking (upsert-by-id logic)
      dateFrom: toDateOnlyString(item.dateFrom),
      dateTo: toDateOnlyString(item.dateTo),
      hours: stringToNumber(item.hours),
      _attachmentIds: item._attachmentIds || [], // Preserve for draft metadata
    }));

    // Log training data BEFORE filtering
    console.log('[transformPdsForSubmission] Training entries BEFORE filter:', {
      count: transformedData.learningDevelopment.length,
      entries: transformedData.learningDevelopment.map((t: any) => ({
        id: t.id,
        title: t.title,
        hasDateFrom: !!t.dateFrom,
        hasDateTo: !!t.dateTo,
        dateFrom: t.dateFrom,
        dateTo: t.dateTo,
      })),
    });

    // Filter out empty/incomplete training entries
    // IMPORTANT: Preserve entries that have IDs AND at least one meaningful field
    // This allows users to upload attachments even if dates aren't filled yet
    transformedData.learningDevelopment = transformedData.learningDevelopment.filter(
      (training: any) => {
        // Check if entry has any meaningful data filled in
        const hasTitle = training.title && training.title.trim() !== '';
        const hasDateFrom = training.dateFrom !== null && training.dateFrom !== undefined;
        const hasDateTo = training.dateTo !== null && training.dateTo !== undefined;
        const hasConductedBy = training.conductedBy && training.conductedBy.trim() !== '';
        const hasHours = training.hours !== null && training.hours !== undefined;

        // Keep if entry has an ID AND at least one meaningful field filled
        // This allows users to upload attachments even if dates aren't filled yet
        if (training.id && (hasTitle || hasDateFrom || hasDateTo || hasConductedBy || hasHours)) {
          return true;
        }

        // For entries without IDs (shouldn't happen with current code), require both dates
        if (!training.id) {
          return hasDateFrom && hasDateTo;
        }

        // Filter out completely empty entries (only have ID, no data)
        return false;
      }
    );

    // Log training data AFTER filtering
    console.log('[transformPdsForSubmission] Training entries AFTER filter:', {
      count: transformedData.learningDevelopment.length,
      entries: transformedData.learningDevelopment.map((t: any) => ({
        id: t.id,
        title: t.title,
        hasDateFrom: !!t.dateFrom,
        hasDateTo: !!t.dateTo,
      })),
    });
  }

  // ========================================================================
  // STEP 1: Filter out empty references
  // ========================================================================

  if (transformedData.otherInfo?.references) {
    transformedData.otherInfo.references =
      transformedData.otherInfo.references.filter(
        (ref: any) =>
          ref.name && ref.name.trim() !== '' &&
          ref.address && ref.address.trim() !== '' &&
          ref.telephoneNo && ref.telephoneNo.trim() !== ''
      );
  }

  // Ensure otherInfo has required structure even if no references
  if (
    !transformedData.otherInfo?.references ||
    transformedData.otherInfo.references.length === 0
  ) {
    if (transformedData.otherInfo) {
      transformedData.otherInfo = {
        ...transformedData.otherInfo,
        references: [],
        skills: transformedData.otherInfo.skills || [],
        recognitions: transformedData.otherInfo.recognitions || [],
        associations: transformedData.otherInfo.associations || [],
        questions: transformedData.otherInfo.questions || {
          Q34_criminal_charged: false,
          Q35_criminal_convicted: false,
          Q36_separated_from_service: false,
          Q37_candidate_for_election: false,
          Q38_resigned_from_government: false,
          Q39_immigrant_or_acquired_residence: false,
          Q40_indigenous_group: false,
          Q41_disabled: false,
          Q42_solo_parent: false,
        },
      };
    }
  }

  // ========================================================================
  // STEP 2: Transform education from object to array format
  // ========================================================================
  // Frontend uses: { elementary: {...}, secondary: {...}, college: {...} }
  // Backend expects: [{ level: 'elementary', ... }, { level: 'secondary', ... }]

  let educationArray: any[] = [];

  if (transformedData.education) {
    const educationObj = transformedData.education as any;
    const levels = [
      'elementary',
      'secondary',
      'vocational',
      'college',
      'graduate',
    ];

    educationArray = levels
      .map((level) => {
        const levelData = educationObj[level];

        // Only include if levelData exists and has meaningful content
        if (!levelData) return null;

        // Check if any field is filled (excluding level field itself)
        const hasSchoolName =
          levelData.schoolName && levelData.schoolName.trim() !== '';
        const hasDegreeCourse =
          levelData.degreeCourse && levelData.degreeCourse.trim() !== '';
        const hasPeriodFrom =
          levelData.periodFrom !== null && levelData.periodFrom !== undefined;
        const hasPeriodTo =
          levelData.periodTo !== null && levelData.periodTo !== undefined;
        const hasUnitsEarned =
          levelData.unitsEarned && levelData.unitsEarned.trim() !== '';
        const hasYearGraduated =
          levelData.yearGraduated !== null &&
          levelData.yearGraduated !== undefined;
        const hasHonors = levelData.honors && levelData.honors.trim() !== '';

        const hasAnyField =
          hasSchoolName ||
          hasDegreeCourse ||
          hasPeriodFrom ||
          hasPeriodTo ||
          hasUnitsEarned ||
          hasYearGraduated ||
          hasHonors;

        // Skip if no meaningful data
        if (!hasAnyField) return null;

        // Return education record with correct field mapping
        // Convert year numbers to ISO date strings for database DATE columns
        return {
          level: levelData.level || level, // Ensure level is set
          schoolName: levelData.schoolName || '',
          degreeCourse: levelData.degreeCourse || null,
          periodFrom: levelData.periodFrom
            ? `${levelData.periodFrom}-01-01`
            : null,
          periodTo: levelData.periodTo ? `${levelData.periodTo}-12-31` : null,
          highestLevelEarned: levelData.unitsEarned || null, // Map unitsEarned to highestLevelEarned
          yearGraduated: levelData.yearGraduated || null,
          honorsReceived: levelData.honors || null, // Map honors to honorsReceived
        };
      })
      .filter(Boolean); // Remove null entries
  }

  // ========================================================================
  // STEP 3: Create backend-compatible data structure
  // ========================================================================
  // Backend expects specific field names for different sections
  // IMPORTANT: Children must be extracted as a SEPARATE property from family
  // The backend expects: { familyBackground: {...}, children: [...] }
  // NOT: { familyBackground: { ..., children: [...] } }
  const backendData = {
    ...transformedData,
    // Extract family background WITHOUT children (children go as separate property)
    familyBackground: transformedData.family ? {
      spouseSurname: transformedData.family.spouseSurname ?? null,
      spouseFirstName: transformedData.family.spouseFirstName ?? null,
      spouseMiddleName: transformedData.family.spouseMiddleName ?? null,
      spouseNameExtension: transformedData.family.spouseNameExtension ?? null,
      spouseOccupation: transformedData.family.spouseOccupation ?? null,
      spouseEmployer: transformedData.family.spouseEmployer ?? null,
      spouseBusinessAddress: transformedData.family.spouseBusinessAddress ?? null,
      spouseTelephoneNo: transformedData.family.spouseTelephoneNo ?? null,
      fatherSurname: transformedData.family.fatherSurname ?? null,
      fatherFirstName: transformedData.family.fatherFirstName ?? null,
      fatherMiddleName: transformedData.family.fatherMiddleName ?? null,
      fatherNameExtension: transformedData.family.fatherNameExtension ?? null,
      motherMaidenSurname: transformedData.family.motherMaidenSurname ?? null,
      motherFirstName: transformedData.family.motherFirstName ?? null,
      motherMiddleName: transformedData.family.motherMiddleName ?? null,
    } : undefined,
    // Extract children as separate array for backend API
    children: transformedData.family?.children || [],
    education: educationArray, // Use transformed education array
    civilService: transformedData.eligibility, // Map 'eligibility' to 'civilService'
    training: transformedData.learningDevelopment, // Map 'learningDevelopment' to 'training'
  };

  // Remove the frontend keys as backend doesn't expect them
  delete (backendData as any).family;
  delete (backendData as any).eligibility;
  delete (backendData as any).learningDevelopment;

  // Log the final backend data structure for debugging
  console.log('[transformPdsForSubmission] Final backend data:', {
    hasCivilService: !!backendData.civilService,
    civilServiceCount: backendData.civilService?.length || 0,
    hasTraining: !!backendData.training,
    trainingCount: backendData.training?.length || 0,
    trainingWithIds: backendData.training?.filter((t: any) => t.id).length || 0,
    trainingWithoutIds: backendData.training?.filter((t: any) => !t.id).length || 0,
  });

  return backendData;
}

/**
 * Reverse transforms PDS data from backend format to frontend format
 * Used when loading drafts from database
 *
 * @param backendData - Data in backend format
 * @returns Transformed data ready for frontend form
 */
export function transformPdsFromBackend(backendData: any): Partial<CompletePdsData> {
  // ========================================================================
  // STEP 1: Transform education from array to object format
  // ========================================================================
  // Backend uses: [{ level: 'elementary', ... }, { level: 'secondary', ... }]
  // Frontend expects: { elementary: {...}, secondary: {...}, college: {...} }

  const educationObj: any = {
    elementary: null,
    secondary: null,
    vocational: null,
    college: null,
    graduate: null,
  };

  if (backendData.education && Array.isArray(backendData.education)) {
    backendData.education.forEach((edu: any) => {
      if (edu.level) {
        // Convert backend field names back to frontend format
        educationObj[edu.level] = {
          level: edu.level,
          schoolName: edu.schoolName || '',
          degreeCourse: edu.degreeCourse || null,
          // Convert ISO date strings back to year numbers
          periodFrom: edu.periodFrom
            ? parseInt(edu.periodFrom.split('-')[0], 10)
            : null,
          periodTo: edu.periodTo
            ? parseInt(edu.periodTo.split('-')[0], 10)
            : null,
          unitsEarned: edu.highestLevelEarned || null, // Map highestLevelEarned back to unitsEarned
          yearGraduated: edu.yearGraduated || null,
          honors: edu.honorsReceived || null, // Map honorsReceived back to honors
        };
      }
    });
  }

  // ========================================================================
  // STEP 2: Convert serialized data types back to proper JavaScript types
  // ========================================================================
  // Database returns dates as ISO strings and numbers may be strings
  // Frontend form components expect Date objects and proper numbers

  // Convert Personal Info date/number fields
  let personalInfo = backendData.personalInfo;
  if (personalInfo) {
    personalInfo = {
      ...personalInfo,
      dateOfBirth: stringToDate(personalInfo.dateOfBirth),
      heightM: stringToNumber(personalInfo.heightM),
      weightKg: stringToNumber(personalInfo.weightKg),
    };
  }

  // Convert children dateOfBirth
  let children = backendData.children || [];
  if (Array.isArray(children)) {
    children = children.map((child: any) => ({
      ...child,
      dateOfBirth: stringToDate(child.dateOfBirth),
    }));
  }

  // Convert Civil Service dates and rating
  let eligibility = backendData.civilService || [];
  if (Array.isArray(eligibility)) {
    eligibility = eligibility.map((item: any) => ({
      ...item,
      id: item.id, // CRITICAL: Preserve ID for attachment linking
      dateOfExam: stringToDate(item.dateOfExam),
      licenseValidityDate: stringToDate(item.licenseValidityDate),
      rating: stringToNumber(item.rating),
      _attachmentIds: item._attachmentIds || [], // Restore for PdsContext sync
    }));
  }

  // Convert Work Experience dates and numbers
  let workExperience = backendData.workExperience || [];
  if (Array.isArray(workExperience)) {
    workExperience = workExperience.map((item: any) => ({
      ...item,
      dateFrom: stringToDate(item.dateFrom),
      dateTo: stringToDate(item.dateTo),
      monthlySalary: stringToNumber(item.monthlySalary),
    }));
  }

  // Convert Voluntary Work dates and numbers
  let voluntaryWork = backendData.voluntaryWork || [];
  if (Array.isArray(voluntaryWork)) {
    voluntaryWork = voluntaryWork.map((item: any) => ({
      ...item,
      dateFrom: stringToDate(item.dateFrom),
      dateTo: stringToDate(item.dateTo),
      numberOfHours: stringToNumber(item.numberOfHours),
    }));
  }

  // Convert Training/Learning Development dates and numbers
  let learningDevelopment = backendData.training || [];
  if (Array.isArray(learningDevelopment)) {
    learningDevelopment = learningDevelopment.map((item: any) => ({
      ...item,
      id: item.id, // CRITICAL: Preserve ID for attachment linking
      dateFrom: stringToDate(item.dateFrom),
      dateTo: stringToDate(item.dateTo),
      hours: stringToNumber(item.hours),
      _attachmentIds: item._attachmentIds || [], // Restore for PdsContext sync
    }));
  }

  // ========================================================================
  // STEP 3: Create frontend-compatible data structure
  // ========================================================================
  // IMPORTANT: Children are stored as a SEPARATE property in backend
  // but frontend expects them nested in family.children
  // We must merge children back into the family object
  const frontendData: Partial<CompletePdsData> = {
    personalInfo,
    // Merge children back into family object - backend stores them separately
    family: backendData.familyBackground ? {
      ...backendData.familyBackground,
      children,
    } : { children },
    education: educationObj,
    eligibility,
    workExperience,
    voluntaryWork,
    learningDevelopment,
    otherInfo: backendData.otherInfo,
  };

  return frontendData;
}

/**
 * Transform PDS data from API/database format to PDF generation format
 *
 * This function handles the transformation of PDS data from the backend structure
 * to the specific format required by the PDF generator component.
 *
 * @param data - The complete PDS data from API (backend structure)
 * @returns PDSData formatted for PDF generation
 * @throws Error if required fields are missing
 */
export function transformPdsForPdf(data: any): PDSData {
  // STEP 1: Validate input data
  if (!data) {
    throw new Error('Cannot transform PDS for PDF: Data is null or undefined');
  }

  // STEP 2: Handle both direct structure and nested submission structure
  const personalInfo = data.personalInfo || {};
  const familyBackground = data.familyBackground || data.family || {};
  const children = data.children || familyBackground.children || [];
  const education = data.education || {};
  const civilService = data.civilService || data.eligibility || [];
  const workExperience = data.workExperience || [];
  const voluntaryWork = data.voluntaryWork || [];
  const training = data.training || data.learningDevelopment || [];
  const otherInfo = data.otherInfo || {};

  // STEP 3: Validate critical fields early
  if (!personalInfo.surname || !personalInfo.firstName) {
    throw new Error(
      'Cannot transform PDS for PDF: Personal information must include surname and firstName. ' +
      'Please ensure the PDS submission has complete personal information.'
    );
  }

  // STEP 4: Log debugging information for data structure
  console.log('[transformPdsForPdf] Data structure check:', {
    hasPersonalInfo: !!personalInfo,
    hasSurname: !!personalInfo.surname,
    hasFirstName: !!personalInfo.firstName,
    hasFamilyBackground: !!familyBackground,
    hasEducation: !!education,
    educationType: Array.isArray(education) ? 'array' : typeof education,
    hasOtherInfo: !!otherInfo,
  });

  // Transform address format
  const transformAddress = (addr: any) => {
    if (!addr) return {};
    return {
      houseNumber: addr.houseNumber || addr.house_number || null,
      street: addr.street || addr.streetName || null,
      subdivision: addr.subdivision || null,
      barangay: addr.barangay || null,
      city: addr.city || addr.cityMunicipality || null,
      province: addr.province || null,
      zipCode: addr.zipCode || addr.zip_code || null,
    };
  };

  // Transform education by level
  const transformEducation = () => {
    // Handle object format (keyed by level)
    if (
      education &&
      typeof education === 'object' &&
      !Array.isArray(education)
    ) {
      return {
        elementary: education.elementary
          ? {
              level: 'elementary' as const,
              schoolName: education.elementary.schoolName || '',
              degreeCourse: education.elementary.degreeCourse || null,
              periodFrom: education.elementary.periodFrom || null,
              periodTo: education.elementary.periodTo || null,
              highestLevelEarned:
                education.elementary.highestLevelEarned || null,
              yearGraduated: education.elementary.yearGraduated || null,
              honorsReceived: education.elementary.honorsReceived || null,
            }
          : null,
        secondary: education.secondary
          ? {
              level: 'secondary' as const,
              schoolName: education.secondary.schoolName || '',
              degreeCourse: education.secondary.degreeCourse || null,
              periodFrom: education.secondary.periodFrom || null,
              periodTo: education.secondary.periodTo || null,
              highestLevelEarned:
                education.secondary.highestLevelEarned || null,
              yearGraduated: education.secondary.yearGraduated || null,
              honorsReceived: education.secondary.honorsReceived || null,
            }
          : null,
        vocational: education.vocational
          ? {
              level: 'vocational' as const,
              schoolName: education.vocational.schoolName || '',
              degreeCourse: education.vocational.degreeCourse || null,
              periodFrom: education.vocational.periodFrom || null,
              periodTo: education.vocational.periodTo || null,
              highestLevelEarned:
                education.vocational.highestLevelEarned || null,
              yearGraduated: education.vocational.yearGraduated || null,
              honorsReceived: education.vocational.honorsReceived || null,
            }
          : null,
        college: education.college
          ? {
              level: 'college' as const,
              schoolName: education.college.schoolName || '',
              degreeCourse: education.college.degreeCourse || null,
              periodFrom: education.college.periodFrom || null,
              periodTo: education.college.periodTo || null,
              highestLevelEarned: education.college.highestLevelEarned || null,
              yearGraduated: education.college.yearGraduated || null,
              honorsReceived: education.college.honorsReceived || null,
            }
          : null,
        graduate: education.graduate
          ? {
              level: 'graduate' as const,
              schoolName: education.graduate.schoolName || '',
              degreeCourse: education.graduate.degreeCourse || null,
              periodFrom: education.graduate.periodFrom || null,
              periodTo: education.graduate.periodTo || null,
              highestLevelEarned: education.graduate.highestLevelEarned || null,
              yearGraduated: education.graduate.yearGraduated || null,
              honorsReceived: education.graduate.honorsReceived || null,
            }
          : null,
      };
    }

    // Handle array format (from database)
    if (Array.isArray(education)) {
      const result: Record<string, any> = {};
      education.forEach((edu: any) => {
        if (edu.level) {
          result[edu.level] = {
            level: edu.level,
            schoolName: edu.schoolName || '',
            degreeCourse: edu.degreeCourse || null,
            periodFrom: edu.periodFrom || null,
            periodTo: edu.periodTo || null,
            highestLevelEarned: edu.highestLevelEarned || null,
            yearGraduated: edu.yearGraduated || null,
            honorsReceived: edu.honorsReceived || null,
          };
        }
      });
      return result;
    }

    return {
      elementary: null,
      secondary: null,
      vocational: null,
      college: null,
      graduate: null,
    };
  };

  // Transform questions to the PDF format
  const transformQuestions = () => {
    const questions = otherInfo.questions || {};
    return {
      Q34_criminal_charged: questions.Q34_criminal_charged || false,
      Q34_criminal_charged_details:
        questions.Q34_criminal_charged_details || undefined,
      Q35_criminal_convicted: questions.Q35_criminal_convicted || false,
      Q35_criminal_convicted_details:
        questions.Q35_criminal_convicted_details || undefined,
      Q36_separated_from_service: questions.Q36_separated_from_service || false,
      Q36_separated_from_service_details:
        questions.Q36_separated_from_service_details || undefined,
      Q37_candidate_for_election: questions.Q37_candidate_for_election || false,
      Q37_candidate_for_election_details:
        questions.Q37_candidate_for_election_details || undefined,
      Q38_resigned_from_government:
        questions.Q38_resigned_from_government || false,
      Q38_resigned_from_government_details:
        questions.Q38_resigned_from_government_details || undefined,
      Q39_immigrant_or_acquired_residence:
        questions.Q39_immigrant_or_acquired_residence || false,
      Q39_immigrant_or_acquired_residence_details:
        questions.Q39_immigrant_or_acquired_residence_details || undefined,
      Q40_indigenous_group: questions.Q40_indigenous_group || false,
      Q40_indigenous_group_details:
        questions.Q40_indigenous_group_details || undefined,
      Q41_disabled: questions.Q41_disabled || false,
      Q41_disabled_details: questions.Q41_disabled_details || undefined,
      Q42_solo_parent: questions.Q42_solo_parent || false,
      Q42_solo_parent_details: questions.Q42_solo_parent_details || undefined,
    };
  };

  // Build the transformed data with safe defaults
  const transformedData: PDSData = {
    id: data.id || data.submission?.id || '',
    submittedAt: data.submittedAt || data.submission?.submittedAt || null,
    version: data.version || data.submission?.version || 1,

    personalInfo: {
      surname: personalInfo.surname,
      firstName: personalInfo.firstName,
      middleName: personalInfo.middleName ?? null,
      nameExtension: personalInfo.nameExtension ?? null,
      dateOfBirth: personalInfo.dateOfBirth ?? null,
      placeOfBirth: personalInfo.placeOfBirth || '',
      sex: personalInfo.sex || 'male',
      civilStatus: personalInfo.civilStatus || 'single',
      heightM: stringToNumber(personalInfo.heightM),
      weightKg: stringToNumber(personalInfo.weightKg),
      bloodType: personalInfo.bloodType ?? null,
      gsisNo: personalInfo.gsisNo ?? null,
      pagibigNo: personalInfo.pagibigNo ?? null,
      philhealthNo: personalInfo.philhealthNo ?? null,
      sssNo: personalInfo.sssNo ?? null,
      tinNo: personalInfo.tinNo ?? null,
      agencyEmployeeNo: personalInfo.agencyEmployeeNo ?? null,
      citizenship: personalInfo.citizenship || { type: 'Filipino' },
      residentialAddress: transformAddress(personalInfo.residentialAddress),
      permanentAddress: transformAddress(personalInfo.permanentAddress),
      telephoneNo: personalInfo.telephoneNo ?? null,
      mobileNo: personalInfo.mobileNo ?? null,
      emailAddress: personalInfo.emailAddress ?? null,
    },

    familyBackground: {
      spouseSurname: familyBackground.spouseSurname ?? null,
      spouseFirstName: familyBackground.spouseFirstName ?? null,
      spouseMiddleName: familyBackground.spouseMiddleName ?? null,
      spouseNameExtension: familyBackground.spouseNameExtension ?? null,
      spouseOccupation: familyBackground.spouseOccupation ?? null,
      spouseEmployer: familyBackground.spouseEmployer ?? null,
      spouseBusinessAddress: familyBackground.spouseBusinessAddress ?? null,
      spouseTelephoneNo: familyBackground.spouseTelephoneNo ?? null,
      fatherSurname: familyBackground.fatherSurname ?? null,
      fatherFirstName: familyBackground.fatherFirstName ?? null,
      fatherMiddleName: familyBackground.fatherMiddleName ?? null,
      fatherNameExtension: familyBackground.fatherNameExtension ?? null,
      motherMaidenSurname: familyBackground.motherMaidenSurname ?? null,
      motherFirstName: familyBackground.motherFirstName ?? null,
      motherMiddleName: familyBackground.motherMiddleName ?? null,
      children: Array.isArray(children)
        ? children.map((child: any) => ({
            fullName: child.fullName || '',
            dateOfBirth: child.dateOfBirth ?? null,
          }))
        : [],
    },

    education: transformEducation(),

    civilServiceEligibilities: Array.isArray(civilService)
      ? civilService.map((cs: any) => ({
          eligibilityName: cs.eligibilityName || '',
          rating: cs.rating ?? null,
          dateOfExam: cs.dateOfExam ?? null,
          placeOfExam: cs.placeOfExam ?? null,
          licenseNo: cs.licenseNo ?? null,
          licenseValidityDate: cs.licenseValidityDate ?? null,
        }))
      : [],

    workExperiences: Array.isArray(workExperience)
      ? workExperience.map((work: any) => ({
          dateFrom: work.dateFrom ?? null,
          dateTo: work.dateTo ?? null,
          positionTitle: work.positionTitle || '',
          departmentAgency: work.departmentAgency || '',
          monthlySalary: work.monthlySalary ?? null,
          salaryGrade: work.salaryGrade ?? null,
          statusOfAppointment: work.statusOfAppointment ?? null,
          isGovernment: work.isGovernment ?? false,
        }))
      : [],

    voluntaryWorks: Array.isArray(voluntaryWork)
      ? voluntaryWork.map((vol: any) => ({
          organizationName: vol.organizationName || '',
          organizationAddress: vol.organizationAddress ?? null,
          dateFrom: vol.dateFrom ?? null,
          dateTo: vol.dateTo ?? null,
          numberOfHours: vol.numberOfHours ?? null,
          positionNature: vol.positionNature ?? null,
        }))
      : [],

    trainings: Array.isArray(training)
      ? training.map((t: any) => ({
          title: t.title || '',
          dateFrom: t.dateFrom ?? null,
          dateTo: t.dateTo ?? null,
          hours: t.hours ?? null,
          typeOfLd: t.typeOfLd ?? null,
          conductedBy: t.conductedBy ?? null,
        }))
      : [],

    skills: otherInfo.skills || [],
    recognitions: Array.isArray(otherInfo.recognitions)
      ? otherInfo.recognitions.map((r: any) => ({
          title: r.title || '',
          year: r.year || 0,
          organization: r.organization || '',
        }))
      : [],
    associations: Array.isArray(otherInfo.associations)
      ? otherInfo.associations.map((a: any) => ({
          name: a.name || '',
          position: a.position ?? undefined,
          yearJoined: a.yearJoined ?? undefined,
        }))
      : [],

    questions: transformQuestions(),

    references: Array.isArray(otherInfo.references)
      ? otherInfo.references.map((ref: any) => ({
          name: ref.name || '',
          address: ref.address || '',
          telephoneNo: ref.telephoneNo ?? undefined,
        }))
      : [],

    governmentId: data.governmentId ?? undefined,
    photoUrl: data.photoUrl ?? null,
  };

  return transformedData;
}

/**
 * Generate a filename for PDS PDF based on the data
 * Note: This function should only be called after validating that required fields exist.
 *
 * @param pdsData - The PDS data
 * @returns A formatted filename string (e.g., "PDS_Doe_John_20250130.pdf")
 */
export function generatePdsFilename(pdsData: PDSData): string {
  const lastName = pdsData.personalInfo.surname;
  const firstName = pdsData.personalInfo.firstName;

  if (!lastName || !firstName) {
    throw new Error('Cannot generate filename: Name fields are required');
  }

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

  // Sanitize names for filename (remove special characters)
  const sanitizedLastName = lastName.replace(/[^a-zA-Z0-9]/g, '');
  const sanitizedFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '');

  return `PDS_${sanitizedLastName}_${sanitizedFirstName}_${date}.pdf`;
}
