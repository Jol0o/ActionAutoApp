import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/inventory-public'];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // 0. Ignore static files, api routes, and common dev paths
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/.well-known') ||
        pathname.includes('.') // common for static files like images/manifests
    ) {
        return NextResponse.next();
    }

    // Check for the access token cookie
    const token = request.cookies.get('auth_token_frontend')?.value;

    console.log(`[Middleware] Path: ${pathname}, Token present: ${!!token}`);

    // 1. If no token and trying to access a protected route (anything not public)
    if (!token && !isPublicRoute) {
        // Exclude static assets and api routes if necessary, but matcher usually handles this
        console.log(`[Middleware] Unauthorized access to ${pathname}. Redirecting to /login`);
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. If token exists and trying to access login/signup, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/signup')) {
        console.log(`[Middleware] Redirecting to / from ${pathname}`);
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
