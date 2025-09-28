// Client utilities
export { createClient } from './utils/supabase/client';

// Legacy client export for backward compatibility
export { supabase } from './client';
export type { SupabaseClient } from './client';

// Context
export { AuthProvider, useAuth } from './context';

// Components
export { ProtectedRoute } from './components/ProtectedRoute';
export { LoginForm } from './components/LoginForm';

// Middleware
export { createAuthMiddleware, getUserFromHeaders } from './middleware';
