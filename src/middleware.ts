import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/uploadthing(.*)',
    '/.well-known(.*)'
]);

const isOrgSelectionRoute = createRouteMatcher(['/org-selection(.*)']);

export default clerkMiddleware(async (auth, request) => {

    const { userId, orgId } = await auth();
    console.log(`[Middleware] URL: ${request.url} | UserId: ${userId} | OrgId: ${orgId}`);

    // 1. If not a public route, protect it
    // Note: We are relying on component-level auth checks (useOrg, etc.) 
    // instead of auth.protect() here to bypass Clerk Edge Runtime cookie loops
    // that occur during localhost development.
    if (!isPublicRoute(request) && !userId) {
        // If there's truly no userId attached to the request headers, we redirect to sign-in
        // But we DO NOT call auth.protect() which throws a hard 401 and kills the session loop.
        const signInUrl = new URL('/sign-in', request.url);
        return NextResponse.redirect(signInUrl);
    }

    // 2. If logged in, but we want to handle org selection on client side or via custom logic
    // We remove the Clerk orgId check here because we are using custom organizations.
    // The DashboardLayout will handle the redirection to /org-selection if no custom org is found.

    // if (userId && !orgId && !isOrgSelectionRoute(request) && !isPublicRoute(request)) {
    //     const orgSelection = new URL('/org-selection', request.url);
    //     return Response.redirect(orgSelection);
    // }

    return NextResponse.next();
}, { clockSkewInMs: 300000 } as any);


export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
