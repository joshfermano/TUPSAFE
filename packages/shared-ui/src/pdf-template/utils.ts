/**
 * Pure utility functions for PDF template filling.
 * No React or @react-pdf/renderer dependencies.
 */

/**
 * Format a date value to MM/DD/YYYY (CSC standard format)
 *
 * Handles ISO date-only strings (YYYY-MM-DD) using LOCAL timezone to prevent
 * -1 day shift from UTC conversion. For example, "2024-05-13" parsed via
 * new Date("2024-05-13") is treated as UTC midnight, which in UTC+8 timezones
 * becomes May 12 — shifting the date by one day. This function avoids that.
 */
export function formatDateMMDDYYYY(value: unknown): string {
  if (!value) return '';

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    // ISO date-only (YYYY-MM-DD): parse as LOCAL time to prevent timezone shift
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      date = new Date(
        parseInt(dateOnlyMatch[1]),
        parseInt(dateOnlyMatch[2]) - 1,
        parseInt(dateOnlyMatch[3])
      );
    } else {
      // ISO datetime or other format: extract date portion if possible
      const isoDatetimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T/);
      if (isoDatetimeMatch) {
        date = new Date(
          parseInt(isoDatetimeMatch[1]),
          parseInt(isoDatetimeMatch[2]) - 1,
          parseInt(isoDatetimeMatch[3])
        );
      } else {
        date = new Date(value);
      }
    }
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return String(value);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Format a date value to YYYY (year only)
 */
export function formatYear(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return String(value);
  return String(date.getFullYear());
}

/**
 * Format currency in Philippine Peso format: P#,###,###.00
 */
export function formatCurrency(amount: unknown): string {
  if (amount === null || amount === undefined || amount === '') return '';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) return '';
  return num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Return the display value or empty string for null/undefined
 */
export function displayOrEmpty(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

/**
 * Get a nested value from an object using dot-path notation
 * e.g., getNestedValue(data, 'personalInfo.surname')
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Format a value using a named formatter
 */
export function applyFormatter(
  value: unknown,
  formatter?: string
): string {
  switch (formatter) {
    case 'date':
    case 'dateMMDDYYYY':
      return formatDateMMDDYYYY(value);
    case 'currency':
      return formatCurrency(value);
    case 'boolean_yn':
      return value ? 'Yes' : 'No';
    default:
      return displayOrEmpty(value);
  }
}
