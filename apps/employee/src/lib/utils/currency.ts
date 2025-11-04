/**
 * Currency Utilities for Philippine Peso (PHP) Formatting
 *
 * Handles formatting, parsing, and validation of currency inputs
 * specifically for the SALN module.
 *
 * @module lib/utils/currency
 */

/**
 * Formats a number value to Philippine Peso currency string
 *
 * @param value - The numeric value to format
 * @returns Formatted string (e.g., "₱ 1,234,567.89")
 *
 * @example
 * formatCurrency(1234567.89) // "₱ 1,234,567.89"
 * formatCurrency(0) // "₱ 0.00"
 * formatCurrency(1000) // "₱ 1,000.00"
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '₱ 0.00';
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parses a currency string to a number value
 *
 * Removes peso sign, spaces, and commas before parsing
 *
 * @param value - The currency string to parse
 * @returns Parsed numeric value
 *
 * @example
 * parseCurrency("₱ 1,234,567.89") // 1234567.89
 * parseCurrency("1,234.56") // 1234.56
 * parseCurrency("") // 0
 */
export function parseCurrency(value: string): number {
  if (!value || value.trim() === '') {
    return 0;
  }

  // Remove peso sign, spaces, and commas
  const cleanValue = value
    .replace(/₱/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '');

  const parsed = parseFloat(cleanValue);

  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a currency input string while typing
 *
 * Adds commas for thousands separators without affecting the decimal point
 *
 * @param value - The input string to format
 * @returns Formatted string with commas
 *
 * @example
 * formatCurrencyInput("1234567") // "1,234,567"
 * formatCurrencyInput("1234.56") // "1,234.56"
 */
export function formatCurrencyInput(value: string): string {
  if (!value) return '';

  // Remove all non-numeric characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, '');

  // Split by decimal point
  const parts = cleanValue.split('.');

  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Limit decimal places to 2
  if (parts.length > 1) {
    parts[1] = parts[1].slice(0, 2);
    return parts.join('.');
  }

  return parts[0];
}

/**
 * Validates if a string is a valid currency input
 *
 * Allows digits, decimal point, and comma separators
 *
 * @param value - The string to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidCurrencyInput("1,234.56") // true
 * isValidCurrencyInput("abc") // false
 * isValidCurrencyInput("1.2.3") // false (multiple decimals)
 */
export function isValidCurrencyInput(value: string): boolean {
  if (!value) return true;

  // Allow digits, decimal point, and commas
  const currencyRegex = /^[\d,]*\.?\d{0,2}$/;

  // Remove commas for validation
  const cleanValue = value.replace(/,/g, '');

  return currencyRegex.test(cleanValue);
}

/**
 * Cleans a currency input string by removing invalid characters
 *
 * @param value - The string to clean
 * @returns Cleaned string with only valid characters
 *
 * @example
 * cleanCurrencyInput("₱1,234.56abc") // "1,234.56"
 * cleanCurrencyInput("1.2.3") // "1.23"
 */
export function cleanCurrencyInput(value: string): string {
  if (!value) return '';

  // Remove all characters except digits, decimal point, and commas
  let cleaned = value.replace(/[^\d.,]/g, '');

  // Handle multiple decimal points - keep only the first one
  const decimalIndex = cleaned.indexOf('.');
  if (decimalIndex !== -1) {
    const beforeDecimal = cleaned.slice(0, decimalIndex);
    const afterDecimal = cleaned
      .slice(decimalIndex + 1)
      .replace(/\./g, '')
      .slice(0, 2);
    cleaned = beforeDecimal + '.' + afterDecimal;
  }

  return cleaned;
}

/**
 * Formats a number to compact currency notation
 *
 * Useful for displaying large amounts in a compact format
 *
 * @param value - The numeric value to format
 * @returns Compact formatted string (e.g., "₱1.2M", "₱5.3K")
 *
 * @example
 * formatCompactCurrency(1234567) // "₱1.2M"
 * formatCompactCurrency(5300) // "₱5.3K"
 * formatCompactCurrency(500) // "₱500"
 */
export function formatCompactCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '₱ 0';
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Constants for currency validation
 */
export const CURRENCY_CONSTANTS = {
  /** Maximum value for SALN property (1 trillion PHP) */
  MAX_VALUE: 1_000_000_000_000,
  /** Minimum value for SALN property */
  MIN_VALUE: 0,
  /** Maximum decimal places allowed */
  MAX_DECIMAL_PLACES: 2,
  /** Peso sign symbol */
  PESO_SIGN: '₱',
  /** Default placeholder */
  DEFAULT_PLACEHOLDER: '₱ 0.00',
} as const;
