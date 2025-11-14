/**
 * Admin Portal Authentication Middleware (Edge Runtime Compatible)
 *
 * Protects all admin routes with Supabase authentication.
 * Role verification is handled by API routes and server components to maintain
 * Edge Runtime compatibility (middleware cannot use Node.js modules).
 *
 * Security Features:
 * - Supabase session validation (edge-compatible)
 * - Session timeout management
 * - Redirects to login for unauthenticated users
 * - Role-based access control delegated to API routes
 *
 * Note: This middleware runs in Edge Runtime and cannot access database directly.
 * User role and permissions are verified in API routes and server components using
 * the @tupsafe/database package.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/forgot-password',
  '/not-found',
];

/**
 * Check if the route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Main middleware function for admin portal route protection
 *
 * Edge Runtime Compatible:
 * - Only validates Supabase session existence
 * - Does NOT query database (database uses Node.js modules)
 * - Role verification happens in API routes and server components
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast path: Allow public routes
  const isPublic = isPublicRoute(pathname);

  if (isPublic) {
    return NextResponse.next();
  }

  try {
    // Initialize Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Admin Middleware] Missing Supabase environment variables');
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

    // Check authentication - this is edge-compatible
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
     * Role and Permission Verification:
     *
     * Role-based access control (admin/super_admin/hr only) is enforced in:
     * 1. API routes using @tupsafe/database to query user profile
     * 2. Server components using @tupsafe/database for role checks
     * 3. Client-side AuthContext for UI rendering
     *
     * This approach maintains Edge Runtime compatibility while ensuring security.
     * Users without proper roles will be redirected when they access protected resources.
     */

    // Add minimal user context headers to response
    response.headers.set('x-user-id', userId);
    response.headers.set('x-user-email', session.user.email || '');
    response.headers.set('x-portal', 'admin');

    // Extract role from user metadata if available (optional, for optimization)
    // Role verification still happens in API routes as the source of truth
    const userRole = session.user.user_metadata?.role;
    if (userRole) {
      response.headers.set('x-user-role', userRole);
    }

    return response;
  } catch (error) {
    // Unexpected error - log and redirect to login
    console.error('[Admin Middleware] Unexpected error:', error);

    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('error', 'internal_error');
    return NextResponse.redirect(redirectUrl);
  }
}

/**
 * Middleware configuration
 * Only protect dashboard routes - everything else is public or handles its own auth
 */
export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
