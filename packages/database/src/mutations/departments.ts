/**
 * Department and Organization Mutations
 *
 * Production-ready Drizzle ORM mutations for creating, updating, and deleting
 * colleges, departments, and administrative offices with proper validation,
 * transaction management, and error handling.
 *
 * @module mutations/departments
 */

import { db } from '../db';
import { departments, positions, profiles } from '../schema';
import { eq, and, ne, count } from 'drizzle-orm';
import type { Department, NewDepartment } from '../types';

/**
 * Input type for creating a new college
 */
export interface CreateCollegeInput {
  name: string;
  code: string;
}

/**
 * Input type for creating a new department under a college
 */
export interface CreateDepartmentInput {
  name: string;
  code: string;
  parentCollegeId: string;
}

/**
 * Input type for creating an administrative office
 */
export interface CreateOfficeInput {
  name: string;
  code: string;
  parentId?: string | null;
}

/**
 * Input type for updating a department
 */
export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  parentId?: string | null;
  parentCollegeId?: string | null;
  officeType?: 'academic' | 'administrative';
  isActive?: boolean;
}

/**
 * Create a new college (top-level academic unit)
 *
 * Creates a college department with officeType='academic', no parent references,
 * and isActive=true. Validates code uniqueness before creation.
 *
 * Colleges are top-level academic organizational units (e.g., College of Engineering,
 * College of Science, College of Liberal Arts).
 *
 * @param data - College creation data (name and code)
 * @returns Promise<Department> The newly created college department
 * @throws Error if code already exists or database operation fails
 *
 * @example
 * const college = await createCollege({
 *   name: 'College of Engineering',
 *   code: 'COE'
 * });
 */
export async function createCollege(
  data: CreateCollegeInput
): Promise<Department> {
  try {
    // Validate input
    if (!data.name || !data.code) {
      throw new Error('College name and code are required');
    }

    const trimmedCode = data.code.trim().toUpperCase();
    const trimmedName = data.name.trim();

    if (trimmedCode.length === 0) {
      throw new Error('College code cannot be empty');
    }

    if (trimmedName.length === 0) {
      throw new Error('College name cannot be empty');
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Check if code already exists
      const existing = await tx
        .select({ id: departments.id })
        .from(departments)
        .where(eq(departments.code, trimmedCode))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(
          `Department code '${trimmedCode}' already exists. Please use a unique code.`
        );
      }

      // Create college department
      const [college] = await tx
        .insert(departments)
        .values({
          name: trimmedName,
          code: trimmedCode,
          officeType: 'academic',
          parentId: null,
          parentCollegeId: null,
          isActive: true,
        })
        .returning();

      if (!college) {
        throw new Error('Failed to create college department');
      }

      return college;
    });

    return result;
  } catch (error) {
    console.error('[createCollege] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to create college');
  }
}

/**
 * Create a new department under a college
 *
 * Creates an academic department within a college with officeType='academic'.
 * Validates parent college exists and code is unique.
 *
 * Departments are organizational units within colleges (e.g., Computer Science
 * Department under College of Science).
 *
 * @param data - Department creation data (name, code, parentCollegeId)
 * @returns Promise<Department> The newly created department
 * @throws Error if parent college not found, code exists, or database operation fails
 *
 * @example
 * const dept = await createDepartment({
 *   name: 'Computer Science Department',
 *   code: 'BSCS',
 *   parentCollegeId: '550e8400-e29b-41d4-a716-446655440000'
 * });
 */
export async function createDepartment(
  data: CreateDepartmentInput
): Promise<Department> {
  try {
    // Validate input
    if (!data.name || !data.code || !data.parentCollegeId) {
      throw new Error('Department name, code, and parent college are required');
    }

    const trimmedCode = data.code.trim().toUpperCase();
    const trimmedName = data.name.trim();

    if (trimmedCode.length === 0) {
      throw new Error('Department code cannot be empty');
    }

    if (trimmedName.length === 0) {
      throw new Error('Department name cannot be empty');
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Verify parent college exists and is a college (academic, no parentCollegeId)
      const [parentCollege] = await tx
        .select()
        .from(departments)
        .where(eq(departments.id, data.parentCollegeId))
        .limit(1);

      if (!parentCollege) {
        throw new Error(
          `Parent college with ID '${data.parentCollegeId}' not found`
        );
      }

      if (parentCollege.officeType !== 'academic') {
        throw new Error('Parent must be an academic college');
      }

      if (parentCollege.parentCollegeId !== null) {
        throw new Error(
          'Parent is not a college. Departments can only be created under colleges.'
        );
      }

      if (!parentCollege.isActive) {
        throw new Error(
          'Cannot create department under inactive college. Please reactivate the college first.'
        );
      }

      // Check if code already exists
      const existing = await tx
        .select({ id: departments.id })
        .from(departments)
        .where(eq(departments.code, trimmedCode))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(
          `Department code '${trimmedCode}' already exists. Please use a unique code.`
        );
      }

      // Create department
      const [department] = await tx
        .insert(departments)
        .values({
          name: trimmedName,
          code: trimmedCode,
          officeType: 'academic',
          parentId: null, // Departments don't use parentId, only parentCollegeId
          parentCollegeId: data.parentCollegeId,
          isActive: true,
        })
        .returning();

      if (!department) {
        throw new Error('Failed to create department');
      }

      return department;
    });

    return result;
  } catch (error) {
    console.error('[createDepartment] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to create department');
  }
}

/**
 * Create a new administrative office
 *
 * Creates an administrative office with officeType='administrative'.
 * Administrative offices can optionally have a parent office for hierarchical structure
 * (e.g., HR Records Office under HR Office).
 *
 * @param data - Office creation data (name, code, optional parentId)
 * @returns Promise<Department> The newly created administrative office
 * @throws Error if code exists, parent not found, or database operation fails
 *
 * @example
 * // Create top-level administrative office
 * const hrOffice = await createOffice({
 *   name: 'Human Resources Office',
 *   code: 'HRO'
 * });
 *
 * @example
 * // Create sub-office
 * const hrRecords = await createOffice({
 *   name: 'HR Records Office',
 *   code: 'HRO-REC',
 *   parentId: hrOffice.id
 * });
 */
export async function createOffice(
  data: CreateOfficeInput
): Promise<Department> {
  try {
    // Validate input
    if (!data.name || !data.code) {
      throw new Error('Office name and code are required');
    }

    const trimmedCode = data.code.trim().toUpperCase();
    const trimmedName = data.name.trim();

    if (trimmedCode.length === 0) {
      throw new Error('Office code cannot be empty');
    }

    if (trimmedName.length === 0) {
      throw new Error('Office name cannot be empty');
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // If parentId is provided, verify it exists and is administrative
      if (data.parentId) {
        const [parentOffice] = await tx
          .select()
          .from(departments)
          .where(eq(departments.id, data.parentId))
          .limit(1);

        if (!parentOffice) {
          throw new Error(`Parent office with ID '${data.parentId}' not found`);
        }

        if (parentOffice.officeType !== 'administrative') {
          throw new Error('Parent must be an administrative office');
        }

        if (!parentOffice.isActive) {
          throw new Error(
            'Cannot create office under inactive parent. Please reactivate the parent office first.'
          );
        }
      }

      // Check if code already exists
      const existing = await tx
        .select({ id: departments.id })
        .from(departments)
        .where(eq(departments.code, trimmedCode))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(
          `Office code '${trimmedCode}' already exists. Please use a unique code.`
        );
      }

      // Create administrative office
      const [office] = await tx
        .insert(departments)
        .values({
          name: trimmedName,
          code: trimmedCode,
          officeType: 'administrative',
          parentId: data.parentId || null,
          parentCollegeId: null, // Administrative offices don't have college parents
          isActive: true,
        })
        .returning();

      if (!office) {
        throw new Error('Failed to create administrative office');
      }

      return office;
    });

    return result;
  } catch (error) {
    console.error('[createOffice] Database error:', error);
    throw error instanceof Error ? error : new Error('Failed to create office');
  }
}

/**
 * Update an existing department
 *
 * Updates department fields with validation. Supports updating:
 * - Basic info (name, code)
 * - Hierarchy (parentId, parentCollegeId)
 * - Office type (academic/administrative)
 * - Active status
 *
 * Validates code uniqueness if changed and prevents circular references
 * in the hierarchy.
 *
 * @param id - Department UUID to update
 * @param data - Fields to update (all optional)
 * @returns Promise<Department> The updated department
 * @throws Error if department not found, validation fails, or database operation fails
 *
 * @example
 * const updated = await updateDepartment('550e8400-e29b-41d4-a716-446655440000', {
 *   name: 'Computer Science and IT Department',
 *   code: 'CSIT'
 * });
 */
export async function updateDepartment(
  id: string,
  data: UpdateDepartmentInput
): Promise<Department> {
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Valid department ID is required');
    }

    if (Object.keys(data).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Verify department exists
      const [existing] = await tx
        .select()
        .from(departments)
        .where(eq(departments.id, id))
        .limit(1);

      if (!existing) {
        throw new Error(`Department with ID '${id}' not found`);
      }

      // Validate code uniqueness if code is being changed
      if (data.code && data.code.trim().toUpperCase() !== existing.code) {
        const trimmedCode = data.code.trim().toUpperCase();

        if (trimmedCode.length === 0) {
          throw new Error('Department code cannot be empty');
        }

        const codeExists = await tx
          .select({ id: departments.id })
          .from(departments)
          .where(and(eq(departments.code, trimmedCode), ne(departments.id, id)))
          .limit(1);

        if (codeExists.length > 0) {
          throw new Error(
            `Department code '${trimmedCode}' already exists. Please use a unique code.`
          );
        }
      }

      // Validate name if being changed
      if (data.name !== undefined && data.name.trim().length === 0) {
        throw new Error('Department name cannot be empty');
      }

      // Prevent circular references if parentId is being changed
      if (data.parentId !== undefined && data.parentId !== null) {
        // Check if new parent exists
        const [newParent] = await tx
          .select()
          .from(departments)
          .where(eq(departments.id, data.parentId))
          .limit(1);

        if (!newParent) {
          throw new Error(`Parent department with ID '${data.parentId}' not found`);
        }

        if (!newParent.isActive) {
          throw new Error(
            'Cannot set inactive department as parent. Please reactivate the parent first.'
          );
        }

        // Prevent setting self as parent
        if (data.parentId === id) {
          throw new Error('A department cannot be its own parent');
        }

        // Check for circular reference (prevent A -> B -> A scenarios)
        // Walk up the parent chain to ensure we don't encounter the current department
        let currentParentId: string | null = data.parentId;
        const visited = new Set<string>([id]);
        let depth = 0;
        const maxDepth = 10; // Prevent infinite loops

        while (currentParentId && depth < maxDepth) {
          if (visited.has(currentParentId)) {
            throw new Error(
              'Circular reference detected. This change would create a loop in the department hierarchy.'
            );
          }

          visited.add(currentParentId);

          const [parent] = await tx
            .select({
              parentId: departments.parentId,
              parentCollegeId: departments.parentCollegeId
            })
            .from(departments)
            .where(eq(departments.id, currentParentId))
            .limit(1);

          currentParentId = parent?.parentId || null;
          depth++;
        }

        if (depth >= maxDepth) {
          throw new Error(
            'Department hierarchy is too deep. Maximum depth is 10 levels.'
          );
        }
      }

      // Prevent circular references if parentCollegeId is being changed
      if (data.parentCollegeId !== undefined && data.parentCollegeId !== null) {
        // Prevent setting self as parent college
        if (data.parentCollegeId === id) {
          throw new Error('A department cannot reference itself as parent college');
        }

        // Check for circular reference via parentCollegeId chain
        let currentCollegeId: string | null = data.parentCollegeId;
        const visitedColleges = new Set<string>([id]);
        let depth = 0;
        const maxDepth = 10;

        while (currentCollegeId && depth < maxDepth) {
          if (visitedColleges.has(currentCollegeId)) {
            throw new Error(
              'Circular reference detected in college hierarchy. This change would create a loop.'
            );
          }

          visitedColleges.add(currentCollegeId);

          const [college] = await tx
            .select({
              parentId: departments.parentId,
              parentCollegeId: departments.parentCollegeId
            })
            .from(departments)
            .where(eq(departments.id, currentCollegeId))
            .limit(1);

          currentCollegeId = college?.parentCollegeId || null;
          depth++;
        }

        if (depth >= maxDepth) {
          throw new Error(
            'College hierarchy is too deep. Maximum depth is 10 levels.'
          );
        }
      }

      // Validate parentCollegeId if being changed
      if (data.parentCollegeId !== undefined && data.parentCollegeId !== null) {
        const [college] = await tx
          .select()
          .from(departments)
          .where(eq(departments.id, data.parentCollegeId))
          .limit(1);

        if (!college) {
          throw new Error(
            `Parent college with ID '${data.parentCollegeId}' not found`
          );
        }

        if (college.officeType !== 'academic' || college.parentCollegeId !== null) {
          throw new Error(
            'Parent college must be a top-level academic unit (college)'
          );
        }

        if (!college.isActive) {
          throw new Error(
            'Cannot set inactive college as parent. Please reactivate the college first.'
          );
        }
      }

      // Validate officeType change
      if (data.officeType && data.officeType !== existing.officeType) {
        // Check if department has children in BOTH parentId and parentCollegeId
        // Children could be in either field depending on office type
        const childrenByParentId = await tx
          .select({ count: count() })
          .from(departments)
          .where(eq(departments.parentId, id));

        const childrenByCollegeId = await tx
          .select({ count: count() })
          .from(departments)
          .where(eq(departments.parentCollegeId, id));

        const totalChildren = (childrenByParentId[0]?.count || 0) + (childrenByCollegeId[0]?.count || 0);

        if (totalChildren > 0) {
          throw new Error(
            `Cannot change office type because this department has ${totalChildren} child department(s). Remove or reassign children first.`
          );
        }
      }

      // Build update object with trimmed values
      const updateData: Partial<NewDepartment> = {};

      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }

      if (data.code !== undefined) {
        updateData.code = data.code.trim().toUpperCase();
      }

      if (data.parentId !== undefined) {
        updateData.parentId = data.parentId;
      }

      if (data.parentCollegeId !== undefined) {
        updateData.parentCollegeId = data.parentCollegeId;
      }

      if (data.officeType !== undefined) {
        updateData.officeType = data.officeType;
      }

      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      // Perform update
      const [updated] = await tx
        .update(departments)
        .set(updateData)
        .where(eq(departments.id, id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update department');
      }

      return updated;
    });

    return result;
  } catch (error) {
    console.error('[updateDepartment] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to update department');
  }
}

/**
 * Soft delete a department (set isActive to false)
 *
 * Performs a safe deletion by setting isActive=false instead of removing the record.
 * This preserves referential integrity and historical data.
 *
 * Validates that:
 * - No active employees are assigned to the department
 * - No active positions exist in the department
 *
 * Child departments are not automatically deleted; they must be handled separately.
 *
 * @param id - Department UUID to soft delete
 * @returns Promise<void>
 * @throws Error if department has active employees/positions or database operation fails
 *
 * @example
 * try {
 *   await softDeleteDepartment('550e8400-e29b-41d4-a716-446655440000');
 *   console.log('Department deactivated successfully');
 * } catch (error) {
 *   console.error('Cannot delete department:', error.message);
 * }
 */
export async function softDeleteDepartment(id: string): Promise<void> {
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Valid department ID is required');
    }

    // Use transaction for atomic operation
    await db.transaction(async (tx) => {
      // Verify department exists
      const [existing] = await tx
        .select()
        .from(departments)
        .where(eq(departments.id, id))
        .limit(1);

      if (!existing) {
        throw new Error(`Department with ID '${id}' not found`);
      }

      if (!existing.isActive) {
        throw new Error(
          'Department is already inactive. Use reactivateDepartment to restore it.'
        );
      }

      // Check for active employees
      const activeEmployeesCount = await tx
        .select({ count: count() })
        .from(profiles)
        .where(
          and(
            eq(profiles.departmentId, id),
            eq(profiles.isActive, true),
            eq(profiles.userType, 'employee')
          )
        );

      if (activeEmployeesCount[0]?.count > 0) {
        throw new Error(
          `Cannot deactivate department. There are ${activeEmployeesCount[0].count} active employee(s) assigned. Please reassign employees first.`
        );
      }

      // Check for active positions
      const activePositionsCount = await tx
        .select({ count: count() })
        .from(positions)
        .where(
          and(eq(positions.departmentId, id), eq(positions.isActive, true))
        );

      if (activePositionsCount[0]?.count > 0) {
        throw new Error(
          `Cannot deactivate department. There are ${activePositionsCount[0].count} active position(s). Please deactivate positions first.`
        );
      }

      // Soft delete by setting isActive to false
      await tx
        .update(departments)
        .set({ isActive: false })
        .where(eq(departments.id, id));
    });
  } catch (error) {
    console.error('[softDeleteDepartment] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to soft delete department');
  }
}

/**
 * Permanently delete a department (hard delete)
 *
 * CAUTION: This is a permanent, irreversible operation. Use only when absolutely necessary.
 * Typically used for cleaning up test data or removing departments created by mistake.
 *
 * Validates that:
 * - No employees are assigned (active or inactive)
 * - No positions exist (active or inactive)
 * - No child departments exist
 * - No PDS submissions reference this department
 * - No SALN submissions reference this department
 *
 * This function should be restricted to admin-only operations in production.
 *
 * @param id - Department UUID to permanently delete
 * @returns Promise<void>
 * @throws Error if department has any references or database operation fails
 *
 * @example
 * // Admin-only operation
 * try {
 *   await hardDeleteDepartment('550e8400-e29b-41d4-a716-446655440000');
 *   console.log('Department permanently deleted');
 * } catch (error) {
 *   console.error('Cannot delete department:', error.message);
 * }
 */
export async function hardDeleteDepartment(id: string): Promise<void> {
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Valid department ID is required');
    }

    // Use transaction for atomic operation
    await db.transaction(async (tx) => {
      // Verify department exists
      const [existing] = await tx
        .select()
        .from(departments)
        .where(eq(departments.id, id))
        .limit(1);

      if (!existing) {
        throw new Error(`Department with ID '${id}' not found`);
      }

      // Check for ANY employees (active or inactive)
      const employeesCount = await tx
        .select({ count: count() })
        .from(profiles)
        .where(eq(profiles.departmentId, id));

      if (employeesCount[0]?.count > 0) {
        throw new Error(
          `Cannot permanently delete department. There are ${employeesCount[0].count} employee record(s) referencing this department. Please reassign all employees first.`
        );
      }

      // Check for ANY positions (active or inactive)
      const positionsCount = await tx
        .select({ count: count() })
        .from(positions)
        .where(eq(positions.departmentId, id));

      if (positionsCount[0]?.count > 0) {
        throw new Error(
          `Cannot permanently delete department. There are ${positionsCount[0].count} position record(s) referencing this department. Please delete positions first.`
        );
      }

      // Check for child departments (by parentId)
      const childrenByParentId = await tx
        .select({ count: count() })
        .from(departments)
        .where(eq(departments.parentId, id));

      if (childrenByParentId[0]?.count > 0) {
        throw new Error(
          `Cannot permanently delete department. There are ${childrenByParentId[0].count} child department(s) with this as parentId. Please delete or reassign children first.`
        );
      }

      // Check for child departments (by parentCollegeId)
      const childrenByCollegeId = await tx
        .select({ count: count() })
        .from(departments)
        .where(eq(departments.parentCollegeId, id));

      if (childrenByCollegeId[0]?.count > 0) {
        throw new Error(
          `Cannot permanently delete college. There are ${childrenByCollegeId[0].count} department(s) under this college. Please delete or reassign departments first.`
        );
      }

      // Permanently delete the department
      // Note: If there are other tables with foreign key references to departments,
      // add checks here before deletion or ensure CASCADE is properly configured
      await tx.delete(departments).where(eq(departments.id, id));
    });
  } catch (error) {
    console.error('[hardDeleteDepartment] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to hard delete department');
  }
}

/**
 * Reactivate a soft-deleted department
 *
 * Sets isActive=true on a previously soft-deleted department, restoring it to active status.
 * The department can then be used for employee assignments and position creation.
 *
 * Validates that the parent (if any) is also active before reactivation.
 *
 * @param id - Department UUID to reactivate
 * @returns Promise<Department> The reactivated department
 * @throws Error if department not found, already active, or parent is inactive
 *
 * @example
 * const reactivated = await reactivateDepartment('550e8400-e29b-41d4-a716-446655440000');
 * console.log(`Department ${reactivated.name} is now active`);
 */
export async function reactivateDepartment(id: string): Promise<Department> {
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Valid department ID is required');
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Verify department exists
      const [existing] = await tx
        .select()
        .from(departments)
        .where(eq(departments.id, id))
        .limit(1);

      if (!existing) {
        throw new Error(`Department with ID '${id}' not found`);
      }

      if (existing.isActive) {
        throw new Error('Department is already active');
      }

      // If department has a parent (via parentId), verify parent exists and is active
      if (existing.parentId) {
        const [parent] = await tx
          .select({ isActive: departments.isActive })
          .from(departments)
          .where(eq(departments.id, existing.parentId))
          .limit(1);

        if (!parent) {
          throw new Error(
            `Parent office with ID '${existing.parentId}' not found. Cannot reactivate department with missing parent.`
          );
        }

        if (!parent.isActive) {
          throw new Error(
            'Cannot reactivate department. Parent office is inactive. Please reactivate parent first.'
          );
        }
      }

      // If department has a parent college, verify parent college exists and is active
      if (existing.parentCollegeId) {
        const [parentCollege] = await tx
          .select({ isActive: departments.isActive })
          .from(departments)
          .where(eq(departments.id, existing.parentCollegeId))
          .limit(1);

        if (!parentCollege) {
          throw new Error(
            `Parent college with ID '${existing.parentCollegeId}' not found. Cannot reactivate department with missing parent college.`
          );
        }

        if (!parentCollege.isActive) {
          throw new Error(
            'Cannot reactivate department. Parent college is inactive. Please reactivate college first.'
          );
        }
      }

      // Reactivate department
      const [reactivated] = await tx
        .update(departments)
        .set({ isActive: true })
        .where(eq(departments.id, id))
        .returning();

      if (!reactivated) {
        throw new Error('Failed to reactivate department');
      }

      return reactivated;
    });

    return result;
  } catch (error) {
    console.error('[reactivateDepartment] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to reactivate department');
  }
}

/**
 * Check if a department code is unique
 *
 * Validates that a department code is not already in use, optionally excluding
 * a specific department (useful for update operations).
 *
 * This is a helper function for validation in forms and other mutations.
 *
 * @param code - Department code to check
 * @param excludeId - Optional department ID to exclude from the check (for updates)
 * @returns Promise<boolean> True if code is unique (available), false if already exists
 * @throws Error if database query fails
 *
 * @example
 * // Check if code is available for new department
 * const isAvailable = await isDepartmentCodeUnique('BSCS');
 * if (!isAvailable) {
 *   console.log('Code already in use');
 * }
 *
 * @example
 * // Check if code is available for update (excluding current department)
 * const isAvailable = await isDepartmentCodeUnique(
 *   'CSIT',
 *   '550e8400-e29b-41d4-a716-446655440000'
 * );
 */
export async function isDepartmentCodeUnique(
  code: string,
  excludeId?: string
): Promise<boolean> {
  try {
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      throw new Error('Valid department code is required');
    }

    const trimmedCode = code.trim().toUpperCase();

    // Build where clause conditionally
    const whereClause = excludeId
      ? and(eq(departments.code, trimmedCode), ne(departments.id, excludeId))
      : eq(departments.code, trimmedCode);

    const [result] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(whereClause)
      .limit(1);

    // Return true if code is unique (no result found)
    return !result;
  } catch (error) {
    console.error('[isDepartmentCodeUnique] Database error:', error);
    throw new Error(
      `Failed to check department code uniqueness: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Reassignment result for audit logging
 */
export interface ReassignmentResult {
  reassignedCount: number;
  fromDeptId: string;
  toDeptId: string;
  fromDeptName?: string;
  toDeptName?: string;
}

/**
 * Combined reassignment and deletion result
 */
export interface ReassignAndDeleteResult {
  employeesReassigned: number;
  positionsReassigned: number;
  deleted: true;
  fromDeptId: string;
  toDeptId: string;
}

/**
 * Options for reassignAndDelete operation
 */
export interface ReassignAndDeleteOptions {
  reassignEmployees?: boolean;
  reassignPositions?: boolean;
}

/**
 * Reassign employees from one department to another
 *
 * Moves employee records from source department to target department.
 * Can reassign all employees or only specific ones.
 *
 * Validates that:
 * - Both departments exist
 * - Target department is active
 * - At least one employee to reassign
 *
 * This operation is typically used before soft-deleting a department to ensure
 * no active employees are left without a department assignment.
 *
 * @param fromDeptId - Source department UUID
 * @param toDeptId - Target department UUID
 * @param employeeIds - Optional array of specific employee UUIDs to reassign (if empty, reassigns all)
 * @returns Promise<ReassignmentResult> Count and details of reassigned employees
 * @throws Error if departments don't exist, target is inactive, or database operation fails
 *
 * @example
 * // Reassign all employees
 * const result = await reassignEmployees(
 *   'old-dept-id',
 *   'new-dept-id'
 * );
 * console.log(`Reassigned ${result.reassignedCount} employees`);
 *
 * @example
 * // Reassign specific employees
 * const result = await reassignEmployees(
 *   'old-dept-id',
 *   'new-dept-id',
 *   ['employee-1-id', 'employee-2-id']
 * );
 */
export async function reassignEmployees(
  fromDeptId: string,
  toDeptId: string,
  employeeIds?: string[]
): Promise<ReassignmentResult> {
  try {
    // Validate input
    if (!fromDeptId || typeof fromDeptId !== 'string') {
      throw new Error('Valid source department ID is required');
    }

    if (!toDeptId || typeof toDeptId !== 'string') {
      throw new Error('Valid target department ID is required');
    }

    if (fromDeptId === toDeptId) {
      throw new Error('Source and target departments must be different');
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Verify source department exists
      const [fromDept] = await tx
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(eq(departments.id, fromDeptId))
        .limit(1);

      if (!fromDept) {
        throw new Error(
          `Source department with ID '${fromDeptId}' not found`
        );
      }

      // Verify target department exists and is active
      const [toDept] = await tx
        .select({
          id: departments.id,
          name: departments.name,
          isActive: departments.isActive,
        })
        .from(departments)
        .where(eq(departments.id, toDeptId))
        .limit(1);

      if (!toDept) {
        throw new Error(`Target department with ID '${toDeptId}' not found`);
      }

      if (!toDept.isActive) {
        throw new Error(
          'Cannot reassign employees to inactive department. Please reactivate the target department first.'
        );
      }

      // Count employees to be reassigned
      const countWhereClause =
        employeeIds && employeeIds.length > 0
          ? and(
              eq(profiles.departmentId, fromDeptId),
              eq(profiles.userType, 'employee')
            )
          : and(
              eq(profiles.departmentId, fromDeptId),
              eq(profiles.userType, 'employee')
            );

      const employeesCount = await tx
        .select({ count: count() })
        .from(profiles)
        .where(countWhereClause);

      const totalEmployees = employeesCount[0]?.count || 0;

      if (totalEmployees === 0) {
        throw new Error(
          `No employees found in source department to reassign`
        );
      }

      // If specific employee IDs provided, validate they exist and belong to source department
      if (employeeIds && employeeIds.length > 0) {
        const specificEmployees = await tx
          .select({ id: profiles.id, departmentId: profiles.departmentId })
          .from(profiles)
          .where(
            and(
              eq(profiles.departmentId, fromDeptId),
              eq(profiles.userType, 'employee')
            )
          );

        const validIds = new Set(specificEmployees.map((e) => e.id));
        const invalidIds = employeeIds.filter((id) => !validIds.has(id));

        if (invalidIds.length > 0) {
          throw new Error(
            `The following employee IDs are not in the source department: ${invalidIds.join(', ')}`
          );
        }
      }

      // Build update where clause
      const updateWhereClause =
        employeeIds && employeeIds.length > 0
          ? and(
              eq(profiles.departmentId, fromDeptId),
              eq(profiles.userType, 'employee')
            )
          : and(
              eq(profiles.departmentId, fromDeptId),
              eq(profiles.userType, 'employee')
            );

      // Perform reassignment
      await tx
        .update(profiles)
        .set({ departmentId: toDeptId })
        .where(updateWhereClause);

      // Get actual count of reassigned employees
      const reassignedCount =
        employeeIds && employeeIds.length > 0
          ? employeeIds.length
          : totalEmployees;

      return {
        reassignedCount,
        fromDeptId,
        toDeptId,
        fromDeptName: fromDept.name,
        toDeptName: toDept.name,
      };
    });

    return result;
  } catch (error) {
    console.error('[reassignEmployees] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to reassign employees');
  }
}

/**
 * Reassign positions from one department to another
 *
 * Moves position records from source department to target department.
 * Can reassign all positions or only specific ones.
 *
 * Validates that:
 * - Both departments exist
 * - Target department is active
 * - At least one position to reassign
 *
 * This operation is typically used before soft-deleting a department to ensure
 * no active positions are left in the department.
 *
 * @param fromDeptId - Source department UUID
 * @param toDeptId - Target department UUID
 * @param positionIds - Optional array of specific position UUIDs to reassign (if empty, reassigns all)
 * @returns Promise<ReassignmentResult> Count and details of reassigned positions
 * @throws Error if departments don't exist, target is inactive, or database operation fails
 *
 * @example
 * // Reassign all positions
 * const result = await reassignPositions(
 *   'old-dept-id',
 *   'new-dept-id'
 * );
 * console.log(`Reassigned ${result.reassignedCount} positions`);
 *
 * @example
 * // Reassign specific positions
 * const result = await reassignPositions(
 *   'old-dept-id',
 *   'new-dept-id',
 *   ['position-1-id', 'position-2-id']
 * );
 */
export async function reassignPositions(
  fromDeptId: string,
  toDeptId: string,
  positionIds?: string[]
): Promise<ReassignmentResult> {
  try {
    // Validate input
    if (!fromDeptId || typeof fromDeptId !== 'string') {
      throw new Error('Valid source department ID is required');
    }

    if (!toDeptId || typeof toDeptId !== 'string') {
      throw new Error('Valid target department ID is required');
    }

    if (fromDeptId === toDeptId) {
      throw new Error('Source and target departments must be different');
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Verify source department exists
      const [fromDept] = await tx
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(eq(departments.id, fromDeptId))
        .limit(1);

      if (!fromDept) {
        throw new Error(
          `Source department with ID '${fromDeptId}' not found`
        );
      }

      // Verify target department exists and is active
      const [toDept] = await tx
        .select({
          id: departments.id,
          name: departments.name,
          isActive: departments.isActive,
        })
        .from(departments)
        .where(eq(departments.id, toDeptId))
        .limit(1);

      if (!toDept) {
        throw new Error(`Target department with ID '${toDeptId}' not found`);
      }

      if (!toDept.isActive) {
        throw new Error(
          'Cannot reassign positions to inactive department. Please reactivate the target department first.'
        );
      }

      // Count positions to be reassigned
      const countWhereClause =
        positionIds && positionIds.length > 0
          ? and(
              eq(positions.departmentId, fromDeptId),
              eq(positions.isActive, true)
            )
          : and(
              eq(positions.departmentId, fromDeptId),
              eq(positions.isActive, true)
            );

      const positionsCount = await tx
        .select({ count: count() })
        .from(positions)
        .where(countWhereClause);

      const totalPositions = positionsCount[0]?.count || 0;

      if (totalPositions === 0) {
        throw new Error(
          `No active positions found in source department to reassign`
        );
      }

      // If specific position IDs provided, validate they exist and belong to source department
      if (positionIds && positionIds.length > 0) {
        const specificPositions = await tx
          .select({ id: positions.id, departmentId: positions.departmentId })
          .from(positions)
          .where(
            and(
              eq(positions.departmentId, fromDeptId),
              eq(positions.isActive, true)
            )
          );

        const validIds = new Set(specificPositions.map((p) => p.id));
        const invalidIds = positionIds.filter((id) => !validIds.has(id));

        if (invalidIds.length > 0) {
          throw new Error(
            `The following position IDs are not active in the source department: ${invalidIds.join(', ')}`
          );
        }
      }

      // Build update where clause
      const updateWhereClause =
        positionIds && positionIds.length > 0
          ? and(
              eq(positions.departmentId, fromDeptId),
              eq(positions.isActive, true)
            )
          : and(
              eq(positions.departmentId, fromDeptId),
              eq(positions.isActive, true)
            );

      // Perform reassignment
      await tx
        .update(positions)
        .set({ departmentId: toDeptId })
        .where(updateWhereClause);

      // Get actual count of reassigned positions
      const reassignedCount =
        positionIds && positionIds.length > 0
          ? positionIds.length
          : totalPositions;

      return {
        reassignedCount,
        fromDeptId,
        toDeptId,
        fromDeptName: fromDept.name,
        toDeptName: toDept.name,
      };
    });

    return result;
  } catch (error) {
    console.error('[reassignPositions] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to reassign positions');
  }
}

/**
 * Combined atomic operation: reassign employees/positions and soft-delete department
 *
 * Performs a complete department closure workflow in a single transaction:
 * 1. Optionally reassign all employees to target department
 * 2. Optionally reassign all positions to target department
 * 3. Soft-delete the source department
 *
 * This ensures atomicity - either all operations succeed or all fail, preventing
 * partial states where a department is deleted but employees/positions remain.
 *
 * Validates that:
 * - Both departments exist
 * - Target department is active
 * - Source department can be soft-deleted after reassignments
 *
 * @param deptId - Department UUID to close (soft delete)
 * @param targetDeptId - Target department UUID for reassignments
 * @param options - Reassignment options (defaults: both true)
 * @returns Promise<ReassignAndDeleteResult> Summary of reassignments and deletion
 * @throws Error if any operation fails (transaction rolls back)
 *
 * @example
 * // Reassign everything and delete
 * const result = await reassignAndDelete(
 *   'dept-to-close-id',
 *   'target-dept-id'
 * );
 * console.log(`Reassigned ${result.employeesReassigned} employees, ${result.positionsReassigned} positions`);
 *
 * @example
 * // Only reassign employees before deletion
 * const result = await reassignAndDelete(
 *   'dept-to-close-id',
 *   'target-dept-id',
 *   { reassignEmployees: true, reassignPositions: false }
 * );
 */
export async function reassignAndDelete(
  deptId: string,
  targetDeptId: string,
  options: ReassignAndDeleteOptions = {
    reassignEmployees: true,
    reassignPositions: true,
  }
): Promise<ReassignAndDeleteResult> {
  try {
    // Validate input
    if (!deptId || typeof deptId !== 'string') {
      throw new Error('Valid department ID is required');
    }

    if (!targetDeptId || typeof targetDeptId !== 'string') {
      throw new Error('Valid target department ID is required');
    }

    if (deptId === targetDeptId) {
      throw new Error('Source and target departments must be different');
    }

    // Use transaction for atomic operation
    const result = await db.transaction(async (tx) => {
      // Verify both departments exist
      const [sourceDept] = await tx
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(eq(departments.id, deptId))
        .limit(1);

      if (!sourceDept) {
        throw new Error(`Department with ID '${deptId}' not found`);
      }

      const [targetDept] = await tx
        .select({
          id: departments.id,
          name: departments.name,
          isActive: departments.isActive,
        })
        .from(departments)
        .where(eq(departments.id, targetDeptId))
        .limit(1);

      if (!targetDept) {
        throw new Error(
          `Target department with ID '${targetDeptId}' not found`
        );
      }

      if (!targetDept.isActive) {
        throw new Error(
          'Cannot reassign to inactive department. Please reactivate the target department first.'
        );
      }

      let employeesReassigned = 0;
      let positionsReassigned = 0;

      // Reassign employees if requested
      if (options.reassignEmployees) {
        // Count employees in source department
        const employeesCount = await tx
          .select({ count: count() })
          .from(profiles)
          .where(
            and(
              eq(profiles.departmentId, deptId),
              eq(profiles.userType, 'employee')
            )
          );

        const totalEmployees = employeesCount[0]?.count || 0;

        if (totalEmployees > 0) {
          // Reassign all employees
          await tx
            .update(profiles)
            .set({ departmentId: targetDeptId })
            .where(
              and(
                eq(profiles.departmentId, deptId),
                eq(profiles.userType, 'employee')
              )
            );

          employeesReassigned = totalEmployees;
        }
      }

      // Reassign positions if requested
      if (options.reassignPositions) {
        // Count active positions in source department
        const positionsCount = await tx
          .select({ count: count() })
          .from(positions)
          .where(
            and(
              eq(positions.departmentId, deptId),
              eq(positions.isActive, true)
            )
          );

        const totalPositions = positionsCount[0]?.count || 0;

        if (totalPositions > 0) {
          // Reassign all active positions
          await tx
            .update(positions)
            .set({ departmentId: targetDeptId })
            .where(
              and(
                eq(positions.departmentId, deptId),
                eq(positions.isActive, true)
              )
            );

          positionsReassigned = totalPositions;
        }
      }

      // Verify no active employees or positions remain (if reassignment options were false)
      if (!options.reassignEmployees) {
        const remainingEmployees = await tx
          .select({ count: count() })
          .from(profiles)
          .where(
            and(
              eq(profiles.departmentId, deptId),
              eq(profiles.isActive, true)
            )
          );

        if (remainingEmployees[0]?.count > 0) {
          throw new Error(
            `Cannot delete department. There are ${remainingEmployees[0].count} active employee(s) remaining. Set reassignEmployees: true to reassign them.`
          );
        }
      }

      if (!options.reassignPositions) {
        const remainingPositions = await tx
          .select({ count: count() })
          .from(positions)
          .where(
            and(
              eq(positions.departmentId, deptId),
              eq(positions.isActive, true)
            )
          );

        if (remainingPositions[0]?.count > 0) {
          throw new Error(
            `Cannot delete department. There are ${remainingPositions[0].count} active position(s) remaining. Set reassignPositions: true to reassign them.`
          );
        }
      }

      // Soft delete the department
      await tx
        .update(departments)
        .set({ isActive: false })
        .where(eq(departments.id, deptId));

      return {
        employeesReassigned,
        positionsReassigned,
        deleted: true as const,
        fromDeptId: deptId,
        toDeptId: targetDeptId,
      };
    });

    return result;
  } catch (error) {
    console.error('[reassignAndDelete] Database error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to reassign and delete department');
  }
}
