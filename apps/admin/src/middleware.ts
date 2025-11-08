/**
 * Mock Authentication Middleware for Admin Portal
 *
 * This middleware checks for the mock auth session in cookies/headers.
 * Since we're using localStorage for session management (client-side only),
 * this middleware is simplified to allow navigation.
 *
 * MIGRATION GUIDE - How to swap for Supabase Auth Middleware:
 *
 * 1. Replace this file content with:
 *    ```typescript
 *    import { createAuthMiddleware } from '@tupsafe/auth';
 *    import type { NextRequest, NextResponse } from 'next/server';
 *
 *    type MiddlewareFunction = (req: NextRequest) => Promise<NextResponse>;
 *    let middlewarePromise: Promise<MiddlewareFunction> | null = null;
 *
 *    export default async function middleware(request: NextRequest) {
 *      if (!middlewarePromise) {
 *        middlewarePromise = createAuthMiddleware();
 *      }
 *      const authMiddleware = await middlewarePromise;
 *      return authMiddleware(request);
 *    }
 *    ```
 *
 * 2. Keep the same config matcher
 *
 * 3. Supabase middleware will handle:
 *    - Session validation from cookies
 *    - Automatic token refresh
 *    - Protected route enforcement
 *    - RLS policy enforcement
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For mock auth, we rely on client-side checks in the layout/pages
  // because localStorage is only available client-side
  // Just allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
