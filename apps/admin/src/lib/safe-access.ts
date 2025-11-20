/**
 * Safe Property Access Utilities
 *
 * Provides type-safe utility functions for accessing potentially undefined
 * or null properties without runtime errors.
 */

/**
 * Safely access a nested property with optional chaining and fallback
 *
 * @param obj - The object to access
 * @param path - Dot-notated path to the property (e.g., 'user.profile.name')
 * @param fallback - Value to return if property is undefined/null
 * @returns The property value or fallback
 *
 * @example
 * safeGet(user, 'profile.department.name', 'Unknown Department')
 * safeGet(details, 'status', 'pending')
 */
export function safeGet<T = any>(
  obj: any,
  path: string,
  fallback: T
): T {
  if (!obj || typeof obj !== 'object') return fallback;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return fallback;
    }
    current = current[key];
  }

  return current !== undefined && current !== null ? current : fallback;
}

/**
 * Safely access a property that might be undefined/null
 *
 * @param value - The value to check
 * @param fallback - Value to return if value is undefined/null/empty
 * @returns The value or fallback
 *
 * @example
 * safe(details?.status, 'pending')
 * safe(user?.email, 'No email')
 */
export function safe<T>(
  value: T | undefined | null | '',
  fallback: NonNullable<T>
): NonNullable<T> {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value as NonNullable<T>;
}

/**
 * Safely format a date with fallback
 *
 * @param date - Date to format (Date object, string, or null/undefined)
 * @param formatter - Function to format the date
 * @param fallback - Value to return if date is invalid
 * @returns Formatted date string or fallback
 *
 * @example
 * safeDate(details.createdAt, (d) => format(d, 'PPpp'), '—')
 */
export function safeDate(
  date: Date | string | null | undefined,
  formatter: (date: Date) => string,
  fallback: string = '—'
): string {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return fallback;
    return formatter(dateObj);
  } catch {
    return fallback;
  }
}

/**
 * Safely access an array property with fallback to empty array
 *
 * @param arr - Array that might be undefined/null
 * @returns The array or empty array
 *
 * @example
 * safeArray(details.tags).map(...)
 */
export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return arr ?? [];
}

/**
 * Safely access a boolean property with fallback
 *
 * @param value - Boolean that might be undefined/null
 * @param fallback - Value to return if value is undefined/null
 * @returns The boolean or fallback
 *
 * @example
 * safeBool(details.isActive, false)
 */
export function safeBool(
  value: boolean | undefined | null,
  fallback: boolean = false
): boolean {
  return value ?? fallback;
}

/**
 * Safely access a number property with fallback
 *
 * @param value - Number that might be undefined/null
 * @param fallback - Value to return if value is undefined/null
 * @returns The number or fallback
 *
 * @example
 * safeNum(details.count, 0)
 */
export function safeNum(
  value: number | undefined | null,
  fallback: number = 0
): number {
  return value ?? fallback;
}

/**
 * Type guard to check if a value is not null or undefined
 *
 * @param value - Value to check
 * @returns True if value is not null or undefined
 *
 * @example
 * if (isDefined(details?.status)) {
 *   // TypeScript knows status is defined here
 * }
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Type guard to check if a string is not empty
 *
 * @param value - String to check
 * @returns True if string has content
 *
 * @example
 * if (hasContent(details?.department?.name)) {
 *   // TypeScript knows name is a non-empty string
 * }
 */
export function hasContent(value: string | undefined | null): value is string {
  return isDefined(value) && value.trim().length > 0;
}
