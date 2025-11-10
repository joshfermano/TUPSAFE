/**
 * Employee ID Generator
 * Generates unique TUPM-XXXXX employee IDs with collision prevention
 */

import { db } from '@tupsafe/database/server';
import { employeeIdRegistry } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

/**
 * Generate a random 5-digit number
 */
function generateRandomDigits(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * Generate a unique TUPM-XXXXX employee ID
 * @param maxAttempts - Maximum collision attempts before failing (default: 10)
 */
export async function generateEmployeeId(
  maxAttempts: number = 10
): Promise<string> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const digits = generateRandomDigits();
    const employeeId = `TUPM-${digits}`;

    // Check if this ID already exists
    const [existing] = await db
      .select()
      .from(employeeIdRegistry)
      .where(eq(employeeIdRegistry.employeeId, employeeId))
      .limit(1);

    if (!existing) {
      return employeeId;
    }

    attempts++;
  }

  // If we've exhausted attempts, throw an error
  throw new Error(
    'Failed to generate unique employee ID after maximum attempts. This is extremely rare - please try again.'
  );
}

/**
 * Register an employee ID with a user
 * @param employeeId - The employee ID to register
 * @param userId - The user ID to associate with
 */
export async function registerEmployeeId(
  employeeId: string,
  userId: string
): Promise<void> {
  try {
    await db.insert(employeeIdRegistry).values({
      employeeId,
      userId,
    });
  } catch (error) {
    console.error('Error registering employee ID:', error);
    throw new Error('Failed to register employee ID');
  }
}

/**
 * Check if an employee ID is available
 * @param employeeId - The employee ID to check
 */
export async function isEmployeeIdAvailable(
  employeeId: string
): Promise<boolean> {
  try {
    const [existing] = await db
      .select()
      .from(employeeIdRegistry)
      .where(eq(employeeIdRegistry.employeeId, employeeId))
      .limit(1);

    return !existing;
  } catch (error) {
    console.error('Error checking employee ID availability:', error);
    return false;
  }
}

/**
 * Get user ID from employee ID
 * @param employeeId - The employee ID to look up
 */
export async function getUserIdFromEmployeeId(
  employeeId: string
): Promise<string | null> {
  try {
    const [record] = await db
      .select()
      .from(employeeIdRegistry)
      .where(eq(employeeIdRegistry.employeeId, employeeId))
      .limit(1);

    return record?.userId || null;
  } catch (error) {
    console.error('Error getting user ID from employee ID:', error);
    return null;
  }
}

/**
 * Get employee ID from user ID
 * @param userId - The user ID to look up
 */
export async function getEmployeeIdFromUserId(
  userId: string
): Promise<string | null> {
  try {
    const [record] = await db
      .select()
      .from(employeeIdRegistry)
      .where(eq(employeeIdRegistry.userId, userId))
      .limit(1);

    return record?.employeeId || null;
  } catch (error) {
    console.error('Error getting employee ID from user ID:', error);
    return null;
  }
}

/**
 * Generate and register a new employee ID for a user
 * This is a convenience function that combines generation and registration
 */
export async function generateAndRegisterEmployeeId(
  userId: string
): Promise<string> {
  const employeeId = await generateEmployeeId();
  await registerEmployeeId(employeeId, userId);
  return employeeId;
}
