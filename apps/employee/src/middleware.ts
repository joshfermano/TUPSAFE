import { createAuthMiddleware } from '@smartgov/auth';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const authMiddleware = await createAuthMiddleware();
  return await authMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Only run middleware on protected routes, excluding:
     * - Public routes (/, /about, /features, /contact, /help, /privacy, /terms, /landing, /home)
     * - Auth routes (/auth/*)
     * - Static files (_next/static, _next/image, favicon.ico, images)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth|about|features|contact|help|privacy|terms|landing|home|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$)(?!^/$).*)',
  ],
};