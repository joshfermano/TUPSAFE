// Client utilities
export { createClient } from './utils/supabase/client.js';

// Legacy client export for backward compatibility
export { supabase } from './client.js';
export type { SupabaseClient } from './client.js';

// Context
export { AuthProvider, useAuth } from './context.js';

// Components
export { ProtectedRoute } from './components/ProtectedRoute.js';
export { LoginForm } from './components/LoginForm.js';

// Middleware
export { createAuthMiddleware, getUserFromHeaders } from './middleware.js';
