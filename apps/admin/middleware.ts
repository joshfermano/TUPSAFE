/**
 * Mock Authentication Middleware for Admin Portal
 *
 * This middleware is simplified for localStorage-based mock authentication.
 * All auth checks happen client-side in the AuthContext and page layouts.
 *
 * MIGRATION: To use Supabase Auth, uncomment the code below and remove the simple middleware.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/not-found',
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For mock auth using localStorage, we rely on client-side checks
  // Just allow the request to proceed - AuthContext will handle redirects
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

/*
 * MIGRATION TO SUPABASE AUTH:
 *
 * Uncomment this code and remove the simple middleware above:
 *
 * import { createAuthMiddleware } from '@tupsafe/auth';
 * import type { NextRequest } from 'next/server';
 *
 * let middlewarePromise: Promise<any> | null = null;
 *
 * export default async function middleware(request: NextRequest) {
 *   if (!middlewarePromise) {
 *     middlewarePromise = createAuthMiddleware();
 *   }
 *   const authMiddleware = await middlewarePromise;
 *   return authMiddleware(request);
 * }
 */
