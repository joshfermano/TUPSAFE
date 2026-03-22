/**
 * Fill variable-row tables in PDF templates.
 * Handles row iteration, column positioning, and overflow detection.
 */

import type { PDFPage } from 'pdf-lib';
import type { TableConfig } from './types';
import type { TemplateFiller } from './TemplateFiller';
import { getNestedValue, applyFormatter } from './utils';

export interface TableRowData {
  [key: string]: unknown;
}

export interface TableFillResult {
  /** Number of rows that were filled on the page */
  filledCount: number;
  /** Rows that didn't fit and need a continuation page */
  overflow: TableRowData[];
}

/**
 * Fill a table on a PDF page with row data.
 * Returns the number of rows filled and any overflow rows.
 *
 * Silently returns empty result if config or rows are missing.
 */
export function fillTable(
  filler: TemplateFiller,
  page: PDFPage,
  config: TableConfig,
  rows: TableRowData[]
): TableFillResult {
  if (!config || !rows || rows.length === 0) {
    return { filledCount: 0, overflow: [] };
  }

  const maxToFill = Math.min(rows.length, config.maxRows);
  const overflow = rows.slice(config.maxRows);

  for (let rowIndex = 0; rowIndex < maxToFill; rowIndex++) {
    const rowData = rows[rowIndex];
    if (!rowData) continue;

    const rowY = config.startY - rowIndex * config.rowHeight;

    for (const col of config.columns) {
      const rawValue = getNestedValue(rowData, col.accessor);
      const displayValue = applyFormatter(rawValue, col.formatter);

      filler.stampText(page, displayValue, {
        x: col.x,
        y: rowY,
        maxWidth: col.width,
        fontSize: col.fontSize,
        alignment: col.alignment ?? 'left',
        fontVariant: col.fontVariant ?? 'regular',
      });
    }
  }

  return { filledCount: maxToFill, overflow };
}
