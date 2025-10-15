import { z } from 'zod';

// Philippine government email domains for validation
const GOVERNMENT_EMAIL_DOMAINS = [
  'gov.ph',
  'deped.gov.ph',
  'doh.gov.ph',
  'dilg.gov.ph',
  'dof.gov.ph',
  'doe.gov.ph',
  'denr.gov.ph',
  'dti.gov.ph',
  'da.gov.ph',
  'dswd.gov.ph',
  'dnd.gov.ph',
  'dotc.gov.ph',
  'dpwh.gov.ph',
  'pcoo.gov.ph',
  'palace.gov.ph',
  'csc.gov.ph',
  'coa.gov.ph',
  'ombudsman.gov.ph',
];

// Philippine government departments
export const GOVERNMENT_DEPARTMENTS = [
  'Department of Education (DepEd)',
  'Department of Health (DOH)',
  'Department of the Interior and Local Government (DILG)',
  'Department of Finance (DOF)',
  'Department of Energy (DOE)',
  'Department of Environment and Natural Resources (DENR)',
  'Department of Trade and Industry (DTI)',
  'Department of Agriculture (DA)',
  'Department of Social Welfare and Development (DSWD)',
  'Department of National Defense (DND)',
  'Department of Transportation (DOTr)',
  'Department of Public Works and Highways (DPWH)',
  'Presidential Communications Operations Office (PCOO)',
  'Office of the President',
  'Civil Service Commission (CSC)',
  'Commission on Audit (COA)',
  'Office of the Ombudsman',
  'Department of Justice (DOJ)',
  'Department of Labor and Employment (DOLE)',
  'Department of Science and Technology (DOST)',
  'Department of Tourism (DOT)',
  'Department of Information and Communications Technology (DICT)',
  'National Economic and Development Authority (NEDA)',
  'Budget and Management (DBM)',
  'Local Government Unit (LGU)',
  'Other Government Agency',
];

// Employee ID format validation (flexible for different agencies)
const employeeIdRegex = /^[A-Z0-9]{3,15}$/;

// Strong password requirements for government systems
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
  .refine(
    (password) =>
      !password.includes('password') && !password.includes('123456'),
    'Password must not contain common weak patterns'
  );

// Government email validation
const governmentEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .refine((email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return (
      GOVERNMENT_DEPARTMENTS.includes('Other Government Agency') ||
      GOVERNMENT_EMAIL_DOMAINS.some((govDomain) => domain?.endsWith(govDomain))
    );
  }, 'Please use your official government email address');

// Login form validation schema
export const loginSchema = z.object({
  loginIdentifier: z
    .string()
    .min(1, 'Please enter your employee ID or email')
    .refine((value) => {
      // Allow either email format or employee ID format
      const isEmail = z.string().email().safeParse(value).success;
      const isEmployeeId = employeeIdRegex.test(value.toUpperCase());
      return isEmail || isEmployeeId;
    }, 'Please enter a valid employee ID or government email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
  mfaCode: z
    .string()
    .optional()
    .refine(
      (code) => !code || /^\d{6}$/.test(code),
      'MFA code must be 6 digits'
    ),
});

// Base registration schema without refinements
const baseRegisterSchema = z.object({
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

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z\s\-\.]+$/,
      'Last name can only contain letters, spaces, hyphens, and periods'
    ),

  middleName: z
    .string()
    .max(50, 'Middle name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z\s\-\.]*$/,
      'Middle name can only contain letters, spaces, hyphens, and periods'
    )
    .optional(),

  email: governmentEmailSchema,

  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(\+639|09)\d{9}$/,
      'Please enter a valid Philippine phone number (e.g., +639123456789 or 09123456789)'
    ),

  // Government Employment Details
  department: z
    .string()
    .min(1, 'Please select your department')
    .refine(
      (dept) => GOVERNMENT_DEPARTMENTS.includes(dept),
      'Please select a valid government department'
    ),

  position: z
    .string()
    .min(1, 'Position/Job title is required')
    .min(3, 'Position must be at least 3 characters')
    .max(100, 'Position must not exceed 100 characters'),

  employeeId: z
    .string()
    .min(1, 'Employee ID is required')
    .regex(
      employeeIdRegex,
      'Employee ID must be 3-15 characters (letters and numbers only)'
    ),

  yearsOfService: z
    .number()
    .min(0, 'Years of service cannot be negative')
    .max(50, 'Years of service seems unusually high')
    .optional(),

  // Security Setup
  password: passwordSchema,

  confirmPassword: z.string().min(1, 'Please confirm your password'),

  // Terms and Privacy
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),

  privacyAccepted: z
    .boolean()
    .refine((val) => val === true, 'You must accept the privacy policy'),

  dataProcessingConsent: z
    .boolean()
    .refine(
      (val) => val === true,
      'Consent for data processing is required for government compliance'
    ),
});

// Registration form validation schema with password confirmation
export const registerSchema = baseRegisterSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Multi-step registration schemas for step-by-step validation
export const registerStep1Schema = baseRegisterSchema.pick({
  firstName: true,
  lastName: true,
  middleName: true,
  email: true,
  phoneNumber: true,
});

export const registerStep2Schema = baseRegisterSchema.pick({
  department: true,
  position: true,
  employeeId: true,
  yearsOfService: true,
});

export const registerStep3Schema = baseRegisterSchema
  .pick({
    password: true,
    confirmPassword: true,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const registerStep4Schema = baseRegisterSchema.pick({
  termsAccepted: true,
  privacyAccepted: true,
  dataProcessingConsent: true,
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: governmentEmailSchema,
});

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// MFA setup schema
export const mfaSetupSchema = z.object({
  backupCodes: z
    .array(z.string())
    .length(8, 'All 8 backup codes must be acknowledged'),
  confirmationCode: z
    .string()
    .min(1, 'Please enter the 6-digit verification code')
    .regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterStep1Data = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Data = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Data = z.infer<typeof registerStep3Schema>;
export type RegisterStep4Data = z.infer<typeof registerStep4Schema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type MfaSetupData = z.infer<typeof mfaSetupSchema>;
