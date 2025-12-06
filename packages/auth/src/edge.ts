/**
 * Edge Runtime Utilities for Supabase
 *
 * This module provides edge-runtime compatible utilities for:
 * - Cookie interception and management
 * - Portal-specific cookie configuration
 *
 * Use this in Next.js middleware and edge functions.
 *
 * @module @tupsafe/auth/edge
 *
 * @example
 * ```typescript
 * import { createCookieInterceptor, type Portal } from '@tupsafe/auth/edge';
 *
 * export async function middleware(request: NextRequest) {
 *   const response = NextResponse.next();
 *   const portal: Portal = 'employee';
 *
 *   const cookieInterceptor = createCookieInterceptor(portal, request, response);
 *   // Use cookieInterceptor with Supabase createServerClient
 * }
 * ```
 */

export {
  createCookieInterceptor,
  getCookieOptions,
  getPortalCookieName,
  getProjectId,
  getDefaultSupabaseCookiePattern,
  type Portal,
} from './utils/supabase/cookie-config';
