import { createAuthMiddleware } from '@tupsafe/auth';
import type { NextRequest, NextResponse } from 'next/server';

type MiddlewareFunction = (req: NextRequest) => Promise<NextResponse>;
let middlewarePromise: Promise<MiddlewareFunction> | null = null;

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
