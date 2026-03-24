import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && routing.locales.includes(first as (typeof routing.locales)[number])) {
    return "/" + segments.slice(1).join("/");
  }
  return pathname;
}

function isProtectedPath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  return (
    path.startsWith("/dashboard") ||
    path.startsWith("/advertiser") ||
    path.startsWith("/admin") ||
    path.startsWith("/upload") ||
    path.startsWith("/campaigns") ||
    path.startsWith("/recommend")
  );
}

function localePrefixFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && routing.locales.includes(first as (typeof routing.locales)[number])) {
    if (first === routing.defaultLocale) return "";
    return `/${first}`;
  }
  return "";
}

function isApiAuthBypassI18n(pathname: string) {
  return (
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/campaign/") ||
    pathname.startsWith("/api/onboarding/")
  );
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (isApiAuthBypassI18n(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const prefix = localePrefixFromPathname(pathname);
      const loginUrl = new URL(`${prefix}/login`, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return handleI18nRouting(req);
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    "/api/admin/:path*",
    "/api/campaign/:path*",
    "/api/onboarding/:path*",
  ],
};
