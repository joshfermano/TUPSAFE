import { z } from 'zod';
export declare const GOVERNMENT_DEPARTMENTS: string[];
export declare const loginSchema: z.ZodObject<{
    loginIdentifier: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    rememberMe: z.ZodDefault<z.ZodBoolean>;
    mfaCode: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    password: string;
    loginIdentifier: string;
    rememberMe: boolean;
    mfaCode?: string | undefined;
}, {
    password: string;
    loginIdentifier: string;
    rememberMe?: boolean | undefined;
    mfaCode?: string | undefined;
}>;
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    middleName: z.ZodOptional<z.ZodString>;
    email: z.ZodEffects<z.ZodString, string, string>;
    phoneNumber: z.ZodString;
    department: z.ZodEffects<z.ZodString, string, string>;
    position: z.ZodString;
    employeeId: z.ZodString;
    yearsOfService: z.ZodOptional<z.ZodNumber>;
    password: z.ZodEffects<z.ZodString, string, string>;
    confirmPassword: z.ZodString;
    termsAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    privacyAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    dataProcessingConsent: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    department: string;
    position: string;
    employeeId: string;
    confirmPassword: string;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    dataProcessingConsent: boolean;
    middleName?: string | undefined;
    yearsOfService?: number | undefined;
}, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    department: string;
    position: string;
    employeeId: string;
    confirmPassword: string;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    dataProcessingConsent: boolean;
    middleName?: string | undefined;
    yearsOfService?: number | undefined;
}>, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    department: string;
    position: string;
    employeeId: string;
    confirmPassword: string;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    dataProcessingConsent: boolean;
    middleName?: string | undefined;
    yearsOfService?: number | undefined;
}, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    department: string;
    position: string;
    employeeId: string;
    confirmPassword: string;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    dataProcessingConsent: boolean;
    middleName?: string | undefined;
    yearsOfService?: number | undefined;
}>;
export declare const registerStep1Schema: z.ZodObject<Pick<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    middleName: z.ZodOptional<z.ZodString>;
    email: z.ZodEffects<z.ZodString, string, string>;
    phoneNumber: z.ZodString;
    department: z.ZodEffects<z.ZodString, string, string>;
    position: z.ZodString;
    employeeId: z.ZodString;
    yearsOfService: z.ZodOptional<z.ZodNumber>;
    password: z.ZodEffects<z.ZodString, string, string>;
    confirmPassword: z.ZodString;
    termsAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    privacyAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    dataProcessingConsent: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "firstName" | "lastName" | "middleName" | "email" | "phoneNumber">, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    middleName?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    middleName?: string | undefined;
}>;
export declare const registerStep2Schema: z.ZodObject<Pick<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    middleName: z.ZodOptional<z.ZodString>;
    email: z.ZodEffects<z.ZodString, string, string>;
    phoneNumber: z.ZodString;
    department: z.ZodEffects<z.ZodString, string, string>;
    position: z.ZodString;
    employeeId: z.ZodString;
    yearsOfService: z.ZodOptional<z.ZodNumber>;
    password: z.ZodEffects<z.ZodString, string, string>;
    confirmPassword: z.ZodString;
    termsAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    privacyAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    dataProcessingConsent: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "department" | "position" | "employeeId" | "yearsOfService">, "strip", z.ZodTypeAny, {
    department: string;
    position: string;
    employeeId: string;
    yearsOfService?: number | undefined;
}, {
    department: string;
    position: string;
    employeeId: string;
    yearsOfService?: number | undefined;
}>;
export declare const registerStep3Schema: z.ZodEffects<z.ZodObject<Pick<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    middleName: z.ZodOptional<z.ZodString>;
    email: z.ZodEffects<z.ZodString, string, string>;
    phoneNumber: z.ZodString;
    department: z.ZodEffects<z.ZodString, string, string>;
    position: z.ZodString;
    employeeId: z.ZodString;
    yearsOfService: z.ZodOptional<z.ZodNumber>;
    password: z.ZodEffects<z.ZodString, string, string>;
    confirmPassword: z.ZodString;
    termsAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    privacyAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    dataProcessingConsent: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "password" | "confirmPassword">, "strip", z.ZodTypeAny, {
    password: string;
    confirmPassword: string;
}, {
    password: string;
    confirmPassword: string;
}>, {
    password: string;
    confirmPassword: string;
}, {
    password: string;
    confirmPassword: string;
}>;
export declare const registerStep4Schema: z.ZodObject<Pick<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    middleName: z.ZodOptional<z.ZodString>;
    email: z.ZodEffects<z.ZodString, string, string>;
    phoneNumber: z.ZodString;
    department: z.ZodEffects<z.ZodString, string, string>;
    position: z.ZodString;
    employeeId: z.ZodString;
    yearsOfService: z.ZodOptional<z.ZodNumber>;
    password: z.ZodEffects<z.ZodString, string, string>;
    confirmPassword: z.ZodString;
    termsAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    privacyAccepted: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    dataProcessingConsent: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "termsAccepted" | "privacyAccepted" | "dataProcessingConsent">, "strip", z.ZodTypeAny, {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    dataProcessingConsent: boolean;
}, {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    dataProcessingConsent: boolean;
}>;
export declare const passwordResetSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodEffects<z.ZodString, string, string>;
    confirmNewPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}>;
export declare const mfaSetupSchema: z.ZodObject<{
    backupCodes: z.ZodArray<z.ZodString, "many">;
    confirmationCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    backupCodes: string[];
    confirmationCode: string;
}, {
    backupCodes: string[];
    confirmationCode: string;
}>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterStep1Data = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Data = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Data = z.infer<typeof registerStep3Schema>;
export type RegisterStep4Data = z.infer<typeof registerStep4Schema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type MfaSetupData = z.infer<typeof mfaSetupSchema>;
