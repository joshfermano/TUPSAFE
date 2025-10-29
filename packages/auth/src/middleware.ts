import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { schema } from '@tupsafe/database';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/auth/verify',
  '/',
  '/about',
  '/features',
  '/contact',
  '/help',
  '/privacy',
  '/terms',
  '/landing',
  '/home',
];

// Admin-only routes
const ADMIN_ROUTES = ['/admin', '/users', '/settings', '/audit', '/reports'];

// HR routes
const HR_ROUTES = ['/submissions/review', '/approvals', '/department'];

export async function createAuthMiddleware() {
  return async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Create a Supabase client configured for middleware
    let supabaseResponse = NextResponse.next({
      request: req,
    });

    const supabase = createServerClient<typeof schema>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              req.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request: req,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Check if the route is public
    const isPublicRoute = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    // If it's a public route, skip authentication entirely
    if (isPublicRoute) {
      return supabaseResponse;
    }

    try {
      // Refresh session if expired - required for Server Components
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // If there's an auth error, redirect to login
      if (error) {
        console.error('Auth middleware error:', error);
        const redirectUrl = new URL('/auth/login', req.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // If no user and accessing protected route, redirect to login
      if (!user) {
        const redirectUrl = new URL('/auth/login', req.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // If user exists, get the user profile for role checking
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('Profile fetch error:', profileError);
          // If profile doesn't exist, redirect to profile setup
          if (!pathname.startsWith('/auth/setup')) {
            return NextResponse.redirect(new URL('/auth/setup', req.url));
          }
          return supabaseResponse;
        }

        // Check if user account is active
        if (!profile.is_active) {
          return NextResponse.redirect(new URL('/auth/inactive', req.url));
        }

        // Check admin routes
        const isAdminRoute = ADMIN_ROUTES.some((route) =>
          pathname.startsWith(route)
        );

        if (isAdminRoute && profile.role !== 'admin') {
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }

        // Check HR routes
        const isHrRoute = HR_ROUTES.some((route) => pathname.startsWith(route));

        if (isHrRoute && !['hr', 'admin'].includes(profile.role)) {
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }

        // Add user info to headers for use in server components
        supabaseResponse.headers.set('x-user-id', user.id);
        supabaseResponse.headers.set('x-user-role', profile.role);
      }

      return supabaseResponse;
    } catch (error) {
      console.error('Middleware error:', error);

      // If there's an unexpected error in protected route, redirect to login
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  };
}

// Configuration moved to individual app middleware files

// Helper function to get user from middleware headers in server components
export function getUserFromHeaders(headers: Headers) {
  const userId = headers.get('x-user-id');
  const userRole = headers.get('x-user-role') as 'employee' | 'hr' | 'admin' | 'supervisor' | 'auditor' | null;

  return userId ? { id: userId, role: userRole } : null;
}
