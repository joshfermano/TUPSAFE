/**
 * SALN PDF template filling module — barrel index (types + pure constants only).
 *
 * IMPORTANT: This barrel must NOT re-export anything that transitively imports
 * `pdf-lib`.  Turbopack / Next.js dev server resolves the entire module graph
 * of every barrel export, so a single runtime re-export of `fillSALN` causes
 * `pdf-lib` to be required at page-load time.
 *
 * Runtime entry points (fillSALN, field-map configs) are accessible via deep
 * subpath imports:
 *
 *   // Dynamic import in hooks (deferred until user triggers PDF generation):
 *   const { fillSALN } = await import('@tupsafe/shared-ui/saln-template/saln-filler');
 */

// Re-export all SALN types (erased at compile time — no runtime cost)
export type {
  SALNData,
  DeclarantInfo,
  SpouseInfo,
  ChildInfo,
  RealProperty,
  PersonalProperty,
  Liability,
  BusinessInterest,
  RelativeInGov,
  GovernmentID,
  FilingType,
  ComplianceType,
  PropertyOwner,
  UnmarriedChild,
  ValidationResult,
  PDFGenerationOptions,
  YearOverYearComparison,
  SectionSummary,
} from './types';

// Overflow types (type-only, erased at compile time)
export type { AnnexASplit, AnnexCData } from './saln-overflow';

// Annex rendering predicates (pure data helpers — NO pdf-lib dependency)
export { shouldRenderAnnexB, shouldRenderAnnexC } from './saln-overflow';

// Data splitting helpers (pure data helpers — NO pdf-lib dependency)
export {
  splitRealProperties,
  splitPersonalProperties,
  splitLiabilities,
  splitBusinessInterests,
  getAnnexCData,
  calculateMainPageTotals,
  calculateNetWorth,
} from './saln-overflow';

// Pure constants (no pdf-lib dependency)
export {
  SALN_PAGE_WIDTH,
  FOLIO_PAGE_HEIGHT,
  LETTER_PAGE_HEIGHT,
  LETTER_WIDTH,
  LETTER_HEIGHT,
  TEMPLATE_TOTAL_PAGES,
  UNUSED_PAGE_INDICES,
  MAX_REAL_PROPERTIES,
  MAX_PERSONAL_PROPERTIES,
  MAX_LIABILITIES,
  MAX_BUSINESS_INTERESTS,
  MAX_RELATIVES_IN_GOV,
  MAX_CHILDREN,
  ANNEX_A_PAGE1_INDEX,
  ANNEX_A_PAGE2_INDEX,
  ANNEX_B_PAGE_INDEX,
  ANNEX_C_PAGE_INDEX,
  FONT_SIZE,
  ROW_HEIGHT,
} from './saln-constants';
