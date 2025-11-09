// Client utilities
export { createClient } from './utils/supabase/client';

// Server utilities
export { createClient as createServerClient } from './utils/supabase/server';

// Legacy client export for backward compatibility
export { supabase } from './client';
export type { SupabaseClient } from './client';

// Context
export { AuthProvider, useAuth } from './context';

// Components
export { ProtectedRoute } from './components/ProtectedRoute';

// Middleware
export { createAuthMiddleware, getUserFromHeaders } from './middleware';

// Auth System Modules
export * from './utils/otp';
export * from './utils/employee-id';
export * from './utils/device';
export * from './utils/email';
export * from './utils/password';
export * from './utils/session';
export * from './utils/rate-limit';
