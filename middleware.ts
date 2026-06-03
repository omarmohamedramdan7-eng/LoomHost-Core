import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/api/sites/render(.*)', // Allow public rendered sites
  '/api/public-projects(.*)', // Public projects retrieval API
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect all non-public routes (such as control panel, generator, code editor, and user profile)
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Protect internal paths including user profile, editor configurations, and private sub-APIs
    '/profile(.*)',
    '/studio(.*)',
    '/editor(.*)',
    '/generator(.*)',
    // Apply authentication to secure internal API routes, while leaving render endpoint open
    '/api/(?!sites/render|public-projects)(.*)',
  ],
};
