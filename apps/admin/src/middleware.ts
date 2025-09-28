import { createAuthMiddleware } from '@smartgov/auth';
import type { NextRequest } from 'next/server';

let middlewarePromise: Promise<any> | null = null;

export default async function middleware(request: NextRequest) {
  if (!middlewarePromise) {
    middlewarePromise = createAuthMiddleware();
  }
  const authMiddleware = await middlewarePromise;
  return authMiddleware(request);
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
