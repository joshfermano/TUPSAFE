/**
 * Date Utilities for PDS Form Inputs
 *
 * These utilities handle local date parsing and formatting to avoid timezone issues
 * when working with HTML date inputs (<input type="date">).
 *
 * Problem:
 * - `toISOString().split('T')[0]` uses UTC, which can shift dates by ±1 day depending on timezone
 * - `new Date('YYYY-MM-DD')` parses as UTC midnight, which can be "yesterday" or "tomorrow" in local time
 *
 * Solution:
 * - Format dates using local time components (getFullYear, getMonth, getDate)
 * - Parse date strings by constructing Date with local time components
 * - For validation, compare against end-of-today to allow "today" as a valid past date
 */

/**
 * Format a Date object to a string suitable for <input type="date"> value
 * Uses local timezone to avoid date shifts
 *
 * @param date - Date object to format, or null/undefined
 * @returns String in 'YYYY-MM-DD' format using local date, or empty string if null
 *
 * @example
 * formatDateForInput(new Date(2024, 11, 25)) // "2024-12-25" (local)
 * formatDateForInput(null) // ""
 */
export function formatDateForInput(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string from <input type="date"> to a local Date object
 * Avoids UTC parsing issues by constructing the Date with local components
 *
 * @param dateString - String in 'YYYY-MM-DD' format from date input
 * @returns Date object at local midnight, or null if invalid/empty
 *
 * @example
 * parseDateFromInput('2024-12-25') // Date(2024, 11, 25) at local midnight
 * parseDateFromInput('') // null
 * parseDateFromInput('invalid') // null
 */
export function parseDateFromInput(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') {
    return null;
  }

  // Validate format: YYYY-MM-DD
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateString.match(dateRegex);

  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
  const day = parseInt(match[3], 10);

  // Validate ranges
  if (month < 0 || month > 11 || day < 1 || day > 31) {
    return null;
  }

  // Create date at local midnight
  const date = new Date(year, month, day);

  // Verify the date is valid (e.g., Feb 30 would roll over)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Get end of today (23:59:59.999) for date validation
 * Allows "today" to be considered a valid "past" date
 *
 * @returns Date object set to 23:59:59.999 of today in local timezone
 */
export function getEndOfToday(): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
}

/**
 * Check if a date is in the past or today (not future)
 * Uses end-of-today comparison to allow today's date
 *
 * @param date - Date to check
 * @returns true if date is today or earlier, false if future
 */
export function isDateNotFuture(date: Date | null | undefined): boolean {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return true; // Null/invalid dates pass (optionality handled elsewhere)
  }

  return date <= getEndOfToday();
}

/**
 * Get today's date at local midnight (start of day)
 * Useful for setting default dates without time component issues
 *
 * @returns Date object set to 00:00:00.000 of today in local timezone
 */
export function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Check if a value is a valid Date object
 *
 * @param value - Any value to check
 * @returns true if value is a valid Date object
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

