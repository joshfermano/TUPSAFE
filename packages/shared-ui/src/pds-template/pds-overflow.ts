/**
 * PDS overflow page generator.
 *
 * When a repeating section has more rows than fit on its designated page,
 * the excess rows are stamped onto a plain-text continuation page appended
 * to the end of the document.
 *
 * Works with both TemplateFiller and FormFiller via the OverflowContext
 * abstraction (addBlankPage + getFont).
 */

import type { PDFPage, PDFFont } from 'pdf-lib';
import { rgb } from 'pdf-lib';
import {
  PDS_PAGE_WIDTH,
  PDS_PAGE_HEIGHT,
  PAGE_MARGIN_LEFT,
  PAGE_MARGIN_TOP,
  OVERFLOW_LINE_HEIGHT,
  OVERFLOW_START_Y,
  FONT_SIZE_NORMAL,
  FONT_SIZE_SMALL,
} from './pds-constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverflowRow {
  /** Pre-formatted single-line string to print */
  text: string;
}

export interface OverflowSection {
  /** Human-readable section title, e.g. "WORK EXPERIENCE (Continuation)" */
  title: string;
  /** Column headers to print before the data rows (optional) */
  columnHeaders?: string;
  /** The overflow data rows */
  rows: OverflowRow[];
}

/**
 * Minimal interface required to add overflow pages.
 * Satisfied by both TemplateFiller and FormFiller.
 */
export interface OverflowContext {
  addBlankPage(width: number, height: number): PDFPage;
  getFont(variant: 'regular' | 'bold' | 'italic' | 'boldItalic'): PDFFont;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Add one or more overflow continuation pages for excess PDS data.
 *
 * Each section gets a bold title, an optional column header line, and then
 * simple text rows.  If the rows overflow the current page, a new blank page
 * is added automatically.
 *
 * @returns The total number of continuation pages added.
 */
export function addOverflowPages(
  ctx: OverflowContext,
  sections: OverflowSection[]
): number {
  if (sections.length === 0) return 0;

  let pagesAdded = 0;
  let currentPage: PDFPage | undefined;
  let cursorY = 0; // tracks current Y position (from bottom)

  function ensurePage(): PDFPage {
    // Start a new page if we don't have one or if the cursor is too low
    if (!currentPage || cursorY < PAGE_MARGIN_TOP + OVERFLOW_LINE_HEIGHT) {
      currentPage = ctx.addBlankPage(PDS_PAGE_WIDTH, PDS_PAGE_HEIGHT);
      cursorY = OVERFLOW_START_Y;
      pagesAdded++;

      // Stamp a small page header
      currentPage.drawText('CS Form No. 212 — Continuation Sheet', {
        x: PAGE_MARGIN_LEFT,
        y: PDS_PAGE_HEIGHT - PAGE_MARGIN_TOP - 10,
        size: FONT_SIZE_SMALL,
        font: ctx.getFont('italic'),
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    return currentPage;
  }

  for (const section of sections) {
    // Ensure we have enough room for at least the title + 1 row
    if (
      !currentPage ||
      cursorY < PAGE_MARGIN_TOP + OVERFLOW_LINE_HEIGHT * 3
    ) {
      currentPage = undefined; // force new page
    }
    const page = ensurePage();

    // Section title (bold)
    page.drawText(section.title, {
      x: PAGE_MARGIN_LEFT,
      y: cursorY,
      size: FONT_SIZE_NORMAL,
      font: ctx.getFont('bold'),
      color: rgb(0, 0, 0),
    });
    cursorY -= OVERFLOW_LINE_HEIGHT + 2;

    // Optional column headers
    if (section.columnHeaders) {
      const colPage = ensurePage();
      colPage.drawText(section.columnHeaders, {
        x: PAGE_MARGIN_LEFT,
        y: cursorY,
        size: FONT_SIZE_SMALL,
        font: ctx.getFont('bold'),
        color: rgb(0.2, 0.2, 0.2),
      });
      cursorY -= OVERFLOW_LINE_HEIGHT;
    }

    // Data rows
    for (const row of section.rows) {
      const rowPage = ensurePage();
      rowPage.drawText(row.text, {
        x: PAGE_MARGIN_LEFT + 4,
        y: cursorY,
        size: FONT_SIZE_SMALL,
        font: ctx.getFont('regular'),
        color: rgb(0, 0, 0),
      });
      cursorY -= OVERFLOW_LINE_HEIGHT;
    }

    // Add a small gap before the next section
    cursorY -= OVERFLOW_LINE_HEIGHT / 2;
  }

  return pagesAdded;
}
