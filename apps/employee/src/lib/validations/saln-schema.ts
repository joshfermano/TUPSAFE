import { z } from 'zod';

/**
 * Comprehensive Zod Validation Schemas for SALN (Statement of Assets, Liabilities, and Net Worth)
 * CSC Form No. SALN 2019 Revised
 *
 * CRITICAL COMPATIBILITY NOTES:
 * - ✅ Compatible with @tupsafe/database package (Supabase integration)
 * - Field names match EXACTLY with database schemas
 * - All schemas are production-ready
 *
 * SALN Structure (7 Sections):
 * I. Declarant Information
 * II. Real Properties (Assets - Real Property)
 * III. Personal Properties (Assets - Personal Property)
 * IV. Liabilities
 * V. Business Interests and Financial Connections
 * VI. Relatives in Government Service
 * VII. Summary (Auto-calculated: Total Assets, Total Liabilities, Net Worth)
 *
 * @see /packages/mock-data/src/data/saln.ts - Mock data structure
 * @see /packages/database/src/schema.ts - Database schema (lines 267-360)
 * @see /packages/database/src/types.ts - TypeScript types (lines 48-76, 186-193)
 */

// ============================================================================
// COMMON VALIDATION PATTERNS
// ============================================================================

/**
 * Currency validation helper
 * - Philippine Peso (PHP) amounts
 * - Positive numbers with up to 2 decimal places
 * - Maximum 15 digits (precision 15, scale 2) matching database schema
 */
const currencySchema = z
  .number()
  .min(0, 'Amount must be a positive number')
  .max(9999999999999.99, 'Amount exceeds maximum allowed value')
  .refine(
    (val) => {
      // Check if has at most 2 decimal places
      const decimals = (val.toString().split('.')[1] || '').length;
      return decimals <= 2;
    },
    { message: 'Amount must have at most 2 decimal places' }
  );

/**
 * Optional currency field (allows 0 or null)
 */
const optionalCurrencySchema = currencySchema.nullable().optional();

/**
 * Year validation helper
 * - Must be between 1950 and current year
 * - Used for acquisition years
 */
const pastYearSchema = z
  .number()
  .int('Year must be a whole number')
  .min(1950, 'Year must be 1950 or later')
  .max(new Date().getFullYear(), 'Year cannot be in the future');

/**
 * Date validation for past dates only
 */
const pastDateSchema = z.date().max(new Date(), 'Date cannot be in the future');

// ============================================================================
// ENUMS AND CONSTANTS (Matching Database Schema)
// ============================================================================

/**
 * Property Kind Types
 * @see database schema: propertyKindEnum (line 47-53)
 */
export const PROPERTY_KIND = [
  'residential',
  'commercial',
  'industrial',
  'agricultural',
  'mixed',
] as const;

/**
 * Acquisition Mode Types
 * Common modes of acquiring property in the Philippines
 */
export const ACQUISITION_MODE = [
  'Purchase',
  'Inheritance',
  'Donation',
  'Homestead',
  'Other',
] as const;

/**
 * Filing Type
 * @see database schema: filingTypeEnum (line 55-59)
 */
export const FILING_TYPE = ['joint', 'separate', 'not_applicable'] as const;

/**
 * Compliance Type (2025 SALN Format)
 * Indicates the reason for filing the SALN
 */
export const COMPLIANCE_TYPE = ['assumption', 'annual', 'exit'] as const;

/**
 * Property Owner (2025 SALN Format)
 * Indicates who owns the property/asset/liability
 */
export const PROPERTY_OWNER = ['declarant', 'spouse', 'child', 'joint'] as const;

/**
 * Submission Status
 * @see database schema: submissionStatusEnum (line 25-31)
 */
export const SUBMISSION_STATUS = [
  'draft',
  'submitted',
  'reviewing',
  'approved',
  'rejected',
] as const;

/**
 * Relationship Types for Relatives in Government
 * Philippine kinship terms up to 4th degree civil relationship
 */
export const RELATIONSHIP_TYPE = [
  'Spouse',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Grandson',
  'Granddaughter',
  'Uncle',
  'Aunt',
  'Nephew',
  'Niece',
  'Cousin',
  'Father-in-law',
  'Mother-in-law',
  'Son-in-law',
  'Daughter-in-law',
  'Brother-in-law',
  'Sister-in-law',
  'Other (within 4th degree)',
] as const;

// ============================================================================
// SECTION I: DECLARANT INFORMATION
// ============================================================================

/**
 * Unmarried Child Schema (2025 SALN Format)
 * For listing unmarried children below 18
 */
export const unmarriedChildSchema = z.object({
  name: z
    .string()
    .min(1, 'Child name is required')
    .max(150, 'Child name must not exceed 150 characters'),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(0, 'Age cannot be negative')
    .max(17, 'Age must be below 18 for unmarried children'),
});

/**
 * Declarant Basic Information
 * Stored in salnSubmissions table
 * @see database schema: salnSubmissions (line 267-288)
 * @see mock-data: SalnSubmission type (saln.ts line 5-18)
 *
 * Updated for 2025 SALN Format with additional fields:
 * - Compliance type (assumption/annual/exit)
 * - Multiple marriages disclosure
 * - Spouse public official status
 * - Unmarried children listing
 * - Declaration checkboxes for business interests and relatives
 * - Secondary government ID
 */
export const declarantInfoSchema = z
  .object({
    // Submission metadata (from database schema)
    id: z.string().uuid().optional(), // UUID v7, optional for new submissions
    userId: z.string().uuid().optional(), // References auth.users.id (added server-side)
    year: z
      .number()
      .int('Year must be a whole number')
      .min(2000, 'Year must be 2000 or later')
      .max(new Date().getFullYear() + 1, 'Invalid year'),

    // Filing information
    filingType: z.enum(FILING_TYPE, {
      required_error: 'Filing type is required',
    }),

    // Spouse information (required if filingType is 'joint')
    spouseName: z
      .string()
      .max(150, 'Spouse name must not exceed 150 characters')
      .nullable()
      .optional(),

    // Employment information (from user profile, displayed for context)
    position: z
      .string()
      .max(150, 'Position must not exceed 150 characters')
      .optional(),
    agency: z
      .string()
      .max(200, 'Agency/Office must not exceed 200 characters')
      .optional(),
    officeAddress: z
      .string()
      .max(300, 'Office address must not exceed 300 characters')
      .optional(),

    // ============================================================================
    // 2025 SALN FORMAT - NEW FIELDS
    // ============================================================================

    // Compliance type and date
    complianceType: z.enum(COMPLIANCE_TYPE).optional(),
    complianceDate: z.date().optional(),

    // Multiple marriages disclosure
    hasMultipleMarriages: z.boolean().default(false),
    previousSpouseNames: z
      .string()
      .max(500, 'Previous spouse names must not exceed 500 characters')
      .optional()
      .nullable(),

    // Spouse public official status (for joint filing)
    spouseIsPublicOfficial: z.boolean().default(false),
    spousePosition: z
      .string()
      .max(150, 'Spouse position must not exceed 150 characters')
      .optional()
      .nullable(),
    spouseAgency: z
      .string()
      .max(200, 'Spouse agency must not exceed 200 characters')
      .optional()
      .nullable(),
    spouseOfficeAddress: z
      .string()
      .max(300, 'Spouse office address must not exceed 300 characters')
      .optional()
      .nullable(),

    // Unmarried children below 18
    unmarriedChildren: z.array(unmarriedChildSchema).default([]),

    // Declaration checkboxes
    hasNoBusinessInterests: z.boolean().default(false),
    hasNoRelativesInGov: z.boolean().default(false),

    // Primary/First government ID (2025 requirement - for first signature)
    governmentIdType: z
      .string()
      .max(100, 'Government ID type must not exceed 100 characters')
      .optional()
      .nullable(),
    governmentIdNumber: z
      .string()
      .max(100, 'Government ID number must not exceed 100 characters')
      .optional()
      .nullable(),
    governmentIdDateIssued: z.date().optional().nullable(),

    // Secondary government ID (2025 requirement - for second signature)
    governmentIdType2: z
      .string()
      .max(100, 'Government ID type must not exceed 100 characters')
      .optional()
      .nullable(),
    governmentIdNumber2: z
      .string()
      .max(100, 'Government ID number must not exceed 100 characters')
      .optional()
      .nullable(),
    governmentIdDateIssued2: z.date().optional().nullable(),

    // TIN fields (2025 requirement)
    declarantTin: z
      .string()
      .max(20, 'TIN must not exceed 20 characters')
      .optional()
      .nullable(),
    spouseTin: z
      .string()
      .max(20, 'Spouse TIN must not exceed 20 characters')
      .optional()
      .nullable(),

    // Spouse date of birth (for joint filing)
    spouseDateOfBirth: z.date().optional().nullable(),

    // SALN format version
    salnFormatVersion: z.literal(2025).default(2025),

    // ============================================================================
    // END 2025 SALN FORMAT - NEW FIELDS
    // ============================================================================

    // Submission status
    status: z.enum(SUBMISSION_STATUS).default('draft'),

    // Timestamps
    submittedAt: z.date().nullable().optional(),
    approvedAt: z.date().nullable().optional(),
    approvedBy: z.string().uuid().nullable().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  })
  .refine(
    (data) => {
      // If filing type is 'joint' or 'separate', spouse name must be provided
      if (data.filingType === 'joint' || data.filingType === 'separate') {
        return !!data.spouseName && data.spouseName.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Spouse name is required for joint or separate filing',
      path: ['spouseName'],
    }
  )
  .refine(
    (data) => {
      // Compliance date required for assumption or exit
      if (
        data.complianceType === 'assumption' ||
        data.complianceType === 'exit'
      ) {
        return !!data.complianceDate;
      }
      return true;
    },
    {
      message: 'Compliance date is required for assumption or exit filing',
      path: ['complianceDate'],
    }
  )
  .refine(
    (data) => {
      // If spouse is public official and filing is joint or separate, require spouse details
      if (
        (data.filingType === 'joint' || data.filingType === 'separate') &&
        data.spouseIsPublicOfficial === true
      ) {
        return (
          !!data.spousePosition &&
          data.spousePosition.trim().length > 0 &&
          !!data.spouseAgency &&
          data.spouseAgency.trim().length > 0 &&
          !!data.spouseOfficeAddress &&
          data.spouseOfficeAddress.trim().length > 0
        );
      }
      return true;
    },
    {
      message:
        'Spouse position, agency, and office address are required when spouse is a public official',
      path: ['spousePosition'],
    }
  );

// ============================================================================
// SECTION II: REAL PROPERTIES
// ============================================================================

/**
 * Real Property Entry Schema
 * Matches database schema: salnRealProperties (line 290-312)
 * Matches mock-data: SalnRealProperty interface (saln.ts line 19-30)
 *
 * Updated for 2025 SALN Format with owner field
 */
export const realPropertySchema = z
  .object({
    id: z.string().uuid().optional(), // UUID v7, optional for new entries
    salnSubmissionId: z.string().uuid().optional(), // Set when saving

    description: z
      .string()
      .min(1, 'Property description is required')
      .max(500, 'Description must not exceed 500 characters')
      .describe(
        'e.g., "3-bedroom house and lot", "Vacant lot", "Condominium unit"'
      ),

    kind: z.enum(PROPERTY_KIND, {
      required_error: 'Property kind is required',
    }),

    exactLocation: z
      .string()
      .min(1, 'Exact location is required')
      .max(500, 'Location must not exceed 500 characters')
      .describe(
        'Complete address including street, barangay, city/municipality, province'
      ),

    assessedValue: currencySchema.describe(
      'Assessed value from tax declaration (PHP)'
    ),

    currentFairMarketValue: currencySchema.describe(
      'Current fair market value (PHP)'
    ),

    acquisitionYear: pastYearSchema.describe('Year the property was acquired'),

    acquisitionMode: z
      .enum(ACQUISITION_MODE)
      .or(z.string().max(100))
      .describe('How the property was acquired'),

    acquisitionCost: currencySchema.describe(
      'Original acquisition cost (PHP). Use 0 for inheritance/donation.'
    ),

    // 2025 SALN Format - Owner field
    owner: z
      .enum(PROPERTY_OWNER)
      .default('declarant')
      .describe('Who owns the property (declarant, spouse, child, or joint)'),

    // Child name (required if owner is 'child')
    childName: z
      .string()
      .max(150, 'Child name must not exceed 150 characters')
      .optional()
      .nullable()
      .describe('Name of the child who owns this property'),
  })
  .refine(
    (data) => {
      // Current fair market value should typically be >= assessed value
      // This is a warning, not a strict validation
      return data.currentFairMarketValue >= data.assessedValue * 0.5; // Allow some flexibility
    },
    {
      message:
        'Current fair market value seems unusually low compared to assessed value',
      path: ['currentFairMarketValue'],
    }
  )
  .refine(
    (data) => {
      // If owner is 'child', childName must be provided
      if (data.owner === 'child') {
        return !!data.childName && data.childName.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Child name is required when owner is a child',
      path: ['childName'],
    }
  );

// ============================================================================
// SECTION III: PERSONAL PROPERTIES
// ============================================================================

/**
 * Personal Property Entry Schema
 * Matches database schema: salnPersonalProperties (line 314-325)
 * Matches mock-data: SalnPersonalProperty interface (saln.ts line 32-38)
 *
 * Includes: Vehicles, Jewelry, Electronics, Furniture, Cash, Investments, etc.
 *
 * Updated for 2025 SALN Format with owner field
 */
export const personalPropertySchema = z
  .object({
    id: z.string().uuid().optional(), // UUID v7, optional for new entries
    salnSubmissionId: z.string().uuid().optional(), // Set when saving

    description: z
      .string()
      .min(1, 'Property description is required')
      .max(500, 'Description must not exceed 500 characters')
      .describe(
        'e.g., "2022 Toyota Camry", "Jewelry and Watches Collection", "Cash in Bank", "Stocks and Bonds"'
      ),

    yearAcquired: pastYearSchema.describe('Year the property was acquired'),

    acquisitionCost: currencySchema.describe(
      'Acquisition cost or current value (PHP)'
    ),

    // 2025 SALN Format - Owner field
    owner: z
      .enum(PROPERTY_OWNER)
      .default('declarant')
      .describe('Who owns the property (declarant, spouse, child, or joint)'),

    // Child name (required if owner is 'child')
    childName: z
      .string()
      .max(150, 'Child name must not exceed 150 characters')
      .optional()
      .nullable()
      .describe('Name of the child who owns this property'),
  })
  .refine(
    (data) => {
      // If owner is 'child', childName must be provided
      if (data.owner === 'child') {
        return !!data.childName && data.childName.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Child name is required when owner is a child',
      path: ['childName'],
    }
  );

// ============================================================================
// SECTION IV: LIABILITIES
// ============================================================================

/**
 * Liability Entry Schema
 * Matches database schema: salnLiabilities (line 327-338)
 * Matches mock-data: SalnLiability interface (saln.ts line 40-46)
 *
 * Includes: Mortgages, Loans, Credit Card Debt, etc.
 *
 * Updated for 2025 SALN Format with owner field
 */
export const liabilitySchema = z
  .object({
    id: z.string().uuid().optional(), // UUID v7, optional for new entries
    salnSubmissionId: z.string().uuid().optional(), // Set when saving

    nature: z
      .string()
      .min(1, 'Nature of liability is required')
      .max(200, 'Nature must not exceed 200 characters')
      .describe(
        'e.g., "Home Mortgage Loan", "Car Loan", "Personal Loan", "Credit Card"'
      ),

    creditorName: z
      .string()
      .min(1, 'Creditor name is required')
      .max(200, 'Creditor name must not exceed 200 characters')
      .describe('Name of bank, lending institution, or creditor'),

    outstandingBalance: currencySchema.describe(
      'Current outstanding balance (PHP)'
    ),

    // 2025 SALN Format - Owner field
    owner: z
      .enum(PROPERTY_OWNER)
      .default('declarant')
      .describe(
        'Who is responsible for the liability (declarant, spouse, child, or joint)'
      ),

    // Child name (required if owner is 'child')
    childName: z
      .string()
      .max(150, 'Child name must not exceed 150 characters')
      .optional()
      .nullable()
      .describe('Name of the child responsible for this liability'),
  })
  .refine(
    (data) => {
      // If owner is 'child', childName must be provided
      if (data.owner === 'child') {
        return !!data.childName && data.childName.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Child name is required when owner is a child',
      path: ['childName'],
    }
  );

// ============================================================================
// SECTION V: BUSINESS INTERESTS
// ============================================================================

/**
 * Business Interest Entry Schema
 * Matches database schema: salnBusinessInterests (line 340-349)
 * Matches mock-data: SalnBusinessInterest interface (saln.ts line 48-55)
 *
 * Updated for 2025 SALN Format with owner field
 */
export const businessInterestSchema = z
  .object({
    id: z.string().uuid().optional(), // UUID v7, optional for new entries
    salnSubmissionId: z.string().uuid().optional(), // Set when saving

    entityName: z
      .string()
      .min(1, 'Entity name is required')
      .max(200, 'Entity name must not exceed 200 characters')
      .describe('Name of business, corporation, partnership, or entity'),

    businessAddress: z
      .string()
      .min(1, 'Business address is required')
      .max(300, 'Business address must not exceed 300 characters')
      .describe('Complete business address'),

    natureOfBusiness: z
      .string()
      .min(1, 'Nature of business is required')
      .max(200, 'Nature of business must not exceed 200 characters')
      .describe('Type of business or industry'),

    dateOfAcquisition: pastDateSchema.describe(
      'Date when interest was acquired'
    ),

    // 2025 SALN Format - Owner field
    owner: z
      .enum(PROPERTY_OWNER)
      .default('declarant')
      .describe(
        'Who owns the business interest (declarant, spouse, child, or joint)'
      ),

    // Child name (required if owner is 'child')
    childName: z
      .string()
      .max(150, 'Child name must not exceed 150 characters')
      .optional()
      .nullable()
      .describe('Name of the child who owns this business interest'),
  })
  .refine(
    (data) => {
      // If owner is 'child', childName must be provided
      if (data.owner === 'child') {
        return !!data.childName && data.childName.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Child name is required when owner is a child',
      path: ['childName'],
    }
  );

// ============================================================================
// SECTION VI: RELATIVES IN GOVERNMENT
// ============================================================================

/**
 * Relative in Government Entry Schema
 * Matches database schema: salnRelativesInGov (line 351-360)
 * Matches mock-data: SalnRelativeInGov interface (saln.ts line 57-64)
 *
 * CSC requires disclosure of relatives within 4th civil degree
 */
export const relativeInGovernmentSchema = z.object({
  id: z.string().uuid().optional(), // UUID v7, optional for new entries
  salnSubmissionId: z.string().uuid().optional(), // Set when saving

  name: z
    .string()
    .min(1, 'Name is required')
    .max(150, 'Name must not exceed 150 characters')
    .describe('Full name of relative'),

  relationship: z
    .enum(RELATIONSHIP_TYPE)
    .or(z.string().max(100))
    .describe('Relationship to declarant (within 4th civil degree)'),

  position: z
    .string()
    .min(1, 'Position is required')
    .max(150, 'Position must not exceed 150 characters')
    .describe('Position/Title in government'),

  agencyAddress: z
    .string()
    .min(1, 'Agency/Office address is required')
    .max(300, 'Agency address must not exceed 300 characters')
    .describe('Complete agency/office name and address'),
});

// ============================================================================
// SECTION VII: SUMMARY (AUTO-CALCULATED)
// ============================================================================

/**
 * SALN Summary Schema
 * Auto-calculated from Sections II, III, and IV
 * Stored in salnSubmissions table (line 274-281)
 */
export const salnSummarySchema = z.object({
  // From Real Properties (Section II)
  totalRealPropertyValue: currencySchema.describe(
    'Sum of all currentFairMarketValue from real properties'
  ),

  // From Personal Properties (Section III)
  totalPersonalPropertyValue: currencySchema.describe(
    'Sum of all acquisitionCost from personal properties'
  ),

  // Total Assets (Section II + Section III)
  totalAssets: currencySchema.describe(
    'totalRealPropertyValue + totalPersonalPropertyValue'
  ),

  // From Liabilities (Section IV)
  totalLiabilities: currencySchema.describe(
    'Sum of all outstandingBalance from liabilities'
  ),

  // Net Worth (Auto-calculated)
  netWorth: z
    .number()
    .describe('totalAssets - totalLiabilities (can be negative)'),
});

// ============================================================================
// COMPLETE SALN DATA STRUCTURE
// ============================================================================

/**
 * Complete SALN Submission Schema
 * Combines all sections into a comprehensive structure
 * Matches database type: CompleteSalnData (types.ts line 186-193)
 * Matches mock-data structure used in useSaln hook
 */
export const completeSalnSchema = z
  .object({
    // Section I: Declarant Information (stored in salnSubmissions table)
    submission: declarantInfoSchema,

    // Section II: Real Properties (Assets - Real Property)
    realProperties: z
      .array(realPropertySchema)
      .default([])
      .describe('List of all real properties owned'),

    // Section III: Personal Properties (Assets - Personal Property)
    personalProperties: z
      .array(personalPropertySchema)
      .default([])
      .describe(
        'List of all personal properties (vehicles, jewelry, cash, investments, etc.)'
      ),

    // Section IV: Liabilities
    liabilities: z
      .array(liabilitySchema)
      .default([])
      .describe('List of all debts and liabilities (can be empty)'),

    // Section V: Business Interests and Financial Connections
    businessInterests: z
      .array(businessInterestSchema)
      .default([])
      .describe('List of all business interests (can be empty)'),

    // Section VI: Relatives in Government Service
    relativesInGov: z
      .array(relativeInGovernmentSchema)
      .default([])
      .describe(
        'List of relatives within 4th degree in government (can be empty)'
      ),

    // Section VII: Summary (auto-calculated, optional for validation)
    calculations: salnSummarySchema.optional(),
  })
  .refine(
    (data) => {
      // Must have at least one asset (real property OR personal property)
      const hasAssets =
        data.realProperties.length > 0 || data.personalProperties.length > 0;
      return hasAssets;
    },
    {
      message:
        'At least one asset (real property or personal property) is required',
      path: ['realProperties'],
    }
  )
  .refine(
    (data) => {
      // If calculations are provided, validate they match the actual sums
      if (data.calculations) {
        const calculatedTotalRealProperty = data.realProperties.reduce(
          (sum, prop) => sum + prop.currentFairMarketValue,
          0
        );
        const calculatedTotalPersonalProperty = data.personalProperties.reduce(
          (sum, prop) => sum + prop.acquisitionCost,
          0
        );
        const calculatedTotalLiabilities = data.liabilities.reduce(
          (sum, liability) => sum + liability.outstandingBalance,
          0
        );

        // Allow small rounding differences (within 1 peso)
        const realPropertyMatch =
          Math.abs(
            data.calculations.totalRealPropertyValue -
              calculatedTotalRealProperty
          ) < 1;
        const personalPropertyMatch =
          Math.abs(
            data.calculations.totalPersonalPropertyValue -
              calculatedTotalPersonalProperty
          ) < 1;
        const liabilitiesMatch =
          Math.abs(
            data.calculations.totalLiabilities - calculatedTotalLiabilities
          ) < 1;

        return realPropertyMatch && personalPropertyMatch && liabilitiesMatch;
      }
      return true;
    },
    {
      message: 'Calculated totals do not match the sum of individual entries',
      path: ['calculations'],
    }
  );

// ============================================================================
// TYPE EXPORTS (Compatible with both mock-data and database packages)
// ============================================================================

export type DeclarantInfo = z.infer<typeof declarantInfoSchema>;
export type RealProperty = z.infer<typeof realPropertySchema>;
export type PersonalProperty = z.infer<typeof personalPropertySchema>;
export type Liability = z.infer<typeof liabilitySchema>;
export type BusinessInterest = z.infer<typeof businessInterestSchema>;
export type RelativeInGovernment = z.infer<typeof relativeInGovernmentSchema>;
export type SalnSummary = z.infer<typeof salnSummarySchema>;
export type CompleteSalnData = z.infer<typeof completeSalnSchema>;

// Export enum types
export type PropertyKind = (typeof PROPERTY_KIND)[number];
export type AcquisitionMode = (typeof ACQUISITION_MODE)[number];
export type FilingType = (typeof FILING_TYPE)[number];
export type SubmissionStatus = (typeof SUBMISSION_STATUS)[number];
export type RelationshipType = (typeof RELATIONSHIP_TYPE)[number];

// 2025 SALN Format enum types
export type ComplianceType = (typeof COMPLIANCE_TYPE)[number];
export type PropertyOwner = (typeof PROPERTY_OWNER)[number];

// 2025 SALN Format additional types
export type UnmarriedChild = z.infer<typeof unmarriedChildSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create an empty SALN submission for a given year
 * Compatible with both mock-data and database structures
 * Updated for 2025 SALN Format with new default fields
 *
 * @param year - The year for the SALN submission
 * @param userId - The user's UUID (optional, can be added server-side)
 * @returns Empty SALN data object with default values
 */
export function createEmptySaln(
  year: number,
  userId?: string
): Partial<CompleteSalnData> {
  return {
    submission: {
      userId,
      year,
      filingType: 'separate',
      status: 'draft',
      spouseName: null,
      position: undefined,
      agency: undefined,
      officeAddress: undefined,

      // 2025 SALN Format defaults
      complianceType: 'annual',
      complianceDate: undefined,
      hasMultipleMarriages: false,
      previousSpouseNames: null,
      spouseIsPublicOfficial: false,
      spousePosition: null,
      spouseAgency: null,
      spouseOfficeAddress: null,
      unmarriedChildren: [],
      hasNoBusinessInterests: false,
      hasNoRelativesInGov: false,

      // TIN fields
      declarantTin: null,
      spouseTin: null,

      // Spouse date of birth
      spouseDateOfBirth: null,

      // First/Primary Government ID (for first signature)
      governmentIdType: null,
      governmentIdNumber: null,
      governmentIdDateIssued: null,

      // Second Government ID (for second signature)
      governmentIdType2: null,
      governmentIdNumber2: null,
      governmentIdDateIssued2: null,
      salnFormatVersion: 2025,

      submittedAt: null,
      approvedAt: null,
      approvedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    realProperties: [],
    personalProperties: [],
    liabilities: [],
    businessInterests: [],
    relativesInGov: [],
  };
}

/**
 * Calculate total value of real properties
 * @param realProperties - Array of real property entries
 * @returns Total current fair market value
 */
export function calculateTotalRealPropertyValue(
  realProperties: RealProperty[]
): number {
  return realProperties.reduce((sum, prop) => {
    const value = prop.currentFairMarketValue;
    const numValue = typeof value === 'string' ? parseFloat(value) : value || 0;
    return sum + (isNaN(numValue) ? 0 : numValue);
  }, 0);
}

/**
 * Calculate total value of personal properties
 * @param personalProperties - Array of personal property entries
 * @returns Total acquisition cost
 */
export function calculateTotalPersonalPropertyValue(
  personalProperties: PersonalProperty[]
): number {
  return personalProperties.reduce((sum, prop) => {
    const value = prop.acquisitionCost;
    const numValue = typeof value === 'string' ? parseFloat(value) : value || 0;
    return sum + (isNaN(numValue) ? 0 : numValue);
  }, 0);
}

/**
 * Calculate total assets (real + personal properties)
 * @param realProperties - Array of real property entries
 * @param personalProperties - Array of personal property entries
 * @returns Total assets value
 */
export function calculateTotalAssets(
  realProperties: RealProperty[],
  personalProperties: PersonalProperty[]
): number {
  const realPropertyValue = calculateTotalRealPropertyValue(realProperties);
  const personalPropertyValue =
    calculateTotalPersonalPropertyValue(personalProperties);
  return realPropertyValue + personalPropertyValue;
}

/**
 * Calculate total liabilities
 * @param liabilities - Array of liability entries
 * @returns Total outstanding balance
 */
export function calculateTotalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((sum, liability) => {
    const balance = liability.outstandingBalance;
    const numBalance =
      typeof balance === 'string' ? parseFloat(balance) : balance || 0;
    return sum + (isNaN(numBalance) ? 0 : numBalance);
  }, 0);
}

/**
 * Calculate net worth (assets - liabilities)
 * @param assets - Total assets value
 * @param liabilities - Total liabilities value
 * @returns Net worth (can be negative)
 */
export function calculateNetWorth(assets: number, liabilities: number): number {
  return assets - liabilities;
}

/**
 * Calculate complete SALN summary with all totals
 * @param data - Partial or complete SALN data
 * @returns Complete summary object
 */
export function calculateSalnSummary(
  data: Partial<CompleteSalnData>
): SalnSummary {
  const totalRealPropertyValue = calculateTotalRealPropertyValue(
    data.realProperties || []
  );
  const totalPersonalPropertyValue = calculateTotalPersonalPropertyValue(
    data.personalProperties || []
  );
  const totalAssets = totalRealPropertyValue + totalPersonalPropertyValue;
  const totalLiabilities = calculateTotalLiabilities(data.liabilities || []);
  const netWorth = calculateNetWorth(totalAssets, totalLiabilities);

  return {
    totalRealPropertyValue,
    totalPersonalPropertyValue,
    totalAssets,
    totalLiabilities,
    netWorth,
  };
}

/**
 * Compare two SALN submissions for year-over-year analysis
 * @param current - Current year SALN data
 * @param previous - Previous year SALN data
 * @returns Comparison object with changes and percentage differences
 */
export function compareSalnYears(
  current: Partial<CompleteSalnData>,
  previous: Partial<CompleteSalnData>
): {
  assetsChange: number;
  assetsPercentChange: number;
  liabilitiesChange: number;
  liabilitiesPercentChange: number;
  netWorthChange: number;
  netWorthPercentChange: number;
} {
  const currentSummary = calculateSalnSummary(current);
  const previousSummary = calculateSalnSummary(previous);

  const assetsChange = currentSummary.totalAssets - previousSummary.totalAssets;
  const assetsPercentChange =
    previousSummary.totalAssets > 0
      ? (assetsChange / previousSummary.totalAssets) * 100
      : 0;

  const liabilitiesChange =
    currentSummary.totalLiabilities - previousSummary.totalLiabilities;
  const liabilitiesPercentChange =
    previousSummary.totalLiabilities > 0
      ? (liabilitiesChange / previousSummary.totalLiabilities) * 100
      : 0;

  const netWorthChange = currentSummary.netWorth - previousSummary.netWorth;
  const netWorthPercentChange =
    previousSummary.netWorth !== 0
      ? (netWorthChange / Math.abs(previousSummary.netWorth)) * 100
      : 0;

  return {
    assetsChange,
    assetsPercentChange,
    liabilitiesChange,
    liabilitiesPercentChange,
    netWorthChange,
    netWorthPercentChange,
  };
}

/**
 * Validate a specific SALN section
 * @param section - The section key to validate
 * @param data - The data to validate
 * @returns boolean indicating if the section is valid
 */
export function validateSalnSection(
  section: keyof CompleteSalnData,
  data: unknown
): boolean {
  try {
    switch (section) {
      case 'submission':
        declarantInfoSchema.parse(data);
        return true;
      case 'realProperties':
        z.array(realPropertySchema).parse(data);
        return true;
      case 'personalProperties':
        z.array(personalPropertySchema).parse(data);
        return true;
      case 'liabilities':
        z.array(liabilitySchema).parse(data);
        return true;
      case 'businessInterests':
        z.array(businessInterestSchema).parse(data);
        return true;
      case 'relativesInGov':
        z.array(relativeInGovernmentSchema).parse(data);
        return true;
      case 'calculations':
        salnSummarySchema.parse(data);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Calculate section completion progress
 * @param data - Partial SALN data
 * @returns Record of section names to completion percentage (0-100)
 */
export function getSalnSectionProgress(
  data: Partial<CompleteSalnData>
): Record<string, number> {
  const progress: Record<string, number> = {};

  // Section I: Declarant Information (required fields)
  if (data.submission) {
    const requiredFields = ['year', 'filingType'];
    const filled = requiredFields.filter(
      (field) => !!data.submission?.[field as keyof typeof data.submission]
    ).length;

    // Check spouse name if joint filing
    let totalRequired = requiredFields.length;
    let totalFilled = filled;

    if (data.submission.filingType === 'joint') {
      totalRequired += 1;
      if (data.submission.spouseName) {
        totalFilled += 1;
      }
    }

    progress.declarantInfo = Math.round((totalFilled / totalRequired) * 100);
  } else {
    progress.declarantInfo = 0;
  }

  // Section II: Real Properties
  progress.realProperties =
    data.realProperties && data.realProperties.length > 0 ? 100 : 0;

  // Section III: Personal Properties
  progress.personalProperties =
    data.personalProperties && data.personalProperties.length > 0 ? 100 : 0;

  // Section IV: Liabilities (optional, but 100% if any exist)
  progress.liabilities =
    data.liabilities && data.liabilities.length > 0 ? 100 : 100; // 100% even if empty

  // Section V: Business Interests (optional)
  progress.businessInterests =
    data.businessInterests && data.businessInterests.length > 0 ? 100 : 100; // 100% even if empty

  // Section VI: Relatives in Government (optional)
  progress.relativesInGov =
    data.relativesInGov && data.relativesInGov.length > 0 ? 100 : 100; // 100% even if empty

  return progress;
}

/**
 * Calculate overall SALN completion percentage
 * @param data - Partial SALN data
 * @returns Completion percentage (0-100)
 */
export function getOverallSalnProgress(
  data: Partial<CompleteSalnData>
): number {
  const sectionProgress = getSalnSectionProgress(data);
  const sections = Object.values(sectionProgress);
  const total = sections.reduce((sum, progress) => sum + progress, 0);
  return Math.round(total / sections.length);
}

/**
 * Calculate SALN readiness progress (submission readiness)
 * Only considers the required sections for submission:
 * - Declarant Info (50%)
 * - Has at least one asset (real or personal property) (50%)
 *
 * @param data - Partial SALN data
 * @returns Completion percentage (0-100) based on submission readiness
 */
export function getSalnReadinessProgress(
  data: Partial<CompleteSalnData>
): number {
  const sectionProgress = getSalnSectionProgress(data);

  // Declarant info progress
  const declarantProgress = sectionProgress.declarantInfo || 0;

  // Has assets check: 100 if at least one asset (real or personal property), 0 otherwise
  const hasRealProperties =
    data.realProperties && data.realProperties.length > 0;
  const hasPersonalProperties =
    data.personalProperties && data.personalProperties.length > 0;
  const assetsProgress = hasRealProperties || hasPersonalProperties ? 100 : 0;

  // Equal weight: 50% for declarant info, 50% for having assets
  return Math.round((declarantProgress + assetsProgress) / 2);
}

/**
 * Check if SALN is ready for submission
 * @param data - Complete SALN data
 * @returns boolean indicating if SALN meets minimum requirements
 */
export function isSalnReadyForSubmission(
  data: Partial<CompleteSalnData>
): boolean {
  try {
    // Must have declarant information
    if (!data.submission) return false;

    // Must have at least one asset (real or personal property)
    const hasAssets =
      (data.realProperties && data.realProperties.length > 0) ||
      (data.personalProperties && data.personalProperties.length > 0);
    if (!hasAssets) return false;

    // Validate declarant information
    declarantInfoSchema.parse(data.submission);

    // Validate all properties
    if (data.realProperties && data.realProperties.length > 0) {
      z.array(realPropertySchema).parse(data.realProperties);
    }

    if (data.personalProperties && data.personalProperties.length > 0) {
      z.array(personalPropertySchema).parse(data.personalProperties);
    }

    // Validate liabilities if present
    if (data.liabilities && data.liabilities.length > 0) {
      z.array(liabilitySchema).parse(data.liabilities);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Format currency for display (Philippine Peso)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage change with sign
 * @param percentChange - The percentage change value
 * @returns Formatted percentage string with + or - sign
 */
export function formatPercentChange(percentChange: number): string {
  const sign = percentChange >= 0 ? '+' : '';
  return `${sign}${percentChange.toFixed(2)}%`;
}

/**
 * Convert string currency from database to number
 * Database stores as decimal(15,2) which comes as string
 * @param value - The string value from database
 * @returns Number value
 */
export function parseCurrencyFromDb(value: string | number | null): number {
  if (value === null) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value);
}

/**
 * Convert number to string currency for database
 * @param value - The number value
 * @returns String formatted for database decimal(15,2)
 */
export function formatCurrencyForDb(value: number): string {
  return value.toFixed(2);
}
