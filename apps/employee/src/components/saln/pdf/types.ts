/**
 * Type definitions for SALN PDF generation
 * Matches the CSC SALN Form 2019 structure
 * Used with @react-pdf/renderer library
 */

/**
 * Government ID information for signature section
 * @example
 * {
 *   type: "TIN",
 *   number: "123-456-789-000",
 *   dateIssued: "2020-01-15"
 * }
 */
export interface GovernmentID {
  type?: string | null;
  number?: string | null;
  dateIssued?: string | null;
}

/**
 * Declarant information
 * Contains personal and professional details of the person filing the SALN
 */
export interface DeclarantInfo {
  surname: string;
  firstName: string;
  middleInitial?: string | null;
  position: string;
  agency: string;
  officeAddress: string;
  governmentId?: GovernmentID | null;
}

/**
 * Spouse information for joint filing
 * Same structure as DeclarantInfo
 */
export interface SpouseInfo {
  surname: string;
  firstName: string;
  middleInitial?: string | null;
  position: string;
  agency: string;
  officeAddress: string;
  governmentId?: GovernmentID | null;
}

/**
 * Information about unmarried children below 18 years old
 * @example
 * {
 *   name: "Juan Dela Cruz Jr.",
 *   dateOfBirth: "2010-05-20",
 *   age: 13
 * }
 */
export interface ChildInfo {
  name: string;
  dateOfBirth: string | Date;
  age: number;
}

/**
 * Real property information
 * Includes land, buildings, and improvements
 *
 * Property kinds:
 * - Residential: Houses, condominiums, residential lots
 * - Commercial: Office buildings, retail spaces, commercial lots
 * - Agricultural: Farms, plantations, agricultural land
 * - Industrial: Factories, warehouses, industrial lots
 * - Mixed: Properties with multiple uses
 *
 * Acquisition modes:
 * - "Purchase" - Outright purchase
 * - "Sale with mortgage" - Purchase with ongoing mortgage
 * - "Deed of Sale" - Through deed of sale
 * - "Inheritance" - Inherited property
 * - "Donation" - Donated property
 * - "Homestead" - Homestead patent
 * - "Other" - Other acquisition methods
 *
 * @example
 * {
 *   description: "House and Lot",
 *   kind: "residential",
 *   location: "123 Main St., Quezon City",
 *   assessedValue: 1500000,
 *   currentFairMarketValue: 3000000,
 *   acquisitionYear: 2015,
 *   acquisitionMode: "Sale with mortgage",
 *   acquisitionCost: 2500000
 * }
 */
export interface RealProperty {
  description: string;
  kind: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'mixed';
  exactLocation: string;
  assessedValue: number;
  currentFairMarketValue: number;
  acquisitionYear: number;
  acquisitionMode: string;
  acquisitionCost: number;
}

/**
 * Personal property information
 * Includes vehicles, jewelry, cash, and other movable assets
 *
 * Common descriptions:
 * - "Motor Vehicle" - Cars, motorcycles, trucks
 * - "Cash on Hand" - Physical cash
 * - "Cash in Bank" - Bank deposits, savings accounts
 * - "Stocks/Bonds" - Securities and investments
 * - "Jewelry" - Personal jewelry and accessories
 * - "Electronics" - Computers, gadgets, appliances
 * - "Furniture" - Home and office furniture
 * - "Other Personal Property" - Other movable assets
 *
 * @example
 * {
 *   description: "Toyota Vios 2020",
 *   yearAcquired: 2020,
 *   acquisitionCost: 850000
 * }
 */
export interface PersonalProperty {
  description: string;
  yearAcquired: number;
  acquisitionCost: number;
}

/**
 * Liability information
 * Includes debts, loans, and financial obligations
 *
 * Common natures:
 * - "Home Loan/Mortgage" - Housing loans
 * - "Car Loan" - Vehicle financing
 * - "Personal Loan" - Personal loans
 * - "Credit Card" - Credit card balances
 * - "Business Loan" - Business-related loans
 * - "Educational Loan" - Student loans
 * - "Other Liabilities" - Other debts and obligations
 *
 * @example
 * {
 *   nature: "Home Loan",
 *   creditors: "BPI Family Savings Bank",
 *   outstandingBalance: 1500000
 * }
 */
export interface Liability {
  nature: string;
  creditorName: string;
  outstandingBalance: number;
}

/**
 * Business interest and financial connection
 * Includes ownership, partnership, or directorship in business entities
 *
 * Nature of interest examples:
 * - "Sole Proprietor" - Owns the business
 * - "Partner" - Business partner
 * - "Stockholder" - Owns shares
 * - "Director" - Board member
 * - "Officer" - Corporate officer
 * - "Consultant" - Business consultant
 *
 * @example
 * {
 *   entityName: "ABC Trading Corporation",
 *   businessAddress: "456 Commerce Ave., Makati City",
 *   natureOfInterest: "Stockholder",
 *   acquisitionDate: "2018-03-15"
 * }
 */
export interface BusinessInterest {
  entityName: string;
  businessAddress: string;
  natureOfBusiness: string;
  dateOfAcquisition: string | Date;
}

/**
 * Relatives in government service
 * Fourth degree of consanguinity or affinity
 *
 * Common relationships:
 * - "Spouse" - Husband/Wife
 * - "Father" - Father
 * - "Mother" - Mother
 * - "Son" - Son
 * - "Daughter" - Daughter
 * - "Brother" - Brother
 * - "Sister" - Sister
 * - "Uncle" - Uncle
 * - "Aunt" - Aunt
 * - "Cousin" - Cousin
 * - "Father-in-law" - Spouse's father
 * - "Mother-in-law" - Spouse's mother
 * - "Brother-in-law" - Spouse's brother
 * - "Sister-in-law" - Spouse's sister
 *
 * @example
 * {
 *   name: "Maria Santos",
 *   relationship: "Sister",
 *   position: "Administrative Officer IV",
 *   agencyOffice: "Department of Education - Division Office"
 * }
 */
export interface RelativeInGov {
  name: string;
  relationship: string;
  position: string;
  agencyAddress: string;
}

/**
 * Filing type for SALN
 * Determines whether assets are filed jointly with spouse or separately
 */
export type FilingType = 'joint' | 'separate' | 'not_applicable';

/**
 * Complete SALN data structure for PDF generation
 * Aggregates all sections of the CSC SALN Form 2019
 *
 * @example
 * {
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   year: 2024,
 *   filingType: "separate",
 *   declarantInfo: {
 *     surname: "Dela Cruz",
 *     firstName: "Juan",
 *     middleInitial: "S",
 *     position: "Professor III",
 *     agency: "Technological University of the Philippines",
 *     officeAddress: "Ayala Blvd., Ermita, Manila"
 *   },
 *   realProperties: [...],
 *   personalProperties: [...],
 *   liabilities: [...],
 *   businessInterests: [...],
 *   relativesInGov: [...],
 *   totalAssets: 5000000,
 *   totalLiabilities: 1500000,
 *   netWorth: 3500000,
 *   submittedAt: new Date("2024-01-15")
 * }
 */
export interface SALNData {
  id: string;
  year: number;
  filingType: FilingType;

  // Declarant and family information
  declarantInfo: DeclarantInfo;
  spouseInfo?: SpouseInfo | null;
  children?: ChildInfo[] | null;

  // Assets
  realProperties: RealProperty[];
  personalProperties: PersonalProperty[];

  // Liabilities
  liabilities: Liability[];

  // Business interests and government connections
  businessInterests: BusinessInterest[];
  relativesInGov: RelativeInGov[];

  // Financial summary (auto-calculated)
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;

  // Metadata
  submittedAt?: Date | string | null;
}

/**
 * Validation result for SALN data
 * Used to check data completeness and correctness before PDF generation
 *
 * @example
 * {
 *   isValid: false,
 *   errors: [
 *     "Declarant first name is required",
 *     "At least one asset (real or personal property) must be declared"
 *   ],
 *   warnings: [
 *     "No liabilities declared - confirm if accurate",
 *     "No business interests declared"
 *   ]
 * }
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * PDF generation options
 * Configuration for customizing PDF output
 */
export interface PDFGenerationOptions {
  /**
   * Include detailed breakdown of assets and liabilities
   * @default true
   */
  includeDetails?: boolean;

  /**
   * Include year-over-year comparison if available
   * @default false
   */
  includeComparison?: boolean;

  /**
   * Include watermark for draft versions
   * @default false
   */
  includeDraftWatermark?: boolean;

  /**
   * Page size for PDF
   * @default "A4"
   */
  pageSize?: 'A4' | 'Letter' | 'Legal';

  /**
   * Page orientation
   * @default "portrait"
   */
  orientation?: 'portrait' | 'landscape';
}

/**
 * Year-over-year comparison data
 * Used for tracking changes in net worth and assets
 */
export interface YearOverYearComparison {
  previousYear: number;
  currentYear: number;
  previousNetWorth: number;
  currentNetWorth: number;
  netWorthChange: number;
  netWorthChangePercentage: number;
  previousTotalAssets: number;
  currentTotalAssets: number;
  assetsChange: number;
  previousTotalLiabilities: number;
  currentTotalLiabilities: number;
  liabilitiesChange: number;
}

/**
 * Section summary for PDF
 * Provides quick overview of each SALN section
 */
export interface SectionSummary {
  realPropertiesCount: number;
  realPropertiesTotal: number;
  personalPropertiesCount: number;
  personalPropertiesTotal: number;
  liabilitiesCount: number;
  liabilitiesTotal: number;
  businessInterestsCount: number;
  relativesInGovCount: number;
}
