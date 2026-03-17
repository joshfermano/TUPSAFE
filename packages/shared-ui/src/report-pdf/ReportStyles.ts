import { StyleSheet, Font } from '@react-pdf/renderer';

/**
 * TUPSAFE Report PDF Styles
 * Professional report styling with TUP Manila branding
 * Legal size, landscape orientation for wide data tables
 */

/**
 * Font Registration for Report PDFs
 *
 * We use Helvetica, a built-in PDF font that doesn't require external font files.
 * This ensures compatibility with server-side rendering without needing to load
 * font files from the filesystem.
 *
 * Helvetica is one of the 14 standard PDF fonts and supports:
 * - Regular, Bold, Italic, and Bold-Italic variants
 * - Professional appearance suitable for government reports
 * - Zero configuration needed
 */

/**
 * Register report fonts (no-op for Helvetica - it's built-in)
 * Kept for API compatibility
 */
export function registerReportFonts(_baseUrl: string = ''): void {
  // Helvetica is built into @react-pdf/renderer, no registration needed
  // Disable hyphenation for better text control
  Font.registerHyphenationCallback((word) => [word]);
}

/**
 * Ensure fonts are registered (no-op for Helvetica - it's built-in)
 * Kept for API compatibility
 */
export function ensureReportFontsRegistered(_baseUrl: string = ''): void {
  // Helvetica is built into @react-pdf/renderer, no registration needed
  Font.registerHyphenationCallback((word) => [word]);
}

/**
 * TUPSAFE Report Color Palette
 * Based on TUP Manila official colors
 */
export const REPORT_COLORS = {
  tupMaroon: '#8B1538', // TUP Maroon - primary brand color
  tupGold: '#FFD700', // TUP Gold - secondary brand color
  headerBg: '#8B1538', // Maroon for table headers
  headerText: '#FFFFFF', // White text on maroon background
  alternateRowBg: '#F5F5F5', // Light gray for alternating rows
  borderColor: '#333333', // Dark gray for borders
  black: '#000000',
  white: '#FFFFFF',
  textGray: '#4A4A4A',
  pageBackground: '#FFFFFF',
  footerText: '#666666',
};

/**
 * Report Dimensions - Legal landscape specifications
 */
export const REPORT_DIMENSIONS = {
  pageSize: 'LEGAL' as const,
  pageOrientation: 'landscape' as const,
  pagePadding: 30,
  pagePaddingTop: 40,
  pagePaddingBottom: 50,
  headerHeight: 80,
  footerHeight: 30,
  tableHeaderHeight: 24,
  tableRowHeight: 20,
  borderWidth: 0.5,
  thickBorderWidth: 1,
  cellPadding: 4,
  cellPaddingSmall: 2,
  logoWidth: 50,
  logoHeight: 50,
};

/**
 * Report Font Sizes
 */
export const REPORT_FONT_SIZES = {
  reportTitle: 16,
  reportSubtitle: 10,
  sectionHeader: 12,
  tableHeader: 8,
  tableCell: 7,
  footerText: 7,
  metadata: 8,
  pageNumber: 7,
};

/**
 * Report StyleSheet
 */
export const reportStyles = StyleSheet.create({
  // Page layout - Legal landscape
  page: {
    size: REPORT_DIMENSIONS.pageSize,
    orientation: REPORT_DIMENSIONS.pageOrientation,
    paddingTop: REPORT_DIMENSIONS.pagePaddingTop,
    paddingBottom: REPORT_DIMENSIONS.pagePaddingBottom,
    paddingLeft: REPORT_DIMENSIONS.pagePadding,
    paddingRight: REPORT_DIMENSIONS.pagePadding,
    fontFamily: 'Helvetica',
    fontSize: REPORT_FONT_SIZES.tableCell,
    lineHeight: 1.3,
    backgroundColor: REPORT_COLORS.pageBackground,
  },

  // Report header section
  reportHeader: {
    marginBottom: 15,
    borderBottomWidth: REPORT_DIMENSIONS.thickBorderWidth,
    borderBottomColor: REPORT_COLORS.tupMaroon,
    paddingBottom: 10,
  },
  reportTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoPlaceholder: {
    width: REPORT_DIMENSIONS.logoWidth,
    height: REPORT_DIMENSIONS.logoHeight,
    borderWidth: REPORT_DIMENSIONS.borderWidth,
    borderColor: REPORT_COLORS.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 8,
    color: REPORT_COLORS.textGray,
  },
  reportTitleText: {
    fontSize: REPORT_FONT_SIZES.reportTitle,
    fontWeight: 'bold',
    color: REPORT_COLORS.tupMaroon,
    textAlign: 'center',
    flex: 1,
  },
  reportSubtitle: {
    fontSize: REPORT_FONT_SIZES.reportSubtitle,
    color: REPORT_COLORS.textGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: REPORT_FONT_SIZES.metadata,
    color: REPORT_COLORS.textGray,
  },
  metadataItem: {
    flexDirection: 'row',
  },
  metadataLabel: {
    fontWeight: 'bold',
    marginRight: 4,
  },

  // Table structure
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: REPORT_COLORS.headerBg,
    borderWidth: REPORT_DIMENSIONS.borderWidth,
    borderColor: REPORT_COLORS.borderColor,
    minHeight: REPORT_DIMENSIONS.tableHeaderHeight,
  },
  tableHeaderCell: {
    padding: REPORT_DIMENSIONS.cellPadding,
    borderRightWidth: REPORT_DIMENSIONS.borderWidth,
    borderRightColor: REPORT_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeaderCellLast: {
    padding: REPORT_DIMENSIONS.cellPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: REPORT_FONT_SIZES.tableHeader,
    fontWeight: 'bold',
    color: REPORT_COLORS.headerText,
    textAlign: 'center',
  },

  // Table rows
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: REPORT_DIMENSIONS.borderWidth,
    borderLeftWidth: REPORT_DIMENSIONS.borderWidth,
    borderRightWidth: REPORT_DIMENSIONS.borderWidth,
    borderColor: REPORT_COLORS.borderColor,
    minHeight: REPORT_DIMENSIONS.tableRowHeight,
  },
  tableRowAlternate: {
    flexDirection: 'row',
    backgroundColor: REPORT_COLORS.alternateRowBg,
    borderBottomWidth: REPORT_DIMENSIONS.borderWidth,
    borderLeftWidth: REPORT_DIMENSIONS.borderWidth,
    borderRightWidth: REPORT_DIMENSIONS.borderWidth,
    borderColor: REPORT_COLORS.borderColor,
    minHeight: REPORT_DIMENSIONS.tableRowHeight,
  },
  tableCell: {
    padding: REPORT_DIMENSIONS.cellPadding,
    borderRightWidth: REPORT_DIMENSIONS.borderWidth,
    borderRightColor: REPORT_COLORS.borderColor,
    justifyContent: 'center',
  },
  tableCellLast: {
    padding: REPORT_DIMENSIONS.cellPadding,
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: REPORT_FONT_SIZES.tableCell,
    color: REPORT_COLORS.black,
  },
  tableCellTextCenter: {
    fontSize: REPORT_FONT_SIZES.tableCell,
    color: REPORT_COLORS.black,
    textAlign: 'center',
  },

  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 15,
    left: REPORT_DIMENSIONS.pagePadding,
    right: REPORT_DIMENSIONS.pagePadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: REPORT_DIMENSIONS.borderWidth,
    borderTopColor: REPORT_COLORS.borderColor,
    paddingTop: 8,
  },
  footerText: {
    fontSize: REPORT_FONT_SIZES.footerText,
    color: REPORT_COLORS.footerText,
    fontStyle: 'italic',
  },
  pageNumber: {
    fontSize: REPORT_FONT_SIZES.pageNumber,
    color: REPORT_COLORS.footerText,
  },

  // Text modifiers
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },

  // Layout helpers
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  flex3: { flex: 3 },
});

/**
 * Format date as MM/DD/YYYY
 */
export function formatReportDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  return `${month}/${day}/${year}`;
}

/**
 * Format date and time as MM/DD/YYYY HH:MM AM/PM
 */
export function formatReportDateTime(
  date: Date | string | null | undefined
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

/**
 * Display value or empty string
 */
export function displayOrEmpty(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

/**
 * Display N/A if empty
 */
export function displayOrNA(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
}
