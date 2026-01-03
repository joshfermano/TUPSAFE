/**
 * SALN Data Transformation Utilities
 *
 * Comprehensive transformations for SALN data across different formats:
 * 1. Frontend ↔ Backend (API submission/retrieval)
 * 2. Type conversions and decimal handling
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
 * Transforms SALN data from frontend format to backend format
 *
 * IMPORTANT: This function preserves undefined values for partial updates.
 * Only sections explicitly provided in data will be included in the result.
 * This allows the API/database layer to distinguish between:
 * - undefined: Don't update this section (preserve existing data)
 * - []: Clear all items in this section
 *
 * @param data - Form data in frontend format (CompleteSalnData)
 * @returns Transformed data ready for backend API
 */
export function transformSalnForSubmission(data: Partial<CompleteSalnData>): any {
  // ========================================================================
  // STEP 1: Extract submission metadata
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
    spouseName: submission.spouseName || undefined,
    position: submission.position || undefined,
    agency: submission.agency || undefined,
    officeAddress: submission.officeAddress || undefined,
  };

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
  // ========================================================================
  const submission = {
    id: backendData.id,
    userId: backendData.userId,
    year: backendData.year,
    filingType: backendData.filingType || 'separate',
    spouseName: backendData.spouseName || null,
    position: backendData.position || undefined,
    agency: backendData.agency || undefined,
    officeAddress: backendData.officeAddress || undefined,
    status: backendData.status || 'draft',
    submittedAt: backendData.submittedAt ? new Date(backendData.submittedAt) : null,
    approvedAt: backendData.approvedAt ? new Date(backendData.approvedAt) : null,
    approvedBy: backendData.approvedBy || null,
    createdAt: backendData.createdAt ? new Date(backendData.createdAt) : new Date(),
    updatedAt: backendData.updatedAt ? new Date(backendData.updatedAt) : new Date(),
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
