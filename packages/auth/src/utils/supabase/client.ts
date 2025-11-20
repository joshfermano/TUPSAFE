import { createBrowserClient } from '@supabase/ssr';
import { getPortalCookieName, type Portal } from './cookie-config';

/**
 * Create a browser-side Supabase client with portal-specific cookie isolation
 *
 * CRITICAL: This function configures the Supabase client to use portal-specific
 * cookie names (storage keys) to prevent session conflicts when admin and employee
 * apps run simultaneously.
 *
 * The cookieOptions.name property sets the base name for all auth-related cookies.
 * Supabase will create cookies like:
 * - {name} (base cookie)
 * - {name}.0, {name}.1, etc. (chunked cookies for large sessions)
 *
 * @returns Supabase browser client configured for the current portal
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  // Read portal from environment variable
  // This MUST be set in each app's .env.local:
  // - apps/employee/.env.local: NEXT_PUBLIC_APP_PORTAL=employee
  // - apps/admin/.env.local: NEXT_PUBLIC_APP_PORTAL=admin
  const portal = process.env.NEXT_PUBLIC_APP_PORTAL as Portal | undefined;

  // Get portal-specific cookie name (storage key)
  // This ensures cookies are written with unique names per portal:
  // - Employee: sb-{projectId}-auth-token-employee
  // - Admin: sb-{projectId}-auth-token-admin
  const cookieName = getPortalCookieName(portal);

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      // CRITICAL: This name becomes the storage key for all auth cookies
      // Without this, both portals would use the same cookie names and conflict
      name: cookieName,
      // Standard security options
      domain: undefined, // Let browser determine domain
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  });
}

