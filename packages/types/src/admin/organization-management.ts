/**
 * Organization Management API Types and Validation Schemas
 *
 * Provides type-safe validation schemas and response types for managing
 * organizational structure (colleges, departments, offices, positions).
 *
 * @module admin/organization-management
 */

import { z } from 'zod';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Re-exported for convenience
import type { Department, Position } from '@tupsafe/database';
import type {
  DepartmentWithStats,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Re-exported for convenience
  CollegeWithDepartments,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Re-exported for convenience
  HierarchyValidation,
} from '@tupsafe/database/queries';
import type { PaginationMeta } from './common';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Validation schema for creating a new college
 *
 * Colleges are top-level academic units in the organizational hierarchy.
 *
 * @example
 * ```typescript
 * const collegeData = {
 *   name: "College of Engineering",
 *   code: "COE"
 * };
 * const validated = createCollegeSchema.parse(collegeData);
 * ```
 */
export const createCollegeSchema = z.object({
  /**
   * Full name of the college
   * @example "College of Engineering"
   */
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),

  /**
   * Unique code/abbreviation for the college
   * Must contain only uppercase letters, numbers, and hyphens
   * @example "COE", "COS", "CLA"
   */
  code: z
    .string({ required_error: 'Code is required' })
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .trim()
    .transform((val) => val.toUpperCase())
    .pipe(
      z
        .string()
        .regex(
          /^[A-Z0-9-]+$/,
          'Code must use uppercase letters, numbers, and hyphens only'
        )
    ),
});

/**
 * Inferred TypeScript type for college creation input
 */
export type CreateCollegeInput = z.infer<typeof createCollegeSchema>;

/**
 * Validation schema for creating a new department
 *
 * Departments belong to colleges and represent academic or administrative units.
 *
 * @example
 * ```typescript
 * const deptData = {
 *   name: "Computer Engineering Department",
 *   code: "CpE",
 *   parentCollegeId: "123e4567-e89b-12d3-a456-426614174000"
 * };
 * const validated = createDepartmentSchema.parse(deptData);
 * ```
 */
export const createDepartmentSchema = z.object({
  /**
   * Full name of the department
   * @example "Computer Engineering Department"
   */
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),

  /**
   * Unique code/abbreviation for the department
   * Must contain only uppercase letters, numbers, and hyphens
   * @example "CpE", "ECE", "IE"
   */
  code: z
    .string({ required_error: 'Code is required' })
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .trim()
    .transform((val) => val.toUpperCase())
    .pipe(
      z
        .string()
        .regex(
          /^[A-Z0-9-]+$/,
          'Code must use uppercase letters, numbers, and hyphens only'
        )
    ),

  /**
   * UUID of the parent college
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  parentCollegeId: z
    .string({ required_error: 'Parent college ID is required' })
    .uuid('Invalid college ID'),
});

/**
 * Inferred TypeScript type for department creation input
 */
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

/**
 * Validation schema for creating a new office
 *
 * Offices are administrative units that don't belong to colleges.
 *
 * @example
 * ```typescript
 * const officeData = {
 *   name: "Human Resources Office",
 *   code: "HRO"
 * };
 * const validated = createOfficeSchema.parse(officeData);
 * ```
 */
export const createOfficeSchema = z.object({
  /**
   * Full name of the office
   * @example "Human Resources Office"
   */
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),

  /**
   * Unique code/abbreviation for the office
   * Must contain only uppercase letters, numbers, and hyphens
   * @example "HRO", "REGISTRAR", "ACCOUNTING"
   */
  code: z
    .string({ required_error: 'Code is required' })
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .trim()
    .transform((val) => val.toUpperCase())
    .pipe(
      z
        .string()
        .regex(
          /^[A-Z0-9-]+$/,
          'Code must use uppercase letters, numbers, and hyphens only'
        )
    ),
});

/**
 * Inferred TypeScript type for office creation input
 */
export type CreateOfficeInput = z.infer<typeof createOfficeSchema>;

/**
 * Validation schema for updating a department
 *
 * All fields are optional. Only provided fields will be updated.
 * Supports updating colleges, departments, and offices.
 *
 * @example
 * ```typescript
 * const updateData = {
 *   name: "Updated Department Name",
 *   isActive: false
 * };
 * const validated = updateDepartmentSchema.parse(updateData);
 * ```
 */
export const updateDepartmentSchema = z.object({
  /**
   * Updated name for the department/college/office
   */
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),

  /**
   * Updated code/abbreviation
   * Must contain only uppercase letters, numbers, and hyphens
   */
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .trim()
    .transform((val) => val.toUpperCase())
    .pipe(
      z
        .string()
        .regex(
          /^[A-Z0-9-]+$/,
          'Code must use uppercase letters, numbers, and hyphens only'
        )
    )
    .optional(),

  /**
   * Updated parent college ID (for departments)
   * Set to null to remove parent college relationship
   */
  parentCollegeId: z.string().uuid('Invalid college ID').nullable().optional(),

  /**
   * Updated parent ID (for nested departments)
   * Set to null to remove parent relationship
   */
  parentId: z.string().uuid('Invalid parent ID').nullable().optional(),

  /**
   * Whether the department/college/office is active
   * Inactive units are hidden from most views
   */
  isActive: z.boolean().optional(),
});

/**
 * Inferred TypeScript type for department update input
 */
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

/**
 * Validation schema for creating a new position
 *
 * Positions define roles within the organization, optionally tied to departments.
 *
 * @example
 * ```typescript
 * const positionData = {
 *   title: "Associate Professor IV",
 *   gradeLevel: 24,
 *   departmentId: "123e4567-e89b-12d3-a456-426614174000"
 * };
 * const validated = createPositionSchema.parse(positionData);
 * ```
 */
export const createPositionSchema = z.object({
  /**
   * Position title
   * @example "Associate Professor IV", "Administrative Officer III"
   */
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title is required')
    .max(100, 'Title must be at most 100 characters')
    .trim(),

  /**
   * Salary grade level (1-33 for Philippine government positions)
   * @example 24 for Associate Professor IV
   */
  gradeLevel: z
    .number()
    .int('Grade level must be an integer')
    .min(1, 'Grade level must be at least 1')
    .max(33, 'Grade level must be at most 33')
    .optional(),

  /**
   * UUID of the department this position belongs to
   * Optional - positions can exist without department assignment
   */
  departmentId: z.string().uuid('Invalid department ID').optional(),
});

/**
 * Inferred TypeScript type for position creation input
 */
export type CreatePositionInput = z.infer<typeof createPositionSchema>;

/**
 * Validation schema for updating a position
 *
 * All fields are optional. Only provided fields will be updated.
 *
 * @example
 * ```typescript
 * const updateData = {
 *   gradeLevel: 25,
 *   isActive: true
 * };
 * const validated = updatePositionSchema.parse(updateData);
 * ```
 */
export const updatePositionSchema = z.object({
  /**
   * Updated position title
   */
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title must be at most 100 characters')
    .trim()
    .optional(),

  /**
   * Updated salary grade level (1-33)
   */
  gradeLevel: z
    .number()
    .int('Grade level must be an integer')
    .min(1, 'Grade level must be at least 1')
    .max(33, 'Grade level must be at most 33')
    .optional(),

  /**
   * Updated department assignment
   * Set to null to remove department association
   */
  departmentId: z.string().uuid('Invalid department ID').nullable().optional(),

  /**
   * Whether the position is active
   * Inactive positions are hidden from most views
   */
  isActive: z.boolean().optional(),
});

/**
 * Inferred TypeScript type for position update input
 */
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

/**
 * Validation schema for organization listing query parameters
 *
 * Supports filtering, searching, and sorting organizational units.
 *
 * @example
 * ```typescript
 * const query = {
 *   type: 'department',
 *   includeInactive: false,
 *   search: 'Engineering',
 *   sortBy: 'name',
 *   sortOrder: 'asc'
 * };
 * const validated = organizationQuerySchema.parse(query);
 * ```
 */
export const organizationQuerySchema = z.object({
  /**
   * Type of organizational unit to retrieve
   * - 'college': Top-level academic units
   * - 'department': Units belonging to colleges
   * - 'office': Administrative units
   * - 'all': All types
   */
  type: z
    .enum(['college', 'department', 'office', 'all'])
    .default('all')
    .optional(),

  /**
   * Whether to include inactive units in results
   * @default false
   */
  includeInactive: z.coerce.boolean().default(false).optional(),

  /**
   * Search term to filter by name or code
   * Performs case-insensitive partial matching
   */
  search: z.string().max(200).trim().optional(),

  /**
   * Field to sort results by
   * @default 'name'
   */
  sortBy: z.enum(['name', 'code', 'createdAt']).default('name').optional(),

  /**
   * Sort direction
   * @default 'asc'
   */
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

/**
 * Inferred TypeScript type for organization query parameters
 */
export type OrganizationQuery = z.infer<typeof organizationQuerySchema>;

/**
 * Validation schema for position listing query parameters
 *
 * Supports pagination, filtering, searching, and sorting positions.
 *
 * @example
 * ```typescript
 * const query = {
 *   page: 1,
 *   limit: 20,
 *   departmentId: "123e4567-e89b-12d3-a456-426614174000",
 *   search: 'Professor',
 *   sortBy: 'gradeLevel',
 *   sortOrder: 'desc'
 * };
 * const validated = positionQuerySchema.parse(query);
 * ```
 */
export const positionQuerySchema = z.object({
  /**
   * Page number for pagination (1-indexed)
   * @default 1
   */
  page: z.coerce.number().int().min(1).default(1).optional(),

  /**
   * Number of results per page
   * @default 20
   * @max 100
   */
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),

  /**
   * Filter positions by department UUID
   */
  departmentId: z.string().uuid('Invalid department ID').optional(),

  /**
   * Whether to include inactive positions in results
   * @default false
   */
  includeInactive: z.coerce.boolean().default(false).optional(),

  /**
   * Search term to filter by position title
   * Performs case-insensitive partial matching
   */
  search: z.string().max(200).trim().optional(),

  /**
   * Field to sort results by
   * @default 'title'
   */
  sortBy: z
    .enum(['title', 'gradeLevel', 'createdAt'])
    .default('title')
    .optional(),

  /**
   * Sort direction
   * @default 'asc'
   */
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

/**
 * Inferred TypeScript type for position query parameters
 */
export type PositionQuery = z.infer<typeof positionQuerySchema>;

// ============================================================================
// RE-EXPORTS FROM DATABASE PACKAGE
// ============================================================================

/**
 * Re-export base types from database package for convenience
 */
export type { Department, Position } from '@tupsafe/database';
export type {
  DepartmentWithStats,
  CollegeWithDepartments,
  HierarchyValidation,
} from '@tupsafe/database/queries';

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Position with basic department information
 *
 * Extends the base Position type with denormalized department data
 * to avoid additional queries.
 */
export interface PositionWithDepartment extends Position {
  /**
   * Department this position belongs to
   * Null if position has no department assignment
   */
  department: {
    /**
     * Department UUID
     */
    id: string;

    /**
     * Department name
     */
    name: string;

    /**
     * Department code/abbreviation
     */
    code: string;
  } | null;
}

/**
 * Response type for organization listing endpoint
 *
 * Returns all organizational units grouped by type with total count.
 *
 * @example
 * ```typescript
 * {
 *   colleges: [...],
 *   departments: [...],
 *   offices: [...],
 *   total: 42
 * }
 * ```
 */
export interface OrganizationListResponse {
  /**
   * All colleges with their statistics
   */
  colleges: DepartmentWithStats[];

  /**
   * All departments with their statistics
   */
  departments: DepartmentWithStats[];

  /**
   * All administrative offices with their statistics
   */
  offices: DepartmentWithStats[];

  /**
   * Total count of all organizational units
   */
  total: number;
}

/**
 * Response type for paginated position listing endpoint
 *
 * Returns positions with pagination metadata.
 *
 * @example
 * ```typescript
 * {
 *   positions: [...],
 *   pagination: {
 *     total: 150,
 *     page: 1,
 *     pageSize: 20,
 *     totalPages: 8
 *   }
 * }
 * ```
 */
export interface PositionListResponse {
  /**
   * Array of positions with department information
   */
  positions: PositionWithDepartment[];

  /**
   * Pagination metadata
   */
  pagination: PaginationMeta;
}

/**
 * Response type for organization statistics endpoint
 *
 * Provides system-wide organizational statistics.
 *
 * @example
 * ```typescript
 * {
 *   totalColleges: 8,
 *   totalDepartments: 42,
 *   totalOffices: 15,
 *   totalPositions: 350,
 *   totalEmployees: 1200,
 *   activeUnits: 63,
 *   inactiveUnits: 2
 * }
 * ```
 */
export interface OrganizationStatsResponse {
  /**
   * Total number of colleges
   */
  totalColleges: number;

  /**
   * Total number of departments
   */
  totalDepartments: number;

  /**
   * Total number of administrative offices
   */
  totalOffices: number;

  /**
   * Total number of defined positions
   */
  totalPositions: number;

  /**
   * Total number of employees across all units
   */
  totalEmployees: number;

  /**
   * Number of active organizational units
   */
  activeUnits: number;

  /**
   * Number of inactive organizational units
   */
  inactiveUnits: number;
}

/**
 * Response type for department detail endpoint
 *
 * Returns comprehensive information about a single department/college/office.
 *
 * @example
 * ```typescript
 * {
 *   department: {...},
 *   positions: [...],
 *   employees: [...],
 *   parentCollege: {...},
 *   childDepartments: [...]
 * }
 * ```
 */
export interface DepartmentDetailResponse {
  /**
   * The department/college/office with statistics
   */
  department: DepartmentWithStats;

  /**
   * All positions defined for this unit
   */
  positions: PositionWithDepartment[];

  /**
   * Summary of employees in this unit
   */
  employees: Array<{
    id: string;
    employeeId: string | null;
    firstName: string;
    lastName: string;
    positionId: string | null;
    positionTitle: string | null;
    isActive: boolean;
  }>;

  /**
   * Parent college information (for departments only)
   * Null for colleges and offices
   */
  parentCollege: {
    id: string;
    name: string;
    code: string;
  } | null;

  /**
   * Child departments (for colleges only)
   * Empty array for departments and offices
   */
  childDepartments: DepartmentWithStats[];
}

/**
 * Response type for position detail endpoint
 *
 * Returns comprehensive information about a single position.
 *
 * @example
 * ```typescript
 * {
 *   position: {...},
 *   employees: [...],
 *   department: {...}
 * }
 * ```
 */
export interface PositionDetailResponse {
  /**
   * The position with department information
   */
  position: PositionWithDepartment;

  /**
   * Summary of employees holding this position
   */
  employees: Array<{
    id: string;
    employeeId: string | null;
    firstName: string;
    lastName: string;
    departmentId: string | null;
    departmentName: string | null;
    isActive: boolean;
  }>;

  /**
   * Full department details (if position has department)
   * Null if position has no department assignment
   */
  department: DepartmentWithStats | null;
}
