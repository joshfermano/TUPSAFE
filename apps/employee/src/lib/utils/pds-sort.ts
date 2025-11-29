/**
 * PDS Sort Utilities
 *
 * Provides sorting functions for PDS form entries (work experience, trainings, voluntary work, etc.)
 * All sorting is done in descending order (latest/most recent first)
 */

// Type for date values that can be Date objects or ISO strings
type DateValue = Date | string | null | undefined;

// Generic interface for items with date range fields
interface DateRangeItem {
  dateFrom?: DateValue;
  dateTo?: DateValue;
}

/**
 * Converts a date value to timestamp for comparison
 * Returns Infinity for null/undefined (represents "present" or current)
 */
function toTimestamp(date: DateValue): number {
  if (date === null || date === undefined) {
    return Infinity; // Present/current dates should be at the top
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime();
}

/**
 * Compares two date values for descending sort order
 * null/undefined values are treated as "present" and sorted to the top
 */
function compareDatesDesc(a: DateValue, b: DateValue): number {
  const timestampA = toTimestamp(a);
  const timestampB = toTimestamp(b);
  return timestampB - timestampA;
}

/**
 * Generic sort function that sorts array items by date in descending order (latest first)
 *
 * Primary sort: by `dateTo` (null/undefined means current/present, sorted to top)
 * Secondary sort: by `dateFrom` (when dateTo values are equal)
 *
 * @param items - Array of items with date range fields
 * @returns New sorted array (does not mutate original)
 */
export function sortByDateDesc<T extends DateRangeItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // Primary sort by dateTo (descending)
    const dateToComparison = compareDatesDesc(a.dateTo, b.dateTo);

    if (dateToComparison !== 0) {
      return dateToComparison;
    }

    // Secondary sort by dateFrom (descending) when dateTo values are equal
    return compareDatesDesc(a.dateFrom, b.dateFrom);
  });
}

// Work Experience interface
interface WorkExperience extends DateRangeItem {
  positionTitle?: string;
  department?: string;
  companyName?: string;
  monthlySalary?: number | string;
  salaryGrade?: string;
  statusOfAppointment?: string;
  governmentService?: boolean | string;
}

/**
 * Sort work experience entries with latest (or current) experiences first
 *
 * @param experiences - Array of work experience entries
 * @returns Sorted array with current/latest experiences at the top
 */
export function sortWorkExperiences<T extends WorkExperience>(
  experiences: T[]
): T[] {
  return sortByDateDesc(experiences);
}

// Training interface
interface Training extends DateRangeItem {
  title?: string;
  type?: string;
  numberOfHours?: number | string;
  conductedBy?: string;
}

/**
 * Sort training/seminar entries with latest trainings first
 *
 * @param trainings - Array of training entries
 * @returns Sorted array with latest trainings at the top
 */
export function sortTrainings<T extends Training>(trainings: T[]): T[] {
  return sortByDateDesc(trainings);
}

// Voluntary Work interface
interface VoluntaryWork extends DateRangeItem {
  organizationName?: string;
  organizationAddress?: string;
  position?: string;
  numberOfHours?: number | string;
}

/**
 * Sort voluntary work entries with latest work first
 *
 * @param voluntaryWorks - Array of voluntary work entries
 * @returns Sorted array with latest voluntary work at the top
 */
export function sortVoluntaryWorks<T extends VoluntaryWork>(
  voluntaryWorks: T[]
): T[] {
  return sortByDateDesc(voluntaryWorks);
}

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Check if items are in correct chronological order (latest first)
 *
 * @param items - Array of items with date range fields
 * @returns Validation result with isValid flag and optional message
 */
export function validateChronologicalOrder<T extends DateRangeItem>(
  items: T[]
): ValidationResult {
  if (items.length <= 1) {
    return { isValid: true };
  }

  for (let i = 0; i < items.length - 1; i++) {
    const current = items[i];
    const next = items[i + 1];

    // Compare dateTo values first
    const currentDateTo = toTimestamp(current.dateTo);
    const nextDateTo = toTimestamp(next.dateTo);

    if (currentDateTo < nextDateTo) {
      return {
        isValid: false,
        message: `Item at position ${i + 1} should come after item at position ${i + 2} (dates are not in descending order)`,
      };
    }

    // If dateTo values are equal, compare dateFrom values
    if (currentDateTo === nextDateTo) {
      const currentDateFrom = toTimestamp(current.dateFrom);
      const nextDateFrom = toTimestamp(next.dateFrom);

      if (currentDateFrom < nextDateFrom) {
        return {
          isValid: false,
          message: `Item at position ${i + 1} should come after item at position ${i + 2} (start dates are not in descending order)`,
        };
      }
    }
  }

  return { isValid: true };
}

// Auto sort result interface
interface AutoSortResult<T> {
  sorted: T[];
  wasReordered: boolean;
}

/**
 * Sort items and return whether reordering occurred
 *
 * @param items - Array of items with date range fields
 * @returns Object containing sorted array and flag indicating if reordering occurred
 *
 * @example
 * const { sorted, wasReordered } = autoSortWithNotification(trainings);
 * if (wasReordered) {
 *   toast.info('Items have been automatically sorted by date (latest first)');
 * }
 */
export function autoSortWithNotification<T extends DateRangeItem>(
  items: T[]
): AutoSortResult<T> {
  const sorted = sortByDateDesc(items);

  // Check if any reordering occurred by comparing arrays
  const wasReordered = items.some((item, index) => item !== sorted[index]);

  return {
    sorted,
    wasReordered,
  };
}

/**
 * Utility to format date for display (optional helper)
 *
 * @param date - Date value to format
 * @param presentText - Text to display for null/undefined dates (default: "Present")
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  date: DateValue,
  presentText: string = 'Present'
): string {
  if (date === null || date === undefined) {
    return presentText;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Sort items by a single date field (for simpler entries)
 *
 * @param items - Array of items with a date field
 * @param dateField - The field name containing the date
 * @returns Sorted array with latest dates first
 */
export function sortBySingleDate<T extends Record<string, unknown>>(
  items: T[],
  dateField: keyof T
): T[] {
  return [...items].sort((a, b) => {
    const dateA = a[dateField] as DateValue;
    const dateB = b[dateField] as DateValue;
    return compareDatesDesc(dateA, dateB);
  });
}
