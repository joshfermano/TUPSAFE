/**
 * Applicant ID Generator
 *
 * Utility for generating unique applicant identifiers following the format:
 * APPL-YYYYMMDD-XXXX
 *
 * Where:
 * - APPL: Fixed prefix for applicants
 * - YYYYMMDD: Application date (e.g., 20250114)
 * - XXXX: Sequential number padded to 4 digits (0001-9999)
 *
 * @module database/utils/applicant-id
 */

import { db } from '../db';
import { profiles } from '../schema';
import { desc, like, and, gte, lt } from 'drizzle-orm';

/**
 * Generates the next available applicant ID for the current date.
 *
 * The function:
 * 1. Queries the profiles table for existing applicant IDs created today
 * 2. Finds the highest sequential number for today's date
 * 3. Increments by 1 and formats with leading zeros
 * 4. Returns the new ID (e.g., APPL-20250114-0001)
 *
 * @returns {Promise<string>} The next available applicant ID
 * @throws {Error} If database query fails
 *
 * @example
 * ```typescript
 * const applicantId = await generateApplicantId();
 * console.log(applicantId); // "APPL-20250114-0001"
 * ```
 */
export async function generateApplicantId(): Promise<string> {
  const today = new Date();
  const dateStr = formatDateForId(today);
  const prefix = `APPL-${dateStr}`;

  try {
    // Get start and end of today for date range query
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Find the highest sequential number for today
    const existingIds = await db
      .select({
        applicantId: profiles.applicantId,
      })
      .from(profiles)
      .where(
        and(
          like(profiles.applicantId, `${prefix}-%`),
          gte(profiles.createdAt, startOfDay),
          lt(profiles.createdAt, endOfDay)
        )
      )
      .orderBy(desc(profiles.applicantId));

    // Extract the highest number
    let nextNumber = 1;

    if (existingIds.length > 0) {
      // Extract numbers from all IDs and find the maximum
      const numbers = existingIds
        .map((record) => {
          if (!record.applicantId) return 0;
          // Extract the number part from "APPL-YYYYMMDD-XXXX"
          const parts = record.applicantId.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            return isNaN(num) ? 0 : num;
          }
          return 0;
        })
        .filter((num) => num > 0);

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    // Check if we've exceeded daily limit
    if (nextNumber > 9999) {
      throw new Error(
        'Daily applicant ID limit reached (9999). Contact system administrator.'
      );
    }

    // Format with leading zeros (4 digits)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    const newApplicantId = `${prefix}-${formattedNumber}`;

    return newApplicantId;
  } catch (error) {
    console.error('Error generating applicant ID:', error);
    if (error instanceof Error && error.message.includes('daily limit')) {
      throw error;
    }
    throw new Error('Failed to generate applicant ID. Please try again.');
  }
}

/**
 * Validates if a given string matches the applicant ID format.
 *
 * @param {string} applicantId - The applicant ID to validate
 * @returns {boolean} True if valid applicant ID format, false otherwise
 *
 * @example
 * ```typescript
 * isValidApplicantId("APPL-20250114-0001"); // true
 * isValidApplicantId("APPL-20250114-1");    // false (not padded)
 * isValidApplicantId("EMP-20250114-0001");  // false (wrong prefix)
 * ```
 */
export function isValidApplicantId(applicantId: string): boolean {
  const pattern = /^APPL-\d{8}-\d{4}$/;
  return pattern.test(applicantId);
}

/**
 * Parses an applicant ID into its components.
 *
 * @param {string} applicantId - The applicant ID to parse
 * @returns Parsed components or null if invalid
 *
 * @example
 * ```typescript
 * const parsed = parseApplicantId("APPL-20250114-0001");
 * // { prefix: "APPL", date: Date(2025-01-14), sequence: 1 }
 * ```
 */
export function parseApplicantId(applicantId: string): {
  prefix: string;
  date: Date;
  sequence: number;
} | null {
  if (!isValidApplicantId(applicantId)) {
    return null;
  }

  const parts = applicantId.split('-');
  const dateStr = parts[1]; // YYYYMMDD

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8), 10);

  return {
    prefix: parts[0],
    date: new Date(year, month, day),
    sequence: parseInt(parts[2], 10),
  };
}

/**
 * Formats a date for use in applicant ID.
 * Format: YYYYMMDD
 *
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 *
 * @internal
 */
function formatDateForId(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Gets statistics for applicant IDs created today.
 * Useful for monitoring and dashboard displays.
 *
 * @returns Statistics about today's applicant registrations
 *
 * @example
 * ```typescript
 * const stats = await getApplicantIdStats();
 * console.log(stats); // { count: 42, lastId: "APPL-20250114-0042", remainingCapacity: 9957 }
 * ```
 */
export async function getApplicantIdStats(): Promise<{
  count: number;
  lastId: string | null;
  remainingCapacity: number;
  date: string;
}> {
  const today = new Date();
  const dateStr = formatDateForId(today);
  const prefix = `APPL-${dateStr}`;

  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  try {
    const applicants = await db
      .select({
        applicantId: profiles.applicantId,
      })
      .from(profiles)
      .where(
        and(
          like(profiles.applicantId, `${prefix}-%`),
          gte(profiles.createdAt, startOfDay),
          lt(profiles.createdAt, endOfDay)
        )
      )
      .orderBy(desc(profiles.applicantId));

    const count = applicants.length;
    const lastId = count > 0 ? applicants[0].applicantId : null;
    const remainingCapacity = 9999 - count;

    return {
      count,
      lastId,
      remainingCapacity,
      date: dateStr,
    };
  } catch (error) {
    console.error('Error fetching applicant ID stats:', error);
    throw new Error('Failed to fetch applicant ID statistics.');
  }
}
