export type TextAlignment = 'left' | 'center' | 'right';

export interface FieldPosition {
  /** X coordinate from left edge of page (in PDF points, 1pt = 1/72 inch) */
  x: number;
  /** Y coordinate from BOTTOM of page (pdf-lib uses bottom-left origin) */
  y: number;
  /** Maximum width for text clipping (in points) */
  maxWidth: number;
  /** Font size in points */
  fontSize: number;
  /** Text alignment within maxWidth */
  alignment?: TextAlignment;
  /** Font variant to use */
  fontVariant?: 'regular' | 'bold' | 'italic' | 'boldItalic';
  /** Optional transform before stamping */
  transform?: 'uppercase' | 'capitalize';
}

export interface CheckboxPosition {
  /** X coordinate of checkbox */
  x: number;
  /** Y coordinate of checkbox */
  y: number;
  /** Size of the checkmark character */
  size: number;
  /** Type of check rendering */
  style?: 'checkmark' | 'x' | 'fill';
}

export interface ImagePosition {
  /** X coordinate from left */
  x: number;
  /** Y coordinate from bottom */
  y: number;
  /** Width to scale image to */
  width: number;
  /** Height to scale image to */
  height: number;
}

export interface TableColumn {
  /** X position of the column's left edge */
  x: number;
  /** Width of the column */
  width: number;
  /** Font size */
  fontSize: number;
  /** Text alignment */
  alignment?: TextAlignment;
  /** Font variant */
  fontVariant?: 'regular' | 'bold';
  /** Data accessor key path (supports dot notation) */
  accessor: string;
  /** Optional formatter */
  formatter?: 'date' | 'dateMMDDYYYY' | 'currency' | 'boolean_yn';
}

export interface TableConfig {
  /** Starting Y position for the first data row (from bottom of page) */
  startY: number;
  /** Row height in points */
  rowHeight: number;
  /** Maximum number of data rows that fit on this page */
  maxRows: number;
  /** Column definitions */
  columns: TableColumn[];
}

export interface PageFieldMap {
  /** Page index (0-based) within the template PDF */
  pageIndex: number;
  /** Static text fields: key is a dot-path into the data object */
  fields: Record<string, FieldPosition>;
  /** Checkbox fields: key is a dot-path into the data object */
  checkboxes: Record<string, CheckboxPosition>;
  /** Image placeholders */
  images: Record<string, ImagePosition>;
  /** Repeating table definitions */
  tables: Record<string, TableConfig>;
}

export interface TemplateConfig {
  /** Path to the template PDF relative to public/ */
  templatePath: string;
  /** Per-page field maps */
  pages: PageFieldMap[];
}
