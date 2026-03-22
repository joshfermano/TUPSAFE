/**
 * Field coordinate maps for SALN PDF template filling.
 *
 * Defines the exact (estimated) x,y positions where data is stamped onto each
 * page of the government SALN template PDF (`saln-annexes-2025.pdf`).
 *
 * The template pages 0-3 are FOLIO size (612 x 936 pts) with pdf-lib bottom-left origin.
 * Y coordinates decrease as you move down the page (y=936 is the top edge).
 *
 * Coordinate values are best-effort estimates for the 2025 CSC SALN template
 * and will be refined after visual comparison with the actual template overlay.
 *
 * Page layout matches:
 *   Page 0 (ANNEX A p1): Declarant, spouse, filing, children, real props, personal props, total assets
 *   Page 1 (ANNEX A p2): Liabilities, net worth, biz interests, relatives, declaration, signatures
 *   Page 2 (ANNEX B AS-1): Declarant overflow
 *   Page 3 (ANNEX C AS-2): Spouse/children exclusive
 *   Pages 4-9: Unused/legacy (removed during filling)
 */

import type { PageFieldMap, TemplateConfig, TableConfig } from '../pdf-template/types';
import {
  FONT_SIZE,
  ROW_HEIGHT,
  ANNEX_A_PAGE1_INDEX,
  ANNEX_A_PAGE2_INDEX,
  ANNEX_B_PAGE_INDEX,
  ANNEX_C_PAGE_INDEX,
  MAX_REAL_PROPERTIES,
  MAX_PERSONAL_PROPERTIES,
  MAX_LIABILITIES,
  MAX_BUSINESS_INTERESTS,
  MAX_RELATIVES_IN_GOV,
  MAX_CHILDREN,
} from './saln-constants';

// ---------------------------------------------------------------------------
// Shared column X positions (estimated for the standard CSC SALN template)
// ---------------------------------------------------------------------------

// ANNEX A Page 1 — Real properties table column positions
const RP_COL = {
  description: 38,
  kind: 108,
  location: 172,
  assessedValue: 270,
  fairMarketValue: 338,
  acqYear: 410,
  acqMode: 448,
  acqCost: 520,
} as const;

// ANNEX A Page 1 — Personal properties table column positions
const PP_COL = {
  description: 38,
  yearAcquired: 310,
  acqCost: 440,
} as const;

// ANNEX A Page 2 — Liabilities table column positions
const LB_COL = {
  nature: 38,
  creditor: 270,
  balance: 460,
} as const;

// ANNEX A Page 2 — Business interests table column positions
const BI_COL = {
  entity: 38,
  address: 190,
  nature: 350,
  date: 500,
} as const;

// ANNEX A Page 2 — Relatives in government table column positions
const RG_COL = {
  name: 38,
  relationship: 180,
  position: 265,
  agency: 400,
} as const;

// Children table column positions
const CH_COL = {
  name: 38,
  age: 440,
} as const;

// ---------------------------------------------------------------------------
// Height offset: FOLIO (936) vs old LETTER assumption (792) = +144 pts
// All Y coordinates on pages 0-3 are shifted up by 144 pts from the old values.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ANNEX A Page 1 field map  (page height = 936 pts)
// ---------------------------------------------------------------------------

/** Real properties table config for ANNEX A Page 1 */
const realPropertiesTable: TableConfig = {
  startY: 459,            // was 315; +144
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_REAL_PROPERTIES,
  columns: [
    { x: RP_COL.description, width: 68, fontSize: FONT_SIZE.tableCell, accessor: 'description' },
    { x: RP_COL.kind, width: 60, fontSize: FONT_SIZE.tableCell, accessor: 'kind', formatter: undefined },
    { x: RP_COL.location, width: 94, fontSize: FONT_SIZE.tableCell, accessor: 'exactLocation' },
    { x: RP_COL.assessedValue, width: 64, fontSize: FONT_SIZE.tableCell, accessor: 'assessedValue', alignment: 'right', formatter: 'currency' },
    { x: RP_COL.fairMarketValue, width: 68, fontSize: FONT_SIZE.tableCell, accessor: 'currentFairMarketValue', alignment: 'right', formatter: 'currency' },
    { x: RP_COL.acqYear, width: 34, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionYear', alignment: 'center' },
    { x: RP_COL.acqMode, width: 68, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionMode' },
    { x: RP_COL.acqCost, width: 72, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionCost', alignment: 'right', formatter: 'currency' },
  ],
};

/** Personal properties table config for ANNEX A Page 1 */
const personalPropertiesTable: TableConfig = {
  startY: 301,            // was 157; +144
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_PERSONAL_PROPERTIES,
  columns: [
    { x: PP_COL.description, width: 268, fontSize: FONT_SIZE.tableCell, accessor: 'description' },
    { x: PP_COL.yearAcquired, width: 126, fontSize: FONT_SIZE.tableCell, accessor: 'yearAcquired', alignment: 'center' },
    { x: PP_COL.acqCost, width: 136, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionCost', alignment: 'right', formatter: 'currency' },
  ],
};

/** Children table config for ANNEX A Page 1 */
const childrenTable: TableConfig = {
  startY: 594,            // was 450; +144
  rowHeight: ROW_HEIGHT.children,
  maxRows: MAX_CHILDREN,
  columns: [
    { x: CH_COL.name, width: 398, fontSize: FONT_SIZE.tableCell, accessor: 'name' },
    { x: CH_COL.age, width: 100, fontSize: FONT_SIZE.tableCell, accessor: 'age', alignment: 'center' },
  ],
};

const annexAPage1: PageFieldMap = {
  pageIndex: ANNEX_A_PAGE1_INDEX,

  fields: {
    // Compliance date fields (+144 offset)
    'complianceDateAssumption': { x: 260, y: 850, maxWidth: 80, fontSize: FONT_SIZE.fieldValue },  // was 706
    'year': { x: 394, y: 837, maxWidth: 40, fontSize: FONT_SIZE.fieldValue },                       // was 693
    'complianceDateExit': { x: 200, y: 824, maxWidth: 80, fontSize: FONT_SIZE.fieldValue },         // was 680

    // Declarant info (+144 offset)
    'declarantInfo.surname': { x: 50, y: 784, maxWidth: 130, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },       // was 640
    'declarantInfo.firstName': { x: 200, y: 784, maxWidth: 130, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },     // was 640
    'declarantInfo.middleInitial': { x: 350, y: 784, maxWidth: 50, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },  // was 640
    'declarantInfo.position': { x: 50, y: 766, maxWidth: 240, fontSize: FONT_SIZE.fieldValue },     // was 622
    'declarantInfo.agency': { x: 310, y: 766, maxWidth: 260, fontSize: FONT_SIZE.fieldValue },      // was 622
    'declarantInfo.officeAddress': { x: 50, y: 748, maxWidth: 520, fontSize: FONT_SIZE.fieldValue }, // was 604

    // Spouse info (+144 offset)
    'spouseInfo.surname': { x: 50, y: 724, maxWidth: 130, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },       // was 580
    'spouseInfo.firstName': { x: 200, y: 724, maxWidth: 130, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },     // was 580
    'spouseInfo.middleInitial': { x: 350, y: 724, maxWidth: 50, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },  // was 580
    'spousePosition': { x: 50, y: 706, maxWidth: 240, fontSize: FONT_SIZE.fieldValue },             // was 562
    'spouseAgency': { x: 310, y: 706, maxWidth: 260, fontSize: FONT_SIZE.fieldValue },              // was 562
    'spouseOfficeAddress': { x: 50, y: 688, maxWidth: 520, fontSize: FONT_SIZE.fieldValue },        // was 544

    // Multiple marriages (+144 offset)
    'previousSpouseNames': { x: 60, y: 634, maxWidth: 500, fontSize: FONT_SIZE.fieldValue },        // was 490

    // Total assets (bottom of page 1) (+144 offset)
    'totalAssetsPage1': { x: 460, y: 197, maxWidth: 115, fontSize: FONT_SIZE.currency, alignment: 'right', fontVariant: 'bold' },  // was 53

    // Real properties subtotal (+144 offset)
    'realPropertiesSubtotal': { x: 520, y: 316, maxWidth: 72, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },  // was 172

    // Personal properties subtotal (+144 offset)
    'personalPropertiesSubtotal': { x: 440, y: 192, maxWidth: 136, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },  // was 48
  },

  checkboxes: {
    // Compliance type checkboxes (+144 offset)
    'compliance_assumption': { x: 62, y: 850, size: 8, style: 'checkmark' },    // was 706
    'compliance_annual': { x: 62, y: 837, size: 8, style: 'checkmark' },        // was 693
    'compliance_exit': { x: 62, y: 824, size: 8, style: 'checkmark' },          // was 680

    // Filing type checkboxes (+144 offset)
    'filing_joint': { x: 160, y: 668, size: 8, style: 'checkmark' },            // was 524
    'filing_separate': { x: 270, y: 668, size: 8, style: 'checkmark' },         // was 524
    'filing_not_applicable': { x: 400, y: 668, size: 8, style: 'checkmark' },   // was 524

    // Multiple marriages - not applicable checkbox (+144 offset)
    'multipleMarriages_na': { x: 50, y: 634, size: 8, style: 'checkmark' },     // was 490
  },

  images: {},

  tables: {
    children: childrenTable,
    realProperties: realPropertiesTable,
    personalProperties: personalPropertiesTable,
  },
};

// ---------------------------------------------------------------------------
// ANNEX A Page 2 field map  (page height = 936 pts)
// ---------------------------------------------------------------------------

/** Liabilities table config for ANNEX A Page 2 */
const liabilitiesTable: TableConfig = {
  startY: 864,            // was 720; +144
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_LIABILITIES,
  columns: [
    { x: LB_COL.nature, width: 228, fontSize: FONT_SIZE.tableCell, accessor: 'nature' },
    { x: LB_COL.creditor, width: 186, fontSize: FONT_SIZE.tableCell, accessor: 'creditorName' },
    { x: LB_COL.balance, width: 114, fontSize: FONT_SIZE.tableCell, accessor: 'outstandingBalance', alignment: 'right', formatter: 'currency' },
  ],
};

/** Business interests table config for ANNEX A Page 2 */
const businessInterestsTable: TableConfig = {
  startY: 622,            // was 478; +144
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_BUSINESS_INTERESTS,
  columns: [
    { x: BI_COL.entity, width: 148, fontSize: FONT_SIZE.tableCell, accessor: 'entityName' },
    { x: BI_COL.address, width: 156, fontSize: FONT_SIZE.tableCell, accessor: 'businessAddress' },
    { x: BI_COL.nature, width: 146, fontSize: FONT_SIZE.tableCell, accessor: 'natureOfBusiness' },
    { x: BI_COL.date, width: 76, fontSize: FONT_SIZE.tableCell, accessor: 'dateOfAcquisition', alignment: 'center', formatter: 'dateMMDDYYYY' },
  ],
};

/** Relatives in government table config for ANNEX A Page 2 */
const relativesInGovTable: TableConfig = {
  startY: 482,            // was 338; +144
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_RELATIVES_IN_GOV,
  columns: [
    { x: RG_COL.name, width: 138, fontSize: FONT_SIZE.tableCell, accessor: 'name' },
    { x: RG_COL.relationship, width: 81, fontSize: FONT_SIZE.tableCell, accessor: 'relationship' },
    { x: RG_COL.position, width: 131, fontSize: FONT_SIZE.tableCell, accessor: 'position' },
    { x: RG_COL.agency, width: 176, fontSize: FONT_SIZE.tableCell, accessor: 'agencyAddress' },
  ],
};

const annexAPage2: PageFieldMap = {
  pageIndex: ANNEX_A_PAGE2_INDEX,

  fields: {
    // Total liabilities (+144 offset)
    'totalLiabilities': { x: 460, y: 689, maxWidth: 114, fontSize: FONT_SIZE.currency, alignment: 'right', fontVariant: 'bold' },  // was 545

    // Net worth line (+144 offset)
    'netWorth': { x: 300, y: 668, maxWidth: 140, fontSize: FONT_SIZE.sectionHeader, alignment: 'right', fontVariant: 'bold' },  // was 524

    // Date field before signatures (+144 offset)
    'declarationDate': { x: 90, y: 339, maxWidth: 150, fontSize: FONT_SIZE.fieldValue },  // was 195

    // Government ID 1 (left column) (+144 offset)
    'governmentIdType': { x: 50, y: 286, maxWidth: 180, fontSize: FONT_SIZE.label },       // was 142
    'governmentIdNumber': { x: 50, y: 274, maxWidth: 180, fontSize: FONT_SIZE.label },     // was 130
    'governmentIdDateIssued': { x: 50, y: 262, maxWidth: 180, fontSize: FONT_SIZE.label }, // was 118

    // Government ID 2 (right column) (+144 offset)
    'governmentIdType2': { x: 320, y: 286, maxWidth: 180, fontSize: FONT_SIZE.label },       // was 142
    'governmentIdNumber2': { x: 320, y: 274, maxWidth: 180, fontSize: FONT_SIZE.label },     // was 130
    'governmentIdDateIssued2': { x: 320, y: 262, maxWidth: 180, fontSize: FONT_SIZE.label }, // was 118
  },

  checkboxes: {
    // "I/We do not have" checkboxes (+144 offset)
    'hasNoBusinessInterests': { x: 50, y: 638, size: 8, style: 'checkmark' },  // was 494
    'hasNoRelativesInGov': { x: 50, y: 498, size: 8, style: 'checkmark' },     // was 354
  },

  images: {},

  tables: {
    liabilities: liabilitiesTable,
    businessInterests: businessInterestsTable,
    relativesInGov: relativesInGovTable,
  },
};

// ---------------------------------------------------------------------------
// ANNEX B (AS-1) field map — Declarant overflow  (page height = 936 pts)
// ---------------------------------------------------------------------------

/** Overflow real properties table for ANNEX B */
const annexBRealPropertiesTable: TableConfig = {
  startY: 764,            // was 620; +144
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 20,
  columns: [
    { x: RP_COL.description, width: 68, fontSize: FONT_SIZE.tableCell, accessor: 'description' },
    { x: RP_COL.kind, width: 60, fontSize: FONT_SIZE.tableCell, accessor: 'kind' },
    { x: RP_COL.location, width: 94, fontSize: FONT_SIZE.tableCell, accessor: 'exactLocation' },
    { x: RP_COL.assessedValue, width: 64, fontSize: FONT_SIZE.tableCell, accessor: 'assessedValue', alignment: 'right', formatter: 'currency' },
    { x: RP_COL.fairMarketValue, width: 68, fontSize: FONT_SIZE.tableCell, accessor: 'currentFairMarketValue', alignment: 'right', formatter: 'currency' },
    { x: RP_COL.acqYear, width: 34, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionYear', alignment: 'center' },
    { x: RP_COL.acqMode, width: 68, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionMode' },
    { x: RP_COL.acqCost, width: 72, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionCost', alignment: 'right', formatter: 'currency' },
  ],
};

/** Overflow personal properties table for ANNEX B */
const annexBPersonalPropertiesTable: TableConfig = {
  startY: 524,            // was 380; +144
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 15,
  columns: [
    { x: PP_COL.description, width: 268, fontSize: FONT_SIZE.tableCell, accessor: 'description' },
    { x: PP_COL.yearAcquired, width: 126, fontSize: FONT_SIZE.tableCell, accessor: 'yearAcquired', alignment: 'center' },
    { x: PP_COL.acqCost, width: 136, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionCost', alignment: 'right', formatter: 'currency' },
  ],
};

/** Overflow liabilities table for ANNEX B */
const annexBLiabilitiesTable: TableConfig = {
  startY: 424,            // was 280; +144
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 15,
  columns: [
    { x: LB_COL.nature, width: 228, fontSize: FONT_SIZE.tableCell, accessor: 'nature' },
    { x: LB_COL.creditor, width: 186, fontSize: FONT_SIZE.tableCell, accessor: 'creditorName' },
    { x: LB_COL.balance, width: 114, fontSize: FONT_SIZE.tableCell, accessor: 'outstandingBalance', alignment: 'right', formatter: 'currency' },
  ],
};

/** Overflow business interests table for ANNEX B */
const annexBBusinessInterestsTable: TableConfig = {
  startY: 324,            // was 180; +144
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 10,
  columns: [
    { x: BI_COL.entity, width: 148, fontSize: FONT_SIZE.tableCell, accessor: 'entityName' },
    { x: BI_COL.address, width: 156, fontSize: FONT_SIZE.tableCell, accessor: 'businessAddress' },
    { x: BI_COL.nature, width: 146, fontSize: FONT_SIZE.tableCell, accessor: 'natureOfBusiness' },
    { x: BI_COL.date, width: 76, fontSize: FONT_SIZE.tableCell, accessor: 'dateOfAcquisition', alignment: 'center', formatter: 'dateMMDDYYYY' },
  ],
};

const annexBPage: PageFieldMap = {
  pageIndex: ANNEX_B_PAGE_INDEX,

  fields: {
    // Declarant identification header (+144 offset)
    'declarantInfo.surname': { x: 120, y: 824, maxWidth: 100, fontSize: FONT_SIZE.fieldValue },       // was 680
    'declarantInfo.firstName': { x: 240, y: 824, maxWidth: 100, fontSize: FONT_SIZE.fieldValue },     // was 680
    'declarantInfo.middleInitial': { x: 360, y: 824, maxWidth: 40, fontSize: FONT_SIZE.fieldValue },  // was 680
    'declarantInfo.position': { x: 430, y: 824, maxWidth: 140, fontSize: FONT_SIZE.fieldValue },      // was 680
    'declarantInfo.agency': { x: 120, y: 808, maxWidth: 450, fontSize: FONT_SIZE.fieldValue },        // was 664

    // Subtotals (+144 offset)
    'realPropertiesOverflowSubtotal': { x: 520, y: 539, maxWidth: 72, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },   // was 395
    'personalPropertiesOverflowSubtotal': { x: 440, y: 396, maxWidth: 136, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },  // was 252
    'totalAssetsOverflow': { x: 460, y: 380, maxWidth: 115, fontSize: FONT_SIZE.currency, alignment: 'right', fontVariant: 'bold' },               // was 236
    'liabilitiesOverflowSubtotal': { x: 460, y: 294, maxWidth: 114, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },     // was 150
  },

  checkboxes: {},
  images: {},

  tables: {
    realProperties: annexBRealPropertiesTable,
    personalProperties: annexBPersonalPropertiesTable,
    liabilities: annexBLiabilitiesTable,
    businessInterests: annexBBusinessInterestsTable,
  },
};

// ---------------------------------------------------------------------------
// ANNEX C (AS-2) field map — Spouse/children exclusive  (page height = 936 pts)
// ---------------------------------------------------------------------------

/** Spouse/child real properties table for ANNEX C */
const annexCRealPropertiesTable: TableConfig = {
  startY: 754,            // was 610; +144
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 15,
  columns: [
    { x: RP_COL.description, width: 68, fontSize: FONT_SIZE.tableCell, accessor: 'description' },
    { x: RP_COL.kind, width: 60, fontSize: FONT_SIZE.tableCell, accessor: 'kind' },
    { x: RP_COL.location, width: 94, fontSize: FONT_SIZE.tableCell, accessor: 'exactLocation' },
    { x: RP_COL.assessedValue, width: 64, fontSize: FONT_SIZE.tableCell, accessor: 'assessedValue', alignment: 'right', formatter: 'currency' },
    { x: RP_COL.fairMarketValue, width: 68, fontSize: FONT_SIZE.tableCell, accessor: 'currentFairMarketValue', alignment: 'right', formatter: 'currency' },
    { x: RP_COL.acqYear, width: 34, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionYear', alignment: 'center' },
    { x: RP_COL.acqMode, width: 68, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionMode' },
    { x: RP_COL.acqCost, width: 72, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionCost', alignment: 'right', formatter: 'currency' },
  ],
};

/** Spouse/child personal properties table for ANNEX C */
const annexCPersonalPropertiesTable: TableConfig = {
  startY: 524,            // was 380; +144
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 15,
  columns: [
    { x: PP_COL.description, width: 268, fontSize: FONT_SIZE.tableCell, accessor: 'description' },
    { x: PP_COL.yearAcquired, width: 126, fontSize: FONT_SIZE.tableCell, accessor: 'yearAcquired', alignment: 'center' },
    { x: PP_COL.acqCost, width: 136, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionCost', alignment: 'right', formatter: 'currency' },
  ],
};

/** Spouse/child liabilities table for ANNEX C */
const annexCLiabilitiesTable: TableConfig = {
  startY: 404,            // was 260; +144
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 15,
  columns: [
    { x: LB_COL.nature, width: 228, fontSize: FONT_SIZE.tableCell, accessor: 'nature' },
    { x: LB_COL.creditor, width: 186, fontSize: FONT_SIZE.tableCell, accessor: 'creditorName' },
    { x: LB_COL.balance, width: 114, fontSize: FONT_SIZE.tableCell, accessor: 'outstandingBalance', alignment: 'right', formatter: 'currency' },
  ],
};

/** Spouse/child business interests table for ANNEX C */
const annexCBusinessInterestsTable: TableConfig = {
  startY: 304,            // was 160; +144
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 10,
  columns: [
    { x: BI_COL.entity, width: 148, fontSize: FONT_SIZE.tableCell, accessor: 'entityName' },
    { x: BI_COL.address, width: 156, fontSize: FONT_SIZE.tableCell, accessor: 'businessAddress' },
    { x: BI_COL.nature, width: 146, fontSize: FONT_SIZE.tableCell, accessor: 'natureOfBusiness' },
    { x: BI_COL.date, width: 76, fontSize: FONT_SIZE.tableCell, accessor: 'dateOfAcquisition', alignment: 'center', formatter: 'dateMMDDYYYY' },
  ],
};

const annexCPage: PageFieldMap = {
  pageIndex: ANNEX_C_PAGE_INDEX,

  fields: {
    // Declarant identification header (+144 offset)
    'declarantInfo.surname': { x: 120, y: 814, maxWidth: 100, fontSize: FONT_SIZE.fieldValue },       // was 670
    'declarantInfo.firstName': { x: 240, y: 814, maxWidth: 100, fontSize: FONT_SIZE.fieldValue },     // was 670
    'declarantInfo.middleInitial': { x: 360, y: 814, maxWidth: 40, fontSize: FONT_SIZE.fieldValue },  // was 670
    'declarantInfo.position': { x: 430, y: 814, maxWidth: 140, fontSize: FONT_SIZE.fieldValue },      // was 670
    'declarantInfo.agency': { x: 120, y: 798, maxWidth: 450, fontSize: FONT_SIZE.fieldValue },        // was 654

    // Subtotals (+144 offset)
    'realPropertiesSpouseSubtotal': { x: 520, y: 544, maxWidth: 72, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },    // was 400
    'personalPropertiesSpouseSubtotal': { x: 440, y: 396, maxWidth: 136, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },  // was 252
    'totalAssetsSpouse': { x: 460, y: 380, maxWidth: 115, fontSize: FONT_SIZE.currency, alignment: 'right', fontVariant: 'bold' },                 // was 236
    'liabilitiesSpouseSubtotal': { x: 460, y: 274, maxWidth: 114, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },       // was 130
    'netWorthSpouse': { x: 300, y: 254, maxWidth: 140, fontSize: FONT_SIZE.sectionHeader, alignment: 'right', fontVariant: 'bold' },              // was 110
  },

  checkboxes: {},
  images: {},

  tables: {
    realProperties: annexCRealPropertiesTable,
    personalProperties: annexCPersonalPropertiesTable,
    liabilities: annexCLiabilitiesTable,
    businessInterests: annexCBusinessInterestsTable,
  },
};

// ---------------------------------------------------------------------------
// Exported template configuration
// ---------------------------------------------------------------------------

/** Complete SALN template config for all four active pages */
export const SALN_TEMPLATE_CONFIG: TemplateConfig = {
  templatePath: 'templates/saln-annexes-2025.pdf',
  pages: [annexAPage1, annexAPage2, annexBPage, annexCPage],
};

/** Direct reference to the ANNEX A Page 1 field map */
export const SALN_ANNEX_A_PAGE1_CONFIG = annexAPage1;

/** Direct reference to the ANNEX A Page 2 field map */
export const SALN_ANNEX_A_PAGE2_CONFIG = annexAPage2;

/** Direct reference to the ANNEX B (AS-1) field map */
export const SALN_ANNEX_B_CONFIG = annexBPage;

/** Direct reference to the ANNEX C (AS-2) field map */
export const SALN_ANNEX_C_CONFIG = annexCPage;
