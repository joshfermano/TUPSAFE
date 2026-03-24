/**
 * Overflow detection and data splitting for SALN template filling.
 *
 * Mirrors the logic in SALNAnnexB.tsx and SALNAnnexC.tsx:
 *   - Declarant/Joint items go to ANNEX A (main pages) and overflow to ANNEX B (AS-1).
 *   - Spouse/Child exclusive items go to ANNEX C (AS-2).
 *
 * These functions are pure data helpers with no rendering or PDF dependencies.
 */

import type {
  SALNData,
  RealProperty,
  PersonalProperty,
  Liability,
  BusinessInterest,
} from './types';

import {
  MAX_REAL_PROPERTIES,
  MAX_PERSONAL_PROPERTIES,
  MAX_LIABILITIES,
  MAX_BUSINESS_INTERESTS,
} from './saln-constants';

// ---------------------------------------------------------------------------
// Ownership predicates
// ---------------------------------------------------------------------------

/**
 * Returns true if the property belongs to the declarant or is jointly owned.
 * Properties with no explicit owner default to declarant.
 */
function isDeclarantOrJoint<T extends { owner?: string | null }>(item: T): boolean {
  return !item.owner || item.owner === 'declarant' || item.owner === 'joint';
}

/**
 * Returns true if the property belongs exclusively to spouse or child.
 */
function isSpouseOrChild<T extends { owner?: string | null }>(item: T): boolean {
  return item.owner === 'spouse' || item.owner === 'child';
}

// ---------------------------------------------------------------------------
// Annex rendering predicates
// ---------------------------------------------------------------------------

/**
 * Determine whether ANNEX B (AS-1 Declarant overflow) is needed.
 *
 * Logic from SALNAnnexB.tsx `shouldRenderAnnexB`:
 * True when declarant/joint items exceed ANNEX A page limits:
 *   - Real properties > 10
 *   - Personal properties > 8
 *   - Liabilities > 12
 *   - Business interests > 8
 */
export function shouldRenderAnnexB(data: SALNData): boolean {
  const declRealProps = data.realProperties.filter(isDeclarantOrJoint);
  const declPersonalProps = data.personalProperties.filter(isDeclarantOrJoint);
  const declLiabilities = data.liabilities.filter(isDeclarantOrJoint);
  const declBusiness = data.businessInterests.filter(isDeclarantOrJoint);

  return (
    declRealProps.length > MAX_REAL_PROPERTIES ||
    declPersonalProps.length > MAX_PERSONAL_PROPERTIES ||
    declLiabilities.length > MAX_LIABILITIES ||
    declBusiness.length > MAX_BUSINESS_INTERESTS
  );
}

/**
 * Determine whether ANNEX C (AS-2 Spouse/Children exclusive) is needed.
 *
 * Logic from SALNAnnexC.tsx `shouldRenderAnnexC`:
 * True when ANY property across all four tables has owner = 'spouse' or 'child'.
 */
export function shouldRenderAnnexC(data: SALNData): boolean {
  return (
    data.realProperties.some(isSpouseOrChild) ||
    data.personalProperties.some(isSpouseOrChild) ||
    data.liabilities.some(isSpouseOrChild) ||
    data.businessInterests.some(isSpouseOrChild)
  );
}

// ---------------------------------------------------------------------------
// Data splitting helpers
// ---------------------------------------------------------------------------

/** Items that appear on ANNEX A (main page) and those that overflow to ANNEX B */
export interface AnnexASplit<T> {
  /** Items displayed on the main ANNEX A page (up to the limit) */
  mainPage: T[];
  /** Overflow items that go on ANNEX B (AS-1) */
  overflow: T[];
}

/**
 * Split declarant/joint real properties into main page (first 10) and overflow.
 */
export function splitRealProperties(data: SALNData): AnnexASplit<RealProperty> {
  const declarantItems = data.realProperties.filter(isDeclarantOrJoint);
  return {
    mainPage: declarantItems.slice(0, MAX_REAL_PROPERTIES),
    overflow: declarantItems.slice(MAX_REAL_PROPERTIES),
  };
}

/**
 * Split declarant/joint personal properties into main page (first 8) and overflow.
 */
export function splitPersonalProperties(data: SALNData): AnnexASplit<PersonalProperty> {
  const declarantItems = data.personalProperties.filter(isDeclarantOrJoint);
  return {
    mainPage: declarantItems.slice(0, MAX_PERSONAL_PROPERTIES),
    overflow: declarantItems.slice(MAX_PERSONAL_PROPERTIES),
  };
}

/**
 * Split declarant/joint liabilities into main page (first 12) and overflow.
 */
export function splitLiabilities(data: SALNData): AnnexASplit<Liability> {
  const declarantItems = data.liabilities.filter(isDeclarantOrJoint);
  return {
    mainPage: declarantItems.slice(0, MAX_LIABILITIES),
    overflow: declarantItems.slice(MAX_LIABILITIES),
  };
}

/**
 * Split declarant/joint business interests into main page (first 8) and overflow.
 */
export function splitBusinessInterests(data: SALNData): AnnexASplit<BusinessInterest> {
  const declarantItems = data.businessInterests.filter(isDeclarantOrJoint);
  return {
    mainPage: declarantItems.slice(0, MAX_BUSINESS_INTERESTS),
    overflow: declarantItems.slice(MAX_BUSINESS_INTERESTS),
  };
}

// ---------------------------------------------------------------------------
// ANNEX C data extraction
// ---------------------------------------------------------------------------

/** All spouse/child exclusive items collected for ANNEX C */
export interface AnnexCData {
  realProperties: RealProperty[];
  personalProperties: PersonalProperty[];
  liabilities: Liability[];
  businessInterests: BusinessInterest[];
}

/**
 * Extract all spouse/child exclusive properties for ANNEX C.
 */
export function getAnnexCData(data: SALNData): AnnexCData {
  return {
    realProperties: data.realProperties.filter(isSpouseOrChild),
    personalProperties: data.personalProperties.filter(isSpouseOrChild),
    liabilities: data.liabilities.filter(isSpouseOrChild),
    businessInterests: data.businessInterests.filter(isSpouseOrChild),
  };
}

// ---------------------------------------------------------------------------
// Financial calculation helpers
// ---------------------------------------------------------------------------

/**
 * Calculate subtotals for main ANNEX A page items (declarant/joint only).
 * Real properties use acquisitionCost for the subtotal on Page 1.
 */
export function calculateMainPageTotals(data: SALNData): {
  realPropertiesSubtotal: number;
  personalPropertiesSubtotal: number;
  totalAssets: number;
} {
  const realSplit = splitRealProperties(data);
  const personalSplit = splitPersonalProperties(data);

  const realPropertiesSubtotal = realSplit.mainPage.reduce(
    (sum, p) => sum + (p.acquisitionCost || 0),
    0
  );
  const personalPropertiesSubtotal = personalSplit.mainPage.reduce(
    (sum, p) => sum + (p.acquisitionCost || 0),
    0
  );

  return {
    realPropertiesSubtotal,
    personalPropertiesSubtotal,
    totalAssets: realPropertiesSubtotal + personalPropertiesSubtotal,
  };
}

/**
 * Calculate net worth using Current Fair Market Value for real properties
 * and Acquisition Cost for personal properties (declarant/joint only).
 * Matches the NetWorthLine logic in SALNPage2.tsx.
 */
export function calculateNetWorth(data: SALNData): {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
} {
  const declRealProps = data.realProperties.filter(isDeclarantOrJoint);
  const declPersonalProps = data.personalProperties.filter(isDeclarantOrJoint);

  const realTotal = declRealProps.reduce(
    (sum, p) => sum + (p.currentFairMarketValue || 0),
    0
  );
  const personalTotal = declPersonalProps.reduce(
    (sum, p) => sum + (p.acquisitionCost || 0),
    0
  );
  const totalAssets = realTotal + personalTotal;

  const totalLiabilities = (data.liabilities || []).reduce(
    (sum, l) => sum + (l.outstandingBalance || 0),
    0
  );

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}
