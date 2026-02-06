import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/uploadthing(.*)' // If you use uploadthing or similar public APIs
]);

const isOrgSelectionRoute = createRouteMatcher(['/org-selection(.*)']);

export default clerkMiddleware(async (auth, request) => {
    const { userId, orgId } = await auth();

    // 1. If not a public route, protect it
    if (!isPublicRoute(request)) {
        await auth.protect();
    }

    // 2. If logged in but no org, and not on the selection page or public routes, redirect
    if (userId && !orgId && !isOrgSelectionRoute(request) && !isPublicRoute(request)) {
        const orgSelection = new URL('/org-selection', request.url);
        return Response.redirect(orgSelection);
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
