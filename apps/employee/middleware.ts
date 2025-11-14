import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { db } from '@tupsafe/database/server';
import { profiles } from '@tupsafe/database/server';
import { eq } from 'drizzle-orm';

/**
 * Route protection configuration based on user type
 *
 * Applicants can access:
 * - /dashboard (main dashboard)
 * - /dashboard/profile
 * - /dashboard/pds (only PDS, not SALN)
 * - /dashboard/applications (their job applications)
 * - /dashboard/positions (browse open positions)
 * - /dashboard/settings
 *
 * Employees can access:
 * - /dashboard (main dashboard)
 * - /dashboard/profile
 * - /dashboard/pds
 * - /dashboard/saln (all SALN routes)
 * - /dashboard/settings
 */

// Routes accessible by applicants only
const APPLICANT_ONLY_ROUTES = [
  '/dashboard/applications',
  '/dashboard/positions',
];

// Routes accessible by employees only
const EMPLOYEE_ONLY_ROUTES = ['/dashboard/saln'];

// Routes accessible by both user types
const SHARED_ROUTES = [
  '/dashboard',
  '/dashboard/profile',
  '/dashboard/pds',
  '/dashboard/settings',
];

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
 * Check if the route is accessible by the given user type
 */
function isRouteAccessible(pathname: string, userType: string): boolean {
  // Check if it's a shared route
  const isSharedRoute = SHARED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isSharedRoute) return true;

  // Check applicant-only routes
  const isApplicantRoute = APPLICANT_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isApplicantRoute) return userType === 'applicant';

  // Check employee-only routes
  const isEmployeeRoute = EMPLOYEE_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isEmployeeRoute) return userType === 'employee';

  // Default: allow if not explicitly restricted
  return true;
}

/**
 * Main middleware function for route protection and user context injection
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast path: Check if it's a public route
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);
  const isAuthRoute = pathname.startsWith('/auth');

  if (isPublicRoute || isAuthRoute) {
    return NextResponse.next();
  }

  try {
    // Initialize Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Middleware] Missing Supabase environment variables');
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

    // Fetch user profile from database
    let userProfile;
    try {
      const profileResult = await db
        .select({
          id: profiles.id,
          userType: profiles.userType,
          employeeId: profiles.employeeId,
          applicantId: profiles.applicantId,
          accountStatus: profiles.accountStatus,
          isActive: profiles.isActive,
        })
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);

      userProfile = profileResult[0];
    } catch (dbError) {
      // Database query failed - log error but allow request to continue (fail open)
      console.error('[Middleware] Database query error:', dbError);

      // Still try to continue with just session data
      response.headers.set('x-user-id', userId);
      return response;
    }

    // If profile doesn't exist, redirect to logout (data inconsistency)
    if (!userProfile) {
      console.error(
        '[Middleware] Profile not found for authenticated user:',
        userId
      );
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('error', 'profile_not_found');
      return NextResponse.redirect(redirectUrl);
    }

    // Check if account is active and approved
    if (!userProfile.isActive || userProfile.accountStatus !== 'active') {
      const redirectUrl = new URL('/auth/login', request.url);
      if (userProfile.accountStatus === 'pending') {
        redirectUrl.searchParams.set('error', 'account_pending_approval');
      } else if (userProfile.accountStatus === 'suspended') {
        redirectUrl.searchParams.set('error', 'account_suspended');
      } else if (userProfile.accountStatus === 'rejected') {
        redirectUrl.searchParams.set('error', 'account_rejected');
      } else {
        redirectUrl.searchParams.set('error', 'account_inactive');
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Check route access based on user type
    const userType = userProfile.userType;
    const hasAccess = isRouteAccessible(pathname, userType);

    if (!hasAccess) {
      // User trying to access forbidden route - redirect to dashboard with error
      const redirectUrl = new URL('/dashboard', request.url);

      if (userType === 'applicant' && pathname.startsWith('/dashboard/saln')) {
        redirectUrl.searchParams.set('error', 'applicants_cannot_access_saln');
      } else if (
        userType === 'employee' &&
        (pathname.startsWith('/dashboard/applications') ||
          pathname.startsWith('/dashboard/positions'))
      ) {
        redirectUrl.searchParams.set(
          'error',
          'employees_cannot_access_applications'
        );
      } else {
        redirectUrl.searchParams.set('error', 'access_denied');
      }

      return NextResponse.redirect(redirectUrl);
    }

    // User has access - add user context headers to response
    response.headers.set('x-user-id', userId);
    response.headers.set('x-user-type', userType);
    response.headers.set('x-employee-id', userProfile.employeeId || '');
    response.headers.set('x-applicant-id', userProfile.applicantId || '');
    response.headers.set('x-account-status', userProfile.accountStatus);

    return response;
  } catch (error) {
    // Unexpected error - log and redirect to login
    console.error('[Middleware] Unexpected error:', error);

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
