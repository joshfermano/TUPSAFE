import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { getPortalCookieName, getDefaultSupabaseCookiePattern, type Portal } from './cookie-config';

/**
 * Create a browser-side Supabase client with portal-specific cookie isolation
 *
 * CRITICAL: This function configures the Supabase client to use portal-specific
 * cookie names (storage keys) to prevent session conflicts when admin and employee
 * apps run simultaneously.
 *
 * In @supabase/ssr@0.7.0+, we use custom cookie storage methods instead of cookieOptions.name
 * to intercept and rename cookies between Supabase's default names and portal-specific names.
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

  // Get portal-specific cookie name and default Supabase pattern
  const portalCookieName = getPortalCookieName(portal);
  const defaultCookieName = getDefaultSupabaseCookiePattern();

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // SSR Guard: document is not available on server
        if (typeof document === 'undefined') {
          return [];
        }

        // Read all cookies from document.cookie
        const cookieHeader = document.cookie;
        const cookies = parseCookieHeader(cookieHeader);

        // Filter for portal-specific cookies and rename to default Supabase names
        return cookies
          .filter(cookie => cookie.name.startsWith(portalCookieName) && cookie.value !== undefined)
          .map(cookie => ({
            name: cookie.name.replace(portalCookieName, defaultCookieName),
            value: cookie.value!,
          }));
      },
      setAll(cookiesToSet) {
        // SSR Guard: document is not available on server
        if (typeof document === 'undefined') {
          return;
        }

        // Supabase wants to set cookies with default names
        // We intercept and rename them to portal-specific names
        cookiesToSet.forEach(({ name, value, options }) => {
          const portalSpecificName = name.replace(defaultCookieName, portalCookieName);

          // Serialize and set the cookie
          const cookieString = serializeCookieHeader(portalSpecificName, value, {
            ...options,
            domain: undefined,
            path: '/',
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production',
          });

          document.cookie = cookieString;
        });
      },
    },
  });
}

