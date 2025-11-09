// Server-only Supabase client
export { createClient as createServerClient } from './utils/supabase/server';

// Middleware utilities (server-only)
export { updateSession } from './utils/supabase/middleware';
export { createAuthMiddleware, getUserFromHeaders } from './middleware';

// Auth System Modules (all server-only)
export * from './utils/otp';
export * from './utils/employee-id';
export * from './utils/device';
export * from './utils/email';
export * from './utils/password';
export * from './utils/session';
export * from './utils/rate-limit';

// Re-export validation schemas for convenience
export * from './auth';
