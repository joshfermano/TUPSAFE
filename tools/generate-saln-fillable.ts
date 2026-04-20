/**
 * generate-saln-fillable.ts
 *
 * Node.js script that reads the SALN field map and stamps named AcroForm fields
 * onto the government SALN PDF template (2025 CSC Annexes).
 *
 * The template has 10 pages total:
 *   Pages 0-3: FOLIO size (612 x 936 pts) -- active pages
 *   Pages 4-9: LETTER size (612 x 792 pts) -- unused, will be removed at runtime
 *
 * Only pages 0-3 receive AcroForm fields:
 *   Page 0 (ANNEX A p1): Declarant info, children, real properties, personal properties
 *   Page 1 (ANNEX A p2): Liabilities, net worth, biz interests, relatives, signatures
 *   Page 2 (ANNEX B):    Declarant/joint overflow
 *   Page 3 (ANNEX C):    Spouse/child exclusive
 *
 * Usage:
 *   cd C:/Personal/TUPSAFE && npx tsx tools/generate-saln-fillable.ts
 *
 * Output:
 *   apps/employee/public/templates/saln-fillable.pdf
 *   apps/admin/public/templates/saln-fillable.pdf
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFFont } from 'pdf-lib';
import * as fontkit from 'fontkit';

// ---------------------------------------------------------------------------
// Inline type definitions (mirrors pdf-template/types.ts)
// ---------------------------------------------------------------------------

interface FieldPosition {
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  alignment?: 'left' | 'center' | 'right';
  fontVariant?: 'regular' | 'bold' | 'italic' | 'boldItalic';
  transform?: 'uppercase' | 'capitalize';
}

interface CheckboxPosition {
  x: number;
  y: number;
  size: number;
  style?: 'checkmark' | 'x' | 'fill';
}

interface TableColumn {
  x: number;
  width: number;
  fontSize: number;
  alignment?: 'left' | 'center' | 'right';
  fontVariant?: 'regular' | 'bold';
  accessor: string;
  formatter?: string;
}

interface TableConfig {
  startY: number;
  rowHeight: number;
  maxRows: number;
  columns: TableColumn[];
}

interface PageFieldMap {
  pageIndex: number;
  fields: Record<string, FieldPosition>;
  checkboxes: Record<string, CheckboxPosition>;
  images: Record<string, { x: number; y: number; width: number; height: number }>;
  tables: Record<string, TableConfig>;
}

// ---------------------------------------------------------------------------
// Inline constants (mirrors saln-constants.ts)
// ---------------------------------------------------------------------------

const FONT_SIZE = {
  fieldValue: 7,
  label: 6,
  tableCell: 6.5,
  currency: 7,
  sectionHeader: 8,
  footnote: 5.5,
} as const;

const ROW_HEIGHT = {
  standard: 14,
  children: 13,
  compact: 12,
} as const;

const ANNEX_A_PAGE1_INDEX = 0;
const ANNEX_A_PAGE2_INDEX = 1;
const ANNEX_B_PAGE_INDEX = 2;
const ANNEX_C_PAGE_INDEX = 3;

const MAX_REAL_PROPERTIES = 10;
const MAX_PERSONAL_PROPERTIES = 8;
const MAX_LIABILITIES = 12;
const MAX_BUSINESS_INTERESTS = 8;
const MAX_RELATIVES_IN_GOV = 8;
const MAX_CHILDREN = 12;

// ---------------------------------------------------------------------------
// Shared column X positions (from saln-field-map.ts)
// ---------------------------------------------------------------------------

// Real properties columns
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

// Personal properties columns
const PP_COL = {
  description: 38,
  yearAcquired: 310,
  acqCost: 440,
} as const;

// Liabilities columns
const LB_COL = {
  nature: 38,
  creditor: 270,
  balance: 460,
} as const;

// Business interests columns
const BI_COL = {
  entity: 38,
  address: 190,
  nature: 350,
  date: 500,
} as const;

// Relatives in government columns
const RG_COL = {
  name: 38,
  relationship: 180,
  position: 265,
  agency: 400,
} as const;

// Children columns
const CH_COL = {
  name: 38,
  age: 440,
} as const;

// ---------------------------------------------------------------------------
// ANNEX A Page 1 — Tables
// ---------------------------------------------------------------------------

const realPropertiesTable: TableConfig = {
  startY: 459,
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_REAL_PROPERTIES,
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

const personalPropertiesTable: TableConfig = {
  startY: 301,
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_PERSONAL_PROPERTIES,
  columns: [
    { x: PP_COL.description, width: 268, fontSize: FONT_SIZE.tableCell, accessor: 'description' },
    { x: PP_COL.yearAcquired, width: 126, fontSize: FONT_SIZE.tableCell, accessor: 'yearAcquired', alignment: 'center' },
    { x: PP_COL.acqCost, width: 136, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionCost', alignment: 'right', formatter: 'currency' },
  ],
};

const childrenTable: TableConfig = {
  startY: 594,
  rowHeight: ROW_HEIGHT.children,
  maxRows: MAX_CHILDREN,
  columns: [
    { x: CH_COL.name, width: 398, fontSize: FONT_SIZE.tableCell, accessor: 'name' },
    { x: CH_COL.age, width: 100, fontSize: FONT_SIZE.tableCell, accessor: 'age', alignment: 'center' },
  ],
};

// ---------------------------------------------------------------------------
// ANNEX A Page 2 — Tables
// ---------------------------------------------------------------------------

const liabilitiesTable: TableConfig = {
  startY: 864,
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_LIABILITIES,
  columns: [
    { x: LB_COL.nature, width: 228, fontSize: FONT_SIZE.tableCell, accessor: 'nature' },
    { x: LB_COL.creditor, width: 186, fontSize: FONT_SIZE.tableCell, accessor: 'creditorName' },
    { x: LB_COL.balance, width: 114, fontSize: FONT_SIZE.tableCell, accessor: 'outstandingBalance', alignment: 'right', formatter: 'currency' },
  ],
};

const businessInterestsTable: TableConfig = {
  startY: 622,
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_BUSINESS_INTERESTS,
  columns: [
    { x: BI_COL.entity, width: 148, fontSize: FONT_SIZE.tableCell, accessor: 'entityName' },
    { x: BI_COL.address, width: 156, fontSize: FONT_SIZE.tableCell, accessor: 'businessAddress' },
    { x: BI_COL.nature, width: 146, fontSize: FONT_SIZE.tableCell, accessor: 'natureOfBusiness' },
    { x: BI_COL.date, width: 76, fontSize: FONT_SIZE.tableCell, accessor: 'dateOfAcquisition', alignment: 'center', formatter: 'dateMMDDYYYY' },
  ],
};

const relativesInGovTable: TableConfig = {
  startY: 482,
  rowHeight: ROW_HEIGHT.standard,
  maxRows: MAX_RELATIVES_IN_GOV,
  columns: [
    { x: RG_COL.name, width: 138, fontSize: FONT_SIZE.tableCell, accessor: 'name' },
    { x: RG_COL.relationship, width: 81, fontSize: FONT_SIZE.tableCell, accessor: 'relationship' },
    { x: RG_COL.position, width: 131, fontSize: FONT_SIZE.tableCell, accessor: 'position' },
    { x: RG_COL.agency, width: 176, fontSize: FONT_SIZE.tableCell, accessor: 'agencyAddress' },
  ],
};

// ---------------------------------------------------------------------------
// ANNEX B — Overflow Tables
// ---------------------------------------------------------------------------

const annexBRealPropertiesTable: TableConfig = {
  startY: 764,
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

const annexBPersonalPropertiesTable: TableConfig = {
  startY: 524,
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 15,
  columns: [
    { x: PP_COL.description, width: 268, fontSize: FONT_SIZE.tableCell, accessor: 'description' },
    { x: PP_COL.yearAcquired, width: 126, fontSize: FONT_SIZE.tableCell, accessor: 'yearAcquired', alignment: 'center' },
    { x: PP_COL.acqCost, width: 136, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionCost', alignment: 'right', formatter: 'currency' },
  ],
};

const annexBLiabilitiesTable: TableConfig = {
  startY: 424,
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 15,
  columns: [
    { x: LB_COL.nature, width: 228, fontSize: FONT_SIZE.tableCell, accessor: 'nature' },
    { x: LB_COL.creditor, width: 186, fontSize: FONT_SIZE.tableCell, accessor: 'creditorName' },
    { x: LB_COL.balance, width: 114, fontSize: FONT_SIZE.tableCell, accessor: 'outstandingBalance', alignment: 'right', formatter: 'currency' },
  ],
};

const annexBBusinessInterestsTable: TableConfig = {
  startY: 324,
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 10,
  columns: [
    { x: BI_COL.entity, width: 148, fontSize: FONT_SIZE.tableCell, accessor: 'entityName' },
    { x: BI_COL.address, width: 156, fontSize: FONT_SIZE.tableCell, accessor: 'businessAddress' },
    { x: BI_COL.nature, width: 146, fontSize: FONT_SIZE.tableCell, accessor: 'natureOfBusiness' },
    { x: BI_COL.date, width: 76, fontSize: FONT_SIZE.tableCell, accessor: 'dateOfAcquisition', alignment: 'center', formatter: 'dateMMDDYYYY' },
  ],
};

// ---------------------------------------------------------------------------
// ANNEX C — Spouse/Child Tables
// ---------------------------------------------------------------------------

const annexCRealPropertiesTable: TableConfig = {
  startY: 754,
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

const annexCPersonalPropertiesTable: TableConfig = {
  startY: 524,
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 15,
  columns: [
    { x: PP_COL.description, width: 268, fontSize: FONT_SIZE.tableCell, accessor: 'description' },
    { x: PP_COL.yearAcquired, width: 126, fontSize: FONT_SIZE.tableCell, accessor: 'yearAcquired', alignment: 'center' },
    { x: PP_COL.acqCost, width: 136, fontSize: FONT_SIZE.tableCell, accessor: 'acquisitionCost', alignment: 'right', formatter: 'currency' },
  ],
};

const annexCLiabilitiesTable: TableConfig = {
  startY: 404,
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 15,
  columns: [
    { x: LB_COL.nature, width: 228, fontSize: FONT_SIZE.tableCell, accessor: 'nature' },
    { x: LB_COL.creditor, width: 186, fontSize: FONT_SIZE.tableCell, accessor: 'creditorName' },
    { x: LB_COL.balance, width: 114, fontSize: FONT_SIZE.tableCell, accessor: 'outstandingBalance', alignment: 'right', formatter: 'currency' },
  ],
};

const annexCBusinessInterestsTable: TableConfig = {
  startY: 304,
  rowHeight: ROW_HEIGHT.compact,
  maxRows: 10,
  columns: [
    { x: BI_COL.entity, width: 148, fontSize: FONT_SIZE.tableCell, accessor: 'entityName' },
    { x: BI_COL.address, width: 156, fontSize: FONT_SIZE.tableCell, accessor: 'businessAddress' },
    { x: BI_COL.nature, width: 146, fontSize: FONT_SIZE.tableCell, accessor: 'natureOfBusiness' },
    { x: BI_COL.date, width: 76, fontSize: FONT_SIZE.tableCell, accessor: 'dateOfAcquisition', alignment: 'center', formatter: 'dateMMDDYYYY' },
  ],
};

// ---------------------------------------------------------------------------
// Page field maps — one per active page (0-3)
// Field names are prefixed per annex section:
//   a1. = ANNEX A page 1
//   a2. = ANNEX A page 2
//   b.  = ANNEX B
//   c.  = ANNEX C
// ---------------------------------------------------------------------------

const annexAPage1: PageFieldMap = {
  pageIndex: ANNEX_A_PAGE1_INDEX,

  fields: {
    // Compliance date fields
    'a1.complianceDateAssumption': { x: 260, y: 850, maxWidth: 80, fontSize: FONT_SIZE.fieldValue },
    'a1.year': { x: 394, y: 837, maxWidth: 40, fontSize: FONT_SIZE.fieldValue },
    'a1.complianceDateExit': { x: 200, y: 824, maxWidth: 80, fontSize: FONT_SIZE.fieldValue },

    // Declarant info
    'a1.declarantInfo.surname': { x: 50, y: 784, maxWidth: 130, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },
    'a1.declarantInfo.firstName': { x: 200, y: 784, maxWidth: 130, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },
    'a1.declarantInfo.middleInitial': { x: 350, y: 784, maxWidth: 50, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },
    'a1.declarantInfo.position': { x: 50, y: 766, maxWidth: 240, fontSize: FONT_SIZE.fieldValue },
    'a1.declarantInfo.agency': { x: 310, y: 766, maxWidth: 260, fontSize: FONT_SIZE.fieldValue },
    'a1.declarantInfo.officeAddress': { x: 50, y: 748, maxWidth: 520, fontSize: FONT_SIZE.fieldValue },

    // Spouse info
    'a1.spouseInfo.surname': { x: 50, y: 724, maxWidth: 130, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },
    'a1.spouseInfo.firstName': { x: 200, y: 724, maxWidth: 130, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },
    'a1.spouseInfo.middleInitial': { x: 350, y: 724, maxWidth: 50, fontSize: FONT_SIZE.fieldValue, transform: 'uppercase' },
    'a1.spousePosition': { x: 50, y: 706, maxWidth: 240, fontSize: FONT_SIZE.fieldValue },
    'a1.spouseAgency': { x: 310, y: 706, maxWidth: 260, fontSize: FONT_SIZE.fieldValue },
    'a1.spouseOfficeAddress': { x: 50, y: 688, maxWidth: 520, fontSize: FONT_SIZE.fieldValue },

    // Multiple marriages
    'a1.previousSpouseNames': { x: 60, y: 634, maxWidth: 500, fontSize: FONT_SIZE.fieldValue },

    // Total assets (bottom of page 1)
    'a1.totalAssetsPage1': { x: 460, y: 197, maxWidth: 115, fontSize: FONT_SIZE.currency, alignment: 'right', fontVariant: 'bold' },

    // Real properties subtotal
    'a1.realPropertiesSubtotal': { x: 520, y: 316, maxWidth: 72, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },

    // Personal properties subtotal
    'a1.personalPropertiesSubtotal': { x: 440, y: 192, maxWidth: 136, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },
  },

  checkboxes: {
    // Compliance type checkboxes
    'cb.compliance.assumption': { x: 62, y: 850, size: 8, style: 'checkmark' },
    'cb.compliance.annual': { x: 62, y: 837, size: 8, style: 'checkmark' },
    'cb.compliance.exit': { x: 62, y: 824, size: 8, style: 'checkmark' },

    // Filing type checkboxes
    'cb.filing.joint': { x: 160, y: 668, size: 8, style: 'checkmark' },
    'cb.filing.separate': { x: 270, y: 668, size: 8, style: 'checkmark' },
    'cb.filing.notApplicable': { x: 400, y: 668, size: 8, style: 'checkmark' },

    // Multiple marriages - not applicable checkbox
    'cb.multipleMarriages.na': { x: 50, y: 634, size: 8, style: 'checkmark' },
  },

  images: {},

  tables: {
    children: childrenTable,
    realProperties: realPropertiesTable,
    personalProperties: personalPropertiesTable,
  },
};

const annexAPage2: PageFieldMap = {
  pageIndex: ANNEX_A_PAGE2_INDEX,

  fields: {
    // Total liabilities
    'a2.totalLiabilities': { x: 460, y: 689, maxWidth: 114, fontSize: FONT_SIZE.currency, alignment: 'right', fontVariant: 'bold' },

    // Net worth
    'a2.netWorth': { x: 300, y: 668, maxWidth: 140, fontSize: FONT_SIZE.sectionHeader, alignment: 'right', fontVariant: 'bold' },

    // Declaration date
    'a2.declarationDate': { x: 90, y: 339, maxWidth: 150, fontSize: FONT_SIZE.fieldValue },

    // Government ID 1 (left column)
    'a2.governmentIdType': { x: 50, y: 286, maxWidth: 180, fontSize: FONT_SIZE.label },
    'a2.governmentIdNumber': { x: 50, y: 274, maxWidth: 180, fontSize: FONT_SIZE.label },
    'a2.governmentIdDateIssued': { x: 50, y: 262, maxWidth: 180, fontSize: FONT_SIZE.label },

    // Government ID 2 (right column)
    'a2.governmentIdType2': { x: 320, y: 286, maxWidth: 180, fontSize: FONT_SIZE.label },
    'a2.governmentIdNumber2': { x: 320, y: 274, maxWidth: 180, fontSize: FONT_SIZE.label },
    'a2.governmentIdDateIssued2': { x: 320, y: 262, maxWidth: 180, fontSize: FONT_SIZE.label },
  },

  checkboxes: {
    // "I/We do not have" checkboxes
    'cb.hasNoBusinessInterests': { x: 50, y: 638, size: 8, style: 'checkmark' },
    'cb.hasNoRelativesInGov': { x: 50, y: 498, size: 8, style: 'checkmark' },
  },

  images: {},

  tables: {
    liabilities: liabilitiesTable,
    businessInterests: businessInterestsTable,
    relativesInGov: relativesInGovTable,
  },
};

const annexBPage: PageFieldMap = {
  pageIndex: ANNEX_B_PAGE_INDEX,

  fields: {
    // Declarant identification header
    'b.declarantInfo.surname': { x: 120, y: 824, maxWidth: 100, fontSize: FONT_SIZE.fieldValue },
    'b.declarantInfo.firstName': { x: 240, y: 824, maxWidth: 100, fontSize: FONT_SIZE.fieldValue },
    'b.declarantInfo.middleInitial': { x: 360, y: 824, maxWidth: 40, fontSize: FONT_SIZE.fieldValue },
    'b.declarantInfo.position': { x: 430, y: 824, maxWidth: 140, fontSize: FONT_SIZE.fieldValue },
    'b.declarantInfo.agency': { x: 120, y: 808, maxWidth: 450, fontSize: FONT_SIZE.fieldValue },

    // Subtotals
    'b.realPropertiesOverflowSubtotal': { x: 520, y: 539, maxWidth: 72, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },
    'b.personalPropertiesOverflowSubtotal': { x: 440, y: 396, maxWidth: 136, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },
    'b.totalAssetsOverflow': { x: 460, y: 380, maxWidth: 115, fontSize: FONT_SIZE.currency, alignment: 'right', fontVariant: 'bold' },
    'b.liabilitiesOverflowSubtotal': { x: 460, y: 294, maxWidth: 114, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },
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

const annexCPage: PageFieldMap = {
  pageIndex: ANNEX_C_PAGE_INDEX,

  fields: {
    // Declarant identification header
    'c.declarantInfo.surname': { x: 120, y: 814, maxWidth: 100, fontSize: FONT_SIZE.fieldValue },
    'c.declarantInfo.firstName': { x: 240, y: 814, maxWidth: 100, fontSize: FONT_SIZE.fieldValue },
    'c.declarantInfo.middleInitial': { x: 360, y: 814, maxWidth: 40, fontSize: FONT_SIZE.fieldValue },
    'c.declarantInfo.position': { x: 430, y: 814, maxWidth: 140, fontSize: FONT_SIZE.fieldValue },
    'c.declarantInfo.agency': { x: 120, y: 798, maxWidth: 450, fontSize: FONT_SIZE.fieldValue },

    // Subtotals
    'c.realPropertiesSpouseSubtotal': { x: 520, y: 544, maxWidth: 72, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },
    'c.personalPropertiesSpouseSubtotal': { x: 440, y: 396, maxWidth: 136, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },
    'c.totalAssetsSpouse': { x: 460, y: 380, maxWidth: 115, fontSize: FONT_SIZE.currency, alignment: 'right', fontVariant: 'bold' },
    'c.liabilitiesSpouseSubtotal': { x: 460, y: 274, maxWidth: 114, fontSize: FONT_SIZE.tableCell, alignment: 'right', fontVariant: 'bold' },
    'c.netWorthSpouse': { x: 300, y: 254, maxWidth: 140, fontSize: FONT_SIZE.sectionHeader, alignment: 'right', fontVariant: 'bold' },
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
// Assembled page configs (only pages 0-3, not 4-9)
// ---------------------------------------------------------------------------

const pageConfigs: PageFieldMap[] = [annexAPage1, annexAPage2, annexBPage, annexCPage];

// Page prefix for table field naming
const PAGE_PREFIX: Record<number, string> = {
  [ANNEX_A_PAGE1_INDEX]: 'a1',
  [ANNEX_A_PAGE2_INDEX]: 'a2',
  [ANNEX_B_PAGE_INDEX]: 'b',
  [ANNEX_C_PAGE_INDEX]: 'c',
};

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const ROOT = path.resolve(__dirname, '..');
  const templatePath = path.join(ROOT, 'apps/employee/public/templates/saln-annexes-2025.pdf');
  const fontPath = path.join(ROOT, 'apps/employee/public/fonts/liberation-serif-regular.ttf');
  const outEmployee = path.join(ROOT, 'apps/employee/public/templates/saln-fillable.pdf');
  const outAdmin = path.join(ROOT, 'apps/admin/public/templates/saln-fillable.pdf');

  // Verify source files exist
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template PDF not found: ${templatePath}`);
  }
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file not found: ${fontPath}`);
  }

  console.log('Loading SALN template PDF...');
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  // Register fontkit and embed the font
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = fs.readFileSync(fontPath);
  const font: PDFFont = await pdfDoc.embedFont(fontBytes);

  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();

  console.log(`Template has ${pages.length} pages.`);
  console.log('Adding AcroForm fields to pages 0-3 only (FOLIO 612x936)...');

  let textFieldCount = 0;
  let checkboxCount = 0;
  let tableCellCount = 0;

  // Process each page config (pages 0-3 only)
  for (const pageConfig of pageConfigs) {
    const page = pages[pageConfig.pageIndex];
    if (!page) {
      console.warn(`Page index ${pageConfig.pageIndex} does not exist in template, skipping.`);
      continue;
    }

    const prefix = PAGE_PREFIX[pageConfig.pageIndex];

    // --- Static text fields ---
    for (const [fieldName, pos] of Object.entries(pageConfig.fields)) {
      const tf = form.createTextField(fieldName);
      tf.addToPage(page, {
        x: pos.x,
        y: pos.y - 2,
        width: pos.maxWidth,
        height: pos.fontSize + 6,
      });
      tf.setFontSize(pos.fontSize);
      // tf.updateAppearances(font); -- skip during generation, applied at fill time
      textFieldCount++;
    }

    // --- Checkboxes ---
    // Checkbox names are already prefixed with "cb." in the field map
    for (const [name, pos] of Object.entries(pageConfig.checkboxes)) {
      const cb = form.createCheckBox(name);
      cb.addToPage(page, {
        x: pos.x,
        y: pos.y - 2,
        width: 10,
        height: 10,
      });
      checkboxCount++;
    }

    // --- Table rows ---
    for (const [tableName, tableConfig] of Object.entries(pageConfig.tables)) {
      for (let row = 0; row < tableConfig.maxRows; row++) {
        for (const col of tableConfig.columns) {
          const fieldName = `${prefix}.tbl.${tableName}.${row}.${col.accessor}`;
          const rowY = tableConfig.startY - row * tableConfig.rowHeight;
          const tf = form.createTextField(fieldName);
          tf.addToPage(page, {
            x: col.x,
            y: rowY - 2,
            width: col.width,
            height: tableConfig.rowHeight,
          });
          tf.setFontSize(col.fontSize);
          // tf.updateAppearances(font); -- skip during generation, applied at fill time
          tableCellCount++;
        }
      }
    }
  }

  // --- Make ALL fields transparent (no border, no background) ---
  console.log('Making all field widgets transparent...');
  for (const field of form.getFields()) {
    const widgets = field.acroField.getWidgets();
    for (const widget of widgets) {
      // Set border to zero width: /Border [0 0 0]
      widget.dict.set(PDFName.of('Border'), pdfDoc.context.obj([0, 0, 0]));

      // Remove background and border color from MK (appearance characteristics)
      const mkDict = widget.dict.lookup(PDFName.of('MK'));
      if (mkDict && typeof (mkDict as Record<string, unknown>).delete === 'function') {
        (mkDict as { delete: (key: PDFName) => void }).delete(PDFName.of('BG'));
        (mkDict as { delete: (key: PDFName) => void }).delete(PDFName.of('BC'));
      }
    }
  }

  // --- Save ---
  console.log('Saving fillable SALN PDF...');
  const pdfBytes = await pdfDoc.save();

  fs.writeFileSync(outEmployee, pdfBytes);
  console.log(`  -> ${outEmployee}`);

  // Ensure admin templates directory exists
  const adminTemplatesDir = path.dirname(outAdmin);
  if (!fs.existsSync(adminTemplatesDir)) {
    fs.mkdirSync(adminTemplatesDir, { recursive: true });
  }
  fs.writeFileSync(outAdmin, pdfBytes);
  console.log(`  -> ${outAdmin}`);

  // --- Summary ---
  const totalFields = textFieldCount + checkboxCount + tableCellCount;
  console.log('');
  console.log('=== SALN Fillable PDF Generation Complete ===');
  console.log(`  Text fields:  ${textFieldCount}`);
  console.log(`  Checkboxes:   ${checkboxCount}`);
  console.log(`  Table cells:  ${tableCellCount}`);
  console.log(`  Total fields: ${totalFields}`);
  console.log('');
  console.log('Page breakdown:');
  for (const pc of pageConfigs) {
    const pref = PAGE_PREFIX[pc.pageIndex];
    const fCount = Object.keys(pc.fields).length;
    const cCount = Object.keys(pc.checkboxes).length;
    let tCount = 0;
    for (const tc of Object.values(pc.tables)) {
      tCount += tc.maxRows * tc.columns.length;
    }
    const pageName =
      pc.pageIndex === 0 ? 'ANNEX A p1' :
      pc.pageIndex === 1 ? 'ANNEX A p2' :
      pc.pageIndex === 2 ? 'ANNEX B' :
      'ANNEX C';
    console.log(`  Page ${pc.pageIndex} (${pageName}, prefix="${pref}"): ${fCount} text, ${cCount} checkboxes, ${tCount} table cells`);
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
