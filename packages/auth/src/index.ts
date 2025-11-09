// Client utilities
export { createClient } from './utils/supabase/client';

// Legacy client export for backward compatibility
export { supabase } from './client';
export type { SupabaseClient } from './client';

// Context (client-safe)
export { AuthProvider, useAuth } from './context';

// Components (client-safe)
export { ProtectedRoute } from './components/ProtectedRoute';

// Auth validation schemas (these are client-safe)
export * from './auth';
