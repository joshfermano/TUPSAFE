/**
 * Admin Employee ID Generator
 *
 * This utility generates unique employee IDs for administrative personnel.
 * Format: HRD-YYYY-XXX (e.g., HRD-2025-001)
 *
 * Components:
 * - HRD: Prefix for Human Resources Department
 * - YYYY: Current year
 * - XXX: Sequential number (padded to 3 digits)
 *
 * @module database/utils/admin-employee-id
 */

import { db } from '../db';
import { employeeIdRegistry } from '../schema';
import { desc, like } from 'drizzle-orm';

/**
 * Generates the next available admin employee ID for the current year.
 *
 * The function:
 * 1. Queries the employeeIdRegistry for existing HRD IDs in the current year
 * 2. Finds the highest sequential number
 * 3. Increments by 1 and formats with leading zeros
 * 4. Returns the new ID (e.g., HRD-2025-001)
 *
 * @returns {Promise<string>} The next available admin employee ID
 * @throws {Error} If database query fails
 *
 * @example
 * ```typescript
 * const adminId = await generateAdminEmployeeId();
 * console.log(adminId); // "HRD-2025-001"
 * ```
 */
export async function generateAdminEmployeeId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `HRD-${currentYear}`;

  try {
    // Find the highest sequential number for the current year
    const existingIds = await db
      .select({
        employeeId: employeeIdRegistry.employeeId,
      })
      .from(employeeIdRegistry)
      .where(like(employeeIdRegistry.employeeId, `${prefix}-%`))
      .orderBy(desc(employeeIdRegistry.employeeId));

    // Extract the highest number
    let nextNumber = 1;

    if (existingIds.length > 0) {
      // Extract numbers from all IDs and find the maximum
      const numbers = existingIds
        .map((record) => {
          // Extract the number part from "HRD-YYYY-XXX"
          const parts = record.employeeId.split('-');
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

    // Format with leading zeros (3 digits)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    const newEmployeeId = `${prefix}-${formattedNumber}`;

    return newEmployeeId;
  } catch (error) {
    console.error('Error generating admin employee ID:', error);
    throw new Error('Failed to generate admin employee ID. Please try again.');
  }
}

/**
 * Validates if a given string matches the admin employee ID format.
 *
 * @param {string} employeeId - The employee ID to validate
 * @returns {boolean} True if valid admin employee ID format, false otherwise
 *
 * @example
 * ```typescript
 * isValidAdminEmployeeId("HRD-2025-001"); // true
 * isValidAdminEmployeeId("HRD-2025-1");   // false (not padded)
 * isValidAdminEmployeeId("EMP-2025-001"); // false (wrong prefix)
 * ```
 */
export function isValidAdminEmployeeId(employeeId: string): boolean {
  const pattern = /^HRD-\d{4}-\d{3}$/;
  return pattern.test(employeeId);
}

/**
 * Parses an admin employee ID into its components.
 *
 * @param {string} employeeId - The employee ID to parse
 * @returns {{ prefix: string; year: number; sequence: number } | null} Parsed components or null if invalid
 *
 * @example
 * ```typescript
 * const parsed = parseAdminEmployeeId("HRD-2025-001");
 * // { prefix: "HRD", year: 2025, sequence: 1 }
 * ```
 */
export function parseAdminEmployeeId(employeeId: string): {
  prefix: string;
  year: number;
  sequence: number;
} | null {
  if (!isValidAdminEmployeeId(employeeId)) {
    return null;
  }

  const parts = employeeId.split('-');
  return {
    prefix: parts[0],
    year: parseInt(parts[1], 10),
    sequence: parseInt(parts[2], 10),
  };
}
