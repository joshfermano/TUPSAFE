/**
 * DOB-based Employee ID Generator
 *
 * Generates unique employee IDs based on date of birth.
 * Format: TUPM-MMDD-YY-### (e.g., TUPM-1223-95-001)
 *
 * Components:
 * - TUPM: Prefix for TUP Manila
 * - MMDD: Month and day from date of birth
 * - YY: Last two digits of birth year
 * - ###: Sequential number (padded to 3 digits)
 *
 * @module database/utils/employee-id-dob
 */

import { db } from '../db';
import { employeeIdRegistry } from '../schema';
import { desc, like, eq } from 'drizzle-orm';

/**
 * Parses a date string (YYYY-MM-DD) into components for employee ID
 *
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Object with month, day, and year components
 */
function parseDateOfBirth(dateOfBirth: string): {
  month: string;
  day: string;
  year: string;
} {
  const date = new Date(dateOfBirth);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date of birth format. Expected YYYY-MM-DD');
  }

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits

  return { month, day, year };
}

/**
 * Builds the employee ID prefix from date of birth
 *
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Prefix string like "TUPM-1223-95"
 */
function buildEmployeeIdPrefix(dateOfBirth: string): string {
  const { month, day, year } = parseDateOfBirth(dateOfBirth);
  return `TUPM-${month}${day}-${year}`;
}

/**
 * Generates the next available employee ID for a given date of birth.
 *
 * The function:
 * 1. Builds the prefix from dateOfBirth (e.g., TUPM-1223-95)
 * 2. Queries the employeeIdRegistry for existing IDs with that prefix
 * 3. Finds the highest sequential number
 * 4. Increments by 1 and formats with leading zeros
 * 5. Returns the new ID (e.g., TUPM-1223-95-001)
 *
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns The next available employee ID
 * @throws {Error} If database query fails
 *
 * @example
 * ```typescript
 * const employeeId = await generateEmployeeIdFromDOB('1995-12-23');
 * console.log(employeeId); // "TUPM-1223-95-001"
 * ```
 */
export async function generateEmployeeIdFromDOB(
  dateOfBirth: string
): Promise<string> {
  const prefix = buildEmployeeIdPrefix(dateOfBirth);

  try {
    // Find the highest sequential number for this prefix
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
          // Extract the number part from "TUPM-MMDD-YY-XXX"
          const parts = record.employeeId.split('-');
          if (parts.length === 4) {
            const num = parseInt(parts[3], 10);
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
    console.error('Error generating DOB-based employee ID:', error);
    throw new Error(
      'Failed to generate employee ID from date of birth. Please try again.'
    );
  }
}

/**
 * Generates and registers a new employee ID for a user based on their date of birth.
 *
 * This function:
 * 1. Generates a unique employee ID from the date of birth
 * 2. Registers it in the employee_id_registry table with the userId
 * 3. Handles unique constraint violations with retries
 *
 * @param userId - The Supabase auth user ID
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @param maxRetries - Maximum number of retries on collision (default: 5)
 * @returns The registered employee ID
 * @throws {Error} If all retries are exhausted or database error occurs
 *
 * @example
 * ```typescript
 * const employeeId = await generateAndRegisterEmployeeIdFromDOB(
 *   'user-uuid-here',
 *   '1995-12-23'
 * );
 * console.log(employeeId); // "TUPM-1223-95-001"
 * ```
 */
export async function generateAndRegisterEmployeeIdFromDOB(
  userId: string,
  dateOfBirth: string,
  maxRetries: number = 5
): Promise<string> {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const employeeId = await generateEmployeeIdFromDOB(dateOfBirth);

      // Attempt to insert into the registry
      await db.insert(employeeIdRegistry).values({
        employeeId,
        userId,
      });

      return employeeId;
    } catch (error) {
      // Check if it's a unique constraint violation
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isUniqueViolation =
        errorMessage.includes('unique') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('23505'); // PostgreSQL unique violation code

      if (isUniqueViolation) {
        attempts++;
        console.warn(
          `Employee ID collision, retrying (attempt ${attempts}/${maxRetries})`
        );

        // Add a small delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Re-throw non-collision errors
      throw error;
    }
  }

  throw new Error(
    `Failed to generate unique employee ID after ${maxRetries} attempts. Please try again.`
  );
}

/**
 * Validates if a given string matches the DOB-based employee ID format.
 *
 * @param employeeId - The employee ID to validate
 * @returns True if valid DOB-based employee ID format, false otherwise
 *
 * @example
 * ```typescript
 * isValidDOBEmployeeId("TUPM-1223-95-001"); // true
 * isValidDOBEmployeeId("TUPM-1223-95-1");   // false (not padded)
 * isValidDOBEmployeeId("HRD-2025-001");     // false (wrong format)
 * ```
 */
export function isValidDOBEmployeeId(employeeId: string): boolean {
  // Pattern: TUPM-MMDD-YY-###
  const pattern = /^TUPM-\d{4}-\d{2}-\d{3}$/;
  return pattern.test(employeeId);
}

/**
 * Parses a DOB-based employee ID into its components.
 *
 * @param employeeId - The employee ID to parse
 * @returns Parsed components or null if invalid
 *
 * @example
 * ```typescript
 * const parsed = parseDOBEmployeeId("TUPM-1223-95-001");
 * // { prefix: "TUPM", monthDay: "1223", year: "95", sequence: 1 }
 * ```
 */
export function parseDOBEmployeeId(employeeId: string): {
  prefix: string;
  monthDay: string;
  year: string;
  sequence: number;
} | null {
  if (!isValidDOBEmployeeId(employeeId)) {
    return null;
  }

  const parts = employeeId.split('-');
  return {
    prefix: parts[0],
    monthDay: parts[1],
    year: parts[2],
    sequence: parseInt(parts[3], 10),
  };
}

/**
 * Updates the userId for an existing employee ID in the registry.
 * Used when the user is created in Supabase before the registry entry.
 *
 * @param employeeId - The employee ID to update
 * @param userId - The new user ID to associate
 */
export async function updateEmployeeIdUserId(
  employeeId: string,
  userId: string
): Promise<void> {
  try {
    await db
      .update(employeeIdRegistry)
      .set({ userId })
      .where(eq(employeeIdRegistry.employeeId, employeeId));
  } catch (error) {
    console.error('Error updating employee ID registry:', error);
    throw new Error('Failed to update employee ID registry');
  }
}

