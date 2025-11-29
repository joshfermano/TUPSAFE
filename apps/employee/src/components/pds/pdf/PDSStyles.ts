/**
 * PDF Styles for CS Form No. 212 (Revised 2025)
 * Personal Data Sheet - Civil Service Commission
 *
 * These styles match the official CSC PDS form layout
 */

import { StyleSheet, Font } from '@react-pdf/renderer';

/**
 * Register Roboto fonts for PDF generation
 * Font files are located in public/fonts/
 * Call this before generating any PDF
 */
export function registerPDFFonts(baseUrl: string = ''): void {
  Font.register({
    family: 'Roboto',
    fonts: [
      {
        src: `${baseUrl}/fonts/roboto-latin-400-normal.woff`,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
      {
        src: `${baseUrl}/fonts/roboto-latin-700-normal.woff`,
        fontWeight: 'bold',
        fontStyle: 'normal',
      },
      {
        src: `${baseUrl}/fonts/roboto-latin-400-italic.woff`,
        fontWeight: 'normal',
        fontStyle: 'italic',
      },
      {
        src: `${baseUrl}/fonts/roboto-latin-700-italic.woff`,
        fontWeight: 'bold',
        fontStyle: 'italic',
      },
    ],
  });

  // Disable hyphenation for better text control
  Font.registerHyphenationCallback((word) => [word]);
}

// Track registration state
let fontsRegistered = false;

/**
 * Ensure fonts are registered (idempotent - safe to call multiple times)
 */
export function ensurePDFFontsRegistered(baseUrl: string = ''): void {
  if (!fontsRegistered) {
    registerPDFFonts(baseUrl);
    fontsRegistered = true;
  }
}

// Color constants matching CSC form
export const colors = {
  headerBg: '#808080', // Gray header background
  lightGray: '#d3d3d3', // Light gray for sub-headers
  white: '#ffffff',
  black: '#000000',
  borderColor: '#000000',
};

// Common dimensions
export const dimensions = {
  pagePadding: 15,
  cellPadding: 2,
  borderWidth: 0.5,
  headerHeight: 20,
  rowHeight: 14,
  smallRowHeight: 12,
};

// Main stylesheet
export const styles = StyleSheet.create({
  // Page layout
  page: {
    padding: dimensions.pagePadding,
    fontFamily: 'Roboto',
    fontSize: 7,
    lineHeight: 1.2,
  },

  // Header styles
  formHeader: {
    textAlign: 'right',
    marginBottom: 5,
  },
  formTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  formSubtitle: {
    fontSize: 6,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  csFormNumber: {
    fontSize: 7,
    textAlign: 'right',
    marginBottom: 2,
  },

  // Section headers
  sectionHeader: {
    backgroundColor: colors.headerBg,
    color: colors.white,
    padding: 3,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: dimensions.borderWidth,
    borderColor: colors.borderColor,
  },
  subSectionHeader: {
    backgroundColor: colors.lightGray,
    padding: 2,
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: dimensions.borderWidth,
    borderColor: colors.borderColor,
  },

  // Table styles
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: dimensions.rowHeight,
    borderBottomWidth: dimensions.borderWidth,
    borderBottomColor: colors.borderColor,
  },
  tableRowNoBorder: {
    flexDirection: 'row',
    minHeight: dimensions.rowHeight,
  },
  tableCell: {
    borderRightWidth: dimensions.borderWidth,
    borderRightColor: colors.borderColor,
    padding: dimensions.cellPadding,
    justifyContent: 'center',
  },
  tableCellNoBorder: {
    padding: dimensions.cellPadding,
    justifyContent: 'center',
  },
  tableCellHeader: {
    backgroundColor: colors.lightGray,
    borderRightWidth: dimensions.borderWidth,
    borderRightColor: colors.borderColor,
    padding: dimensions.cellPadding,
    justifyContent: 'center',
  },

  // Text styles
  label: {
    fontSize: 6,
    color: colors.black,
    marginBottom: 1,
  },
  labelSmall: {
    fontSize: 5,
    color: colors.black,
  },
  value: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.black,
  },
  valueSmall: {
    fontSize: 6,
    color: colors.black,
  },
  italic: {
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: 'bold',
  },
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },
  uppercase: {
    textTransform: 'uppercase',
  },

  // Field containers
  fieldRow: {
    flexDirection: 'row',
    borderBottomWidth: dimensions.borderWidth,
    borderBottomColor: colors.borderColor,
  },
  fieldCell: {
    borderRightWidth: dimensions.borderWidth,
    borderRightColor: colors.borderColor,
    padding: dimensions.cellPadding,
  },
  fieldCellLast: {
    padding: dimensions.cellPadding,
  },
  labelCell: {
    backgroundColor: colors.lightGray,
    borderRightWidth: dimensions.borderWidth,
    borderRightColor: colors.borderColor,
    padding: dimensions.cellPadding,
    justifyContent: 'center',
  },

  // Checkbox styles
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: colors.black,
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: colors.black,
    marginRight: 3,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  checkMark: {
    fontSize: 6,
    color: colors.white,
  },

  // Signature and photo boxes
  signatureBox: {
    width: 120,
    height: 50,
    borderWidth: 1,
    borderColor: colors.black,
    marginTop: 5,
  },
  photoBox: {
    width: 100,
    height: 120,
    borderWidth: 1,
    borderColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbmarkBox: {
    width: 60,
    height: 80,
    borderWidth: 1,
    borderColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Layout helpers
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  flex3: {
    flex: 3,
  },
  flex4: {
    flex: 4,
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  marginTop5: {
    marginTop: 5,
  },
  marginTop10: {
    marginTop: 10,
  },
  marginBottom5: {
    marginBottom: 5,
  },
  marginBottom10: {
    marginBottom: 10,
  },

  // Border wrapper for full sections
  borderedSection: {
    borderWidth: dimensions.borderWidth,
    borderColor: colors.borderColor,
  },

  // Empty row placeholder
  emptyRow: {
    height: dimensions.rowHeight,
    borderBottomWidth: dimensions.borderWidth,
    borderBottomColor: colors.borderColor,
  },

  // Footer styles
  footerText: {
    fontSize: 5,
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    fontSize: 6,
  },

  // Declaration section
  declarationText: {
    fontSize: 6,
    textAlign: 'justify',
    lineHeight: 1.4,
    marginBottom: 10,
  },
  subscribeText: {
    fontSize: 6,
    textAlign: 'center',
    marginTop: 10,
  },

  // ID section
  idSection: {
    borderWidth: dimensions.borderWidth,
    borderColor: colors.borderColor,
    padding: 5,
    marginTop: 5,
  },

  // Notes section
  noteText: {
    fontSize: 5,
    fontStyle: 'italic',
    color: '#666666',
  },

  // Width percentages as explicit values
  w10: { width: '10%' },
  w15: { width: '15%' },
  w20: { width: '20%' },
  w25: { width: '25%' },
  w30: { width: '30%' },
  w33: { width: '33.33%' },
  w40: { width: '40%' },
  w50: { width: '50%' },
  w60: { width: '60%' },
  w70: { width: '70%' },
  w75: { width: '75%' },
  w80: { width: '80%' },
  w100: { width: '100%' },
});

// Helper function to format date
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

// Helper function to format date as MM/DD/YYYY
export function formatDateMMDDYYYY(
  date: Date | string | null | undefined
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

// Helper function to format currency
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-PH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper to check if value is empty
export function isEmpty(
  value: string | number | null | undefined
): value is null | undefined | '' {
  return value === null || value === undefined || value === '';
}

// Helper to display N/A if empty
export function displayOrNA(value: string | number | null | undefined): string {
  if (isEmpty(value)) return 'N/A';
  return String(value);
}

// Helper to display empty string if null
export function displayOrEmpty(
  value: string | number | null | undefined
): string {
  if (isEmpty(value)) return '';
  return String(value);
}
