import { z } from 'zod';
import { TUP_DEPARTMENTS } from './auth';

// Phone number validation for Philippine format
const phoneNumberRegex = /^(\+639|09)\d{9}$/;

// Profile edit validation schema
export const editProfileSchema = z.object({
  // Personal Information
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z\s\-\.]+$/,
      'First name can only contain letters, spaces, hyphens, and periods'
    ),

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
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z\s\-\.]+$/,
      'Last name can only contain letters, spaces, hyphens, and periods'
    ),

  // Contact Information (email is readonly, coming from auth)
  phoneNumber: z
    .string()
    .regex(
      phoneNumberRegex,
      'Please enter a valid Philippine phone number (e.g., +639123456789 or 09123456789)'
    )
    .optional()
    .or(z.literal('')),

  // Employment Information (employeeId is readonly)
  departmentId: z
    .string()
    .min(1, 'Please select your department'),

  positionId: z
    .string()
    .min(1, 'Please select your position'),

  // Avatar/Profile Picture
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
