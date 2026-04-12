/**
 * SALN AcroForm filler — fills the government SALN form using named AcroForm
 * fields instead of coordinate-based stamping.
 *
 * Loads the fillable template (`saln-fillable.pdf`), fills fields by name via
 * FormFiller.setText / setCheckbox / fillTable, flattens to static content,
 * removes unused pages, and returns the final PDF bytes.
 *
 * IMPORTANT: This filler does NOT stamp any page headers, titles, or annex labels.
 * The template PDF already contains all static text (e.g. "ANNEX A", "ANNEX B",
 * section titles, column headers). This code only fills in dynamic data fields.
 *
 * Flow:
 *   1. Fetch the 10-page fillable template PDF (pages 0-3 are FOLIO 936pt,
 *      pages 4-9 are LETTER 792pt).
 *   2. Load fonts via FontManager.
 *   3. Create a FormFiller instance.
 *   4. Normalize SALNData to ensure safe defaults for all fields.
 *   5. Fill ANNEX A pages 1-2 (indices 0-1) with main declarant/joint data.
 *   6. If overflow exists, fill ANNEX B (index 2) with declarant overflow.
 *   7. If spouse/child exclusive items exist, fill ANNEX C (index 3).
 *   8. Flatten to static content BEFORE page removal (critical).
 *   9. Remove unused pages: always remove 4-9, conditionally remove ANNEX B/C.
 *  10. Return the saved PDF bytes.
 */

import { FormFiller } from '../pdf-template/FormFiller';
import { loadAllFonts } from '../pdf-template/FontManager';
import { formatCurrency, formatDateMMDDYYYY, displayOrEmpty } from '../pdf-template/utils';
import type { SALNData, DeclarantInfo, SpouseInfo } from './types';

import {
  shouldRenderAnnexB,
  shouldRenderAnnexC,
  splitRealProperties,
  splitPersonalProperties,
  splitLiabilities,
  splitBusinessInterests,
  getAnnexCData,
  calculateMainPageTotals,
  calculateNetWorth,
} from './saln-overflow';

import {
  ANNEX_B_PAGE_INDEX,
  ANNEX_C_PAGE_INDEX,
  UNUSED_PAGE_INDICES,
} from './saln-constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a date-like value to MM/DD/YYYY string */
function toDateStr(value: string | Date | undefined | null): string {
  if (!value) return '';
  return formatDateMMDDYYYY(value);
}

/** Capitalize the first letter of a string */
function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Safely coerce a numeric-like value to a number */
function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

/**
 * Normalize SALNData to ensure all fields have safe defaults.
 *
 * The data flowing into the filler may originate from various transform layers
 * (e.g. transformSalnFromBackend -> transformSALNToData) where some fields
 * end up as null, undefined, or string-typed numbers.  This function provides
 * a single place to guarantee safe values before filling.
 */
function normalizeSALNData(raw: SALNData): SALNData {
  const safeDeclarant: DeclarantInfo = {
    surname: raw.declarantInfo?.surname ?? '',
    firstName: raw.declarantInfo?.firstName ?? '',
    middleInitial: raw.declarantInfo?.middleInitial ?? null,
    position: raw.declarantInfo?.position ?? '',
    agency: raw.declarantInfo?.agency ?? '',
    officeAddress: raw.declarantInfo?.officeAddress ?? '',
    governmentId: raw.declarantInfo?.governmentId ?? null,
  };

  let safeSpouse: SpouseInfo | null = null;
  if (raw.spouseInfo) {
    safeSpouse = {
      surname: raw.spouseInfo.surname ?? '',
      firstName: raw.spouseInfo.firstName ?? '',
      middleInitial: raw.spouseInfo.middleInitial ?? null,
      position: raw.spouseInfo.position ?? '',
      agency: raw.spouseInfo.agency ?? '',
      officeAddress: raw.spouseInfo.officeAddress ?? '',
      governmentId: raw.spouseInfo.governmentId ?? null,
    };
  }

  // Ensure numeric fields on property arrays are actual numbers
  const realProperties = (raw.realProperties ?? []).map((p) => ({
    ...p,
    assessedValue: toNum(p.assessedValue),
    currentFairMarketValue: toNum(p.currentFairMarketValue),
    acquisitionYear: toNum(p.acquisitionYear),
    acquisitionCost: toNum(p.acquisitionCost),
  }));

  const personalProperties = (raw.personalProperties ?? []).map((p) => ({
    ...p,
    yearAcquired: toNum(p.yearAcquired),
    acquisitionCost: toNum(p.acquisitionCost),
  }));

  const liabilities = (raw.liabilities ?? []).map((l) => ({
    ...l,
    outstandingBalance: toNum(l.outstandingBalance),
  }));

  return {
    ...raw,
    year: raw.year ?? new Date().getFullYear(),
    filingType: raw.filingType ?? 'not_applicable',
    declarantInfo: safeDeclarant,
    spouseInfo: safeSpouse,
    children: raw.children ?? [],
    realProperties,
    personalProperties,
    liabilities,
    businessInterests: raw.businessInterests ?? [],
    relativesInGov: raw.relativesInGov ?? [],
    totalAssets: toNum(raw.totalAssets),
    totalLiabilities: toNum(raw.totalLiabilities),
    netWorth: toNum(raw.netWorth),
    unmarriedChildren: raw.unmarriedChildren ?? [],
    complianceType: raw.complianceType ?? null,
    complianceDate: raw.complianceDate ?? null,
    hasMultipleMarriages: raw.hasMultipleMarriages ?? false,
    previousSpouseNames: raw.previousSpouseNames ?? null,
    spouseIsPublicOfficial: raw.spouseIsPublicOfficial ?? false,
    spousePosition: raw.spousePosition ?? null,
    spouseAgency: raw.spouseAgency ?? null,
    spouseOfficeAddress: raw.spouseOfficeAddress ?? null,
    hasNoBusinessInterests: raw.hasNoBusinessInterests ?? false,
    hasNoRelativesInGov: raw.hasNoRelativesInGov ?? false,
    governmentIdType: raw.governmentIdType ?? '',
    governmentIdNumber: raw.governmentIdNumber ?? '',
    governmentIdDateIssued: raw.governmentIdDateIssued ?? undefined,
    governmentIdType2: raw.governmentIdType2 ?? '',
    governmentIdNumber2: raw.governmentIdNumber2 ?? '',
    governmentIdDateIssued2: raw.governmentIdDateIssued2 ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// ANNEX A Page 1 filling
// ---------------------------------------------------------------------------

function fillAnnexAPage1(filler: FormFiller, data: SALNData): void {
  // --- Compliance checkboxes ---
  filler.setCheckbox('cb.compliance.assumption', data.complianceType === 'assumption');
  filler.setCheckbox('cb.compliance.annual', data.complianceType === 'annual');
  filler.setCheckbox('cb.compliance.exit', data.complianceType === 'exit');

  // --- Compliance date fields ---
  if (data.complianceType === 'assumption' && data.complianceDate) {
    filler.setText('a1.complianceDateAssumption', toDateStr(data.complianceDate));
  }
  filler.setText('a1.year', String(data.year || ''));
  if (data.complianceType === 'exit' && data.complianceDate) {
    filler.setText('a1.complianceDateExit', toDateStr(data.complianceDate));
  }

  // --- Declarant info ---
  const miFit = { alignment: 'center' as const, minFontSize: 5 };
  const fieldFit = { minFontSize: 5 };
  filler.setText('a1.declarantInfo.surname', displayOrEmpty(data.declarantInfo.surname));
  filler.setText('a1.declarantInfo.firstName', displayOrEmpty(data.declarantInfo.firstName));
  filler.setTextWithFit('a1.declarantInfo.middleInitial', displayOrEmpty(data.declarantInfo.middleInitial), miFit);
  filler.setTextWithFit('a1.declarantInfo.position', displayOrEmpty(data.declarantInfo.position), fieldFit);
  filler.setTextWithFit('a1.declarantInfo.agency', displayOrEmpty(data.declarantInfo.agency), fieldFit);
  filler.setTextWithFit('a1.declarantInfo.officeAddress', displayOrEmpty(data.declarantInfo.officeAddress), fieldFit);

  // --- Spouse info ---
  if (data.spouseInfo) {
    filler.setText('a1.spouseInfo.surname', displayOrEmpty(data.spouseInfo.surname));
    filler.setText('a1.spouseInfo.firstName', displayOrEmpty(data.spouseInfo.firstName));
    filler.setTextWithFit('a1.spouseInfo.middleInitial', displayOrEmpty(data.spouseInfo.middleInitial), miFit);
  } else {
    filler.setText('a1.spouseInfo.surname', 'N/A');
    filler.setText('a1.spouseInfo.firstName', 'N/A');
    filler.setTextWithFit('a1.spouseInfo.middleInitial', 'N/A', miFit);
  }

  // Spouse position/agency uses either top-level fields or spouseInfo fallback
  const spousePos = data.spousePosition || data.spouseInfo?.position || '';
  const spouseAgency = data.spouseAgency || data.spouseInfo?.agency || '';
  const spouseAddr = data.spouseOfficeAddress || data.spouseInfo?.officeAddress || '';
  filler.setTextWithFit('a1.spousePosition', displayOrEmpty(spousePos), fieldFit);
  filler.setTextWithFit('a1.spouseAgency', displayOrEmpty(spouseAgency), fieldFit);
  filler.setTextWithFit('a1.spouseOfficeAddress', displayOrEmpty(spouseAddr), fieldFit);

  // --- Filing type checkboxes ---
  filler.setCheckbox('cb.filing.joint', data.filingType === 'joint');
  filler.setCheckbox('cb.filing.separate', data.filingType === 'separate');
  filler.setCheckbox('cb.filing.notApplicable', data.filingType === 'not_applicable');

  // --- Multiple marriages ---
  if (data.hasMultipleMarriages && data.previousSpouseNames) {
    filler.setText('a1.previousSpouseNames', data.previousSpouseNames);
  } else {
    filler.setCheckbox('cb.multipleMarriages.na', true);
  }

  // --- Children table ---
  const childrenData = (data.unmarriedChildren && data.unmarriedChildren.length > 0)
    ? data.unmarriedChildren
    : (data.children || []);

  if (childrenData.length > 0) {
    const childRows = childrenData.map((child) => ({
      name: displayOrEmpty(child.name),
      age: String(child.age),
    }));
    filler.fillTable('children', childRows, 'a1.tbl.children');
  }

  // --- Real properties table (declarant/joint, first 10) ---
  const tableFit = { minFontSize: 4 };
  const realSplit = splitRealProperties(data);
  if (realSplit.mainPage.length > 0) {
    const realRows = realSplit.mainPage.map((p) => ({
      description: displayOrEmpty(p.description),
      kind: capitalize(p.kind),
      exactLocation: displayOrEmpty(p.exactLocation),
      assessedValue: formatCurrency(p.assessedValue),
      currentFairMarketValue: formatCurrency(p.currentFairMarketValue),
      acquisitionYear: String(p.acquisitionYear),
      acquisitionMode: displayOrEmpty(p.acquisitionMode),
      acquisitionCost: formatCurrency(p.acquisitionCost),
    }));
    filler.fillTable('realProperties', realRows, 'a1.tbl.realProperties', tableFit);
  }

  // --- Personal properties table (declarant/joint, first 8) ---
  const personalSplit = splitPersonalProperties(data);
  if (personalSplit.mainPage.length > 0) {
    const personalRows = personalSplit.mainPage.map((p) => ({
      description: displayOrEmpty(p.description),
      yearAcquired: String(p.yearAcquired),
      acquisitionCost: formatCurrency(p.acquisitionCost),
    }));
    filler.fillTable('personalProperties', personalRows, 'a1.tbl.personalProperties', tableFit);
  }

  // --- Subtotals and total assets ---
  const pageTotals = calculateMainPageTotals(data);
  if (realSplit.mainPage.length > 0) {
    filler.setText('a1.realPropertiesSubtotal', formatCurrency(pageTotals.realPropertiesSubtotal));
  }
  if (personalSplit.mainPage.length > 0) {
    filler.setText('a1.personalPropertiesSubtotal', formatCurrency(pageTotals.personalPropertiesSubtotal));
  }
  filler.setText('a1.totalAssetsPage1', formatCurrency(pageTotals.totalAssets));
}

// ---------------------------------------------------------------------------
// ANNEX A Page 2 filling
// ---------------------------------------------------------------------------

function fillAnnexAPage2(filler: FormFiller, data: SALNData): void {
  const tableFit = { minFontSize: 4 };

  // --- Liabilities table ---
  const liabSplit = splitLiabilities(data);
  if (liabSplit.mainPage.length > 0) {
    const liabRows = liabSplit.mainPage.map((l) => ({
      nature: displayOrEmpty(l.nature),
      creditorName: displayOrEmpty(l.creditorName),
      outstandingBalance: formatCurrency(l.outstandingBalance),
    }));
    filler.fillTable('liabilities', liabRows, 'a2.tbl.liabilities', tableFit);
  }

  // Total liabilities
  const totalLiabilities = (data.liabilities || []).reduce(
    (sum, l) => sum + (l.outstandingBalance || 0),
    0
  );
  filler.setText('a2.totalLiabilities', formatCurrency(totalLiabilities));

  // --- Net worth ---
  const nw = calculateNetWorth(data);
  filler.setText('a2.netWorth', formatCurrency(nw.netWorth));

  // --- Business interests ---
  if (data.hasNoBusinessInterests) {
    filler.setCheckbox('cb.hasNoBusinessInterests', true);
  } else {
    const bizSplit = splitBusinessInterests(data);
    if (bizSplit.mainPage.length > 0) {
      const bizRows = bizSplit.mainPage.map((b) => ({
        entityName: displayOrEmpty(b.entityName),
        businessAddress: displayOrEmpty(b.businessAddress),
        natureOfBusiness: displayOrEmpty(b.natureOfBusiness),
        dateOfAcquisition: toDateStr(b.dateOfAcquisition),
      }));
      filler.fillTable('businessInterests', bizRows, 'a2.tbl.businessInterests', tableFit);
    }
  }

  // --- Relatives in government ---
  if (data.hasNoRelativesInGov) {
    filler.setCheckbox('cb.hasNoRelativesInGov', true);
  } else {
    const relatives = (data.relativesInGov || []).slice(0, 8);
    if (relatives.length > 0) {
      const relRows = relatives.map((r) => ({
        name: displayOrEmpty(r.name),
        relationship: displayOrEmpty(r.relationship),
        position: displayOrEmpty(r.position),
        agencyAddress: displayOrEmpty(r.agencyAddress),
      }));
      filler.fillTable('relativesInGov', relRows, 'a2.tbl.relativesInGov', tableFit);
    }
  }

  // --- Declaration date ---
  if (data.submittedAt) {
    filler.setText('a2.declarationDate', toDateStr(data.submittedAt));
  }

  // --- Government ID 1 ---
  filler.setText(
    'a2.governmentIdType',
    displayOrEmpty(data.governmentIdType || data.declarantInfo.governmentId?.type)
  );
  filler.setText(
    'a2.governmentIdNumber',
    displayOrEmpty(data.governmentIdNumber || data.declarantInfo.governmentId?.number)
  );
  const govId1Date = data.governmentIdDateIssued || data.declarantInfo.governmentId?.dateIssued;
  filler.setText(
    'a2.governmentIdDateIssued',
    govId1Date ? toDateStr(govId1Date) : ''
  );

  // --- Government ID 2 ---
  const govId2Type = data.governmentId2?.type || data.governmentIdType2 || '';
  const govId2Number = data.governmentId2?.number || data.governmentIdNumber2 || '';
  const govId2Date = data.governmentId2?.dateIssued || data.governmentIdDateIssued2 || '';
  filler.setText('a2.governmentIdType2', displayOrEmpty(govId2Type));
  filler.setText('a2.governmentIdNumber2', displayOrEmpty(govId2Number));
  filler.setText('a2.governmentIdDateIssued2', govId2Date ? toDateStr(govId2Date) : '');
}

// ---------------------------------------------------------------------------
// ANNEX B (AS-1) filling -- Declarant overflow
// ---------------------------------------------------------------------------

function fillAnnexB(filler: FormFiller, data: SALNData): void {
  const miFit = { alignment: 'center' as const, minFontSize: 5 };
  const fieldFit = { minFontSize: 5 };
  const tableFit = { minFontSize: 4 };

  // --- Declarant identification ---
  filler.setText('b.declarantInfo.surname', displayOrEmpty(data.declarantInfo.surname));
  filler.setText('b.declarantInfo.firstName', displayOrEmpty(data.declarantInfo.firstName));
  filler.setTextWithFit('b.declarantInfo.middleInitial', displayOrEmpty(data.declarantInfo.middleInitial), miFit);
  filler.setTextWithFit('b.declarantInfo.position', displayOrEmpty(data.declarantInfo.position), fieldFit);
  filler.setTextWithFit('b.declarantInfo.agency', displayOrEmpty(data.declarantInfo.agency), fieldFit);

  // --- Overflow real properties ---
  const realSplit = splitRealProperties(data);
  if (realSplit.overflow.length > 0) {
    const realRows = realSplit.overflow.map((p) => ({
      description: displayOrEmpty(p.description),
      kind: capitalize(p.kind),
      exactLocation: displayOrEmpty(p.exactLocation),
      assessedValue: formatCurrency(p.assessedValue),
      currentFairMarketValue: formatCurrency(p.currentFairMarketValue),
      acquisitionYear: String(p.acquisitionYear),
      acquisitionMode: displayOrEmpty(p.acquisitionMode),
      acquisitionCost: formatCurrency(p.acquisitionCost),
    }));
    filler.fillTable('realProperties', realRows, 'b.tbl.realProperties', tableFit);

    // Subtotal - use currentFairMarketValue per SALNAnnexB.tsx
    const subtotal = realSplit.overflow.reduce(
      (sum, p) => sum + (p.currentFairMarketValue || 0),
      0
    );
    filler.setText('b.realPropertiesOverflowSubtotal', formatCurrency(subtotal));
  }

  // --- Overflow personal properties ---
  const personalSplit = splitPersonalProperties(data);
  if (personalSplit.overflow.length > 0) {
    const personalRows = personalSplit.overflow.map((p) => ({
      description: displayOrEmpty(p.description),
      yearAcquired: String(p.yearAcquired),
      acquisitionCost: formatCurrency(p.acquisitionCost),
    }));
    filler.fillTable('personalProperties', personalRows, 'b.tbl.personalProperties', tableFit);

    const subtotal = personalSplit.overflow.reduce(
      (sum, p) => sum + (p.acquisitionCost || 0),
      0
    );
    filler.setText('b.personalPropertiesOverflowSubtotal', formatCurrency(subtotal));
  }

  // --- Total assets overflow ---
  const realOverflowTotal = realSplit.overflow.reduce(
    (sum, p) => sum + (p.currentFairMarketValue || 0),
    0
  );
  const personalOverflowTotal = personalSplit.overflow.reduce(
    (sum, p) => sum + (p.acquisitionCost || 0),
    0
  );
  if (realSplit.overflow.length > 0 || personalSplit.overflow.length > 0) {
    filler.setText('b.totalAssetsOverflow', formatCurrency(realOverflowTotal + personalOverflowTotal));
  }

  // --- Overflow liabilities ---
  const liabSplit = splitLiabilities(data);
  if (liabSplit.overflow.length > 0) {
    const liabRows = liabSplit.overflow.map((l) => ({
      nature: displayOrEmpty(l.nature),
      creditorName: displayOrEmpty(l.creditorName),
      outstandingBalance: formatCurrency(l.outstandingBalance),
    }));
    filler.fillTable('liabilities', liabRows, 'b.tbl.liabilities', tableFit);

    const subtotal = liabSplit.overflow.reduce(
      (sum, l) => sum + (l.outstandingBalance || 0),
      0
    );
    filler.setText('b.liabilitiesOverflowSubtotal', formatCurrency(subtotal));
  }

  // --- Overflow business interests ---
  const bizSplit = splitBusinessInterests(data);
  if (bizSplit.overflow.length > 0) {
    const bizRows = bizSplit.overflow.map((b) => ({
      entityName: displayOrEmpty(b.entityName),
      businessAddress: displayOrEmpty(b.businessAddress),
      natureOfBusiness: displayOrEmpty(b.natureOfBusiness),
      dateOfAcquisition: toDateStr(b.dateOfAcquisition),
    }));
    filler.fillTable('businessInterests', bizRows, 'b.tbl.businessInterests', tableFit);
  }
}

// ---------------------------------------------------------------------------
// ANNEX C (AS-2) filling -- Spouse/child exclusive
// ---------------------------------------------------------------------------

function fillAnnexC(filler: FormFiller, data: SALNData): void {
  const annexCData = getAnnexCData(data);
  const miFit = { alignment: 'center' as const, minFontSize: 5 };
  const fieldFit = { minFontSize: 5 };
  const tableFit = { minFontSize: 4 };

  // --- Declarant identification ---
  filler.setText('c.declarantInfo.surname', displayOrEmpty(data.declarantInfo.surname));
  filler.setText('c.declarantInfo.firstName', displayOrEmpty(data.declarantInfo.firstName));
  filler.setTextWithFit('c.declarantInfo.middleInitial', displayOrEmpty(data.declarantInfo.middleInitial), miFit);
  filler.setTextWithFit('c.declarantInfo.position', displayOrEmpty(data.declarantInfo.position), fieldFit);
  filler.setTextWithFit('c.declarantInfo.agency', displayOrEmpty(data.declarantInfo.agency), fieldFit);

  // --- Spouse/child real properties ---
  if (annexCData.realProperties.length > 0) {
    const realRows = annexCData.realProperties.map((p) => ({
      description: displayOrEmpty(p.description),
      kind: capitalize(p.kind),
      exactLocation: displayOrEmpty(p.exactLocation),
      assessedValue: formatCurrency(p.assessedValue),
      currentFairMarketValue: formatCurrency(p.currentFairMarketValue),
      acquisitionYear: String(p.acquisitionYear),
      acquisitionMode: displayOrEmpty(p.acquisitionMode),
      acquisitionCost: formatCurrency(p.acquisitionCost),
    }));
    filler.fillTable('realProperties', realRows, 'c.tbl.realProperties', tableFit);

    const subtotal = annexCData.realProperties.reduce(
      (sum, p) => sum + (p.acquisitionCost || 0),
      0
    );
    filler.setText('c.realPropertiesSpouseSubtotal', formatCurrency(subtotal));
  }

  // --- Spouse/child personal properties ---
  if (annexCData.personalProperties.length > 0) {
    const personalRows = annexCData.personalProperties.map((p) => ({
      description: displayOrEmpty(p.description),
      yearAcquired: String(p.yearAcquired),
      acquisitionCost: formatCurrency(p.acquisitionCost),
    }));
    filler.fillTable('personalProperties', personalRows, 'c.tbl.personalProperties', tableFit);

    const subtotal = annexCData.personalProperties.reduce(
      (sum, p) => sum + (p.acquisitionCost || 0),
      0
    );
    filler.setText('c.personalPropertiesSpouseSubtotal', formatCurrency(subtotal));
  }

  // --- Total assets (spouse/child) ---
  const realTotal = annexCData.realProperties.reduce(
    (sum, p) => sum + (p.acquisitionCost || 0),
    0
  );
  const personalTotal = annexCData.personalProperties.reduce(
    (sum, p) => sum + (p.acquisitionCost || 0),
    0
  );
  const totalAssets = realTotal + personalTotal;

  if (annexCData.realProperties.length > 0 || annexCData.personalProperties.length > 0) {
    filler.setText('c.totalAssetsSpouse', formatCurrency(totalAssets));
  }

  // --- Spouse/child liabilities ---
  if (annexCData.liabilities.length > 0) {
    const liabRows = annexCData.liabilities.map((l) => ({
      nature: displayOrEmpty(l.nature),
      creditorName: displayOrEmpty(l.creditorName),
      outstandingBalance: formatCurrency(l.outstandingBalance),
    }));
    filler.fillTable('liabilities', liabRows, 'c.tbl.liabilities', tableFit);

    const subtotal = annexCData.liabilities.reduce(
      (sum, l) => sum + (l.outstandingBalance || 0),
      0
    );
    filler.setText('c.liabilitiesSpouseSubtotal', formatCurrency(subtotal));
  }

  // --- Net worth (spouse/child) ---
  const liabTotal = annexCData.liabilities.reduce(
    (sum, l) => sum + (l.outstandingBalance || 0),
    0
  );
  const netWorth = totalAssets - liabTotal;

  if (
    annexCData.realProperties.length > 0 ||
    annexCData.personalProperties.length > 0 ||
    annexCData.liabilities.length > 0
  ) {
    filler.setText('c.netWorthSpouse', formatCurrency(netWorth));
  }

  // --- Spouse/child business interests ---
  if (annexCData.businessInterests.length > 0) {
    const bizRows = annexCData.businessInterests.map((b) => ({
      entityName: displayOrEmpty(b.entityName),
      businessAddress: displayOrEmpty(b.businessAddress),
      natureOfBusiness: displayOrEmpty(b.natureOfBusiness),
      dateOfAcquisition: toDateStr(b.dateOfAcquisition),
    }));
    filler.fillTable('businessInterests', bizRows, 'c.tbl.businessInterests', tableFit);
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fill the SALN government PDF template with submission data.
 *
 * Uses the fillable AcroForm template (`saln-fillable.pdf`) with named fields.
 * Fields are filled by name, flattened to static content, and unused pages are
 * removed. ANNEX B and ANNEX C are conditionally kept based on data presence.
 *
 * @param baseUrl - Base URL to resolve template and font files (e.g., window.location.origin or '' for relative).
 * @param salnData - Complete SALN data structure from the database/form.
 * @returns A Uint8Array of the filled PDF ready for download or preview.
 *
 * @example
 * ```ts
 * const pdfBytes = await fillSALN('', salnData);
 * const blob = new Blob([pdfBytes], { type: 'application/pdf' });
 * window.open(URL.createObjectURL(blob));
 * ```
 */
export async function fillSALN(
  baseUrl: string,
  salnData: SALNData
): Promise<Uint8Array> {
  // -----------------------------------------------------------------------
  // 1. Normalize input data -- ensure safe defaults for all fields
  // -----------------------------------------------------------------------
  const data = normalizeSALNData(salnData);

  // -----------------------------------------------------------------------
  // 2. Load fillable template PDF and fonts in parallel
  // -----------------------------------------------------------------------
  const [templateBytes, fontBuffers] = await Promise.all([
    fetch(`${baseUrl}/templates/saln-fillable.pdf`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load SALN template: ${r.status}`);
      return r.arrayBuffer();
    }),
    loadAllFonts(baseUrl),
  ]);

  // -----------------------------------------------------------------------
  // 3. Create FormFiller instance
  // -----------------------------------------------------------------------
  const filler = await FormFiller.create(templateBytes, fontBuffers);

  // -----------------------------------------------------------------------
  // 4. Determine which annexes are needed
  // -----------------------------------------------------------------------
  const needAnnexB = shouldRenderAnnexB(data);
  const needAnnexC = shouldRenderAnnexC(data);

  // -----------------------------------------------------------------------
  // 5. Fill ANNEX A Page 1 -- declarant, spouse, children, assets
  // -----------------------------------------------------------------------
  fillAnnexAPage1(filler, data);

  // -----------------------------------------------------------------------
  // 6. Fill ANNEX A Page 2 -- liabilities, net worth, biz, relatives, IDs
  // -----------------------------------------------------------------------
  fillAnnexAPage2(filler, data);

  // -----------------------------------------------------------------------
  // 7. Fill ANNEX B (if needed) -- declarant overflow
  // -----------------------------------------------------------------------
  if (needAnnexB) {
    fillAnnexB(filler, data);
  }

  // -----------------------------------------------------------------------
  // 8. Fill ANNEX C (if needed) -- spouse/child exclusive items
  // -----------------------------------------------------------------------
  if (needAnnexC) {
    fillAnnexC(filler, data);
  }

  // -----------------------------------------------------------------------
  // 9. Flatten all form fields to static content BEFORE page removal.
  //    This is critical because AcroForm field references are tied to page
  //    indices; removing pages before flattening corrupts field resolution.
  // -----------------------------------------------------------------------
  filler.flatten();

  // -----------------------------------------------------------------------
  // 10. Remove unused pages (must remove from back to front to keep indices valid)
  //
  // The template has 10 pages:
  //   0-1: ANNEX A (always kept)
  //   2:   ANNEX B (kept only if needAnnexB)
  //   3:   ANNEX C (kept only if needAnnexC)
  //   4-9: Unused/legacy pages (always removed)
  // -----------------------------------------------------------------------
  const totalPages = filler.getPageCount();
  const pagesToRemove: number[] = [];

  // Always remove unused/legacy pages (indices 4-9)
  for (const idx of UNUSED_PAGE_INDICES) {
    if (idx < totalPages) {
      pagesToRemove.push(idx);
    }
  }

  // Conditionally remove ANNEX C (index 3) then ANNEX B (index 2)
  if (!needAnnexC && ANNEX_C_PAGE_INDEX < totalPages) {
    pagesToRemove.push(ANNEX_C_PAGE_INDEX);
  }
  if (!needAnnexB && ANNEX_B_PAGE_INDEX < totalPages) {
    pagesToRemove.push(ANNEX_B_PAGE_INDEX);
  }

  // De-duplicate and sort descending so removals don't shift earlier indices
  const uniquePages = [...new Set(pagesToRemove)].sort((a, b) => b - a);
  for (const pageIdx of uniquePages) {
    if (pageIdx < filler.getPageCount()) {
      filler.removePage(pageIdx);
    }
  }

  // -----------------------------------------------------------------------
  // 11. Save and return the filled PDF
  // -----------------------------------------------------------------------
  return filler.save();
}
