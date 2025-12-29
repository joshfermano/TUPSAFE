import { z } from 'zod';
import { TUP_DEPARTMENTS } from './auth';

// Phone number validation for Philippine format
const phoneNumberRegex = /^(\+639|09)\d{9}$/;

// Profile edit validation schema
// Note: firstName, lastName, positionId are READ-ONLY fields (require HR approval to change)
// They are included in the schema for form display but marked as optional
// Only phoneNumber, middleName, collegeId, and departmentId are actually sent to the API
export const editProfileSchema = z.object({
  // Personal Information (firstName and lastName are read-only, require HR to change)
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z\s\-\.]+$/,
      'First name can only contain letters, spaces, hyphens, and periods'
    )
    .optional()
    .or(z.literal('')),

  middleName: z
    .string()
    .max(50, 'Middle name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z\s\-\.]*$/,
      'Middle name can only contain letters, spaces, hyphens, and periods'
    )
    .optional()
    .or(z.literal('')),

  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z\s\-\.]+$/,
      'Last name can only contain letters, spaces, hyphens, and periods'
    )
    .optional()
    .or(z.literal('')),

  // Contact Information (email is readonly, coming from auth)
  // Phone number is optional - if provided, must match Philippine format
  phoneNumber: z
    .string()
    .transform((val) => val?.trim() || '')
    .refine(
      (val) => val === '' || phoneNumberRegex.test(val),
      'Please enter a valid Philippine phone number (e.g., +639123456789 or 09123456789)'
    )
    .optional(),

  // Employment Information
  // collegeId is the parent college/office
  collegeId: z
    .string()
    .uuid('Invalid college ID')
    .optional()
    .or(z.literal('')),

  // departmentId is optional department under a college
  departmentId: z
    .string()
    .uuid('Invalid department ID')
    .optional()
    .or(z.literal('')),

  // positionId is read-only (requires HR approval to change)
  positionId: z
    .string()
    .uuid('Invalid position ID')
    .optional()
    .or(z.literal('')),

  // positionTitle is editable by employee
  positionTitle: z
    .string()
    .max(200, 'Position title must not exceed 200 characters')
    .optional()
    .or(z.literal('')),

  // Avatar/Profile Picture (handled separately by AvatarUpload component)
  avatarUrl: z
    .string()
    .url('Please provide a valid URL')
    .optional()
    .or(z.literal('')),
});

// Type export for use in components
export type EditProfileFormData = z.infer<typeof editProfileSchema>;

// Partial schema for step-by-step validation if needed
export const editPersonalInfoSchema = editProfileSchema.pick({
  firstName: true,
  middleName: true,
  lastName: true,
});

export const editContactInfoSchema = editProfileSchema.pick({
  phoneNumber: true,
});

export const editEmploymentInfoSchema = editProfileSchema.pick({
  departmentId: true,
  positionId: true,
});

// Type exports for partial schemas
export type EditPersonalInfoData = z.infer<typeof editPersonalInfoSchema>;
export type EditContactInfoData = z.infer<typeof editContactInfoSchema>;
export type EditEmploymentInfoData = z.infer<typeof editEmploymentInfoSchema>;
