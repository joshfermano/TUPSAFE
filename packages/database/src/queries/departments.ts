/**
 * Department and Organization Queries
 *
 * Production-ready Drizzle ORM queries for retrieving college, department,
 * and position data with proper indexing, error handling, and TypeScript typing.
 *
 * @module queries/departments
 */

import { db } from '../db';
import { departments, positions, profiles } from '../schema';
import { eq, and, isNull, sql, ilike, or } from 'drizzle-orm';
import type { Department, Position } from '../types';

/**
 * Extended department type with nested departments for hierarchy views
 */
export type DepartmentWithChildren = Department & {
  departments: Department[];
};

/**
 * Department detail type with related information
 */
export type DepartmentDetail = {
  department: Department;
  parentCollege: Department | null;
  positionsCount: number;
  employeesCount: number;
};

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Get all colleges (departments with officeType='academic' and no parentCollegeId)
 *
 * Colleges are top-level academic units (e.g., College of Engineering, College of Science).
 * This query is optimized using the composite index: departments_office_type_is_active_idx
 *
 * @returns Promise<Department[]> Array of active college departments
 * @throws Error if database query fails
 *
 * @example
 * const colleges = await getAllColleges();
 * console.log(`Found ${colleges.length} colleges`);
 */
export async function getAllColleges(): Promise<Department[]> {
  try {
    const colleges = await db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.officeType, 'academic'),
          isNull(departments.parentCollegeId),
          eq(departments.isActive, true)
        )
      )
      .orderBy(departments.name);

    return colleges;
  } catch (error) {
    console.error('[getAllColleges] Database error:', error);
    throw new Error('Failed to fetch colleges from database');
  }
}

/**
 * Get all departments under a specific college
 *
 * Retrieves department-level units within a college (e.g., Computer Science,
 * Information Technology under College of Science).
 * Uses index: departments_parent_college_id_idx
 *
 * @param collegeId - UUID of the parent college
 * @returns Promise<Department[]> Array of departments in the college
 * @throws Error if collegeId is invalid or database query fails
 *
 * @example
 * const depts = await getDepartmentsByCollege('550e8400-e29b-41d4-a716-446655440000');
 * console.log(`College has ${depts.length} departments`);
 */
export async function getDepartmentsByCollege(
  collegeId: string
): Promise<Department[]> {
  try {
    if (!collegeId || typeof collegeId !== 'string') {
      throw new Error('Valid college ID is required');
    }

    const depts = await db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.parentCollegeId, collegeId),
          eq(departments.isActive, true)
        )
      )
      .orderBy(departments.name);

    return depts;
  } catch (error) {
    console.error('[getDepartmentsByCollege] Database error:', error);
    throw new Error(
      `Failed to fetch departments for college ${collegeId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all administrative offices
 *
 * Retrieves non-academic departments (e.g., HR Office, Finance Office, Registrar).
 * Uses composite index: departments_office_type_is_active_idx
 *
 * @param options - Optional pagination parameters
 * @returns Promise<Department[]> Array of administrative office departments
 * @throws Error if database query fails
 *
 * @example
 * const offices = await getAdministrativeOffices({ limit: 20 });
 * console.log(`Found ${offices.length} administrative offices`);
 */
export async function getAdministrativeOffices(
  options?: PaginationOptions
): Promise<Department[]> {
  try {
    const baseQuery = db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.officeType, 'administrative'),
          eq(departments.isActive, true)
        )
      )
      .orderBy(departments.name);

    // Build final query with limit/offset if provided
    const query = options?.offset
      ? options?.limit
        ? baseQuery.limit(options.limit).offset(options.offset)
        : baseQuery.offset(options.offset)
      : options?.limit
        ? baseQuery.limit(options.limit)
        : baseQuery;

    const offices = await query;
    return offices;
  } catch (error) {
    console.error('[getAdministrativeOffices] Database error:', error);
    throw new Error('Failed to fetch administrative offices from database');
  }
}

/**
 * Get department by ID with comprehensive related information
 *
 * Retrieves a single department along with:
 * - Parent college (if applicable)
 * - Count of active positions
 * - Count of active employees
 *
 * This function uses multiple optimized queries with proper indexing to minimize
 * database round trips while maintaining query performance.
 *
 * @param id - Department UUID
 * @returns Promise<DepartmentDetail | null> Department with relations or null if not found
 * @throws Error if id is invalid or database query fails
 *
 * @example
 * const detail = await getDepartmentById('550e8400-e29b-41d4-a716-446655440000');
 * if (detail) {
 *   console.log(`${detail.department.name} has ${detail.employeesCount} employees`);
 * }
 */
export async function getDepartmentById(
  id: string
): Promise<DepartmentDetail | null> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid department ID is required');
    }

    // Fetch department (uses primary key index)
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!department) {
      return null;
    }

    // Fetch parent college if exists (uses primary key index)
    let parentCollege: Department | null = null;
    if (department.parentCollegeId) {
      const [college] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, department.parentCollegeId))
        .limit(1);
      parentCollege = college || null;
    }

    // Count active positions (uses positions_department_id_idx and positions_is_active_idx)
    const positionsCountResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(positions)
      .where(
        and(eq(positions.departmentId, id), eq(positions.isActive, true))
      );
    const positionsCount = positionsCountResult[0]?.count ?? 0;

    // Count active employees (uses profiles_department_id_idx and profiles_is_active_idx)
    const employeesCountResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(profiles)
      .where(and(eq(profiles.departmentId, id), eq(profiles.isActive, true)));
    const employeesCount = employeesCountResult[0]?.count ?? 0;

    return {
      department,
      parentCollege,
      positionsCount,
      employeesCount,
    };
  } catch (error) {
    console.error('[getDepartmentById] Database error:', error);
    throw new Error(
      `Failed to fetch department ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all active positions within a department
 *
 * Retrieves position records for a specific department, useful for:
 * - Displaying available positions
 * - Employee assignment workflows
 * - Organizational structure views
 *
 * Uses index: positions_department_id_idx
 *
 * @param departmentId - Department UUID
 * @param options - Optional pagination parameters
 * @returns Promise<Position[]> Array of positions in the department
 * @throws Error if departmentId is invalid or database query fails
 *
 * @example
 * const positions = await getPositionsByDepartment(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   { limit: 50 }
 * );
 */
export async function getPositionsByDepartment(
  departmentId: string,
  options?: PaginationOptions
): Promise<Position[]> {
  try {
    if (!departmentId || typeof departmentId !== 'string') {
      throw new Error('Valid department ID is required');
    }

    const baseQuery = db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.departmentId, departmentId),
          eq(positions.isActive, true)
        )
      )
      .orderBy(positions.title);

    // Build final query with limit/offset if provided
    const query = options?.offset
      ? options?.limit
        ? baseQuery.limit(options.limit).offset(options.offset)
        : baseQuery.offset(options.offset)
      : options?.limit
        ? baseQuery.limit(options.limit)
        : baseQuery;

    const positionsList = await query;
    return positionsList;
  } catch (error) {
    console.error('[getPositionsByDepartment] Database error:', error);
    throw new Error(
      `Failed to fetch positions for department ${departmentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get complete department hierarchy (colleges with nested departments)
 *
 * Returns the full organizational structure with colleges as top-level nodes
 * and their departments as children. This is useful for:
 * - Organizational charts
 * - Navigation menus
 * - Department selection dropdowns with grouping
 *
 * Performance: Uses Promise.all for parallel fetching of department children,
 * reducing total query time compared to sequential fetching.
 *
 * @returns Promise<DepartmentWithChildren[]> Colleges with nested departments
 * @throws Error if database query fails
 *
 * @example
 * const hierarchy = await getDepartmentHierarchy();
 * hierarchy.forEach(college => {
 *   console.log(`${college.name}: ${college.departments.length} departments`);
 * });
 */
export async function getDepartmentHierarchy(): Promise<
  DepartmentWithChildren[]
> {
  try {
    // Fetch all colleges
    const colleges = await getAllColleges();

    // Fetch departments for each college in parallel
    const hierarchy = await Promise.all(
      colleges.map(async (college) => {
        const depts = await getDepartmentsByCollege(college.id);
        return {
          ...college,
          departments: depts,
        };
      })
    );

    return hierarchy;
  } catch (error) {
    console.error('[getDepartmentHierarchy] Database error:', error);
    throw new Error('Failed to fetch department hierarchy from database');
  }
}

/**
 * Search departments by name or code (case-insensitive)
 *
 * Performs fuzzy search across department names and codes using ILIKE.
 * Results are limited to prevent performance issues with overly broad queries.
 *
 * Search behavior:
 * - Case-insensitive matching
 * - Partial string matching (e.g., "comp" matches "Computer Science")
 * - Searches both name and code fields
 * - Returns only active departments
 *
 * @param query - Search query string (minimum 1 character)
 * @param options - Optional pagination (default limit: 50)
 * @returns Promise<Department[]> Array of matching departments
 * @throws Error if database query fails
 *
 * @example
 * const results = await searchDepartments('computer');
 * // Returns departments like "Computer Science", "Computer Engineering"
 *
 * @example
 * const byCode = await searchDepartments('BSCS');
 * // Returns departments with code containing "BSCS"
 */
export async function searchDepartments(
  query: string,
  options?: PaginationOptions
): Promise<Department[]> {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;
    const limit = options?.limit ?? 50;

    const baseQuery = db
      .select()
      .from(departments)
      .where(
        and(
          or(
            ilike(departments.name, searchTerm),
            ilike(departments.code, searchTerm)
          ),
          eq(departments.isActive, true)
        )
      )
      .orderBy(departments.name);

    // Build final query with limit and optional offset
    const dbQuery = options?.offset
      ? baseQuery.limit(limit).offset(options.offset)
      : baseQuery.limit(limit);

    const results = await dbQuery;
    return results;
  } catch (error) {
    console.error('[searchDepartments] Database error:', error);
    throw new Error(
      `Failed to search departments: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get department statistics
 *
 * Retrieves aggregate statistics for a department including:
 * - Total active positions
 * - Total active employees
 * - Faculty count (if academic)
 * - Staff count (if administrative)
 *
 * This is useful for dashboard displays and reporting.
 *
 * @param departmentId - Department UUID
 * @returns Promise with department statistics
 * @throws Error if departmentId is invalid or database query fails
 *
 * @example
 * const stats = await getDepartmentStatistics('550e8400-e29b-41d4-a716-446655440000');
 * console.log(`Department has ${stats.totalPositions} positions and ${stats.totalEmployees} employees`);
 */
export async function getDepartmentStatistics(departmentId: string): Promise<{
  totalPositions: number;
  totalEmployees: number;
  activeSubmissions: number;
}> {
  try {
    if (!departmentId || typeof departmentId !== 'string') {
      throw new Error('Valid department ID is required');
    }

    // Count positions
    const [positionsResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(positions)
      .where(
        and(eq(positions.departmentId, departmentId), eq(positions.isActive, true))
      );

    // Count employees
    const [employeesResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(profiles)
      .where(
        and(eq(profiles.departmentId, departmentId), eq(profiles.isActive, true))
      );

    return {
      totalPositions: positionsResult?.count ?? 0,
      totalEmployees: employeesResult?.count ?? 0,
      activeSubmissions: 0, // Placeholder for future PDS/SALN submission counts
    };
  } catch (error) {
    console.error('[getDepartmentStatistics] Database error:', error);
    throw new Error(
      `Failed to fetch statistics for department ${departmentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all departments (both academic and administrative)
 *
 * Retrieves all active departments regardless of type.
 * Useful for admin panels and comprehensive department listings.
 *
 * @param options - Optional pagination parameters
 * @returns Promise<Department[]> Array of all active departments
 * @throws Error if database query fails
 *
 * @example
 * const allDepts = await getAllDepartments({ limit: 100, offset: 0 });
 */
export async function getAllDepartments(
  options?: PaginationOptions
): Promise<Department[]> {
  try {
    const baseQuery = db
      .select()
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(departments.name);

    // Build final query with limit/offset if provided
    const query = options?.offset
      ? options?.limit
        ? baseQuery.limit(options.limit).offset(options.offset)
        : baseQuery.offset(options.offset)
      : options?.limit
        ? baseQuery.limit(options.limit)
        : baseQuery;

    const allDepts = await query;
    return allDepts;
  } catch (error) {
    console.error('[getAllDepartments] Database error:', error);
    throw new Error('Failed to fetch all departments from database');
  }
}

/**
 * Check if a department code already exists
 *
 * Validates department code uniqueness before insertion.
 * Uses the unique index: departments_code_unique
 *
 * @param code - Department code to check
 * @returns Promise<boolean> True if code exists, false otherwise
 * @throws Error if database query fails
 *
 * @example
 * const exists = await isDepartmentCodeExists('BSCS');
 * if (exists) {
 *   console.log('Code already in use');
 * }
 */
export async function isDepartmentCodeExists(code: string): Promise<boolean> {
  try {
    if (!code || typeof code !== 'string') {
      throw new Error('Valid department code is required');
    }

    const [result] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.code, code.trim()))
      .limit(1);

    return !!result;
  } catch (error) {
    console.error('[isDepartmentCodeExists] Database error:', error);
    throw new Error(
      `Failed to check department code existence: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
