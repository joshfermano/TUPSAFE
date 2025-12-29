// Server-only Supabase client
export { createClient as createServerClient } from './utils/supabase/server';

// Cookie configuration utilities for portal-specific session isolation
// NOTE: For Edge Runtime compatibility, import directly from './utils/supabase/cookie-config'
export { getCookieOptions, type Portal } from './utils/supabase/cookie-config';

// Admin Supabase client (server-only, bypasses RLS)
export { createAdminClient } from './utils/supabase/admin';
export type { AdminClient } from './utils/supabase/admin';

// Middleware utilities (server-only)
export { updateSession } from './utils/supabase/middleware';
export { createAuthMiddleware, getUserFromHeaders } from './middleware';

// Auth System Modules (all server-only, use Node.js modules like crypto, database)
export * from './utils/otp';
export * from './utils/employee-id';
export * from './utils/device';
export * from './utils/email';
export * from './utils/password';
export * from './utils/session';
export * from './utils/rate-limit';

// Storage utilities (profile pictures, etc.)
export * from './utils/storage';

// Re-export validation schemas for convenience
export * from './auth';
