/**
 * PDS Data Transformation Utilities
 *
 * Comprehensive transformations for PDS data across different formats:
 * 1. Frontend <-> Backend (API submission/retrieval)
 * 2. Backend -> PDF (PDF generation)
 *
 * Key transformations:
 * 1. Type conversions for serialized data (fixes validation errors):
 *    - dateOfBirth: string -> Date (personalInfo, children)
 *    - heightM: string -> number (personalInfo)
 *    - weightKg: string -> number (personalInfo)
 *    - All date fields: string -> Date (eligibility, workExperience, voluntaryWork, learningDevelopment)
 *    - All numeric fields: string -> number (monthlySalary, numberOfHours, hours)
 * 2. Field mappings (frontend <-> backend):
 *    - family <-> familyBackground
 *    - eligibility <-> civilService
 *    - learningDevelopment <-> training
 * 3. education: object <-> array format
 * 4. unitsEarned <-> highestLevelEarned (field rename)
 * 5. honors <-> honorsReceived (field rename)
 * 6. Year numbers <-> ISO date strings for periodFrom/periodTo
 * 7. Filter out empty references
 */

import type { CompletePdsData } from '../validations/pds-schema';
import type { PDSData } from '@tupsafe/shared-ui/pds-pdf';

// ============================================================================
// Internal type aliases for data flowing across serialization boundaries
// (localStorage, API JSON, database rows) where dates may be strings, etc.
// ============================================================================

/** A value that could be a Date, an ISO string, or null/undefined */
type DateLike = Date | string | null | undefined;

/** A value that could be a number, a numeric string, or null/undefined */
type NumberLike = number | string | null | undefined;

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
function toDateOnlyString(value: DateLike): string | null {
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
function stringToDate(value: DateLike): Date | null {
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
function stringToNumber(value: NumberLike): number | null {
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
export function transformPdsForSubmission(data: Partial<CompletePdsData>): Record<string, unknown> {
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
    const pi = transformedData.personalInfo;
    transformedData.personalInfo = {
      ...pi,
      dateOfBirth: toDateOnlyString(pi.dateOfBirth) as unknown as Date,
      heightM: stringToNumber(pi.heightM) as unknown as number | null | undefined,
      weightKg: stringToNumber(pi.weightKg) as unknown as number | null | undefined,
    };
  }

  // Convert Family Background - Children dateOfBirth
  // NOTE: dateOfBirth is converted to YYYY-MM-DD string to prevent timezone issues
  if (transformedData.family?.children) {
    transformedData.family.children = transformedData.family.children.map((child) => ({
      ...child,
      dateOfBirth: toDateOnlyString(child.dateOfBirth) as unknown as Date | null | undefined,
    }));
  }

  // Convert Civil Service Eligibility dates and rating
  // NOTE: All date fields converted to YYYY-MM-DD strings
  if (transformedData.eligibility) {
    let eligibilityItems = transformedData.eligibility.map((item) => ({
      ...item,
      id: item.id, // CRITICAL: Preserve ID for attachment linking (upsert-by-id logic)
      dateOfExam: toDateOnlyString(item.dateOfExam) as unknown as Date | null,
      licenseValidityDate: toDateOnlyString(item.licenseValidityDate) as unknown as Date | null | undefined,
      rating: stringToNumber(item.rating as NumberLike) as unknown as number | null | undefined,
      _attachmentIds: ((item as Record<string, unknown>)._attachmentIds as string[] | undefined) || [], // Preserve for draft metadata
    }));

    // Log civil service data for debugging
    console.log('[transformPdsForSubmission] Civil Service entries:', {
      count: eligibilityItems.length,
      entries: eligibilityItems.map((cs) => ({
        id: cs.id,
        eligibilityName: cs.eligibilityName,
        hasDateOfExam: !!cs.dateOfExam,
      })),
    });

    // Filter out completely empty entries (but preserve entries with IDs for upsert)
    // IMPORTANT: Preserve entries that have IDs AND at least one meaningful field
    // This allows users to upload attachments even if other fields aren't filled yet
    eligibilityItems = eligibilityItems.filter(
      (cs) => {
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

    // Sort eligibility by exam date (latest first)
    eligibilityItems = [...eligibilityItems].sort((a, b) => {
      const dateA = a.dateOfExam ? new Date(a.dateOfExam as unknown as string).getTime() : 0;
      const dateB = b.dateOfExam ? new Date(b.dateOfExam as unknown as string).getTime() : 0;
      return dateB - dateA;
    });

    transformedData.eligibility = eligibilityItems;
  }

  // Convert Work Experience dates and filter empty entries
  // NOTE: All date fields converted to YYYY-MM-DD strings
  if (transformedData.workExperience) {
    let workItems = transformedData.workExperience.map((item) => ({
      ...item,
      dateFrom: toDateOnlyString(item.dateFrom) as unknown as Date | null | undefined,
      dateTo: toDateOnlyString(item.dateTo) as unknown as Date | null | undefined,
      monthlySalary: stringToNumber(item.monthlySalary as NumberLike) as unknown as number | null | undefined,
    }));
    // Filter out empty/incomplete work experience entries
    // dateFrom is NOT NULL in database - only keep entries with valid dateFrom
    workItems = workItems.filter(
      (work) => work.dateFrom !== null && work.dateFrom !== undefined
    );

    // Sort work experience by date (latest first)
    workItems = [...workItems].sort((a, b) => {
      const dateToA = a.dateTo ? new Date(a.dateTo as unknown as string).getTime() : Infinity;
      const dateToB = b.dateTo ? new Date(b.dateTo as unknown as string).getTime() : Infinity;
      if (dateToB !== dateToA) return dateToB - dateToA;
      const dateFromA = a.dateFrom ? new Date(a.dateFrom as unknown as string).getTime() : Infinity;
      const dateFromB = b.dateFrom ? new Date(b.dateFrom as unknown as string).getTime() : Infinity;
      return dateFromB - dateFromA;
    });

    transformedData.workExperience = workItems;
  }

  // Convert Voluntary Work dates and filter empty entries
  // NOTE: All date fields converted to YYYY-MM-DD strings
  if (transformedData.voluntaryWork) {
    let volItems = transformedData.voluntaryWork.map((item) => ({
      ...item,
      dateFrom: toDateOnlyString(item.dateFrom) as unknown as Date | null | undefined,
      dateTo: toDateOnlyString(item.dateTo) as unknown as Date | null | undefined,
      numberOfHours: stringToNumber(item.numberOfHours as NumberLike) as unknown as number | null | undefined,
    }));
    // Filter out empty/incomplete voluntary work entries
    // dateFrom is NOT NULL in database - only keep entries with valid dateFrom
    volItems = volItems.filter(
      (vol) => vol.dateFrom !== null && vol.dateFrom !== undefined
    );

    // Sort voluntary work by date (latest first)
    volItems = [...volItems].sort((a, b) => {
      const dateToA = a.dateTo ? new Date(a.dateTo as unknown as string).getTime() : Infinity;
      const dateToB = b.dateTo ? new Date(b.dateTo as unknown as string).getTime() : Infinity;
      if (dateToB !== dateToA) return dateToB - dateToA;
      const dateFromA = a.dateFrom ? new Date(a.dateFrom as unknown as string).getTime() : Infinity;
      const dateFromB = b.dateFrom ? new Date(b.dateFrom as unknown as string).getTime() : Infinity;
      return dateFromB - dateFromA;
    });

    transformedData.voluntaryWork = volItems;
  }

  // Convert Learning Development dates and filter empty entries
  // NOTE: All date fields converted to YYYY-MM-DD strings
  if (transformedData.learningDevelopment) {
    let ldItems = transformedData.learningDevelopment.map((item) => ({
      ...item,
      id: item.id, // CRITICAL: Preserve ID for attachment linking (upsert-by-id logic)
      dateFrom: toDateOnlyString(item.dateFrom) as unknown as Date | null | undefined,
      dateTo: toDateOnlyString(item.dateTo) as unknown as Date | null | undefined,
      hours: stringToNumber(item.hours as NumberLike) as unknown as number | null | undefined,
      _attachmentIds: ((item as Record<string, unknown>)._attachmentIds as string[] | undefined) || [], // Preserve for draft metadata
    }));

    // Log training data BEFORE filtering
    console.log('[transformPdsForSubmission] Training entries BEFORE filter:', {
      count: ldItems.length,
      entries: ldItems.map((t) => ({
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
    ldItems = ldItems.filter(
      (training) => {
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

    // Sort learning/development by date (latest first)
    ldItems = [...ldItems].sort((a, b) => {
      const dateToA = a.dateTo ? new Date(a.dateTo as unknown as string).getTime() : Infinity;
      const dateToB = b.dateTo ? new Date(b.dateTo as unknown as string).getTime() : Infinity;
      if (dateToB !== dateToA) return dateToB - dateToA;
      const dateFromA = a.dateFrom ? new Date(a.dateFrom as unknown as string).getTime() : Infinity;
      const dateFromB = b.dateFrom ? new Date(b.dateFrom as unknown as string).getTime() : Infinity;
      return dateFromB - dateFromA;
    });

    // Log training data AFTER filtering
    console.log('[transformPdsForSubmission] Training entries AFTER filter:', {
      count: ldItems.length,
      entries: ldItems.map((t) => ({
        id: t.id,
        title: t.title,
        hasDateFrom: !!t.dateFrom,
        hasDateTo: !!t.dateTo,
      })),
    });

    transformedData.learningDevelopment = ldItems;
  }

  // ========================================================================
  // STEP 1: Filter out empty references
  // ========================================================================

  if (transformedData.otherInfo?.references) {
    transformedData.otherInfo.references =
      transformedData.otherInfo.references.filter(
        (ref) =>
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

  let educationArray: Record<string, unknown>[] = [];

  if (transformedData.education) {
    const educationObj = transformedData.education as Record<string, Record<string, unknown> | null | undefined>;
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
          levelData.schoolName && (levelData.schoolName as string).trim() !== '';
        const hasDegreeCourse =
          levelData.degreeCourse && (levelData.degreeCourse as string).trim() !== '';
        const hasPeriodFrom =
          levelData.periodFrom !== null && levelData.periodFrom !== undefined;
        const hasPeriodTo =
          levelData.periodTo !== null && levelData.periodTo !== undefined;
        const hasUnitsEarned =
          levelData.unitsEarned && (levelData.unitsEarned as string).trim() !== '';
        const hasYearGraduated =
          levelData.yearGraduated !== null &&
          levelData.yearGraduated !== undefined;
        const hasHonors = levelData.honors && (levelData.honors as string).trim() !== '';

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
      .filter(Boolean) as Record<string, unknown>[]; // Remove null entries
  }

  // ========================================================================
  // STEP 3: Create backend-compatible data structure
  // ========================================================================
  // Backend expects specific field names for different sections
  // IMPORTANT: Children must be extracted as a SEPARATE property from family
  // The backend expects: { familyBackground: {...}, children: [...] }
  // NOT: { familyBackground: { ..., children: [...] } }
  const backendData: Record<string, unknown> = {
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
  delete backendData.family;
  delete backendData.eligibility;
  delete backendData.learningDevelopment;

  // Log the final backend data structure for debugging
  const trainingArr = backendData.training as Array<Record<string, unknown>> | undefined;
  console.log('[transformPdsForSubmission] Final backend data:', {
    hasCivilService: !!backendData.civilService,
    civilServiceCount: (backendData.civilService as unknown[] | undefined)?.length || 0,
    hasTraining: !!trainingArr,
    trainingCount: trainingArr?.length || 0,
    trainingWithIds: trainingArr?.filter((t) => t.id).length || 0,
    trainingWithoutIds: trainingArr?.filter((t) => !t.id).length || 0,
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
export function transformPdsFromBackend<T extends object>(backendInput: T): Partial<CompletePdsData> {
  // Cast to Record<string, unknown> for property access across serialization boundary
  const backendData = backendInput as unknown as Record<string, unknown>;
  // ========================================================================
  // STEP 1: Transform education from array to object format
  // ========================================================================
  // Backend uses: [{ level: 'elementary', ... }, { level: 'secondary', ... }]
  // Frontend expects: { elementary: {...}, secondary: {...}, college: {...} }

  const educationObj: Record<string, Record<string, unknown> | null> = {
    elementary: null,
    secondary: null,
    vocational: null,
    college: null,
    graduate: null,
  };

  const backendEducation = backendData.education;
  if (backendEducation && Array.isArray(backendEducation)) {
    backendEducation.forEach((edu: Record<string, unknown>) => {
      if (edu.level) {
        // Convert backend field names back to frontend format
        educationObj[edu.level as string] = {
          level: edu.level,
          schoolName: edu.schoolName || '',
          degreeCourse: edu.degreeCourse || null,
          // Convert ISO date strings back to year numbers
          periodFrom: edu.periodFrom
            ? parseInt((edu.periodFrom as string).split('-')[0], 10)
            : null,
          periodTo: edu.periodTo
            ? parseInt((edu.periodTo as string).split('-')[0], 10)
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
  let personalInfo = backendData.personalInfo as Record<string, unknown> | undefined;
  if (personalInfo) {
    personalInfo = {
      ...personalInfo,
      dateOfBirth: stringToDate(personalInfo.dateOfBirth as DateLike),
      heightM: stringToNumber(personalInfo.heightM as NumberLike),
      weightKg: stringToNumber(personalInfo.weightKg as NumberLike),
    };
  }

  // Convert children dateOfBirth
  let children = (backendData.children || []) as Record<string, unknown>[];
  if (Array.isArray(children)) {
    children = children.map((child: Record<string, unknown>) => ({
      ...child,
      dateOfBirth: stringToDate(child.dateOfBirth as DateLike),
    }));
  }

  // Convert Civil Service dates and rating
  let eligibility = (backendData.civilService || []) as Record<string, unknown>[];
  if (Array.isArray(eligibility)) {
    eligibility = eligibility.map((item: Record<string, unknown>) => ({
      ...item,
      id: item.id, // CRITICAL: Preserve ID for attachment linking
      dateOfExam: stringToDate(item.dateOfExam as DateLike),
      licenseValidityDate: stringToDate(item.licenseValidityDate as DateLike),
      rating: stringToNumber(item.rating as NumberLike),
      _attachmentIds: (item._attachmentIds as string[] | undefined) || [], // Restore for PdsContext sync
    }));
  }

  // Convert Work Experience dates and numbers
  let workExperience = (backendData.workExperience || []) as Record<string, unknown>[];
  if (Array.isArray(workExperience)) {
    workExperience = workExperience.map((item: Record<string, unknown>) => ({
      ...item,
      dateFrom: stringToDate(item.dateFrom as DateLike),
      dateTo: stringToDate(item.dateTo as DateLike),
      monthlySalary: stringToNumber(item.monthlySalary as NumberLike),
    }));
  }

  // Convert Voluntary Work dates and numbers
  let voluntaryWork = (backendData.voluntaryWork || []) as Record<string, unknown>[];
  if (Array.isArray(voluntaryWork)) {
    voluntaryWork = voluntaryWork.map((item: Record<string, unknown>) => ({
      ...item,
      dateFrom: stringToDate(item.dateFrom as DateLike),
      dateTo: stringToDate(item.dateTo as DateLike),
      numberOfHours: stringToNumber(item.numberOfHours as NumberLike),
    }));
  }

  // Convert Training/Learning Development dates and numbers
  let learningDevelopment = (backendData.training || []) as Record<string, unknown>[];
  if (Array.isArray(learningDevelopment)) {
    learningDevelopment = learningDevelopment.map((item: Record<string, unknown>) => ({
      ...item,
      id: item.id, // CRITICAL: Preserve ID for attachment linking
      dateFrom: stringToDate(item.dateFrom as DateLike),
      dateTo: stringToDate(item.dateTo as DateLike),
      hours: stringToNumber(item.hours as NumberLike),
      _attachmentIds: (item._attachmentIds as string[] | undefined) || [], // Restore for PdsContext sync
    }));
  }

  // ========================================================================
  // STEP 3: Create frontend-compatible data structure
  // ========================================================================
  // IMPORTANT: Children are stored as a SEPARATE property in backend
  // but frontend expects them nested in family.children
  // We must merge children back into the family object
  const familyBackground = backendData.familyBackground as Record<string, unknown> | undefined;
  const frontendData: Partial<CompletePdsData> = {
    personalInfo: personalInfo as unknown as CompletePdsData['personalInfo'],
    // Merge children back into family object - backend stores them separately
    family: familyBackground ? {
      ...familyBackground,
      children,
    } as unknown as CompletePdsData['family'] : { children } as unknown as CompletePdsData['family'],
    education: educationObj as unknown as CompletePdsData['education'],
    eligibility: eligibility as unknown as CompletePdsData['eligibility'],
    workExperience: workExperience as unknown as CompletePdsData['workExperience'],
    voluntaryWork: voluntaryWork as unknown as CompletePdsData['voluntaryWork'],
    learningDevelopment: learningDevelopment as unknown as CompletePdsData['learningDevelopment'],
    otherInfo: backendData.otherInfo as unknown as CompletePdsData['otherInfo'],
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
export function transformPdsForPdf<T extends object>(dataInput: T): PDSData {
  // Cast to Record<string, unknown> for property access across serialization boundary
  const data = dataInput as unknown as Record<string, unknown>;
  // STEP 1: Validate input data
  if (!data) {
    throw new Error('Cannot transform PDS for PDF: Data is null or undefined');
  }

  // STEP 2: Handle both direct structure and nested submission structure
  const personalInfo = (data.personalInfo || {}) as Record<string, unknown>;
  const familyBackground = (data.familyBackground || data.family || {}) as Record<string, unknown>;
  const children = (data.children || familyBackground.children || []) as Record<string, unknown>[];
  const education = data.education || {};
  const civilService = (data.civilService || data.eligibility || []) as Record<string, unknown>[];
  const workExperience = (data.workExperience || []) as Record<string, unknown>[];
  const voluntaryWork = (data.voluntaryWork || []) as Record<string, unknown>[];
  const training = (data.training || data.learningDevelopment || []) as Record<string, unknown>[];
  const otherInfo = (data.otherInfo || {}) as Record<string, unknown>;

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
  const transformAddress = (addr: Record<string, unknown> | null | undefined) => {
    if (!addr) return {};
    return {
      houseNumber: (addr.houseNumber as string | null) || (addr.house_number as string | null) || null,
      street: (addr.street as string | null) || (addr.streetName as string | null) || null,
      subdivision: (addr.subdivision as string | null) || null,
      barangay: (addr.barangay as string | null) || null,
      city: (addr.city as string | null) || (addr.cityMunicipality as string | null) || null,
      province: (addr.province as string | null) || null,
      zipCode: (addr.zipCode as string | null) || (addr.zip_code as string | null) || null,
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
      const eduObj = education as Record<string, Record<string, unknown> | null | undefined>;
      const buildLevel = (level: string) => {
        const ed = eduObj[level];
        if (!ed) return null;
        return {
          level: level as 'elementary' | 'secondary' | 'vocational' | 'college' | 'graduate',
          schoolName: (ed.schoolName as string) || '',
          degreeCourse: ed.degreeCourse || null,
          periodFrom: ed.periodFrom || null,
          periodTo: ed.periodTo || null,
          highestLevelEarned: ed.highestLevelEarned || null,
          yearGraduated: ed.yearGraduated || null,
          honorsReceived: ed.honorsReceived || null,
        };
      };
      return {
        elementary: buildLevel('elementary'),
        secondary: buildLevel('secondary'),
        vocational: buildLevel('vocational'),
        college: buildLevel('college'),
        graduate: buildLevel('graduate'),
      };
    }

    // Handle array format (from database)
    if (Array.isArray(education)) {
      const result: Record<string, unknown> = {};
      (education as Record<string, unknown>[]).forEach((edu) => {
        if (edu.level) {
          result[edu.level as string] = {
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
    const questions = (otherInfo.questions || {}) as Record<string, boolean | string | undefined>;
    return {
      Q34_criminal_charged: (questions.Q34_criminal_charged as boolean) || false,
      Q34_criminal_charged_details:
        (questions.Q34_criminal_charged_details as string) || undefined,
      Q35_criminal_convicted: (questions.Q35_criminal_convicted as boolean) || false,
      Q35_criminal_convicted_details:
        (questions.Q35_criminal_convicted_details as string) || undefined,
      Q36_separated_from_service: (questions.Q36_separated_from_service as boolean) || false,
      Q36_separated_from_service_details:
        (questions.Q36_separated_from_service_details as string) || undefined,
      Q37_candidate_for_election: (questions.Q37_candidate_for_election as boolean) || false,
      Q37_candidate_for_election_details:
        (questions.Q37_candidate_for_election_details as string) || undefined,
      Q38_resigned_from_government:
        (questions.Q38_resigned_from_government as boolean) || false,
      Q38_resigned_from_government_details:
        (questions.Q38_resigned_from_government_details as string) || undefined,
      Q39_immigrant_or_acquired_residence:
        (questions.Q39_immigrant_or_acquired_residence as boolean) || false,
      Q39_immigrant_or_acquired_residence_details:
        (questions.Q39_immigrant_or_acquired_residence_details as string) || undefined,
      Q40_indigenous_group: (questions.Q40_indigenous_group as boolean) || false,
      Q40_indigenous_group_details:
        (questions.Q40_indigenous_group_details as string) || undefined,
      Q41_disabled: (questions.Q41_disabled as boolean) || false,
      Q41_disabled_details: (questions.Q41_disabled_details as string) || undefined,
      Q42_solo_parent: (questions.Q42_solo_parent as boolean) || false,
      Q42_solo_parent_details: (questions.Q42_solo_parent_details as string) || undefined,
    };
  };

  const submission = data.submission as Record<string, unknown> | undefined;

  // Build the transformed data with safe defaults
  const transformedData: PDSData = {
    id: (data.id || submission?.id || '') as string,
    submittedAt: (data.submittedAt || submission?.submittedAt || null) as Date | string | null,
    version: (data.version || submission?.version || 1) as number,

    personalInfo: {
      surname: personalInfo.surname as string,
      firstName: personalInfo.firstName as string,
      middleName: (personalInfo.middleName as string | null) ?? null,
      nameExtension: (personalInfo.nameExtension as string | null) ?? null,
      dateOfBirth: ((personalInfo.dateOfBirth as DateLike) ?? '') as Date | string,
      placeOfBirth: (personalInfo.placeOfBirth as string) || '',
      sex: (personalInfo.sex as 'male' | 'female') || 'male',
      civilStatus: (personalInfo.civilStatus as 'single' | 'married' | 'widowed' | 'separated' | 'divorced') || 'single',
      heightM: stringToNumber(personalInfo.heightM as NumberLike),
      weightKg: stringToNumber(personalInfo.weightKg as NumberLike),
      bloodType: (personalInfo.bloodType as string | null) ?? null,
      gsisNo: (personalInfo.gsisNo as string | null) ?? null,
      pagibigNo: (personalInfo.pagibigNo as string | null) ?? null,
      philhealthNo: (personalInfo.philhealthNo as string | null) ?? null,
      sssNo: (personalInfo.sssNo as string | null) ?? null,
      tinNo: (personalInfo.tinNo as string | null) ?? null,
      agencyEmployeeNo: (personalInfo.agencyEmployeeNo as string | null) ?? null,
      philsysNo: (personalInfo.philsysNo as string | null) ?? null,
      citizenship: (personalInfo.citizenship as { type: 'Filipino' | 'Dual'; details?: string }) || { type: 'Filipino' },
      residentialAddress: transformAddress(personalInfo.residentialAddress as Record<string, unknown> | null | undefined),
      permanentAddress: transformAddress(personalInfo.permanentAddress as Record<string, unknown> | null | undefined),
      telephoneNo: (personalInfo.telephoneNo as string | null) ?? null,
      mobileNo: (personalInfo.mobileNo as string | null) ?? null,
      emailAddress: (personalInfo.emailAddress as string | null) ?? null,
    },

    familyBackground: {
      spouseSurname: (familyBackground.spouseSurname as string | null) ?? null,
      spouseFirstName: (familyBackground.spouseFirstName as string | null) ?? null,
      spouseMiddleName: (familyBackground.spouseMiddleName as string | null) ?? null,
      spouseNameExtension: (familyBackground.spouseNameExtension as string | null) ?? null,
      spouseOccupation: (familyBackground.spouseOccupation as string | null) ?? null,
      spouseEmployer: (familyBackground.spouseEmployer as string | null) ?? null,
      spouseBusinessAddress: (familyBackground.spouseBusinessAddress as string | null) ?? null,
      spouseTelephoneNo: (familyBackground.spouseTelephoneNo as string | null) ?? null,
      fatherSurname: (familyBackground.fatherSurname as string | null) ?? null,
      fatherFirstName: (familyBackground.fatherFirstName as string | null) ?? null,
      fatherMiddleName: (familyBackground.fatherMiddleName as string | null) ?? null,
      fatherNameExtension: (familyBackground.fatherNameExtension as string | null) ?? null,
      motherMaidenSurname: (familyBackground.motherMaidenSurname as string | null) ?? null,
      motherFirstName: (familyBackground.motherFirstName as string | null) ?? null,
      motherMiddleName: (familyBackground.motherMiddleName as string | null) ?? null,
      children: Array.isArray(children)
        ? children.map((child: Record<string, unknown>) => ({
            fullName: (child.fullName as string) || '',
            dateOfBirth: ((child.dateOfBirth as DateLike) ?? '') as Date | string,
          }))
        : [],
    },

    education: transformEducation() as PDSData['education'],

    civilServiceEligibilities: Array.isArray(civilService)
      ? civilService.map((cs: Record<string, unknown>) => ({
          eligibilityName: (cs.eligibilityName as string) || '',
          rating: (cs.rating as number | null) ?? null,
          dateOfExam: (cs.dateOfExam ?? null) as Date | string | null,
          placeOfExam: (cs.placeOfExam as string | null) ?? null,
          licenseNo: (cs.licenseNo as string | null) ?? null,
          licenseValidityDate: (cs.licenseValidityDate ?? null) as Date | string | null,
        }))
      : [],

    workExperiences: Array.isArray(workExperience)
      ? workExperience.map((work: Record<string, unknown>) => ({
          dateFrom: ((work.dateFrom as DateLike) ?? '') as Date | string,
          dateTo: (work.dateTo ?? null) as Date | string | null,
          positionTitle: (work.positionTitle as string) || '',
          departmentAgency: (work.departmentAgency as string) || '',
          monthlySalary: (work.monthlySalary as number | null) ?? null,
          salaryGrade: (work.salaryGrade as string | null) ?? null,
          statusOfAppointment: (work.statusOfAppointment as string | null) ?? null,
          isGovernment: (work.isGovernment as boolean) ?? false,
        }))
      : [],

    voluntaryWorks: Array.isArray(voluntaryWork)
      ? voluntaryWork.map((vol: Record<string, unknown>) => ({
          organizationName: (vol.organizationName as string) || '',
          organizationAddress: (vol.organizationAddress as string | null) ?? null,
          dateFrom: ((vol.dateFrom as DateLike) ?? '') as Date | string,
          dateTo: (vol.dateTo ?? null) as Date | string | null,
          numberOfHours: (vol.numberOfHours as number | null) ?? null,
          positionNature: (vol.positionNature as string | null) ?? null,
        }))
      : [],

    trainings: Array.isArray(training)
      ? training.map((t: Record<string, unknown>) => ({
          title: (t.title as string) || '',
          dateFrom: ((t.dateFrom as DateLike) ?? '') as Date | string,
          dateTo: ((t.dateTo as DateLike) ?? '') as Date | string,
          hours: (t.hours as number | null) ?? null,
          typeOfLd: (t.typeOfLd as string | null) ?? null,
          conductedBy: (t.conductedBy as string | null) ?? null,
        }))
      : [],

    skills: (otherInfo.skills as string[]) || [],
    recognitions: Array.isArray(otherInfo.recognitions)
      ? (otherInfo.recognitions as Record<string, unknown>[]).map((r) => ({
          title: (r.title as string) || '',
          year: (r.year as number) || 0,
          organization: (r.organization as string) || '',
        }))
      : [],
    associations: Array.isArray(otherInfo.associations)
      ? (otherInfo.associations as Record<string, unknown>[]).map((a) => ({
          name: (a.name as string) || '',
          position: (a.position as string) ?? undefined,
          yearJoined: (a.yearJoined as number) ?? undefined,
        }))
      : [],

    questions: transformQuestions(),

    references: Array.isArray(otherInfo.references)
      ? (otherInfo.references as Record<string, unknown>[]).map((ref) => ({
          name: (ref.name as string) || '',
          address: (ref.address as string) || '',
          telephoneNo: (ref.telephoneNo as string) ?? undefined,
        }))
      : [],

    governmentId: (data.governmentId as PDSData['governmentId']) ?? undefined,
    photoUrl: (data.photoUrl as string | null) ?? null,
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
