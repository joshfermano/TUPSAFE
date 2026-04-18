import { z } from 'zod';

/**
 * Edit User Form Schema
 *
 * Design principles:
 * - All organization fields are OPTIONAL to allow partial updates
 * - Validation is permissive at schema level
 * - Business logic (e.g. "HR/Admin roles require an HR-prefixed department",
 *   "role change requires a reason ≥20 chars") is enforced in the submit
 *   handler / confirmation dialog, NOT via Zod conditional schemas — this
 *   keeps the resolver simple and the type inference clean.
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
  // `superadmin` is allowed in the enum so the form can round-trip a superadmin
  // user without throwing during initialization. The UI never exposes
  // superadmin as a selectable option — promotion to superadmin is a dedicated
  // flow (see POST /api/users/[id]/role, PR 3).
  role: z.enum(['superadmin', 'admin', 'hr', 'employee'], {
    required_error: 'Please select a role',
    invalid_type_error: 'Please select a valid role',
  }).default('employee'),
  // Human-readable justification required whenever `role` changes. Enforced in
  // the submit handler + confirmation dialog, not here.
  roleChangeReason: z.string().trim().max(500, 'Reason is too long').optional(),

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
  role: 'employee',
  roleChangeReason: undefined,
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
  role: {
    required: 'Please select a role',
  },
  roleChangeReason: {
    required: 'Please describe why this role is changing (at least 20 characters).',
    maxLength: 'Reason cannot exceed 500 characters.',
  },
  positionTitle: {
    maxLength: 'Position title cannot exceed 200 characters',
  },
  salaryGrade: {
    min: 'Salary grade must be at least 1',
    max: 'Salary grade cannot exceed 33',
  },
} as const;
