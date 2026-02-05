/**
 * SALN Data Transformation Utilities
 *
 * Comprehensive transformations for SALN data across different formats:
 * 1. Frontend ↔ Backend (API submission/retrieval)
 * 2. Type conversions and decimal handling
 * 3. 2025 SALN format support with owner-based filtering
 *
 * Key transformations:
 * 1. Type conversions for serialized data:
 *    - dateOfAcquisition: string → Date (businessInterests)
 *    - All currency fields: number → string with toFixed(2) for database decimal(15,2)
 *    - yearAcquired: string/number → number
 * 2. Nested structure flattening:
 *    - Frontend: { submission: {...}, realProperties: [...], ... }
 *    - Backend: Flat structure with separate sections
 * 3. Currency precision: Ensure exactly 2 decimal places for all amounts
 * 4. 2025 Format fields:
 *    - owner/childName on properties and liabilities
 *    - Compliance type and date
 *    - Multiple marriages disclosure
 *    - Spouse public official status
 *    - Unmarried children JSONB
 *    - Secondary government ID
 */

import type { CompleteSalnData } from '../validations/saln-schema';

/**
 * Helper function to convert string to Date
 */
function stringToDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/**
 * Helper function to convert number/string to number with precision
 */
function toCurrency(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Math.round(value * 100) / 100;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }
  return 0;
}

/**
 * Helper function to format currency for database (decimal 15,2)
 */
function formatForDb(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  return value.toFixed(2);
}

/**
 * Transform a flat (legacy) payload to ensure proper DB formatting
 * Used when the payload is already in flat format (e.g., already transformed once)
 * This prevents double-transformation issues
 *
 * @param data - Flat payload with year, filingType at root level
 * @returns Properly formatted flat payload for DB
 */
function transformFlatPayload(data: any): any {
  const result: any = {
    year: data.year,
    filingType: data.filingType || 'separate',
  };

  // Pass through optional scalar fields
  if (data.spouseName !== undefined) {
    result.spouseName = data.spouseName;
  }
  if (data.position !== undefined) {
    result.position = data.position;
  }
  if (data.agency !== undefined) {
    result.agency = data.agency;
  }
  if (data.officeAddress !== undefined) {
    result.officeAddress = data.officeAddress;
  }

  // 2025 SALN Format submission fields
  if (data.complianceType !== undefined) {
    result.complianceType = data.complianceType;
  }
  if (data.complianceDate !== undefined) {
    result.complianceDate = data.complianceDate instanceof Date
      ? data.complianceDate.toISOString()
      : data.complianceDate;
  }
  if (data.hasMultipleMarriages !== undefined) {
    result.hasMultipleMarriages = data.hasMultipleMarriages;
  }
  if (data.previousSpouseNames !== undefined) {
    result.previousSpouseNames = data.previousSpouseNames;
  }
  if (data.spouseIsPublicOfficial !== undefined) {
    result.spouseIsPublicOfficial = data.spouseIsPublicOfficial;
  }
  if (data.spousePosition !== undefined) {
    result.spousePosition = data.spousePosition;
  }
  if (data.spouseAgency !== undefined) {
    result.spouseAgency = data.spouseAgency;
  }
  if (data.spouseOfficeAddress !== undefined) {
    result.spouseOfficeAddress = data.spouseOfficeAddress;
  }
  if (data.unmarriedChildren !== undefined) {
    result.unmarriedChildren = data.unmarriedChildren;
  }
  if (data.hasNoBusinessInterests !== undefined) {
    result.hasNoBusinessInterests = data.hasNoBusinessInterests;
  }
  if (data.hasNoRelativesInGov !== undefined) {
    result.hasNoRelativesInGov = data.hasNoRelativesInGov;
  }
  if (data.governmentIdType !== undefined) {
    result.governmentIdType = data.governmentIdType;
  }
  if (data.governmentIdNumber !== undefined) {
    result.governmentIdNumber = data.governmentIdNumber;
  }
  if (data.governmentIdDateIssued !== undefined) {
    result.governmentIdDateIssued = data.governmentIdDateIssued instanceof Date
      ? data.governmentIdDateIssued.toISOString()
      : data.governmentIdDateIssued;
  }
  if (data.declarantTin !== undefined) {
    result.declarantTin = data.declarantTin;
  }
  if (data.spouseTin !== undefined) {
    result.spouseTin = data.spouseTin;
  }
  if (data.spouseDateOfBirth !== undefined) {
    result.spouseDateOfBirth = data.spouseDateOfBirth instanceof Date
      ? data.spouseDateOfBirth.toISOString()
      : data.spouseDateOfBirth;
  }
  if (data.governmentIdType2 !== undefined) {
    result.governmentIdType2 = data.governmentIdType2;
  }
  if (data.governmentIdNumber2 !== undefined) {
    result.governmentIdNumber2 = data.governmentIdNumber2;
  }
  if (data.governmentIdDateIssued2 !== undefined) {
    result.governmentIdDateIssued2 = data.governmentIdDateIssued2 instanceof Date
      ? data.governmentIdDateIssued2.toISOString()
      : data.governmentIdDateIssued2;
  }
  if (data.salnFormatVersion !== undefined) {
    result.salnFormatVersion = data.salnFormatVersion;
  }

  // Transform arrays if present (ensure proper DB formatting)
  if (data.realProperties !== undefined) {
    result.realProperties = data.realProperties.map((prop: any) => ({
      description: prop.description,
      kind: prop.kind,
      exactLocation: prop.exactLocation,
      assessedValue: typeof prop.assessedValue === 'string' ? prop.assessedValue : formatForDb(toCurrency(prop.assessedValue)),
      currentFairMarketValue: typeof prop.currentFairMarketValue === 'string' ? prop.currentFairMarketValue : formatForDb(toCurrency(prop.currentFairMarketValue)),
      acquisitionYear: prop.acquisitionYear,
      acquisitionMode: prop.acquisitionMode,
      acquisitionCost: typeof prop.acquisitionCost === 'string' ? prop.acquisitionCost : formatForDb(toCurrency(prop.acquisitionCost)),
      // 2025 SALN Format fields
      owner: prop.owner || 'declarant',
      childName: prop.childName ?? null,
    }));
  }

  if (data.personalProperties !== undefined) {
    result.personalProperties = data.personalProperties.map((prop: any) => ({
      description: prop.description,
      yearAcquired: prop.yearAcquired,
      acquisitionCost: typeof prop.acquisitionCost === 'string' ? prop.acquisitionCost : formatForDb(toCurrency(prop.acquisitionCost)),
      // 2025 SALN Format fields
      owner: prop.owner || 'declarant',
      childName: prop.childName ?? null,
    }));
  }

  if (data.liabilities !== undefined) {
    result.liabilities = data.liabilities.map((liability: any) => ({
      nature: liability.nature,
      creditorName: liability.creditorName,
      outstandingBalance: typeof liability.outstandingBalance === 'string' ? liability.outstandingBalance : formatForDb(toCurrency(liability.outstandingBalance)),
      // 2025 SALN Format fields
      owner: liability.owner || 'declarant',
      childName: liability.childName ?? null,
    }));
  }

  if (data.businessInterests !== undefined) {
    result.businessInterests = data.businessInterests.map((interest: any) => {
      const date = stringToDate(interest.dateOfAcquisition);
      return {
        entityName: interest.entityName,
        businessAddress: interest.businessAddress,
        natureOfBusiness: interest.natureOfBusiness,
        dateOfAcquisition: date ? date.toISOString() : (interest.dateOfAcquisition || null),
        // 2025 SALN Format fields
        owner: interest.owner || 'declarant',
        childName: interest.childName ?? null,
      };
    });
  }

  if (data.relativesInGov !== undefined) {
    result.relativesInGov = data.relativesInGov.map((relative: any) => ({
      name: relative.name,
      relationship: relative.relationship,
      position: relative.position,
      agencyAddress: relative.agencyAddress,
    }));
  }

  return result;
}

/**
 * Transforms SALN data from frontend format to backend format
 *
 * IMPORTANT: This function preserves undefined values for partial updates.
 * Only sections explicitly provided in data will be included in the result.
 * This allows the API/database layer to distinguish between:
 * - undefined: Don't update this section (preserve existing data)
 * - []: Clear all items in this section
 *
 * BACKWARD COMPATIBILITY: This function accepts both:
 * 1. Nested format (preferred): { submission: { year, filingType, ... }, realProperties: [...] }
 * 2. Legacy flat format: { year, filingType, realProperties: [...] }
 *
 * Detection: If `data.submission` exists, use nested format. Otherwise, treat as flat.
 *
 * @param data - Form data in frontend format (CompleteSalnData) or legacy flat format
 * @returns Transformed data ready for backend API
 */
export function transformSalnForSubmission(data: Partial<CompleteSalnData> | any): any {
  // ========================================================================
  // STEP 0: Detect input format (nested vs flat/legacy)
  // If data.submission exists, it's nested format from the form
  // If data.year exists but data.submission doesn't, it's already flat (legacy)
  // ========================================================================
  const isNestedFormat = data.submission !== undefined;
  const isLegacyFlatFormat = !isNestedFormat && data.year !== undefined;

  // If already in flat format (legacy), just pass through with minimal processing
  if (isLegacyFlatFormat) {
    console.log('[transformSalnForSubmission] Detected legacy flat format, passing through');
    return transformFlatPayload(data);
  }

  // ========================================================================
  // STEP 1: Extract submission metadata from nested format
  // ========================================================================
  const submission = data.submission || {
    year: new Date().getFullYear(),
    filingType: 'separate' as const,
    spouseName: null,
    position: undefined,
    agency: undefined,
    officeAddress: undefined,
  };

  // ========================================================================
  // STEP 2: Transform Real Properties (Section II) - preserve undefined
  // ========================================================================
  const realProperties = data.realProperties !== undefined
    ? data.realProperties.map((prop: any) => ({
        description: prop.description,
        kind: prop.kind,
        exactLocation: prop.exactLocation,
        assessedValue: formatForDb(toCurrency(prop.assessedValue)),
        currentFairMarketValue: formatForDb(toCurrency(prop.currentFairMarketValue)),
        acquisitionYear: prop.acquisitionYear,
        acquisitionMode: prop.acquisitionMode,
        acquisitionCost: formatForDb(toCurrency(prop.acquisitionCost)),
        // 2025 SALN Format fields
        owner: prop.owner || 'declarant',
        childName: prop.childName ?? null,
      }))
    : undefined;

  // ========================================================================
  // STEP 3: Transform Personal Properties (Section III) - preserve undefined
  // ========================================================================
  const personalProperties = data.personalProperties !== undefined
    ? data.personalProperties.map((prop: any) => ({
        description: prop.description,
        yearAcquired: prop.yearAcquired,
        acquisitionCost: formatForDb(toCurrency(prop.acquisitionCost)),
        // 2025 SALN Format fields
        owner: prop.owner || 'declarant',
        childName: prop.childName ?? null,
      }))
    : undefined;

  // ========================================================================
  // STEP 4: Transform Liabilities (Section IV) - preserve undefined
  // ========================================================================
  const liabilities = data.liabilities !== undefined
    ? data.liabilities.map((liability: any) => ({
        nature: liability.nature,
        creditorName: liability.creditorName,
        outstandingBalance: formatForDb(toCurrency(liability.outstandingBalance)),
        // 2025 SALN Format fields
        owner: liability.owner || 'declarant',
        childName: liability.childName ?? null,
      }))
    : undefined;

  // ========================================================================
  // STEP 5: Transform Business Interests (Section V) - preserve undefined
  // ========================================================================
  const businessInterests = data.businessInterests !== undefined
    ? data.businessInterests.map((interest: any) => {
        // Convert date to ISO string for database storage
        const date = stringToDate(interest.dateOfAcquisition);
        return {
          entityName: interest.entityName,
          businessAddress: interest.businessAddress,
          natureOfBusiness: interest.natureOfBusiness,
          dateOfAcquisition: date ? date.toISOString() : null,
          // 2025 SALN Format fields
          owner: interest.owner || 'declarant',
          childName: interest.childName ?? null,
        };
      })
    : undefined;

  // ========================================================================
  // STEP 6: Transform Relatives in Government (Section VI) - preserve undefined
  // ========================================================================
  const relativesInGov = data.relativesInGov !== undefined
    ? data.relativesInGov.map((relative: any) => ({
        name: relative.name,
        relationship: relative.relationship,
        position: relative.position,
        agencyAddress: relative.agencyAddress,
      }))
    : undefined;

  // ========================================================================
  // STEP 7: Create backend-compatible data structure
  // Only include defined sections (undefined sections will be omitted)
  // ========================================================================
  const result: any = {
    year: submission.year,
    filingType: submission.filingType || 'separate',
  };

  // Only include optional scalar fields if they have actual values
  // This prevents auto-save from overwriting existing database values
  // undefined = don't update (preserve existing)
  // null or string = update with new value
  if (submission.spouseName !== undefined) {
    result.spouseName = submission.spouseName;
  }
  if (submission.position !== undefined) {
    result.position = submission.position;
  }
  if (submission.agency !== undefined) {
    result.agency = submission.agency;
  }
  if (submission.officeAddress !== undefined) {
    result.officeAddress = submission.officeAddress;
  }

  // 2025 SALN Format submission fields
  if (submission.complianceType !== undefined) {
    result.complianceType = submission.complianceType;
  }
  if (submission.complianceDate !== undefined) {
    result.complianceDate = submission.complianceDate instanceof Date
      ? submission.complianceDate.toISOString()
      : submission.complianceDate;
  }
  if (submission.hasMultipleMarriages !== undefined) {
    result.hasMultipleMarriages = submission.hasMultipleMarriages;
  }
  if (submission.previousSpouseNames !== undefined) {
    result.previousSpouseNames = submission.previousSpouseNames;
  }
  if (submission.spouseIsPublicOfficial !== undefined) {
    result.spouseIsPublicOfficial = submission.spouseIsPublicOfficial;
  }
  if (submission.spousePosition !== undefined) {
    result.spousePosition = submission.spousePosition;
  }
  if (submission.spouseAgency !== undefined) {
    result.spouseAgency = submission.spouseAgency;
  }
  if (submission.spouseOfficeAddress !== undefined) {
    result.spouseOfficeAddress = submission.spouseOfficeAddress;
  }
  if (submission.unmarriedChildren !== undefined) {
    result.unmarriedChildren = submission.unmarriedChildren;
  }
  if (submission.hasNoBusinessInterests !== undefined) {
    result.hasNoBusinessInterests = submission.hasNoBusinessInterests;
  }
  if (submission.hasNoRelativesInGov !== undefined) {
    result.hasNoRelativesInGov = submission.hasNoRelativesInGov;
  }
  if (submission.governmentIdType !== undefined) {
    result.governmentIdType = submission.governmentIdType;
  }
  if (submission.governmentIdNumber !== undefined) {
    result.governmentIdNumber = submission.governmentIdNumber;
  }
  if (submission.governmentIdDateIssued !== undefined) {
    result.governmentIdDateIssued = submission.governmentIdDateIssued instanceof Date
      ? submission.governmentIdDateIssued.toISOString()
      : submission.governmentIdDateIssued;
  }
  if (submission.declarantTin !== undefined) {
    result.declarantTin = submission.declarantTin;
  }
  if (submission.spouseTin !== undefined) {
    result.spouseTin = submission.spouseTin;
  }
  if (submission.spouseDateOfBirth !== undefined) {
    result.spouseDateOfBirth = submission.spouseDateOfBirth instanceof Date
      ? submission.spouseDateOfBirth.toISOString()
      : submission.spouseDateOfBirth;
  }
  if (submission.governmentIdType2 !== undefined) {
    result.governmentIdType2 = submission.governmentIdType2;
  }
  if (submission.governmentIdNumber2 !== undefined) {
    result.governmentIdNumber2 = submission.governmentIdNumber2;
  }
  if (submission.governmentIdDateIssued2 !== undefined) {
    result.governmentIdDateIssued2 = submission.governmentIdDateIssued2 instanceof Date
      ? submission.governmentIdDateIssued2.toISOString()
      : submission.governmentIdDateIssued2;
  }
  if (submission.salnFormatVersion !== undefined) {
    result.salnFormatVersion = submission.salnFormatVersion;
  }

  // Only add section arrays if they were explicitly provided
  if (realProperties !== undefined) result.realProperties = realProperties;
  if (personalProperties !== undefined) result.personalProperties = personalProperties;
  if (liabilities !== undefined) result.liabilities = liabilities;
  if (businessInterests !== undefined) result.businessInterests = businessInterests;
  if (relativesInGov !== undefined) result.relativesInGov = relativesInGov;

  return result;
}

/**
 * Reverse transforms SALN data from backend format to frontend format
 * Used when loading submissions from database
 *
 * @param backendData - Data in backend format (from database)
 * @returns Transformed data ready for frontend form
 */
export function transformSalnFromBackend(backendData: any): Partial<CompleteSalnData> {
  // ========================================================================
  // STEP 1: Transform submission metadata
  // Use nullish coalescing (??) to preserve empty strings if intentionally cleared
  // ========================================================================
  const submission = {
    id: backendData.id,
    userId: backendData.userId,
    year: backendData.year,
    filingType: backendData.filingType || 'separate',
    spouseName: backendData.spouseName ?? null,
    position: backendData.position ?? undefined,
    agency: backendData.agency ?? undefined,
    officeAddress: backendData.officeAddress ?? undefined,
    status: backendData.status || 'draft',
    submittedAt: backendData.submittedAt ? new Date(backendData.submittedAt) : null,
    approvedAt: backendData.approvedAt ? new Date(backendData.approvedAt) : null,
    approvedBy: backendData.approvedBy || null,
    createdAt: backendData.createdAt ? new Date(backendData.createdAt) : new Date(),
    updatedAt: backendData.updatedAt ? new Date(backendData.updatedAt) : new Date(),
    // 2025 SALN Format fields
    complianceType: backendData.complianceType || 'annual',
    complianceDate: backendData.complianceDate ? new Date(backendData.complianceDate) : undefined,
    hasMultipleMarriages: backendData.hasMultipleMarriages ?? false,
    previousSpouseNames: backendData.previousSpouseNames ?? null,
    spouseIsPublicOfficial: backendData.spouseIsPublicOfficial ?? false,
    spousePosition: backendData.spousePosition ?? null,
    spouseAgency: backendData.spouseAgency ?? null,
    spouseOfficeAddress: backendData.spouseOfficeAddress ?? null,
    unmarriedChildren: backendData.unmarriedChildren ?? [],
    hasNoBusinessInterests: backendData.hasNoBusinessInterests ?? false,
    hasNoRelativesInGov: backendData.hasNoRelativesInGov ?? false,
    governmentIdType: backendData.governmentIdType ?? null,
    governmentIdNumber: backendData.governmentIdNumber ?? null,
    governmentIdDateIssued: backendData.governmentIdDateIssued ? new Date(backendData.governmentIdDateIssued) : null,
    declarantTin: backendData.declarantTin ?? null,
    spouseTin: backendData.spouseTin ?? null,
    spouseDateOfBirth: backendData.spouseDateOfBirth ? new Date(backendData.spouseDateOfBirth) : null,
    governmentIdType2: backendData.governmentIdType2 ?? null,
    governmentIdNumber2: backendData.governmentIdNumber2 ?? null,
    governmentIdDateIssued2: backendData.governmentIdDateIssued2 ? new Date(backendData.governmentIdDateIssued2) : null,
    salnFormatVersion: backendData.salnFormatVersion ?? 2025,
  };

  // ========================================================================
  // STEP 2: Transform Real Properties (Section II)
  // ========================================================================
  const realProperties = (backendData.realProperties || []).map((prop: any) => ({
    id: prop.id,
    salnSubmissionId: prop.salnSubmissionId,
    description: prop.description,
    kind: prop.kind,
    exactLocation: prop.exactLocation,
    assessedValue: toCurrency(prop.assessedValue),
    currentFairMarketValue: toCurrency(prop.currentFairMarketValue),
    acquisitionYear: prop.acquisitionYear,
    acquisitionMode: prop.acquisitionMode,
    acquisitionCost: toCurrency(prop.acquisitionCost),
    // 2025 SALN Format fields
    owner: prop.owner || 'declarant',
    childName: prop.childName ?? null,
  }));

  // ========================================================================
  // STEP 3: Transform Personal Properties (Section III)
  // ========================================================================
  const personalProperties = (backendData.personalProperties || []).map((prop: any) => ({
    id: prop.id,
    salnSubmissionId: prop.salnSubmissionId,
    description: prop.description,
    yearAcquired: prop.yearAcquired,
    acquisitionCost: toCurrency(prop.acquisitionCost),
    // 2025 SALN Format fields
    owner: prop.owner || 'declarant',
    childName: prop.childName ?? null,
  }));

  // ========================================================================
  // STEP 4: Transform Liabilities (Section IV)
  // ========================================================================
  const liabilities = (backendData.liabilities || []).map((liability: any) => ({
    id: liability.id,
    salnSubmissionId: liability.salnSubmissionId,
    nature: liability.nature,
    creditorName: liability.creditorName,
    outstandingBalance: toCurrency(liability.outstandingBalance),
    // 2025 SALN Format fields
    owner: liability.owner || 'declarant',
    childName: liability.childName ?? null,
  }));

  // ========================================================================
  // STEP 5: Transform Business Interests (Section V)
  // ========================================================================
  const businessInterests = (backendData.businessInterests || []).map((interest: any) => ({
    id: interest.id,
    salnSubmissionId: interest.salnSubmissionId,
    entityName: interest.entityName,
    businessAddress: interest.businessAddress,
    natureOfBusiness: interest.natureOfBusiness,
    dateOfAcquisition: stringToDate(interest.dateOfAcquisition),
    // 2025 SALN Format fields
    owner: interest.owner || 'declarant',
    childName: interest.childName ?? null,
  }));

  // ========================================================================
  // STEP 6: Transform Relatives in Government (Section VI)
  // ========================================================================
  const relativesInGov = (backendData.relativesInGov || []).map((relative: any) => ({
    id: relative.id,
    salnSubmissionId: relative.salnSubmissionId,
    name: relative.name,
    relationship: relative.relationship,
    position: relative.position,
    agencyAddress: relative.agencyAddress,
  }));

  // ========================================================================
  // STEP 7: Calculate totals (Section VII - Summary)
  // ========================================================================
  const totalRealPropertyValue = realProperties.reduce(
    (sum: number, prop: any) => sum + (prop.currentFairMarketValue || 0),
    0
  );

  const totalPersonalPropertyValue = personalProperties.reduce(
    (sum: number, prop: any) => sum + (prop.acquisitionCost || 0),
    0
  );

  const totalAssets = totalRealPropertyValue + totalPersonalPropertyValue;

  const totalLiabilities = liabilities.reduce(
    (sum: number, liability: any) => sum + (liability.outstandingBalance || 0),
    0
  );

  const netWorth = totalAssets - totalLiabilities;

  const calculations = {
    totalRealPropertyValue,
    totalPersonalPropertyValue,
    totalAssets,
    totalLiabilities,
    netWorth,
  };

  // ========================================================================
  // STEP 8: Create frontend-compatible data structure
  // ========================================================================
  return {
    submission,
    realProperties,
    personalProperties,
    liabilities,
    businessInterests,
    relativesInGov,
    calculations,
  };
}

/**
 * Calculate SALN totals from frontend data
 * Used for real-time calculation display
 *
 * @param data - Partial SALN data
 * @returns Calculated totals
 */
export function calculateSalnTotals(data: Partial<CompleteSalnData>): {
  totalRealPropertyValue: number;
  totalPersonalPropertyValue: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
} {
  const totalRealPropertyValue = (data.realProperties || []).reduce(
    (sum: number, prop: any) => {
      const value = toCurrency(prop.currentFairMarketValue);
      return sum + (isNaN(value) ? 0 : value);
    },
    0
  );

  const totalPersonalPropertyValue = (data.personalProperties || []).reduce(
    (sum: number, prop: any) => {
      const value = toCurrency(prop.acquisitionCost);
      return sum + (isNaN(value) ? 0 : value);
    },
    0
  );

  const totalAssets = totalRealPropertyValue + totalPersonalPropertyValue;

  const totalLiabilities = (data.liabilities || []).reduce(
    (sum: number, liability: any) => {
      const value = toCurrency(liability.outstandingBalance);
      return sum + (isNaN(value) ? 0 : value);
    },
    0
  );

  const netWorth = totalAssets - totalLiabilities;

  return {
    totalRealPropertyValue: Math.round(totalRealPropertyValue * 100) / 100,
    totalPersonalPropertyValue: Math.round(totalPersonalPropertyValue * 100) / 100,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    netWorth: Math.round(netWorth * 100) / 100,
  };
}

// ============================================================================
// 2025 SALN FORMAT HELPER FUNCTIONS
// ============================================================================

/**
 * Property owner type for 2025 SALN format
 */
export type PropertyOwner = 'declarant' | 'spouse' | 'child' | 'joint';

/**
 * Compliance type for 2025 SALN format
 */
export type ComplianceType = 'assumption' | 'annual' | 'exit';

/**
 * Filter items by owner type
 * @param items - Array of items with 'owner' field
 * @param owner - Owner type to filter by
 * @returns Filtered array
 */
export function filterByOwner<T extends { owner?: string | null }>(
  items: T[],
  owner: PropertyOwner
): T[] {
  return items.filter((item) => item.owner === owner);
}

/**
 * Group items by owner type
 * @param items - Array of items with 'owner' field
 * @returns Object with arrays for each owner type
 */
export function groupByOwner<T extends { owner?: string | null }>(
  items: T[]
): Record<PropertyOwner, T[]> {
  return {
    declarant: items.filter((item) => item.owner === 'declarant' || !item.owner),
    spouse: items.filter((item) => item.owner === 'spouse'),
    child: items.filter((item) => item.owner === 'child'),
    joint: items.filter((item) => item.owner === 'joint'),
  };
}

/**
 * Calculate totals by owner for 2025 SALN format
 * @param data - SALN data with realProperties, personalProperties, and liabilities
 * @returns Totals broken down by owner
 */
export function calculateTotalsByOwner(data: Partial<CompleteSalnData>): {
  declarant: { assets: number; liabilities: number; netWorth: number };
  spouse: { assets: number; liabilities: number; netWorth: number };
  child: { assets: number; liabilities: number; netWorth: number };
  joint: { assets: number; liabilities: number; netWorth: number };
  combined: { assets: number; liabilities: number; netWorth: number };
} {
  const realProps = data.realProperties || [];
  const personalProps = data.personalProperties || [];
  const liabilities = data.liabilities || [];

  const realByOwner = groupByOwner(realProps);
  const personalByOwner = groupByOwner(personalProps);
  const liabilitiesByOwner = groupByOwner(liabilities);

  const calculateOwnerTotals = (owner: PropertyOwner) => {
    const realTotal = realByOwner[owner].reduce(
      (sum, p: any) => sum + toCurrency(p.currentFairMarketValue),
      0
    );
    const personalTotal = personalByOwner[owner].reduce(
      (sum, p: any) => sum + toCurrency(p.acquisitionCost),
      0
    );
    const assets = realTotal + personalTotal;
    const liabTotal = liabilitiesByOwner[owner].reduce(
      (sum, l: any) => sum + toCurrency(l.outstandingBalance),
      0
    );

    return {
      assets: Math.round(assets * 100) / 100,
      liabilities: Math.round(liabTotal * 100) / 100,
      netWorth: Math.round((assets - liabTotal) * 100) / 100,
    };
  };

  const declarant = calculateOwnerTotals('declarant');
  const spouse = calculateOwnerTotals('spouse');
  const child = calculateOwnerTotals('child');
  const joint = calculateOwnerTotals('joint');

  const combinedAssets = declarant.assets + spouse.assets + child.assets + joint.assets;
  const combinedLiabilities = declarant.liabilities + spouse.liabilities + child.liabilities + joint.liabilities;

  return {
    declarant,
    spouse,
    child,
    joint,
    combined: {
      assets: Math.round(combinedAssets * 100) / 100,
      liabilities: Math.round(combinedLiabilities * 100) / 100,
      netWorth: Math.round((combinedAssets - combinedLiabilities) * 100) / 100,
    },
  };
}

/**
 * Check if SALN uses 2025 format
 * @param submission - SALN submission object
 * @returns true if using 2025 format
 */
export function is2025Format(submission: any): boolean {
  return submission?.salnFormatVersion === 2025;
}

/**
 * Get compliance type label for display
 * @param type - Compliance type value
 * @returns Human-readable label
 */
export function getComplianceTypeLabel(type?: ComplianceType | null): string {
  switch (type) {
    case 'assumption':
      return 'Assumption of Office';
    case 'annual':
      return 'Annual Declaration';
    case 'exit':
      return 'Separation from Service';
    default:
      return 'Annual Declaration';
  }
}

/**
 * Get owner label for display
 * @param owner - Owner type value
 * @returns Human-readable label
 */
export function getOwnerLabel(owner?: PropertyOwner | null): string {
  switch (owner) {
    case 'declarant':
      return 'Declarant';
    case 'spouse':
      return 'Spouse';
    case 'child':
      return 'Unmarried Child';
    case 'joint':
      return 'Joint (Declarant & Spouse)';
    default:
      return 'Declarant';
  }
}

/**
 * Transform snake_case database field names to camelCase
 * Used when receiving data directly from database queries
 * @param obj - Object with snake_case keys
 * @returns Object with camelCase keys
 */
export function snakeToCamel<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = obj[key];
    }
  }

  return result;
}

/**
 * Transform camelCase field names to snake_case
 * Used when sending data to database
 * @param obj - Object with camelCase keys
 * @returns Object with snake_case keys
 */
export function camelToSnake<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = obj[key];
    }
  }

  return result;
}

/**
 * Validate that all 2025 SALN required fields are present
 * @param submission - SALN submission data
 * @returns Object with validation result and missing fields
 */
export function validate2025RequiredFields(submission: any): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  // Check compliance type (required for 2025)
  if (!submission.complianceType) {
    missingFields.push('complianceType');
  }

  // If assumption or exit, compliance date is required
  if (
    (submission.complianceType === 'assumption' || submission.complianceType === 'exit') &&
    !submission.complianceDate
  ) {
    missingFields.push('complianceDate');
  }

  // If joint filing and spouse is public official, spouse details required
  if (submission.filingType === 'joint' && submission.spouseIsPublicOfficial) {
    if (!submission.spousePosition) missingFields.push('spousePosition');
    if (!submission.spouseAgency) missingFields.push('spouseAgency');
    if (!submission.spouseOfficeAddress) missingFields.push('spouseOfficeAddress');
  }

  // If has multiple marriages, previous spouse names required
  if (submission.hasMultipleMarriages && !submission.previousSpouseNames) {
    missingFields.push('previousSpouseNames');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get default values for a new 2025 SALN submission
 * @returns Default values object
 */
export function get2025DefaultValues(): Record<string, any> {
  return {
    salnFormatVersion: 2025,
    complianceType: 'annual',
    hasMultipleMarriages: false,
    spouseIsPublicOfficial: false,
    hasNoBusinessInterests: false,
    hasNoRelativesInGov: false,
    unmarriedChildren: [],
  };
}
