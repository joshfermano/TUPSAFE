import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

/**
 * Portal type for cookie isolation
 */
type Portal = 'admin' | 'employee';

/**
 * Get the Supabase project ID from the URL
 */
function getProjectId(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const hostname = baseUrl.replace('https://', '').replace('http://', '');
  return hostname.split('.')[0];
}

/**
 * Get portal-specific cookie name
 */
function getPortalCookieName(portal?: Portal): string {
  const projectId = getProjectId();
  const baseName = `sb-${projectId}-auth-token`;
  if (!portal) return baseName;
  return `${baseName}-${portal}`;
}

/**
 * Get the default Supabase cookie name pattern
 */
function getDefaultCookieName(): string {
  const projectId = getProjectId();
  return `sb-${projectId}-auth-token`;
}

// Lazy-initialized singleton to avoid build-time errors
let cachedClient: SupabaseClientType | null = null;
let cachedPortal: Portal | undefined = undefined;

function getSupabaseClient(): SupabaseClientType {
  // Read portal from environment variable
  const portal = process.env.NEXT_PUBLIC_APP_PORTAL as Portal | undefined;

  // Invalidate cache if portal changed
  if (cachedClient && cachedPortal === portal) {
    return cachedClient;
  }

  // Environment variables validation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  // Get portal-specific cookie name and default Supabase pattern
  const portalCookieName = getPortalCookieName(portal);
  const defaultCookieName = getDefaultCookieName();

  // Create Supabase client with portal-specific cookie isolation
  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // SSR Guard: document is not available on server
        if (typeof document === 'undefined') {
          return [];
        }

        // Read all cookies from document.cookie
        const cookieHeader = document.cookie;
        const cookies = parseCookieHeader(cookieHeader);

        // If no portal specified, return all matching cookies
        if (!portal) {
          return cookies
            .filter(cookie => cookie.name.startsWith(defaultCookieName) && cookie.value !== undefined)
            .map(cookie => ({
              name: cookie.name,
              value: cookie.value!,
            }));
        }

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
          // If no portal specified, use default names
          const targetName = portal
            ? name.replace(defaultCookieName, portalCookieName)
            : name;

          // Serialize and set the cookie
          const cookieString = serializeCookieHeader(targetName, value, {
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
  }) as SupabaseClientType;

  cachedPortal = portal;
  return cachedClient;
}

// Export lazy-initialized singleton with portal-specific cookie isolation
export const supabase = new Proxy({} as SupabaseClientType, {
  get(_, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  },
});

// Export types for easier use
export type SupabaseClient = SupabaseClientType;
