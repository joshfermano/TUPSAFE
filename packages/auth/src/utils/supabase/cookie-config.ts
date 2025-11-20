/**
 * Cookie configuration for portal-specific session isolation
 *
 * Prevents session conflicts when admin and employee apps run simultaneously
 * on localhost by using different cookie names for each portal.
 *
 * Implementation Strategy:
 * Supabase SSR does not support custom cookie names via cookieOptions.name.
 * Instead, we intercept cookie operations in getAll/setAll to rename cookies
 * on-the-fly, mapping between Supabase's default names and our portal-specific names.
 */

import type { NextRequest, NextResponse } from 'next/server';

export type Portal = 'admin' | 'employee';

/**
 * Get the Supabase project ID from the URL
 * Exported for use in client-side and server-side code
 *
 * @returns The Supabase project ID (e.g., 'qnghxovloclorfjkjlgs')
 */
export function getProjectId(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const hostname = baseUrl.replace('https://', '').replace('http://', '');
  return hostname.split('.')[0];
}

/**
 * Get portal-specific cookie name
 *
 * @param portal - The portal identifier ('admin' or 'employee')
 * @returns Cookie name with portal suffix
 */
export function getPortalCookieName(portal?: Portal): string {
  const projectId = getProjectId();
  const baseName = `sb-${projectId}-auth-token`;

  if (!portal) {
    return baseName;
  }

  return `${baseName}-${portal}`;
}

/**
 * Get the default Supabase cookie name pattern
 * Supabase uses chunked cookies with patterns like:
 * - sb-{projectId}-auth-token (base)
 * - sb-{projectId}-auth-token.0, sb-{projectId}-auth-token.1, etc. (chunks)
 *
 * Exported for use in middleware cookie interceptors
 */
export function getDefaultSupabaseCookiePattern(): string {
  const projectId = getProjectId();
  return `sb-${projectId}-auth-token`;
}

/**
 * Create cookie interceptor functions for middleware
 * These functions rename cookies between Supabase's default names and portal-specific names
 *
 * @param portal - The portal identifier ('admin' or 'employee')
 * @param request - Next.js request object
 * @param response - Next.js response object (will be mutated)
 * @returns Cookie methods for Supabase createServerClient
 */
export function createCookieInterceptor(
  portal: Portal,
  request: NextRequest,
  response: NextResponse
) {
  const portalCookieName = getPortalCookieName(portal);
  const defaultCookieName = getDefaultSupabaseCookiePattern();

  return {
    getAll() {
      // Read portal-specific cookies and rename them to default Supabase names
      // so Supabase can read them correctly
      const allCookies = request.cookies.getAll();

      return allCookies
        .filter(cookie => cookie.name.startsWith(portalCookieName))
        .map(cookie => ({
          name: cookie.name.replace(portalCookieName, defaultCookieName),
          value: cookie.value,
        }));
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
      // Supabase wants to set cookies with default names
      // We intercept and rename them to portal-specific names
      cookiesToSet.forEach(({ name, value, options }) => {
        // Rename from default Supabase name to portal-specific name
        const portalSpecificName = name.replace(defaultCookieName, portalCookieName);

        // Set in request for immediate reading
        request.cookies.set(portalSpecificName, value);

        // Set in response to send to browser
        response.cookies.set(portalSpecificName, value, options);
      });
    },
  };
}

/**
 * Get cookie options for Supabase client
 *
 * @deprecated Use createCookieInterceptor instead for proper cookie isolation
 * @param portal - The portal identifier ('admin' or 'employee')
 * @returns Cookie configuration object
 */
export function getCookieOptions(portal?: Portal) {
  return {
    name: getPortalCookieName(portal),
  };
}
