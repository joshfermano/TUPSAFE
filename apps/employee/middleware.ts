/**
 * Employee Portal Authentication Middleware (Edge Runtime Compatible)
 *
 * Protects employee and applicant routes with Supabase authentication.
 * User type verification is handled by API routes and server components to maintain
 * Edge Runtime compatibility (middleware cannot use Node.js modules).
 *
 * Security Features:
 * - Supabase session validation (edge-compatible)
 * - Portal-specific session isolation via custom cookie names
 * - Email verification enforcement
 * - Account status checks (pending vs active)
 * - Session timeout management
 * - Redirects to login for unauthenticated users
 *
 * Note: This middleware runs in Edge Runtime and cannot access database directly.
 * User type (employee/applicant) and detailed profile verification happen in
 * API routes and server components using the @tupsafe/database package.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getPortalCookieName, getDefaultSupabaseCookiePattern, type Portal } from '@tupsafe/auth/edge';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/features',
  '/contact',
  '/help',
  '/privacy',
  '/terms',
];

/**
 * Check if the route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Main middleware function for employee portal route protection
 *
 * Edge Runtime Compatible:
 * - Only validates Supabase session existence
 * - Does NOT query database (database uses Node.js modules)
 * - User type and profile verification happens in API routes and server components
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast path: Allow public routes and ALL auth routes (no auth check needed)
  const isPublic = isPublicRoute(pathname);
  const isAuthRoute = pathname.startsWith('/auth');

  // Always allow auth routes without any checks to prevent loops
  if (isPublic || isAuthRoute) {
    return NextResponse.next();
  }

  try {
    // Initialize Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        '[Employee Middleware] Missing Supabase environment variables'
      );
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('error', 'configuration_error');
      return NextResponse.redirect(redirectUrl);
    }

    // Create response object for cookie management
    const response = NextResponse.next({ request });

    // Portal-specific cookie configuration
    const portal: Portal = 'employee';
    const portalCookieName = getPortalCookieName(portal);
    const defaultCookieName = getDefaultSupabaseCookiePattern();

    // Create Supabase client with portal-specific cookie interceptor
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        /**
         * Read portal-specific cookies and rename them to default Supabase names
         * so Supabase can read them correctly
         */
        getAll() {
          const allCookies = request.cookies.getAll();

          return allCookies
            .filter(cookie => cookie.name.startsWith(portalCookieName))
            .map(cookie => ({
              name: cookie.name.replace(portalCookieName, defaultCookieName),
              value: cookie.value,
            }));
        },

        /**
         * Supabase wants to set cookies with default names
         * We intercept and rename them to portal-specific names
         */
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Rename from default Supabase name to portal-specific name
            const portalSpecificName = name.replace(defaultCookieName, portalCookieName);

            // Set in request for immediate reading
            request.cookies.set(portalSpecificName, value);

            // Set in response to send to browser
            response.cookies.set(portalSpecificName, value, options);
          });
        },
      },
    });

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // If no session and accessing protected route, redirect to login
    if (!session || sessionError) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      redirectUrl.searchParams.set('error', 'authentication_required');
      return NextResponse.redirect(redirectUrl);
    }

    const userId = session.user.id;

    /**
     * User Type and Profile Verification:
     *
     * User type (applicant vs employee) and profile data verification is enforced in:
     * 1. API routes using @tupsafe/database to query user profile
     * 2. Server components using @tupsafe/database for user type checks
     * 3. Client-side AuthContext/RealtimeProvider for UI rendering
     *
     * Route-level protection based on user type:
     * - Applicant-only routes: /dashboard/applications, /dashboard/positions
     * - Employee-only routes: /dashboard/saln
     * - Shared routes: /dashboard, /profile, /pds, /settings
     *
     * This approach maintains Edge Runtime compatibility while ensuring security.
     * Users without proper permissions will be redirected when they access protected resources.
     */

    // Extract user metadata for account status and email verification checks
    const accountStatus = session.user.user_metadata?.account_status;
    const emailVerifiedAt = session.user.user_metadata?.email_verified_at;

    // Check email verification first - if not verified, redirect to verification page
    if (pathname.startsWith('/dashboard') && !emailVerifiedAt) {
      const redirectUrl = new URL('/auth/verify-email', request.url);
      redirectUrl.searchParams.set('email', session.user.email || '');
      return NextResponse.redirect(redirectUrl);
    }

    // Check account status - must be 'active' to access dashboard routes
    // Allow access to /auth/pending-approval itself to prevent redirect loop
    if (
      pathname.startsWith('/dashboard') &&
      accountStatus !== 'active' &&
      pathname !== '/auth/pending-approval'
    ) {
      const redirectUrl = new URL('/auth/pending-approval', request.url);
      redirectUrl.searchParams.set('status', accountStatus || 'pending');
      return NextResponse.redirect(redirectUrl);
    }

    // Add minimal user context headers to response
    response.headers.set('x-user-id', userId);
    response.headers.set('x-user-email', session.user.email || '');
    response.headers.set('x-portal', 'employee');

    // Extract user metadata if available (optional, for optimization)
    // Actual verification still happens in API routes as the source of truth
    const userType = session.user.user_metadata?.user_type;

    if (userType) {
      response.headers.set('x-user-type', userType);
    }

    if (accountStatus) {
      response.headers.set('x-account-status', accountStatus);
    }

    return response;
  } catch (error) {
    // Unexpected error - log and redirect to login
    console.error('[Employee Middleware] Unexpected error:', error);

    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('error', 'internal_error');
    return NextResponse.redirect(redirectUrl);
  }
}

/**
 * Middleware configuration
 * Only run on protected routes, excluding:
 * - Static files (_next/static, _next/image, favicon.ico)
 * - Public routes (/, /about, /features, etc.)
 * - Auth routes (/auth/*)
 * - Image files (*.svg, *.png, *.jpg, etc.)
 * - API routes that handle their own auth (/api/*)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - auth routes
     * - public landing pages
     */
    '/((?!_next/static|_next/image|favicon.ico|auth|about|features|contact|help|privacy|terms|landing|home|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$)(?!^/$).*)',
  ],
};
