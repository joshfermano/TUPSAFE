/**
 * Employee Portal Authentication Middleware (Edge Runtime Compatible)
 *
 * Protects employee portal routes with Supabase authentication.
 * User type and profile verification is handled by API routes and server components
 * to maintain Edge Runtime compatibility (middleware cannot use Node.js modules).
 *
 * Security Features:
 * - Supabase session validation (edge-compatible)
 * - Session timeout management
 * - Redirects to login for unauthenticated users
 * - User type-based routing delegated to API routes/server components
 *
 * Note: This middleware runs in Edge Runtime and cannot access database directly.
 * User type (applicant/employee), profile data, and permissions are verified in
 * API routes and server components using the @tupsafe/database package.
 *
 * Route Protection:
 * - Applicants: /dashboard, /profile, /pds, /applications, /positions, /settings
 * - Employees: /dashboard, /profile, /pds, /saln, /settings
 * - Enforcement happens in server components and API routes based on user metadata
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  // Fast path: Allow public routes
  const isPublic = isPublicRoute(pathname);
  const isAuthRoute = pathname.startsWith('/auth');

  if (isPublic || isAuthRoute) {
    return NextResponse.next();
  }

  try {
    // Initialize Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Employee Middleware] Missing Supabase environment variables');
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('error', 'configuration_error');
      return NextResponse.redirect(redirectUrl);
    }

    // Create response object for cookie management
    let response = NextResponse.next({ request });

    // Create Supabase client with request context
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
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

    // Add minimal user context headers to response
    response.headers.set('x-user-id', userId);
    response.headers.set('x-user-email', session.user.email || '');
    response.headers.set('x-portal', 'employee');

    // Extract user metadata if available (optional, for optimization)
    // Actual verification still happens in API routes as the source of truth
    const userType = session.user.user_metadata?.user_type;
    const accountStatus = session.user.user_metadata?.account_status;

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
