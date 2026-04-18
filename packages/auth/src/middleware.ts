import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { schema } from '@tupsafe/database/server';

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

// TTL for profile cache cookie: 5 minutes in milliseconds
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
// TTL expressed as seconds for cookie maxAge
const PROFILE_CACHE_MAX_AGE_SECONDS = 300;

interface ProfileCachePayload {
  id: string;
  role: string;
  is_active: boolean;
  exp: number;
}

interface AuthMiddlewareOptions {
  /**
   * Portal identifier used to namespace the profile cache cookie.
   * Prevents cross-portal cache collisions when both portals share a domain.
   * Defaults to 'default' when not provided.
   */
  portal?: 'admin' | 'employee';
}

/**
 * Attempt to read and validate the profile cache cookie.
 *
 * Returns the cached profile when:
 *   - The cookie exists and is valid JSON
 *   - The cached user ID matches the authenticated user ID
 *   - The TTL has not expired
 *
 * Returns null on any failure, causing a fall-through to the DB query.
 * Edge Runtime safe: uses only JSON.parse, no Buffer or Node.js crypto.
 */
function readProfileCache(
  req: NextRequest,
  userId: string,
  cookieName: string
): { role: string; is_active: boolean } | null {
  try {
    const raw = req.cookies.get(cookieName)?.value;
    if (!raw) return null;

    const payload = JSON.parse(raw) as ProfileCachePayload;

    // Validate structure before trusting the payload
    if (
      typeof payload.id !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.is_active !== 'boolean' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    // Ensure the cached entry belongs to the currently authenticated user
    if (payload.id !== userId) return null;

    // Reject expired entries
    if (Date.now() > payload.exp) return null;

    return { role: payload.role, is_active: payload.is_active };
  } catch {
    // Corrupted cookie value — silently discard and fall through to DB query
    return null;
  }
}

/**
 * Write the profile cache cookie onto the outgoing response.
 *
 * httpOnly + secure + sameSite=lax prevents client-side access and CSRF.
 * The 5-minute maxAge means stale data is bounded to one cron cycle of role changes.
 */
function writeProfileCache(
  response: NextResponse,
  userId: string,
  role: string,
  is_active: boolean,
  cookieName: string
): void {
  const payload: ProfileCachePayload = {
    id: userId,
    role,
    is_active,
    exp: Date.now() + PROFILE_CACHE_TTL_MS,
  };

  response.cookies.set(cookieName, JSON.stringify(payload), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: PROFILE_CACHE_MAX_AGE_SECONDS,
    path: '/',
  });
}

export async function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  const portal = options.portal ?? 'default';
  const profileCacheCookieName = `x-profile-cache-${portal}`;

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
            cookiesToSet.forEach(({ name, value, options: _options }) =>
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
        // --- Profile cache check ---
        // Attempt to serve role/is_active from the short-lived cache cookie before
        // hitting the database. Falls through to DB query on any cache miss or error.
        const cachedProfile = readProfileCache(req, user.id, profileCacheCookieName);

        let profile: { role: string; is_active: boolean } | null = cachedProfile;
        const cacheHit = cachedProfile !== null;

        if (!cacheHit) {
          // Cache miss: query the database for the profile
          const { data: fetchedProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role, is_active')
            .eq('id', user.id)
            .single() as { data: { role: string; is_active: boolean } | null; error: unknown };

          if (profileError || !fetchedProfile) {
            console.error('Profile fetch error:', profileError);
            // If profile doesn't exist, redirect to profile setup
            if (!pathname.startsWith('/auth/setup')) {
              return NextResponse.redirect(new URL('/auth/setup', req.url));
            }
            return supabaseResponse;
          }

          profile = fetchedProfile;
        }

        // profile is guaranteed non-null here (cache hit or successful DB fetch)
        const resolvedProfile = profile!;

        // Check if user account is active
        if (!resolvedProfile.is_active) {
          return NextResponse.redirect(new URL('/auth/inactive', req.url));
        }

        // Check admin routes (admin and co_admin have access)
        const isAdminRoute = ADMIN_ROUTES.some((route) =>
          pathname.startsWith(route)
        );

        if (isAdminRoute && !['superadmin', 'admin'].includes(resolvedProfile.role)) {
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }

        // Check HR routes (hr, admin, and co_admin have access)
        const isHrRoute = HR_ROUTES.some((route) => pathname.startsWith(route));

        if (isHrRoute && !['superadmin', 'admin', 'hr'].includes(resolvedProfile.role)) {
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }

        // Add user info to headers for use in server components
        supabaseResponse.headers.set('x-user-id', user.id);
        supabaseResponse.headers.set('x-user-role', resolvedProfile.role);

        // On cache miss, persist the freshly-fetched profile to the cache cookie
        // so subsequent requests within the TTL window skip the DB query entirely.
        if (!cacheHit) {
          writeProfileCache(
            supabaseResponse,
            user.id,
            resolvedProfile.role,
            resolvedProfile.is_active,
            profileCacheCookieName
          );
        }
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
  const userRole = headers.get('x-user-role') as
    | 'employee'
    | 'hr'
    | 'admin'
    | 'superadmin'
    | null;

  return userId ? { id: userId, role: userRole } : null;
}
