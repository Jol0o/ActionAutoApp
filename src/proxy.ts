import { NextResponse, NextRequest } from "next/server";

const publicRoutes = [
    '/sign-in',
    '/sign-up',
    '/verify-email',
    '/auth/callback',
    '/upgrade',
    '/api/uploadthing',
    '/.well-known'
];

export async function proxy(request: any) {
    // The previous authentication logic here was checking for a 'refreshToken' cookie.
    // In production, the backend is on a separate domain (e.g. api.actionauto.com), 
    // so Next.js Middleware cannot see the HttpOnly cookies set by the backend.
    // 
    // All authentication routing guards are now safely managed by the AuthProvider.tsx
    // running on the client-side which can make cross-origin API verify requests.
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
