/**
 * SALN Data Transformation Utilities
 *
 * Comprehensive transformations for SALN data across different formats:
 * 1. Frontend <-> Backend (API submission/retrieval)
 * 2. Type conversions and decimal handling
 * 3. 2025 SALN format support with owner-based filtering
 *
 * Key transformations:
 * 1. Type conversions for serialized data:
 *    - dateOfAcquisition: string -> Date (businessInterests)
 *    - All currency fields: number -> string with toFixed(2) for database decimal(15,2)
 *    - yearAcquired: string/number -> number
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

// ============================================================================
// Internal type aliases for data flowing across serialization boundaries
// ============================================================================

/** Values that may represent a date across serialization boundaries */
type DateLike = Date | string | null | undefined;

/** Values that may represent a number across serialization boundaries */
type NumberLike = number | string | null | undefined;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function to convert string to Date
 */
function stringToDate(value: DateLike): Date | null {
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
function toCurrency(value: NumberLike): number {
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
function transformFlatPayload(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    year: data.year,
    filingType: (data.filingType as string) || 'separate',
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
    result.realProperties = (data.realProperties as Record<string, unknown>[]).map((prop) => ({
      description: prop.description,
      kind: prop.kind,
      exactLocation: prop.exactLocation,
      assessedValue: typeof prop.assessedValue === 'string' ? prop.assessedValue : formatForDb(toCurrency(prop.assessedValue as NumberLike)),
      currentFairMarketValue: typeof prop.currentFairMarketValue === 'string' ? prop.currentFairMarketValue : formatForDb(toCurrency(prop.currentFairMarketValue as NumberLike)),
      acquisitionYear: prop.acquisitionYear,
      acquisitionMode: prop.acquisitionMode,
      acquisitionCost: typeof prop.acquisitionCost === 'string' ? prop.acquisitionCost : formatForDb(toCurrency(prop.acquisitionCost as NumberLike)),
      // 2025 SALN Format fields
      owner: (prop.owner as string) || 'declarant',
      childName: prop.childName ?? null,
    }));
  }

  if (data.personalProperties !== undefined) {
    result.personalProperties = (data.personalProperties as Record<string, unknown>[]).map((prop) => ({
      description: prop.description,
      yearAcquired: prop.yearAcquired,
      acquisitionCost: typeof prop.acquisitionCost === 'string' ? prop.acquisitionCost : formatForDb(toCurrency(prop.acquisitionCost as NumberLike)),
      // 2025 SALN Format fields
      owner: (prop.owner as string) || 'declarant',
      childName: prop.childName ?? null,
    }));
  }

  if (data.liabilities !== undefined) {
    result.liabilities = (data.liabilities as Record<string, unknown>[]).map((liability) => ({
      nature: liability.nature,
      creditorName: liability.creditorName,
      outstandingBalance: typeof liability.outstandingBalance === 'string' ? liability.outstandingBalance : formatForDb(toCurrency(liability.outstandingBalance as NumberLike)),
      // 2025 SALN Format fields
      owner: (liability.owner as string) || 'declarant',
      childName: liability.childName ?? null,
    }));
  }

  if (data.businessInterests !== undefined) {
    result.businessInterests = (data.businessInterests as Record<string, unknown>[]).map((interest) => {
      const date = stringToDate(interest.dateOfAcquisition as DateLike);
      return {
        entityName: interest.entityName,
        businessAddress: interest.businessAddress,
        natureOfBusiness: interest.natureOfBusiness,
        dateOfAcquisition: date ? date.toISOString() : (interest.dateOfAcquisition || null),
        // 2025 SALN Format fields
        owner: (interest.owner as string) || 'declarant',
        childName: interest.childName ?? null,
      };
    });
  }

  if (data.relativesInGov !== undefined) {
    result.relativesInGov = (data.relativesInGov as Record<string, unknown>[]).map((relative) => ({
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
export function transformSalnForSubmission(data: Partial<CompleteSalnData>): Record<string, unknown> {
  // ========================================================================
  // STEP 0: Detect input format (nested vs flat/legacy)
  // If data.submission exists, it's nested format from the form
  // If data.year exists but data.submission doesn't, it's already flat (legacy)
  // ========================================================================
  const isNestedFormat = data.submission !== undefined;
  // Check for legacy flat format by casting to Record to access arbitrary keys
  const dataRecord = data as Record<string, unknown>;
  const isLegacyFlatFormat = !isNestedFormat && dataRecord.year !== undefined;

  // If already in flat format (legacy), just pass through with minimal processing
  if (isLegacyFlatFormat) {
    console.log('[transformSalnForSubmission] Detected legacy flat format, passing through');
    return transformFlatPayload(dataRecord);
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

  // Access submission as Record for 2025 fields that may not exist on the fallback object
  const sub = submission as Record<string, unknown>;

  // ========================================================================
  // STEP 2: Transform Real Properties (Section II) - preserve undefined
  // ========================================================================
  const realProperties = data.realProperties !== undefined
    ? data.realProperties.map((prop) => ({
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
      // Filter out incomplete entries - description, kind, exactLocation, acquisitionMode are NOT NULL in DB
      .filter((prop) => prop.description && prop.kind && prop.exactLocation && prop.acquisitionMode)
    : undefined;

  // ========================================================================
  // STEP 3: Transform Personal Properties (Section III) - preserve undefined
  // ========================================================================
  const personalProperties = data.personalProperties !== undefined
    ? data.personalProperties.map((prop) => ({
        description: prop.description,
        yearAcquired: prop.yearAcquired,
        acquisitionCost: formatForDb(toCurrency(prop.acquisitionCost)),
        // 2025 SALN Format fields
        owner: prop.owner || 'declarant',
        childName: prop.childName ?? null,
      }))
      // Filter out incomplete entries - description, yearAcquired are NOT NULL in DB
      .filter((prop) => prop.description && prop.yearAcquired)
    : undefined;

  // ========================================================================
  // STEP 4: Transform Liabilities (Section IV) - preserve undefined
  // ========================================================================
  const liabilities = data.liabilities !== undefined
    ? data.liabilities.map((liability) => ({
        nature: liability.nature,
        creditorName: liability.creditorName,
        outstandingBalance: formatForDb(toCurrency(liability.outstandingBalance)),
        // 2025 SALN Format fields
        owner: liability.owner || 'declarant',
        childName: liability.childName ?? null,
      }))
      // Filter out incomplete entries - nature, creditorName are NOT NULL in DB
      .filter((l) => l.nature && l.creditorName)
    : undefined;

  // ========================================================================
  // STEP 5: Transform Business Interests (Section V) - preserve undefined
  // ========================================================================
  const businessInterests = data.businessInterests !== undefined
    ? data.businessInterests.map((interest) => {
        // Convert date to ISO string for database storage
        const date = stringToDate(interest.dateOfAcquisition as DateLike);
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
      // Filter out incomplete entries - entityName, businessAddress, natureOfBusiness, dateOfAcquisition are NOT NULL in DB
      .filter((b) => b.entityName && b.businessAddress && b.natureOfBusiness && b.dateOfAcquisition)
    : undefined;

  // ========================================================================
  // STEP 6: Transform Relatives in Government (Section VI) - preserve undefined
  // ========================================================================
  const relativesInGov = data.relativesInGov !== undefined
    ? data.relativesInGov.map((relative) => ({
        name: relative.name,
        relationship: relative.relationship,
        position: relative.position,
        agencyAddress: relative.agencyAddress,
      }))
      // Filter out incomplete entries - name, relationship, position, agencyAddress are NOT NULL in DB
      .filter((r) => r.name && r.relationship && r.position && r.agencyAddress)
    : undefined;

  // ========================================================================
  // STEP 7: Create backend-compatible data structure
  // Only include defined sections (undefined sections will be omitted)
  // ========================================================================
  const result: Record<string, unknown> = {
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
  // Use the Record<string, unknown> cast (sub) to access 2025 fields
  // that may not exist on the fallback object type
  if (sub.complianceType !== undefined) {
    result.complianceType = sub.complianceType;
    // When compliance type is 'annual', clear complianceDate since annual
    // uses a fixed "December 31" date and doesn't need a user-supplied date.
    // This ensures assumption/exit dates don't persist in the DB when switching to annual.
    if (sub.complianceType === 'annual') {
      result.complianceDate = null;
    }
  }
  if (sub.complianceDate !== undefined && sub.complianceType !== 'annual') {
    const cd = sub.complianceDate;
    result.complianceDate = cd instanceof Date
      ? cd.toISOString()
      : cd;
  }
  if (sub.hasMultipleMarriages !== undefined) {
    result.hasMultipleMarriages = sub.hasMultipleMarriages;
  }
  if (sub.previousSpouseNames !== undefined) {
    result.previousSpouseNames = sub.previousSpouseNames;
  }
  if (sub.spouseIsPublicOfficial !== undefined) {
    result.spouseIsPublicOfficial = sub.spouseIsPublicOfficial;
  }
  if (sub.spousePosition !== undefined) {
    result.spousePosition = sub.spousePosition;
  }
  if (sub.spouseAgency !== undefined) {
    result.spouseAgency = sub.spouseAgency;
  }
  if (sub.spouseOfficeAddress !== undefined) {
    result.spouseOfficeAddress = sub.spouseOfficeAddress;
  }
  if (sub.unmarriedChildren !== undefined) {
    result.unmarriedChildren = sub.unmarriedChildren;
  }
  if (sub.hasNoBusinessInterests !== undefined) {
    result.hasNoBusinessInterests = sub.hasNoBusinessInterests;
  }
  if (sub.hasNoRelativesInGov !== undefined) {
    result.hasNoRelativesInGov = sub.hasNoRelativesInGov;
  }
  if (sub.governmentIdType !== undefined) {
    result.governmentIdType = sub.governmentIdType;
  }
  if (sub.governmentIdNumber !== undefined) {
    result.governmentIdNumber = sub.governmentIdNumber;
  }
  if (sub.governmentIdDateIssued !== undefined) {
    const gid = sub.governmentIdDateIssued;
    result.governmentIdDateIssued = gid instanceof Date
      ? gid.toISOString()
      : gid;
  }
  if (sub.declarantTin !== undefined) {
    result.declarantTin = sub.declarantTin;
  }
  if (sub.spouseTin !== undefined) {
    result.spouseTin = sub.spouseTin;
  }
  if (sub.spouseDateOfBirth !== undefined) {
    const sdob = sub.spouseDateOfBirth;
    result.spouseDateOfBirth = sdob instanceof Date
      ? sdob.toISOString()
      : sdob;
  }
  if (sub.governmentIdType2 !== undefined) {
    result.governmentIdType2 = sub.governmentIdType2;
  }
  if (sub.governmentIdNumber2 !== undefined) {
    result.governmentIdNumber2 = sub.governmentIdNumber2;
  }
  if (sub.governmentIdDateIssued2 !== undefined) {
    const gid2 = sub.governmentIdDateIssued2;
    result.governmentIdDateIssued2 = gid2 instanceof Date
      ? gid2.toISOString()
      : gid2;
  }
  if (sub.salnFormatVersion !== undefined) {
    result.salnFormatVersion = sub.salnFormatVersion;
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
export function transformSalnFromBackend<T extends object>(backendInput: T): Partial<CompleteSalnData> {
  // Cast to Record<string, unknown> for property access across serialization boundary
  const backendData = backendInput as unknown as Record<string, unknown>;
  // ========================================================================
  // STEP 1: Transform submission metadata
  // Use nullish coalescing (??) to preserve empty strings if intentionally cleared
  // ========================================================================
  const submission = {
    id: backendData.id as string | undefined,
    userId: backendData.userId as string | undefined,
    year: backendData.year as number,
    filingType: (backendData.filingType as string) || 'separate',
    spouseName: (backendData.spouseName as string | null) ?? null,
    position: (backendData.position as string | undefined) ?? undefined,
    agency: (backendData.agency as string | undefined) ?? undefined,
    officeAddress: (backendData.officeAddress as string | undefined) ?? undefined,
    status: (backendData.status as string) || 'draft',
    submittedAt: backendData.submittedAt ? new Date(backendData.submittedAt as string) : null,
    approvedAt: backendData.approvedAt ? new Date(backendData.approvedAt as string) : null,
    approvedBy: (backendData.approvedBy as string | null) || null,
    createdAt: backendData.createdAt ? new Date(backendData.createdAt as string) : new Date(),
    updatedAt: backendData.updatedAt ? new Date(backendData.updatedAt as string) : new Date(),
    // 2025 SALN Format fields
    complianceType: (backendData.complianceType as string) || 'annual',
    complianceDate: backendData.complianceDate ? new Date(backendData.complianceDate as string) : undefined,
    hasMultipleMarriages: (backendData.hasMultipleMarriages as boolean) ?? false,
    previousSpouseNames: (backendData.previousSpouseNames as string | null) ?? null,
    spouseIsPublicOfficial: (backendData.spouseIsPublicOfficial as boolean) ?? false,
    spousePosition: (backendData.spousePosition as string | null) ?? null,
    spouseAgency: (backendData.spouseAgency as string | null) ?? null,
    spouseOfficeAddress: (backendData.spouseOfficeAddress as string | null) ?? null,
    unmarriedChildren: (backendData.unmarriedChildren as Array<{ name: string; age: number }>) ?? [],
    hasNoBusinessInterests: (backendData.hasNoBusinessInterests as boolean) ?? false,
    hasNoRelativesInGov: (backendData.hasNoRelativesInGov as boolean) ?? false,
    governmentIdType: (backendData.governmentIdType as string | null) ?? null,
    governmentIdNumber: (backendData.governmentIdNumber as string | null) ?? null,
    governmentIdDateIssued: backendData.governmentIdDateIssued ? new Date(backendData.governmentIdDateIssued as string) : null,
    declarantTin: (backendData.declarantTin as string | null) ?? null,
    spouseTin: (backendData.spouseTin as string | null) ?? null,
    spouseDateOfBirth: backendData.spouseDateOfBirth ? new Date(backendData.spouseDateOfBirth as string) : null,
    governmentIdType2: (backendData.governmentIdType2 as string | null) ?? null,
    governmentIdNumber2: (backendData.governmentIdNumber2 as string | null) ?? null,
    governmentIdDateIssued2: backendData.governmentIdDateIssued2 ? new Date(backendData.governmentIdDateIssued2 as string) : null,
    salnFormatVersion: (backendData.salnFormatVersion as number) ?? 2025,
  };

  // ========================================================================
  // STEP 2: Transform Real Properties (Section II)
  // ========================================================================
  const rawRealProperties = (backendData.realProperties || []) as Record<string, unknown>[];
  const realProperties = rawRealProperties.map((prop) => ({
    id: prop.id as string | undefined,
    salnSubmissionId: prop.salnSubmissionId as string | undefined,
    description: prop.description as string,
    kind: prop.kind as string,
    exactLocation: prop.exactLocation as string,
    assessedValue: toCurrency(prop.assessedValue as NumberLike),
    currentFairMarketValue: toCurrency(prop.currentFairMarketValue as NumberLike),
    acquisitionYear: prop.acquisitionYear as number,
    acquisitionMode: prop.acquisitionMode as string,
    acquisitionCost: toCurrency(prop.acquisitionCost as NumberLike),
    // 2025 SALN Format fields
    owner: (prop.owner as string) || 'declarant',
    childName: (prop.childName as string | null) ?? null,
  }));

  // ========================================================================
  // STEP 3: Transform Personal Properties (Section III)
  // ========================================================================
  const rawPersonalProperties = (backendData.personalProperties || []) as Record<string, unknown>[];
  const personalProperties = rawPersonalProperties.map((prop) => ({
    id: prop.id as string | undefined,
    salnSubmissionId: prop.salnSubmissionId as string | undefined,
    description: prop.description as string,
    yearAcquired: prop.yearAcquired as number,
    acquisitionCost: toCurrency(prop.acquisitionCost as NumberLike),
    // 2025 SALN Format fields
    owner: (prop.owner as string) || 'declarant',
    childName: (prop.childName as string | null) ?? null,
  }));

  // ========================================================================
  // STEP 4: Transform Liabilities (Section IV)
  // ========================================================================
  const rawLiabilities = (backendData.liabilities || []) as Record<string, unknown>[];
  const liabilities = rawLiabilities.map((liability) => ({
    id: liability.id as string | undefined,
    salnSubmissionId: liability.salnSubmissionId as string | undefined,
    nature: liability.nature as string,
    creditorName: liability.creditorName as string,
    outstandingBalance: toCurrency(liability.outstandingBalance as NumberLike),
    // 2025 SALN Format fields
    owner: (liability.owner as string) || 'declarant',
    childName: (liability.childName as string | null) ?? null,
  }));

  // ========================================================================
  // STEP 5: Transform Business Interests (Section V)
  // ========================================================================
  const rawBusinessInterests = (backendData.businessInterests || []) as Record<string, unknown>[];
  const businessInterests = rawBusinessInterests.map((interest) => ({
    id: interest.id as string | undefined,
    salnSubmissionId: interest.salnSubmissionId as string | undefined,
    entityName: interest.entityName as string,
    businessAddress: interest.businessAddress as string,
    natureOfBusiness: interest.natureOfBusiness as string,
    dateOfAcquisition: stringToDate(interest.dateOfAcquisition as DateLike),
    // 2025 SALN Format fields
    owner: (interest.owner as string) || 'declarant',
    childName: (interest.childName as string | null) ?? null,
  }));

  // ========================================================================
  // STEP 6: Transform Relatives in Government (Section VI)
  // ========================================================================
  const rawRelatives = (backendData.relativesInGov || []) as Record<string, unknown>[];
  const relativesInGov = rawRelatives.map((relative) => ({
    id: relative.id as string | undefined,
    salnSubmissionId: relative.salnSubmissionId as string | undefined,
    name: relative.name as string,
    relationship: relative.relationship as string,
    position: relative.position as string,
    agencyAddress: relative.agencyAddress as string,
  }));

  // ========================================================================
  // STEP 7: Calculate totals (Section VII - Summary)
  // ========================================================================
  const totalRealPropertyValue = realProperties.reduce(
    (sum: number, prop) => sum + (prop.currentFairMarketValue || 0),
    0
  );

  const totalPersonalPropertyValue = personalProperties.reduce(
    (sum: number, prop) => sum + (prop.acquisitionCost || 0),
    0
  );

  const totalAssets = totalRealPropertyValue + totalPersonalPropertyValue;

  const totalLiabilities = liabilities.reduce(
    (sum: number, liability) => sum + (liability.outstandingBalance || 0),
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
  } as unknown as Partial<CompleteSalnData>;
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
    (sum: number, prop) => {
      const value = toCurrency(prop.currentFairMarketValue as NumberLike);
      return sum + (isNaN(value) ? 0 : value);
    },
    0
  );

  const totalPersonalPropertyValue = (data.personalProperties || []).reduce(
    (sum: number, prop) => {
      const value = toCurrency(prop.acquisitionCost as NumberLike);
      return sum + (isNaN(value) ? 0 : value);
    },
    0
  );

  const totalAssets = totalRealPropertyValue + totalPersonalPropertyValue;

  const totalLiabilities = (data.liabilities || []).reduce(
    (sum: number, liability) => {
      const value = toCurrency(liability.outstandingBalance as NumberLike);
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
  const liabilitiesArr = data.liabilities || [];

  const realByOwner = groupByOwner(realProps);
  const personalByOwner = groupByOwner(personalProps);
  const liabilitiesByOwner = groupByOwner(liabilitiesArr);

  const calculateOwnerTotals = (owner: PropertyOwner) => {
    const realTotal = realByOwner[owner].reduce(
      (sum, p) => sum + toCurrency(p.currentFairMarketValue as NumberLike),
      0
    );
    const personalTotal = personalByOwner[owner].reduce(
      (sum, p) => sum + toCurrency(p.acquisitionCost as NumberLike),
      0
    );
    const assets = realTotal + personalTotal;
    const liabTotal = liabilitiesByOwner[owner].reduce(
      (sum, l) => sum + toCurrency(l.outstandingBalance as NumberLike),
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
export function is2025Format(submission: object | null | undefined): boolean {
  return (submission as Record<string, unknown> | null | undefined)?.salnFormatVersion === 2025;
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
export function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
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
export function camelToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};

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
export function validate2025RequiredFields<T extends object>(submissionInput: T): {
  isValid: boolean;
  missingFields: string[];
} {
  // Cast to Record<string, unknown> for dynamic property access
  const submission = submissionInput as unknown as Record<string, unknown>;
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

  // If joint or separate filing and spouse is public official, spouse details required
  if ((submission.filingType === 'joint' || submission.filingType === 'separate') && submission.spouseIsPublicOfficial) {
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
export function get2025DefaultValues(): Record<string, unknown> {
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
