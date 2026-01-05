import { StyleSheet, Font } from '@react-pdf/renderer';

/**
 * PDS PDF Styles for CS Form No. 212 (Revised 2025)
 * Based on official CSC specifications with gray section headers
 */

// Track registration state
let fontsRegistered = false;

/**
 * Register Liberation Serif fonts for PDF generation
 * Font files are located in public/fonts/
 * Call this before generating any PDF
 */
export function registerPDSFonts(baseUrl: string = ''): void {
  Font.register({
    family: 'Liberation Serif',
    fonts: [
      {
        src: `${baseUrl}/fonts/liberation-serif-regular.woff`,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
      {
        src: `${baseUrl}/fonts/liberation-serif-bold.woff`,
        fontWeight: 'bold',
        fontStyle: 'normal',
      },
      {
        src: `${baseUrl}/fonts/liberation-serif-italic.woff`,
        fontWeight: 'normal',
        fontStyle: 'italic',
      },
      {
        src: `${baseUrl}/fonts/liberation-serif-bold-italic.woff`,
        fontWeight: 'bold',
        fontStyle: 'italic',
      },
    ],
  });

  // Disable hyphenation for better text control
  Font.registerHyphenationCallback((word) => [word]);
}

/**
 * Ensure fonts are registered (idempotent - safe to call multiple times)
 */
export function ensurePDSFontsRegistered(baseUrl: string = ''): void {
  if (!fontsRegistered) {
    registerPDSFonts(baseUrl);
    fontsRegistered = true;
  }
}

/**
 * PDS Color Palette - CS Form No. 212 (Revised 2025)
 * Based on official CSC form specifications
 */
export const PDS_COLORS = {
  sectionHeaderBg: '#808080', // Gray for sections I-VIII (matching official CSC form)
  sectionHeaderText: '#FFFFFF', // White text on gray background (bold italic)
  subHeaderBg: '#D9D9D9', // Light gray for sub-headers/table headers
  labelCellBg: '#F2F2F2', // Very light gray for label cells
  warningRed: '#FF0000', // Red for warnings and continue text
  borderColor: '#000000', // Black borders
  black: '#000000',
  white: '#FFFFFF',
  pageBackground: '#FFFFFF',
};

/**
 * Legacy color export for backward compatibility
 */
export const colors = PDS_COLORS;

/**
 * PDS Dimensions - CS Form No. 212 specifications
 */
export const PDS_DIMENSIONS = {
  pageSize: 'LEGAL' as const,
  pagePadding: 20,
  headerHeight: 18,
  subHeaderHeight: 16,
  rowHeight: 16,
  emptyRowHeight: 18,
  minRowHeight: 14,
  cellPadding: 3,
  cellPaddingSmall: 2,
  borderWidth: 0.5,
  thickBorderWidth: 1,
  photoWidth: 127.56, // 4.5cm in points
  photoHeight: 99.21, // 3.5cm in points
  signatureBoxWidth: 140,
  signatureBoxHeight: 50,
  thumbmarkWidth: 60,
  thumbmarkHeight: 80,
};

/**
 * PDS Font Sizes - CS Form No. 212 specifications
 */
export const PDS_FONT_SIZES = {
  csFormNumber: 7,
  formTitle: 12,
  formSubtitle: 6,
  sectionHeader: 8,
  subSectionHeader: 7,
  fieldLabel: 5,
  fieldValue: 7,
  tableHeader: 6,
  tableCell: 6,
  footerText: 6,
  noteText: 5,
  declarationText: 7,
  continueText: 6,
};

/**
 * PDS StyleSheet - CS Form No. 212 (Revised 2025)
 */
export const styles = StyleSheet.create({
  // Page layout
  page: {
    padding: PDS_DIMENSIONS.pagePadding,
    fontFamily: 'Liberation Serif',
    fontSize: PDS_FONT_SIZES.fieldValue,
    lineHeight: 1.2,
    backgroundColor: PDS_COLORS.pageBackground,
  },

  // Form header
  formHeader: {
    marginBottom: 5,
  },
  csFormNumber: {
    fontSize: PDS_FONT_SIZES.csFormNumber,
    textAlign: 'right',
    marginBottom: 2,
  },
  formTitle: {
    fontSize: PDS_FONT_SIZES.formTitle,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  formSubtitle: {
    fontSize: PDS_FONT_SIZES.formSubtitle,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  warningText: {
    fontSize: PDS_FONT_SIZES.formSubtitle,
    color: PDS_COLORS.warningRed,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },

  // Section headers (Gray background with white text - matching official CSC form)
  sectionHeader: {
    backgroundColor: PDS_COLORS.sectionHeaderBg,
    color: PDS_COLORS.sectionHeaderText,
    fontSize: PDS_FONT_SIZES.sectionHeader,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'left',
    paddingLeft: 5,
    paddingVertical: PDS_DIMENSIONS.cellPadding,
    borderWidth: PDS_DIMENSIONS.borderWidth,
    borderColor: PDS_COLORS.borderColor,
    minHeight: PDS_DIMENSIONS.headerHeight,
    justifyContent: 'center',
  },
  subSectionHeader: {
    backgroundColor: PDS_COLORS.subHeaderBg,
    color: PDS_COLORS.black,
    fontSize: PDS_FONT_SIZES.subSectionHeader,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: PDS_DIMENSIONS.cellPaddingSmall,
    borderWidth: PDS_DIMENSIONS.borderWidth,
    borderColor: PDS_COLORS.borderColor,
    minHeight: PDS_DIMENSIONS.subHeaderHeight,
    justifyContent: 'center',
  },

  // Table structures
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderWidth: PDS_DIMENSIONS.borderWidth,
    borderColor: PDS_COLORS.borderColor,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: PDS_DIMENSIONS.rowHeight,
    borderBottomWidth: PDS_DIMENSIONS.borderWidth,
    borderBottomColor: PDS_COLORS.borderColor,
  },
  tableRowNoBorder: {
    flexDirection: 'row',
    minHeight: PDS_DIMENSIONS.rowHeight,
  },
  tableCell: {
    borderRightWidth: PDS_DIMENSIONS.borderWidth,
    borderRightColor: PDS_COLORS.borderColor,
    padding: PDS_DIMENSIONS.cellPadding,
    justifyContent: 'center',
  },
  tableCellNoBorder: {
    padding: PDS_DIMENSIONS.cellPadding,
    justifyContent: 'center',
  },
  tableCellHeader: {
    backgroundColor: PDS_COLORS.subHeaderBg,
    borderRightWidth: PDS_DIMENSIONS.borderWidth,
    borderRightColor: PDS_COLORS.borderColor,
    padding: PDS_DIMENSIONS.cellPadding,
    justifyContent: 'center',
    fontSize: PDS_FONT_SIZES.tableHeader,
    fontWeight: 'bold',
  },

  // Empty rows for spacing
  emptyTableRow: {
    flexDirection: 'row',
    height: PDS_DIMENSIONS.emptyRowHeight,
    borderBottomWidth: PDS_DIMENSIONS.borderWidth,
    borderBottomColor: PDS_COLORS.borderColor,
  },

  // Field labels and values
  fieldLabel: {
    fontSize: PDS_FONT_SIZES.fieldLabel,
    color: PDS_COLORS.black,
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: PDS_FONT_SIZES.fieldValue,
    fontWeight: 'bold',
    color: PDS_COLORS.black,
  },
  fieldValueNormal: {
    fontSize: PDS_FONT_SIZES.fieldValue,
    color: PDS_COLORS.black,
  },

  // Label cells (light gray background)
  labelCell: {
    backgroundColor: PDS_COLORS.labelCellBg,
    borderRightWidth: PDS_DIMENSIONS.borderWidth,
    borderRightColor: PDS_COLORS.borderColor,
    padding: PDS_DIMENSIONS.cellPadding,
    justifyContent: 'center',
  },

  // Field containers
  fieldRow: {
    flexDirection: 'row',
    borderBottomWidth: PDS_DIMENSIONS.borderWidth,
    borderBottomColor: PDS_COLORS.borderColor,
  },
  fieldCell: {
    borderRightWidth: PDS_DIMENSIONS.borderWidth,
    borderRightColor: PDS_COLORS.borderColor,
    padding: PDS_DIMENSIONS.cellPadding,
  },
  fieldCellLast: {
    padding: PDS_DIMENSIONS.cellPadding,
  },

  // Continuation text (RED italic)
  continueText: {
    fontSize: PDS_FONT_SIZES.continueText,
    fontStyle: 'italic',
    color: PDS_COLORS.warningRed,
    textAlign: 'right',
    marginTop: 5,
  },

  // Signature and ID section
  signatureSection: {
    marginTop: 10,
    borderWidth: PDS_DIMENSIONS.borderWidth,
    borderColor: PDS_COLORS.borderColor,
    padding: 10,
  },
  signatureBox: {
    width: PDS_DIMENSIONS.signatureBoxWidth,
    height: PDS_DIMENSIONS.signatureBoxHeight,
    borderWidth: PDS_DIMENSIONS.thickBorderWidth,
    borderColor: PDS_COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBox: {
    width: PDS_DIMENSIONS.photoWidth,
    height: PDS_DIMENSIONS.photoHeight,
    borderWidth: PDS_DIMENSIONS.thickBorderWidth,
    borderColor: PDS_COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PDS_COLORS.white,
  },
  thumbmarkBox: {
    width: PDS_DIMENSIONS.thumbmarkWidth,
    height: PDS_DIMENSIONS.thumbmarkHeight,
    borderWidth: PDS_DIMENSIONS.thickBorderWidth,
    borderColor: PDS_COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Declaration section
  declarationText: {
    fontSize: PDS_FONT_SIZES.declarationText,
    textAlign: 'justify',
    lineHeight: 1.4,
    marginBottom: 10,
  },

  // Footer and page numbers
  pageFooter: {
    position: 'absolute',
    bottom: 10,
    left: PDS_DIMENSIONS.pagePadding,
    right: PDS_DIMENSIONS.pagePadding,
    fontSize: PDS_FONT_SIZES.footerText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noteText: {
    fontSize: PDS_FONT_SIZES.noteText,
    fontStyle: 'italic',
    color: '#666666',
  },

  // Text modifiers
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },
  justify: {
    textAlign: 'justify',
  },

  // Layout helpers
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  flex3: { flex: 3 },
  flex4: { flex: 4 },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },

  // Spacing utilities
  marginTop5: { marginTop: 5 },
  marginTop10: { marginTop: 10 },
  marginBottom5: { marginBottom: 5 },
  marginBottom10: { marginBottom: 10 },

  // Width utilities
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

  // Checkbox styles
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: PDS_COLORS.black,
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: PDS_COLORS.black,
    marginRight: 3,
    backgroundColor: PDS_COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxContainer: {
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 6,
    color: PDS_COLORS.white,
  },

  // Additional text styles
  labelSmall: {
    fontSize: PDS_FONT_SIZES.fieldLabel,
    color: PDS_COLORS.black,
  },
  value: {
    fontSize: PDS_FONT_SIZES.fieldValue,
    fontWeight: 'bold',
    color: PDS_COLORS.black,
  },
  valueSmall: {
    fontSize: 6,
    color: PDS_COLORS.black,
  },
  valueSingleLine: {
    fontSize: 6,
    color: PDS_COLORS.black,
    maxLines: 1,
    overflow: 'hidden',
  },

  // Bordered section wrapper
  borderedSection: {
    borderWidth: PDS_DIMENSIONS.borderWidth,
    borderColor: PDS_COLORS.borderColor,
  },

  // Compact field row with fixed height
  fieldRowCompact: {
    flexDirection: 'row',
    borderBottomWidth: PDS_DIMENSIONS.borderWidth,
    borderBottomColor: PDS_COLORS.borderColor,
    height: PDS_DIMENSIONS.rowHeight,
    maxHeight: PDS_DIMENSIONS.rowHeight,
    overflow: 'hidden',
  },

  // Page number footer
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    fontSize: PDS_FONT_SIZES.footerText,
    textAlign: 'center',
  },
});

/**
 * Format date as dd/mm/yyyy
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format date as MM/DD/YYYY (US format for CSC forms)
 */
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
 * Format full name from components
 */
export function formatFullName(
  surname: string,
  firstName: string,
  middleName?: string | null,
  extension?: string | null
): string {
  const parts = [surname, firstName];

  if (middleName) {
    parts.push(middleName);
  }

  if (extension) {
    parts.push(extension);
  }

  return parts.join(' ').trim();
}

/**
 * Helper to check if value is empty
 */
export function isEmpty(
  value: string | number | null | undefined
): value is null | undefined | '' {
  return value === null || value === undefined || value === '';
}

/**
 * Display N/A if empty
 */
export function displayOrNA(value: string | number | null | undefined): string {
  if (isEmpty(value)) return 'N/A';
  return String(value);
}

/**
 * Format currency (PHP)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-PH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
