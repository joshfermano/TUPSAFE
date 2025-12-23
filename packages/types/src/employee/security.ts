/**
 * Employee Security Types and Validation Schemas
 *
 * Provides type-safe validation schemas for employee authentication
 * operations including password change and reset flows.
 *
 * @module types/employee/security
 */

import { z } from 'zod';

// ============================================================================
// Shared Password Strength Schema
// ============================================================================

/**
 * Strong password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordStrengthSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

// ============================================================================
// Change Password (Logged-in User)
// ============================================================================

/**
 * Change password request schema for logged-in employees
 * Validates current password and new password strength
 */
export const employeeChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordStrengthSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type EmployeeChangePasswordRequest = z.infer<
  typeof employeeChangePasswordSchema
>;

/**
 * Response from change password API
 */
export interface EmployeeChangePasswordResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Forgot Password (OTP Request)
// ============================================================================

/**
 * Forgot password request schema
 * Accepts email or employee ID as identifier
 */
export const employeeForgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or Employee ID is required')
    .max(255, 'Identifier too long'),
});

export type EmployeeForgotPasswordRequest = z.infer<
  typeof employeeForgotPasswordSchema
>;

/**
 * Response from forgot password API
 * Always returns generic success to prevent user enumeration
 */
export interface EmployeeForgotPasswordResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Reset Password (OTP Verification + New Password)
// ============================================================================

/**
 * Reset password request schema
 * Requires identifier, OTP code, and new password
 */
export const employeeResetPasswordSchema = z
  .object({
    identifier: z
      .string()
      .min(1, 'Email or Employee ID is required')
      .max(255, 'Identifier too long'),
    code: z
      .string()
      .length(6, 'Verification code must be 6 digits')
      .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
    password: passwordStrengthSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type EmployeeResetPasswordRequest = z.infer<
  typeof employeeResetPasswordSchema
>;

/**
 * Response from reset password API
 */
export interface EmployeeResetPasswordResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Resend OTP for Password Reset
// ============================================================================

/**
 * Resend OTP request schema for password reset
 * Uses identifier (email or employee ID) instead of userId
 */
export const employeeResendPasswordResetOTPSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or Employee ID is required')
    .max(255, 'Identifier too long'),
  type: z.literal('password_reset'),
});

export type EmployeeResendPasswordResetOTPRequest = z.infer<
  typeof employeeResendPasswordResetOTPSchema
>;

/**
 * Response from resend OTP API
 */
export interface EmployeeResendOTPResponse {
  success: boolean;
  message: string;
  remaining?: number;
}

// ============================================================================
// User Identifier Resolution
// ============================================================================

/**
 * Result of resolving an identifier (email or employee ID) to user details
 */
export interface ResolvedUserIdentifier {
  userId: string;
  email: string;
}

