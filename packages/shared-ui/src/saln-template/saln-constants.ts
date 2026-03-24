/**
 * Constants for SALN PDF template filling.
 *
 * The SALN template (`saln-annexes-2025.pdf`) has 10 pages with mixed sizes:
 *   Pages 0-3: 612 x 936 pts (8.5" x 13" — FOLIO size)
 *   Pages 4-9: 612 x 792 pts (8.5" x 11" — LETTER size)
 *
 * ANNEX A (pages 0-1) and ANNEX B/C (pages 2-3) use the FOLIO dimensions.
 * Pages 4-9 are unused/legacy and will be removed during filling.
 *
 * Max rows per table match the ANNEX A limits defined in SALNPage1/Page2.
 * Overflow beyond these limits routes to ANNEX B (declarant/joint) or ANNEX C (spouse/child).
 */

// ---------------------------------------------------------------------------
// Page dimensions (pdf-lib bottom-left origin)
// ---------------------------------------------------------------------------

/** Width of all SALN pages (same for both FOLIO and LETTER pages) */
export const SALN_PAGE_WIDTH = 612;

/** Height of FOLIO pages (pages 0-3: ANNEX A, B, C) */
export const FOLIO_PAGE_HEIGHT = 936;

/** Height of LETTER pages (pages 4-9: unused/legacy) */
export const LETTER_PAGE_HEIGHT = 792;

// Backward-compat aliases
export const LETTER_WIDTH = SALN_PAGE_WIDTH;
export const LETTER_HEIGHT = FOLIO_PAGE_HEIGHT;

/** Standard page margins used in the CSC SALN form template (estimated) */
export const PAGE_MARGIN = {
  top: 36,
  right: 36,
  bottom: 36,
  left: 36,
} as const;

/** Usable content width within margins */
export const CONTENT_WIDTH = SALN_PAGE_WIDTH - PAGE_MARGIN.left - PAGE_MARGIN.right;

// ---------------------------------------------------------------------------
// Max rows per table on ANNEX A (main pages 1 and 2)
// Items beyond these counts overflow to ANNEX B or C.
// ---------------------------------------------------------------------------

/** Maximum real property rows on ANNEX A Page 1 */
export const MAX_REAL_PROPERTIES = 10;

/** Maximum personal property rows on ANNEX A Page 1 */
export const MAX_PERSONAL_PROPERTIES = 8;

/** Maximum liability rows on ANNEX A Page 2 */
export const MAX_LIABILITIES = 12;

/** Maximum business interest rows on ANNEX A Page 2 */
export const MAX_BUSINESS_INTERESTS = 8;

/** Maximum relatives-in-government rows on ANNEX A Page 2 */
export const MAX_RELATIVES_IN_GOV = 8;

/** Maximum children rows on ANNEX A Page 1 */
export const MAX_CHILDREN = 12;

// ---------------------------------------------------------------------------
// Template page indices within the multi-page template PDF
// The template has 10 pages total:
//   0-1: ANNEX A (folio 936pt)
//   2:   ANNEX B (folio 936pt)
//   3:   ANNEX C (folio 936pt)
//   4-9: Unused/legacy pages (letter 792pt) — removed during filling
// ---------------------------------------------------------------------------

/** Page index for ANNEX A page 1 (declarant info, assets) */
export const ANNEX_A_PAGE1_INDEX = 0;

/** Page index for ANNEX A page 2 (liabilities, biz interests, signatures) */
export const ANNEX_A_PAGE2_INDEX = 1;

/** Page index for ANNEX B (AS-1 declarant overflow) */
export const ANNEX_B_PAGE_INDEX = 2;

/** Page index for ANNEX C (AS-2 spouse/child exclusive) */
export const ANNEX_C_PAGE_INDEX = 3;

/** Total number of pages in the raw template PDF */
export const TEMPLATE_TOTAL_PAGES = 10;

/** Page indices of unused/legacy pages that should always be removed */
export const UNUSED_PAGE_INDICES = [4, 5, 6, 7, 8, 9] as const;

// ---------------------------------------------------------------------------
// Common font sizes used across SALN template stamping
// ---------------------------------------------------------------------------

export const FONT_SIZE = {
  /** Standard field value text */
  fieldValue: 7,
  /** Small labels / headers */
  label: 6,
  /** Table cell data */
  tableCell: 6.5,
  /** Currency amounts */
  currency: 7,
  /** Section headers */
  sectionHeader: 8,
  /** Footnotes and fine print */
  footnote: 5.5,
} as const;

// ---------------------------------------------------------------------------
// Table row heights (in points)
// ---------------------------------------------------------------------------

export const ROW_HEIGHT = {
  /** Standard data row in tables */
  standard: 14,
  /** Children table row */
  children: 13,
  /** Compact row for overflow tables */
  compact: 12,
} as const;
