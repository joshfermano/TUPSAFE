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

// Font sizes matching CSC Form No. 212 Revised 2025
export const fontSizes = {
  formTitle: 10, // "PERSONAL DATA SHEET"
  formSubtitle: 7, // Warning text
  csFormNumber: 7, // "CS Form No. 212"
  sectionHeader: 8, // Roman numeral headers
  fieldLabel: 6, // Field labels (ALL CAPS)
  fieldValue: 7, // User data
  tableHeader: 6, // Table column headers
  tableContent: 6, // Table data cells
  footerText: 5, // Page footers
  declarationText: 6, // Declaration paragraph
  noteText: 5, // Italic continuation notes
};

// Common dimensions matching CSC Form No. 212 Revised 2025
export const dimensions = {
  pagePadding: 15,
  cellPadding: 2,
  borderWidth: 0.5,
  headerHeight: 20,
  rowHeight: 14,
  smallRowHeight: 12,
  photoWidth: 127.56, // 4.5cm → points (exact CSC requirement)
  photoHeight: 99.21, // 3.5cm → points (exact CSC requirement)
  signatureBoxWidth: 120,
  signatureBoxHeight: 50,
  thumbmarkWidth: 60,
  thumbmarkHeight: 80,
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
    fontSize: fontSizes.formTitle,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  formSubtitle: {
    fontSize: fontSizes.formSubtitle,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  csFormNumber: {
    fontSize: fontSizes.csFormNumber,
    textAlign: 'right',
    marginBottom: 2,
  },

  // Section headers
  sectionHeader: {
    backgroundColor: colors.headerBg,
    color: colors.white,
    padding: 3,
    fontSize: fontSizes.sectionHeader,
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
    fontSize: fontSizes.fieldLabel,
    color: colors.black,
    marginBottom: 1,
  },
  labelSmall: {
    fontSize: fontSizes.fieldLabel,
    color: colors.black,
  },
  value: {
    fontSize: fontSizes.fieldValue,
    fontWeight: 'bold',
    color: colors.black,
  },
  valueSmall: {
    fontSize: 6,
    color: colors.black,
  },
  // Single-line value that prevents wrapping (used for fields that could overflow)
  valueSingleLine: {
    fontSize: 6,
    color: colors.black,
    maxLines: 1,
    overflow: 'hidden',
  },
  // Single-line bold value
  valueSingleLineBold: {
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.black,
    maxLines: 1,
    overflow: 'hidden',
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
  // Compact field row with fixed height (prevents overflow)
  fieldRowCompact: {
    flexDirection: 'row',
    borderBottomWidth: dimensions.borderWidth,
    borderBottomColor: colors.borderColor,
    height: dimensions.rowHeight,
    maxHeight: dimensions.rowHeight,
    overflow: 'hidden',
  },
  // Slightly taller compact row for address sub-rows
  fieldRowCompactTall: {
    flexDirection: 'row',
    borderBottomWidth: dimensions.borderWidth,
    borderBottomColor: colors.borderColor,
    height: 20,
    maxHeight: 20,
    overflow: 'hidden',
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
  checkboxContainer: {
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSymbol: {
    fontSize: 10,
    color: colors.black,
  },

  // Signature and photo boxes
  signatureBox: {
    width: dimensions.signatureBoxWidth,
    height: dimensions.signatureBoxHeight,
    borderWidth: 1,
    borderColor: colors.black,
    marginTop: 5,
  },
  photoBox: {
    width: dimensions.photoWidth,
    height: dimensions.photoHeight,
    borderWidth: 1,
    borderColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbmarkBox: {
    width: dimensions.thumbmarkWidth,
    height: dimensions.thumbmarkHeight,
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
    fontSize: fontSizes.footerText,
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    fontSize: 6,
    textAlign: 'center',
  },

  // Declaration section
  declarationText: {
    fontSize: fontSizes.declarationText,
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
    fontSize: fontSizes.noteText,
    fontStyle: 'italic',
    color: '#666666',
  },

  // Width percentages as explicit values
  w10: { width: '10%' },
  w15: { width: '15%' },
  w16: { width: '16%' },
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
