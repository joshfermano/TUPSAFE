import { z } from 'zod';

/**
 * Edit User Form Schema
 *
 * Design principles:
 * - All organization fields are OPTIONAL to allow partial updates
 * - Validation is permissive at schema level
 * - Business logic validation (Co-Admin requires HR) happens in submit handler
 */
export const editUserFormSchema = z.object({
  // Personal Information
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  middleName: z.string().max(50, 'Middle name is too long').optional().default(''),
  suffix: z.string().optional().default('none'),
  email: z.string().email('Invalid email address'),

  // Role & Access
  baseRole: z.enum(['employee', 'hr', 'supervisor', 'auditor'], {
    required_error: 'Please select a role',
    invalid_type_error: 'Please select a valid role',
  }).default('employee'),
  isCoAdmin: z.boolean().default(false),

  // Organization (ALL OPTIONAL for partial updates)
  collegeId: z.string().optional().default('none'),
  departmentId: z.string().optional().default('none'),
  positionId: z.string().optional().default('none'),
  salaryGrade: z.coerce.number().int().min(1).max(33).optional().nullable(),
  positionTitle: z.string().max(200, 'Position title is too long').optional().nullable(),

  // Account Status
  isActive: z.boolean().default(true),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

/**
 * Default form values for initialization
 */
export const defaultEditUserFormValues: EditUserFormValues = {
  firstName: '',
  lastName: '',
  middleName: '',
  suffix: 'none',
  email: '',
  baseRole: 'employee',
  isCoAdmin: false,
  collegeId: 'none',
  departmentId: 'none',
  positionId: 'none',
  salaryGrade: null,
  positionTitle: null,
  isActive: true,
};

/**
 * Validation messages for form fields
 */
export const validationMessages = {
  firstName: {
    required: 'First name is required',
    maxLength: 'First name cannot exceed 50 characters',
  },
  lastName: {
    required: 'Last name is required',
    maxLength: 'Last name cannot exceed 50 characters',
  },
  middleName: {
    maxLength: 'Middle name cannot exceed 50 characters',
  },
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
  },
  baseRole: {
    required: 'Please select a role',
  },
  positionTitle: {
    maxLength: 'Position title cannot exceed 200 characters',
  },
  salaryGrade: {
    min: 'Salary grade must be at least 1',
    max: 'Salary grade cannot exceed 33',
  },
} as const;
