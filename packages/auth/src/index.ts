// Client utilities
export { createClient } from './utils/supabase/client';

// Legacy client export for backward compatibility
// Re-export directly from client.ts instead of as a module path
import { supabase as supabaseClient } from './client';
import type { SupabaseClient as SupabaseClientType } from './client';
export { supabaseClient as supabase };
export type SupabaseClient = SupabaseClientType;

// Context (client-safe)
// Re-export directly from context.tsx instead of as a module path
export { AuthProvider, useAuth } from './context';

// Components (client-safe)
export { ProtectedRoute } from './components/ProtectedRoute';

// Auth validation schemas (these are client-safe)
// Re-export all from auth.ts
export {
  GOVERNMENT_DEPARTMENTS,
  loginSchema,
  registerSchema,
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  registerStep4Schema,
  passwordResetSchema,
  changePasswordSchema,
  mfaSetupSchema,
} from './auth';

export type {
  LoginFormData,
  RegisterFormData,
  RegisterStep1Data,
  RegisterStep2Data,
  RegisterStep3Data,
  RegisterStep4Data,
  PasswordResetData,
  ChangePasswordData,
  MfaSetupData,
} from './auth';
