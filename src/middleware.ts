import { NextResponse, NextRequest } from "next/server";

const publicRoutes = [
    '/sign-in',
    '/sign-up',
    '/upgrade',
    '/api/uploadthing',
    '/.well-known'
];

export async function middleware(request: any) {
    const { pathname } = request.nextUrl;

    // 1. Check if route is public
    const isPublic = publicRoutes.some(route => pathname.startsWith(route));

    // 2. Check for native refresh token cookie
    // Note: HttpOnly cookies ARE accessible in Middleware (Edge Runtime)
    const refreshToken = request.cookies.get('refreshToken');
    const isSignedIn = !!refreshToken;

    console.log(`[Middleware] URL: ${pathname} | SignedIn: ${isSignedIn}`);

    // 3. Redirect logic
    if (!isPublic && !isSignedIn) {
        const signInUrl = new URL('/sign-in', request.url);
        // Preserve redirect_url
        signInUrl.searchParams.set('redirect_url', pathname);
        return NextResponse.redirect(signInUrl);
    }

    // Optional: If signed in and on sign-in page, redirect to home
    if (isPublic && isSignedIn && (pathname === '/sign-in' || pathname === '/sign-up')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.webmanifest (PWA manifest)
         * - public folder files (images, variants, themes, logos, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|images|variants|themes|logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
    ],
};
