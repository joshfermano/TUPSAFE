import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPortalCookieName, type Portal } from './cookie-config';

// Export for use in middleware
export { getPortalCookieName, type Portal } from './cookie-config';

/**
 * Get the Supabase project ID from the URL
 */
function getProjectId(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const hostname = baseUrl.replace('https://', '').replace('http://', '');
  return hostname.split('.')[0];
}

/**
 * Get the default Supabase cookie name pattern
 */
function getDefaultSupabaseCookiePattern(): string {
  const projectId = getProjectId();
  return `sb-${projectId}-auth-token`;
}

/**
 * Create a Supabase client with portal-specific cookie isolation
 *
 * CRITICAL: This function uses cookie name interceptor to ensure
 * admin and employee portals maintain separate sessions.
 *
 * @param portal - The portal identifier ('admin' or 'employee')
 * @returns Supabase client configured for the specified portal
 */
export async function createClient(portal?: Portal) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  const cookieStore = await cookies();

  // Get portal-specific and default cookie name patterns
  const portalCookieName = getPortalCookieName(portal);
  const defaultCookieName = getDefaultSupabaseCookiePattern();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      /**
       * Read cookies with portal-specific names and translate them
       * to default Supabase names so Supabase can read them correctly
       */
      getAll() {
        const allCookies = cookieStore.getAll();

        // If no portal specified, return all cookies as-is
        if (!portal) {
          return allCookies;
        }

        // Filter and rename portal-specific cookies to default names
        return allCookies
          .filter(cookie => cookie.name.startsWith(portalCookieName))
          .map(cookie => ({
            name: cookie.name.replace(portalCookieName, defaultCookieName),
            value: cookie.value,
          }));
      },

      /**
       * Set cookies with portal-specific names to maintain session isolation
       */
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // If no portal specified, use default names
            if (!portal) {
              cookieStore.set(name, value, options);
              return;
            }

            // Rename from default Supabase name to portal-specific name
            const portalSpecificName = name.replace(defaultCookieName, portalCookieName);

            // Debug logging
            console.log(`[Cookie Interceptor] Setting cookie: ${name} -> ${portalSpecificName}`);

            cookieStore.set(portalSpecificName, value, options);
          });
        } catch (error) {
          // Log the error to see what's failing
          console.error('[Cookie Interceptor] Error setting cookies:', error);
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
