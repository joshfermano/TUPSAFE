import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // For development with mock data, we'll use a simplified auth check
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isPublicPage = request.nextUrl.pathname === '/';

  // Check if user is logged in (mock auth stores session in localStorage, checked on client)
  // For now, allow all dashboard routes and redirect to login if needed
  if (!isAuthPage && !isPublicPage) {
    // Protected routes - the client-side auth hook will handle redirects
    return NextResponse.next();
  }

  return NextResponse.next();
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
