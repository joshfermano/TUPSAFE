/**
 * PDS template filling constants.
 * CS Form No. 212 (Revised 2025) — 4-page LETTER size document.
 *
 * pdf-lib uses bottom-left origin.  All coordinates are in PDF points
 * (1 pt = 1/72 inch).  LETTER page = 612 x 792 pts.
 */

// ---------------------------------------------------------------------------
// Page dimensions
// ---------------------------------------------------------------------------

/** Width of the PDS page in PDF points (LETTER size) */
export const PDS_PAGE_WIDTH = 612;

/** Height of the PDS page in PDF points (LETTER size) */
export const PDS_PAGE_HEIGHT = 792;

// Backward-compat aliases (prefer PDS_PAGE_WIDTH / PDS_PAGE_HEIGHT)
export const LEGAL_WIDTH = PDS_PAGE_WIDTH;
export const LEGAL_HEIGHT = PDS_PAGE_HEIGHT;

// ---------------------------------------------------------------------------
// Margins (approximate — will be refined against the real template)
// ---------------------------------------------------------------------------

export const PAGE_MARGIN_LEFT = 28;
export const PAGE_MARGIN_RIGHT = 28;
export const PAGE_MARGIN_TOP = 28;
export const PAGE_MARGIN_BOTTOM = 28;

/** Usable content width inside margins */
export const CONTENT_WIDTH = PDS_PAGE_WIDTH - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT;

// ---------------------------------------------------------------------------
// Default font sizes used for stamping
// ---------------------------------------------------------------------------

export const FONT_SIZE_NORMAL = 8;
export const FONT_SIZE_SMALL = 7;
export const FONT_SIZE_TABLE = 6.5;
export const FONT_SIZE_CHECKBOX = 10;

// ---------------------------------------------------------------------------
// Maximum rows per table section
// ---------------------------------------------------------------------------

/** Section II — Item 25: Children */
export const MAX_CHILDREN_ROWS = 12;

/** Section III — Item 26: Education levels (elementary through graduate) */
export const MAX_EDUCATION_ROWS = 5;

/** Section IV — Item 27: Civil Service Eligibility */
export const MAX_ELIGIBILITY_ROWS = 7;

/** Section V — Item 28: Work Experience */
export const MAX_WORK_EXPERIENCE_ROWS = 28;

/** Section VI — Item 29: Voluntary Work */
export const MAX_VOLUNTARY_WORK_ROWS = 7;

/** Section VII — Item 30: Training / L&D Programs */
export const MAX_TRAINING_ROWS = 21;

/** Section VIII — Item 31: Special Skills & Hobbies */
export const MAX_SKILLS_ROWS = 7;

/** Section VIII — Item 32: Non-Academic Distinctions */
export const MAX_RECOGNITIONS_ROWS = 7;

/** Section VIII — Item 33: Association / Organization Membership */
export const MAX_ASSOCIATIONS_ROWS = 7;

/** Item 41: References (person not related) */
export const MAX_REFERENCE_ROWS = 3;

// ---------------------------------------------------------------------------
// Overflow page constants
// ---------------------------------------------------------------------------

/** Line height for plain-text overflow pages */
export const OVERFLOW_LINE_HEIGHT = 14;

/** Top Y for the first text line on an overflow page (from bottom) */
export const OVERFLOW_START_Y = PDS_PAGE_HEIGHT - PAGE_MARGIN_TOP - 40;
