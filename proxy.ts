import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/en/dashboard(.*)",
  "/ja/dashboard(.*)",
  "/zh/dashboard(.*)",
  "/advertiser(.*)",
  "/en/advertiser(.*)",
  "/ja/advertiser(.*)",
  "/zh/advertiser(.*)",
  "/admin(.*)",
  "/en/admin(.*)",
  "/ja/admin(.*)",
  "/zh/admin(.*)",
  "/upload(.*)",
  "/en/upload(.*)",
  "/ja/upload(.*)",
  "/zh/upload(.*)",
]);

/**
 * Clerk auth() in Route Handlers needs this middleware to run on the request.
 * Skip i18n rewrite for these API routes (multipart upload, JSON campaign APIs, etc.).
 */
function isApiAuthBypassI18n(pathname: string) {
  return (
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/campaign/") ||
    pathname.startsWith("/api/onboarding/")
  );
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isApiAuthBypassI18n(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  if (isProtectedRoute(req)) await auth.protect();
  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    "/api/admin/:path*",
    "/api/campaign/:path*",
    "/api/onboarding/:path*",
  ],
};
