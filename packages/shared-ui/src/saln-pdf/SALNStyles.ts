import { Font, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Type definitions for SALN properties (subset for calculations)
interface SalnRealProperty {
  acquisitionCost: number | string | null;
}

interface SalnPersonalProperty {
  acquisitionCost: number | string | null;
}

interface SalnLiability {
  outstandingBalance: number | string | null;
}

// Track registration state
let fontsRegistered = false;

/**
 * Register Liberation Serif fonts for SALN PDF generation
 * Font files are located in public/fonts/
 * This function checks if fonts are already registered to avoid duplicate registration
 * Call this before generating any SALN PDF
 *
 * @param baseUrl - Base URL for font paths (default: '')
 */
export function registerSALNFonts(baseUrl: string = ''): void {
  // Check if fonts are already registered
  if (fontsRegistered) {
    return; // Already registered, skip
  }

  Font.register({
    family: 'LiberationSerif',
    fonts: [
      {
        src: `${baseUrl}/fonts/liberation-serif-regular.woff`,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
      {
        src: `${baseUrl}/fonts/liberation-serif-italic.woff`,
        fontWeight: 'normal',
        fontStyle: 'italic',
      },
      {
        src: `${baseUrl}/fonts/liberation-serif-bold.woff`,
        fontWeight: 'bold',
        fontStyle: 'normal',
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

  // Mark as registered
  fontsRegistered = true;
}

/**
 * Ensure fonts are registered (idempotent - safe to call multiple times)
 * This is a convenience wrapper around registerSALNFonts
 *
 * @param baseUrl - Base URL for font paths (default: '')
 */
export function ensureSALNFontsRegistered(baseUrl: string = ''): void {
  registerSALNFonts(baseUrl);
}

/**
 * Color constants matching CSC SALN Form 2019/2025 specifications
 * These colors ensure consistency with the official form layout
 */
export const SALN_COLORS = {
  formTitle: '#000000', // Black for main title
  headerBg: '#E0E0E0', // Light gray for table headers (CSC compliant)
  headerText: '#000000', // Black text on headers (CSC compliant)
  borderColor: '#000000', // Black borders
  currencyBlack: '#000000', // Black for currency values (CSC compliant)
  subtotalBorder: '#000000', // Thick border for subtotals
  lightGray: '#D3D3D3', // Light gray for header backgrounds
  mediumGray: '#808080', // Medium gray for section backgrounds
  black: '#000000',
  white: '#FFFFFF',
  textGray: '#333333', // Dark gray for body text
};

/**
 * Font sizes (in points) matching CSC SALN Form 2019/2025 layout
 * All sizes are calibrated to fit standard letter-size paper (8.5" x 11")
 */
export const SALN_FONT_SIZES = {
  formTitle: 11, // "SWORN STATEMENT OF ASSETS, LIABILITIES AND NET WORTH"
  formSubtitle: 9, // "(As of [date])"
  sectionHeader: 8, // Section titles (ASSETS, LIABILITIES, etc.)
  fieldLabel: 7, // Field labels
  fieldValue: 7, // User-entered values
  tableHeader: 7, // Table column headers
  tableCell: 6, // Table cell content
  currencyValue: 7, // Currency values
  legalText: 6, // Legal/certification text
  footerText: 6, // Footer information
  noteText: 5, // Italic footnotes
  checkboxText: 7, // Checkbox label text (2025 format)
};

/**
 * Common dimensions for layout consistency
 */
export const SALN_DIMENSIONS = {
  pagePadding: 20,
  cellPadding: 3,
  borderWidth: 0.5,
  thickBorderWidth: 1,
  headerHeight: 18,
  rowHeight: 16,
  smallRowHeight: 14,
  signatureBoxWidth: 140,
  signatureBoxHeight: 50,
};

/**
 * Main stylesheet for SALN PDF generation
 * Styles are organized by component type for easy navigation
 */
export const styles = StyleSheet.create({
  // Page layout
  page: {
    padding: SALN_DIMENSIONS.pagePadding,
    fontFamily: 'LiberationSerif',
    fontSize: SALN_FONT_SIZES.fieldValue,
    lineHeight: 1.3,
    color: SALN_COLORS.textGray,
  },

  // Form header section
  formHeader: {
    textAlign: 'center',
    marginBottom: 10,
  },
  formTitle: {
    fontSize: SALN_FONT_SIZES.formTitle,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
    color: SALN_COLORS.formTitle,
    textTransform: 'uppercase',
    textDecoration: 'underline',
  },
  formSubtitle: {
    fontSize: SALN_FONT_SIZES.formSubtitle,
    textAlign: 'center',
    marginBottom: 8,
    color: SALN_COLORS.textGray,
  },
  formInfo: {
    fontSize: SALN_FONT_SIZES.footerText,
    textAlign: 'right',
    marginBottom: 5,
    fontStyle: 'italic',
  },

  // Declarant information boxes
  declarantInfo: {
    borderWidth: SALN_DIMENSIONS.borderWidth,
    borderColor: SALN_COLORS.borderColor,
    padding: SALN_DIMENSIONS.cellPadding,
    marginBottom: 8,
  },
  declarantRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  declarantLabel: {
    fontSize: SALN_FONT_SIZES.fieldLabel,
    fontWeight: 'bold',
    width: '30%',
    color: SALN_COLORS.textGray,
  },
  declarantValue: {
    fontSize: SALN_FONT_SIZES.fieldValue,
    width: '70%',
    color: SALN_COLORS.black,
  },
  labelSmall: {
    fontSize: SALN_FONT_SIZES.noteText,
    color: SALN_COLORS.textGray,
    fontStyle: 'italic',
  },

  // Section headers
  sectionHeader: {
    backgroundColor: SALN_COLORS.headerBg,
    color: SALN_COLORS.headerText,
    padding: 4,
    fontSize: SALN_FONT_SIZES.sectionHeader,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: SALN_DIMENSIONS.borderWidth,
    borderColor: SALN_COLORS.borderColor,
    marginTop: 5,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  subSectionHeader: {
    backgroundColor: SALN_COLORS.lightGray,
    padding: 3,
    fontSize: SALN_FONT_SIZES.fieldLabel,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: SALN_DIMENSIONS.borderWidth,
    borderColor: SALN_COLORS.borderColor,
    marginTop: 3,
  },

  // Table styles
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderWidth: SALN_DIMENSIONS.borderWidth,
    borderColor: SALN_COLORS.borderColor,
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: SALN_COLORS.lightGray,
    borderBottomWidth: SALN_DIMENSIONS.borderWidth,
    borderBottomColor: SALN_COLORS.borderColor,
    minHeight: SALN_DIMENSIONS.headerHeight,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: SALN_DIMENSIONS.rowHeight,
    borderBottomWidth: SALN_DIMENSIONS.borderWidth,
    borderBottomColor: SALN_COLORS.borderColor,
  },
  tableRowNoBorder: {
    flexDirection: 'row',
    minHeight: SALN_DIMENSIONS.rowHeight,
  },
  tableCell: {
    borderRightWidth: SALN_DIMENSIONS.borderWidth,
    borderRightColor: SALN_COLORS.borderColor,
    padding: SALN_DIMENSIONS.cellPadding,
    justifyContent: 'center',
    fontSize: SALN_FONT_SIZES.tableCell,
  },
  tableCellNoBorder: {
    padding: SALN_DIMENSIONS.cellPadding,
    justifyContent: 'center',
    fontSize: SALN_FONT_SIZES.tableCell,
  },
  tableHeaderCell: {
    borderRightWidth: SALN_DIMENSIONS.borderWidth,
    borderRightColor: SALN_COLORS.borderColor,
    padding: SALN_DIMENSIONS.cellPadding,
    justifyContent: 'center',
    fontSize: SALN_FONT_SIZES.tableHeader,
    fontWeight: 'bold',
  },

  // Currency-specific cells
  currencyCell: {
    borderRightWidth: SALN_DIMENSIONS.borderWidth,
    borderRightColor: SALN_COLORS.borderColor,
    padding: SALN_DIMENSIONS.cellPadding,
    justifyContent: 'center',
    alignItems: 'flex-end',
    fontSize: SALN_FONT_SIZES.currencyValue,
    color: SALN_COLORS.currencyBlack,
  },
  currencyCellNoBorder: {
    padding: SALN_DIMENSIONS.cellPadding,
    justifyContent: 'center',
    alignItems: 'flex-end',
    fontSize: SALN_FONT_SIZES.currencyValue,
    color: SALN_COLORS.currencyBlack,
  },

  // Subtotal and total rows
  subtotalRow: {
    flexDirection: 'row',
    minHeight: SALN_DIMENSIONS.rowHeight,
    backgroundColor: SALN_COLORS.lightGray,
    borderTopWidth: SALN_DIMENSIONS.thickBorderWidth,
    borderBottomWidth: SALN_DIMENSIONS.borderWidth,
    borderColor: SALN_COLORS.subtotalBorder,
  },
  totalRow: {
    flexDirection: 'row',
    minHeight: SALN_DIMENSIONS.rowHeight,
    backgroundColor: SALN_COLORS.lightGray,
    borderTopWidth: SALN_DIMENSIONS.thickBorderWidth,
    borderBottomWidth: SALN_DIMENSIONS.thickBorderWidth,
    borderColor: SALN_COLORS.subtotalBorder,
  },
  subtotalLabel: {
    fontSize: SALN_FONT_SIZES.tableHeader,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 5,
  },
  subtotalValue: {
    fontSize: SALN_FONT_SIZES.currencyValue,
    fontWeight: 'bold',
    color: SALN_COLORS.currencyBlack,
  },

  // Net Worth section (highlighted)
  netWorthBox: {
    borderWidth: SALN_DIMENSIONS.thickBorderWidth,
    borderColor: SALN_COLORS.borderColor,
    backgroundColor: SALN_COLORS.lightGray,
    padding: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  netWorthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  netWorthLabel: {
    fontSize: SALN_FONT_SIZES.sectionHeader,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  netWorthValue: {
    fontSize: SALN_FONT_SIZES.formTitle,
    fontWeight: 'bold',
    color: SALN_COLORS.currencyBlack,
  },

  // Signature section
  signatureSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signatureBox: {
    width: SALN_DIMENSIONS.signatureBoxWidth,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: SALN_COLORS.borderColor,
    height: SALN_DIMENSIONS.signatureBoxHeight,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: SALN_FONT_SIZES.fieldLabel,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  signatureDate: {
    fontSize: SALN_FONT_SIZES.fieldLabel,
    textAlign: 'center',
    marginTop: 3,
  },

  // Certification text
  certificationText: {
    fontSize: SALN_FONT_SIZES.legalText,
    textAlign: 'justify',
    lineHeight: 1.4,
    marginBottom: 10,
  },
  certificationTitle: {
    fontSize: SALN_FONT_SIZES.sectionHeader,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    marginTop: 10,
  },

  // Text utilities
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
  uppercase: {
    textTransform: 'uppercase',
  },

  // Layout helpers
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
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

  // Width percentages
  w10: { width: '10%' },
  w15: { width: '15%' },
  w20: { width: '20%' },
  w25: { width: '25%' },
  w30: { width: '30%' },
  w33: { width: '33.33%' },
  w35: { width: '35%' },
  w40: { width: '40%' },
  w45: { width: '45%' },
  w50: { width: '50%' },
  w55: { width: '55%' },
  w60: { width: '60%' },
  w65: { width: '65%' },
  w70: { width: '70%' },
  w75: { width: '75%' },
  w80: { width: '80%' },
  w100: { width: '100%' },

  // Flex helpers
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  flex3: { flex: 3 },
  flex4: { flex: 4 },

  // Margin helpers
  marginTop5: { marginTop: 5 },
  marginTop10: { marginTop: 10 },
  marginBottom5: { marginBottom: 5 },
  marginBottom10: { marginBottom: 10 },

  // Empty placeholder
  emptyRow: {
    height: SALN_DIMENSIONS.rowHeight,
    borderBottomWidth: SALN_DIMENSIONS.borderWidth,
    borderBottomColor: SALN_COLORS.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SALN_FONT_SIZES.tableCell,
    fontStyle: 'italic',
    color: SALN_COLORS.mediumGray,
  },

  // Footer styles
  footerText: {
    fontSize: SALN_FONT_SIZES.footerText,
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
    color: SALN_COLORS.textGray,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    fontSize: SALN_FONT_SIZES.footerText,
    textAlign: 'center',
  },

  // Notes section
  noteText: {
    fontSize: SALN_FONT_SIZES.noteText,
    fontStyle: 'italic',
    color: SALN_COLORS.mediumGray,
    marginTop: 3,
  },

  // 2025 Format Checkbox Styles
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  checkboxText: {
    fontSize: SALN_FONT_SIZES.checkboxText,
    marginLeft: 3,
  },
  checkboxContainer: {
    padding: 8,
    borderWidth: 0.5,
    borderColor: SALN_COLORS.borderColor,
    marginBottom: 5,
  },

  // 2025 Format Section Styles
  complianceSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  multipleMarriagesSection: {
    borderWidth: 0.5,
    borderColor: SALN_COLORS.borderColor,
    padding: 5,
    marginTop: 5,
    marginBottom: 5,
  },
  spousePublicOfficialSection: {
    borderWidth: 0.5,
    borderColor: SALN_COLORS.borderColor,
    padding: 5,
    marginTop: 5,
    marginBottom: 5,
  },
  footerNotesSection: {
    marginTop: 10,
    paddingTop: 5,
    borderTopWidth: 0.5,
    borderTopColor: SALN_COLORS.borderColor,
  },
  secondSignatureSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: SALN_COLORS.borderColor,
  },

  // 2025 Format: Net Worth single-line display (replaces box)
  netWorthLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    marginTop: 8,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
  },

  // Total Assets row on page 1
  totalAssetsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 4,
    marginTop: 3,
    marginBottom: 3,
  },

  // Signature/Initial line (right-aligned, for page 1 bottom)
  signatureInitialRight: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  // Footnotes section at bottom of page
  footnoteSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  footnoteText: {
    fontSize: 5,
    fontStyle: 'italic',
    color: '#333333',
    marginBottom: 2,
    lineHeight: 1.3,
  },

  // "COMPLIANCE FOR:" label
  complianceLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    marginBottom: 3,
  },

  // Filing notice text (for the "SPOUSES WHO ARE BOTH..." note)
  filingNoticeText: {
    fontSize: 6,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 3,
    color: '#333333',
  },
});

/**
 * Format currency as P#,###,###.00
 * Uses letter P prefix (CSC compliant) with 2 decimal places
 *
 * @param amount - The numeric amount to format
 * @returns Formatted currency string with P prefix
 *
 * @example
 * formatCurrency(1234567.89) // "P1,234,567.89"
 * formatCurrency(0) // "P0.00"
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `P${formatted}`;
}

/**
 * Format date as MM/DD/YYYY
 * Converts Date objects or ISO strings to CSC-standard date format
 *
 * @param date - Date object or ISO string
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2024-12-25')) // "12/25/2024"
 * formatDate('2024-01-15T00:00:00Z') // "01/15/2024"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MM/dd/yyyy');
}

/**
 * Display value or empty string for N/A cases
 * Handles null, undefined, and empty string values
 *
 * @param value - Value to display
 * @returns String representation or "N/A"
 *
 * @example
 * displayOrEmpty(null) // "N/A"
 * displayOrEmpty("") // "N/A"
 * displayOrEmpty(123) // "123"
 * displayOrEmpty("text") // "text"
 */
export function displayOrEmpty(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
}

/**
 * Calculate age from date of birth
 * Accurately accounts for month and day to determine current age
 *
 * @param dateOfBirth - Date of birth as Date object or ISO string
 * @returns Age in years
 *
 * @example
 * calculateAge(new Date('1990-06-15')) // Returns current age
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Sum array of numbers
 * Pure utility function for calculating totals
 *
 * @param arr - Array of numbers to sum
 * @returns Sum of all numbers in array
 *
 * @example
 * sumArray([10, 20, 30]) // 60
 * sumArray([]) // 0
 */
export function sumArray(arr: number[]): number {
  return arr.reduce((sum, val) => sum + val, 0);
}

/**
 * Calculate total value of real properties
 * Sums acquisition costs from all real property entries
 *
 * @param properties - Array of real property objects
 * @returns Total acquisition cost
 *
 * @example
 * const properties = [
 *   { acquisitionCost: 1000000, ... },
 *   { acquisitionCost: 500000, ... }
 * ];
 * calculateRealPropertiesTotal(properties) // 1500000
 */
export function calculateRealPropertiesTotal(
  properties: SalnRealProperty[]
): number {
  return sumArray(
    properties.map((p) => {
      const cost = p.acquisitionCost;
      return typeof cost === 'string' ? parseFloat(cost) || 0 : cost || 0;
    })
  );
}

/**
 * Calculate total value of personal properties
 * Sums acquisition costs from all personal property entries
 *
 * @param properties - Array of personal property objects
 * @returns Total acquisition cost
 *
 * @example
 * const properties = [
 *   { acquisitionCost: 50000, ... },
 *   { acquisitionCost: 25000, ... }
 * ];
 * calculatePersonalPropertiesTotal(properties) // 75000
 */
export function calculatePersonalPropertiesTotal(
  properties: SalnPersonalProperty[]
): number {
  return sumArray(
    properties.map((p) => {
      const cost = p.acquisitionCost;
      return typeof cost === 'string' ? parseFloat(cost) || 0 : cost || 0;
    })
  );
}

/**
 * Calculate total liabilities
 * Sums outstanding balances from all liability entries
 *
 * @param liabilities - Array of liability objects
 * @returns Total outstanding balance
 *
 * @example
 * const liabilities = [
 *   { outstandingBalance: 100000, ... },
 *   { outstandingBalance: 50000, ... }
 * ];
 * calculateLiabilitiesTotal(liabilities) // 150000
 */
export function calculateLiabilitiesTotal(
  liabilities: SalnLiability[]
): number {
  return sumArray(
    liabilities.map((l) => {
      const balance = l.outstandingBalance;
      return typeof balance === 'string' ? parseFloat(balance) || 0 : balance || 0;
    })
  );
}

/**
 * Calculate total assets (real + personal properties)
 * Combines real and personal property totals
 *
 * @param realProperties - Array of real property objects
 * @param personalProperties - Array of personal property objects
 * @returns Total asset value
 */
export function calculateTotalAssets(
  realProperties: SalnRealProperty[],
  personalProperties: SalnPersonalProperty[]
): number {
  return (
    calculateRealPropertiesTotal(realProperties) +
    calculatePersonalPropertiesTotal(personalProperties)
  );
}

/**
 * Calculate net worth (assets - liabilities)
 * Main calculation for SALN form
 *
 * @param totalAssets - Total value of all assets
 * @param totalLiabilities - Total value of all liabilities
 * @returns Net worth value
 *
 * @example
 * calculateNetWorth(2000000, 500000) // 1500000
 */
export function calculateNetWorth(
  totalAssets: number,
  totalLiabilities: number
): number {
  return totalAssets - totalLiabilities;
}

/**
 * Format large currency values with abbreviated notation
 * Useful for summary displays
 *
 * @param amount - Amount to format
 * @returns Abbreviated currency string
 *
 * @example
 * formatCurrencyAbbreviated(1500000) // "P1.5M"
 * formatCurrencyAbbreviated(750000) // "P750K"
 */
export function formatCurrencyAbbreviated(amount: number): string {
  if (amount >= 1000000) {
    return `P${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `P${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
}

/**
 * Check if value is empty or null
 * Type guard for empty value checking
 *
 * @param value - Value to check
 * @returns True if value is null, undefined, or empty string
 */
export function isEmpty(
  value: string | number | null | undefined
): value is null | undefined | '' {
  return value === null || value === undefined || value === '';
}

/**
 * Format year to 4-digit string
 * Ensures consistent year formatting
 *
 * @param year - Year as number or string
 * @returns 4-digit year string
 *
 * @example
 * formatYear(2024) // "2024"
 * formatYear("24") // "2024"
 */
export function formatYear(year: number | string | null | undefined): string {
  if (isEmpty(year)) return 'N/A';
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  return yearNum.toString();
}
