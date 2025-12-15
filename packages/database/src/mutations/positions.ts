/**
 * Position Management Mutations
 *
 * Production-ready Drizzle ORM mutations for creating, updating, and managing
 * positions within the TUP Manila organizational structure. Handles position
 * lifecycle with proper validation, transaction management, and error handling.
 *
 * Positions represent job titles/roles that can be assigned to employees,
 * with optional department associations and Philippine salary grade levels (1-33).
 *
 * @module mutations/positions
 */

import { db } from '../db';
import { positions, departments, profiles } from '../schema';
import { eq, and, count } from 'drizzle-orm';
import type { Position, NewPosition } from '../types';

/**
 * Input type for creating a new position
 */
export interface CreatePositionInput {
  title: string;
  gradeLevel?: number | null;
  departmentId?: string | null;
}

/**
 * Input type for updating an existing position
 */
export interface UpdatePositionInput {
  title?: string;
  gradeLevel?: number | null;
  departmentId?: string | null;
  isActive?: boolean;
}

/**
 * Philippine Salary Grade System Constants
 */
const MIN_GRADE_LEVEL = 1;
const MAX_GRADE_LEVEL = 33;

/**
 * Position title validation constants
 */
const MIN_TITLE_LENGTH = 1;
const MAX_TITLE_LENGTH = 100;

/**
 * Validate grade level is within Philippine Salary Grade range (1-33)
 *
 * @param gradeLevel - Grade level to validate
 * @throws Error if grade level is out of range
 */
function validateGradeLevel(gradeLevel: number | null | undefined): void {
  if (gradeLevel === null || gradeLevel === undefined) {
    return; // Grade level is optional
  }

  if (!Number.isInteger(gradeLevel)) {
    throw new Error('Grade level must be an integer');
  }

  if (gradeLevel < MIN_GRADE_LEVEL || gradeLevel > MAX_GRADE_LEVEL) {
    throw new Error(
      `Grade level must be between ${MIN_GRADE_LEVEL} and ${MAX_GRADE_LEVEL} (Philippine Salary Grade System)`
    );
  }
}

/**
 * Validate position title
 *
 * @param title - Title to validate
 * @throws Error if title is invalid
 */
function validateTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    throw new Error('Position title is required');
  }

  const trimmedTitle = title.trim();

  if (trimmedTitle.length < MIN_TITLE_LENGTH) {
    throw new Error('Position title cannot be empty');
  }

  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    throw new Error(
      `Position title cannot exceed ${MAX_TITLE_LENGTH} characters`
    );
  }

  return trimmedTitle;
}

/**
 * Create a new position
 *
 * Creates a position with optional department association and salary grade level.
 * Validates title, grade level range, and department status before creation.
 *
 * Positions can be:
 * - Department-specific (e.g., "Professor" in Computer Science Department)
 * - Organization-wide (e.g., "University President", departmentId=null)
 *
 * @param data - Position creation data
 * @returns Promise<Position> The newly created position
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * // Create department-specific position
 * const position = await createPosition({
 *   title: 'Associate Professor',
 *   gradeLevel: 24,
 *   departmentId: '550e8400-e29b-41d4-a716-446655440000'
 * });
 *
 * @example
 * // Create organization-wide position
 * const position = await createPosition({
 *   title: 'University President',
 *   gradeLevel: 33
 * });
 */
export async function createPosition(
  data: CreatePositionInput
): Promise<Position> {
  try {
    // Validate input
    const trimmedTitle = validateTitle(data.title);
    validateGradeLevel(data.gradeLevel);

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // If department is specified, verify it exists and is active
      if (data.departmentId) {
        const [department] = await tx
          .select()
          .from(departments)
          .where(eq(departments.id, data.departmentId))
          .limit(1);

        if (!department) {
          throw new Error(
            `Department with ID '${data.departmentId}' not found`
          );
        }

        if (!department.isActive) {
          throw new Error(
            'Cannot create position in inactive department. Please reactivate the department first.'
          );
        }
      }

      // Create position
      const [position] = await tx
        .insert(positions)
        .values({
          title: trimmedTitle,
          gradeLevel: data.gradeLevel ?? null,
          departmentId: data.departmentId ?? null,
          isActive: true,
        })
        .returning();

      if (!position) {
        throw new Error('Failed to create position');
      }

      return position;
    });

    return result;
  } catch (error) {
    console.error('[createPosition] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to create position');
  }
}

/**
 * Update an existing position
 *
 * Updates position fields with validation. Supports updating:
 * - Title
 * - Grade level (1-33)
 * - Department association
 * - Active status
 *
 * Validates that new department exists and is active if changing department.
 * All fields are optional - only provided fields will be updated.
 *
 * @param id - Position UUID to update
 * @param data - Fields to update (all optional)
 * @returns Promise<Position> The updated position
 * @throws Error if position not found, validation fails, or database operation fails
 *
 * @example
 * const updated = await updatePosition('550e8400-e29b-41d4-a716-446655440000', {
 *   title: 'Senior Associate Professor',
 *   gradeLevel: 25
 * });
 *
 * @example
 * // Reassign to different department
 * const updated = await updatePosition('550e8400-e29b-41d4-a716-446655440000', {
 *   departmentId: '660e8400-e29b-41d4-a716-446655440001'
 * });
 */
export async function updatePosition(
  id: string,
  data: UpdatePositionInput
): Promise<Position> {
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Valid position ID is required');
    }

    if (Object.keys(data).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    // Validate title if provided
    if (data.title !== undefined) {
      validateTitle(data.title);
    }

    // Validate grade level if provided
    if (data.gradeLevel !== undefined) {
      validateGradeLevel(data.gradeLevel);
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Verify position exists
      const [existing] = await tx
        .select()
        .from(positions)
        .where(eq(positions.id, id))
        .limit(1);

      if (!existing) {
        throw new Error(`Position with ID '${id}' not found`);
      }

      // Validate new department if being changed
      if (data.departmentId !== undefined && data.departmentId !== null) {
        const [department] = await tx
          .select()
          .from(departments)
          .where(eq(departments.id, data.departmentId))
          .limit(1);

        if (!department) {
          throw new Error(
            `Department with ID '${data.departmentId}' not found`
          );
        }

        if (!department.isActive) {
          throw new Error(
            'Cannot assign position to inactive department. Please reactivate the department first.'
          );
        }
      }

      // Build update object
      const updateData: Partial<NewPosition> = {};

      if (data.title !== undefined) {
        updateData.title = data.title.trim();
      }

      if (data.gradeLevel !== undefined) {
        updateData.gradeLevel = data.gradeLevel;
      }

      if (data.departmentId !== undefined) {
        updateData.departmentId = data.departmentId;
      }

      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      // Perform update
      const [updated] = await tx
        .update(positions)
        .set(updateData)
        .where(eq(positions.id, id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update position');
      }

      return updated;
    });

    return result;
  } catch (error) {
    console.error('[updatePosition] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to update position');
  }
}

/**
 * Soft delete a position (set isActive to false)
 *
 * Performs a safe deletion by setting isActive=false instead of removing the record.
 * This preserves referential integrity and historical employment data.
 *
 * Validates that no active employees are currently assigned to this position.
 * If employees are assigned, they must be reassigned to other positions first.
 *
 * @param id - Position UUID to soft delete
 * @returns Promise<void>
 * @throws Error if position has active employees or database operation fails
 *
 * @example
 * try {
 *   await softDeletePosition('550e8400-e29b-41d4-a716-446655440000');
 *   console.log('Position deactivated successfully');
 * } catch (error) {
 *   console.error('Cannot delete position:', error.message);
 * }
 */
export async function softDeletePosition(id: string): Promise<void> {
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Valid position ID is required');
    }

    // Use transaction for atomic operation
    await db.transaction(async (tx) => {
      // Verify position exists
      const [existing] = await tx
        .select()
        .from(positions)
        .where(eq(positions.id, id))
        .limit(1);

      if (!existing) {
        throw new Error(`Position with ID '${id}' not found`);
      }

      if (!existing.isActive) {
        throw new Error('Position is already inactive');
      }

      // Check for active employees assigned to this position
      const activeEmployeesCount = await tx
        .select({ count: count() })
        .from(profiles)
        .where(and(eq(profiles.positionId, id), eq(profiles.isActive, true)));

      if (activeEmployeesCount[0]?.count > 0) {
        throw new Error(
          `Cannot deactivate position. There are ${activeEmployeesCount[0].count} active employee(s) assigned. Please reassign employees first.`
        );
      }

      // Soft delete by setting isActive to false
      await tx
        .update(positions)
        .set({ isActive: false })
        .where(eq(positions.id, id));
    });
  } catch (error) {
    console.error('[softDeletePosition] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to soft delete position');
  }
}

/**
 * Reactivate a soft-deleted position
 *
 * Sets isActive=true on a previously soft-deleted position, restoring it to active status.
 * The position can then be assigned to employees.
 *
 * Validates that the associated department (if any) is still active before reactivation.
 * If the department has been deactivated, it must be reactivated first.
 *
 * @param id - Position UUID to reactivate
 * @returns Promise<Position> The reactivated position
 * @throws Error if position not found, already active, or department is inactive
 *
 * @example
 * const reactivated = await reactivatePosition('550e8400-e29b-41d4-a716-446655440000');
 * console.log(`Position ${reactivated.title} is now active`);
 */
export async function reactivatePosition(id: string): Promise<Position> {
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Valid position ID is required');
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Verify position exists
      const [existing] = await tx
        .select()
        .from(positions)
        .where(eq(positions.id, id))
        .limit(1);

      if (!existing) {
        throw new Error(`Position with ID '${id}' not found`);
      }

      if (existing.isActive) {
        throw new Error('Position is already active');
      }

      // If position has a department, verify department is still active
      if (existing.departmentId) {
        const [department] = await tx
          .select({ isActive: departments.isActive })
          .from(departments)
          .where(eq(departments.id, existing.departmentId))
          .limit(1);

        if (!department) {
          throw new Error(
            `Associated department with ID '${existing.departmentId}' not found. Consider removing department association before reactivation.`
          );
        }

        if (!department.isActive) {
          throw new Error(
            'Cannot reactivate position. Associated department is inactive. Please reactivate the department first.'
          );
        }
      }

      // Reactivate position
      const [reactivated] = await tx
        .update(positions)
        .set({ isActive: true })
        .where(eq(positions.id, id))
        .returning();

      if (!reactivated) {
        throw new Error('Failed to reactivate position');
      }

      return reactivated;
    });

    return result;
  } catch (error) {
    console.error('[reactivatePosition] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to reactivate position');
  }
}

/**
 * Check if a position has employees assigned to it
 *
 * Validates whether any employees (active or inactive) are currently assigned
 * to this position. This is a helper function for validation before deletion.
 *
 * Used to prevent deletion of positions that have employment history associated.
 *
 * @param positionId - Position UUID to check
 * @returns Promise<boolean> True if position has employees assigned, false otherwise
 * @throws Error if database query fails
 *
 * @example
 * const isAssigned = await isPositionAssigned('550e8400-e29b-41d4-a716-446655440000');
 * if (isAssigned) {
 *   console.log('Position has employees assigned, cannot delete');
 * }
 *
 * @example
 * // Use in validation before deletion
 * if (await isPositionAssigned(positionId)) {
 *   throw new Error('Cannot delete position with assigned employees');
 * }
 */
export async function isPositionAssigned(
  positionId: string
): Promise<boolean> {
  try {
    // Validate input
    if (!positionId || typeof positionId !== 'string') {
      throw new Error('Valid position ID is required');
    }

    // Check if any profiles reference this position
    const [result] = await db
      .select({ count: count() })
      .from(profiles)
      .where(eq(profiles.positionId, positionId));

    return (result?.count ?? 0) > 0;
  } catch (error) {
    console.error('[isPositionAssigned] Database error:', error);
    throw new Error(
      `Failed to check position assignment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
