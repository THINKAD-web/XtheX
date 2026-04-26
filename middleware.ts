import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";
import {
  ADMIN_GATE_COOKIE,
  adminSitePasswordConfigured,
  verifyAdminGateCookie,
} from "./lib/admin-site-gate";
import { authenticateAdminInMiddleware } from "./lib/auth/admin-guard";

const handleI18nRouting = createMiddleware(routing);

function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && routing.locales.includes(first as (typeof routing.locales)[number])) {
    return "/" + segments.slice(1).join("/");
  }
  return pathname;
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

function isAdminApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/admin/");
}

function isAdminPagePath(pathname: string): boolean {
  return stripLocalePrefix(pathname).startsWith("/admin");
}

function isProtectedPath(pathname: string): boolean {
  // /admin is handled separately (admin-only role gate). This list covers
  // routes that just require any logged-in user.
  const path = stripLocalePrefix(pathname);
  return (
    path.startsWith("/dashboard") ||
    path.startsWith("/advertiser") ||
    path.startsWith("/upload") ||
    path.startsWith("/campaigns") ||
    path.startsWith("/recommend") ||
    path.startsWith("/community")
  );
}

/**
 * Paths that should skip next-intl rewriting (they're API endpoints, not
 * locale-prefixed pages). Admin/campaign/onboarding APIs were previously
 * lumped into a single "bypass" branch that ALSO skipped auth — that was
 * the bug. Now i18n bypass is the only thing this controls.
 */
function bypassesI18nRouting(pathname: string): boolean {
  return (
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/campaign/") ||
    pathname.startsWith("/api/onboarding/")
  );
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // NextAuth must always pass through (its handlers respond JSON; HTML breaks
  // the client-side fetch with CLIENT_FETCH_ERROR).
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // ── Admin gate ────────────────────────────────────────────────────────
  // Page paths under `/[locale]/admin/*` and API paths under `/api/admin/*`
  // require ADMIN role (NextAuth session) OR a valid `ADMIN_SECRET`.
  const adminApi = isAdminApiPath(pathname);
  const adminPage = !adminApi && isAdminPagePath(pathname);
  if (adminApi || adminPage) {
    const auth = await authenticateAdminInMiddleware(req);
    if (auth.kind === "none") {
      if (adminApi) {
        const status = auth.reason === "no-token" ? 401 : 403;
        return NextResponse.json(
          {
            error:
              auth.reason === "no-token" ? "Unauthorized" : "Forbidden",
          },
          { status },
        );
      }
      const prefix = localePrefixFromPathname(pathname);
      if (auth.reason === "no-token") {
        const loginUrl = new URL(`${prefix}/login`, req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Logged in but not admin: send home rather than back to login.
      return NextResponse.redirect(new URL(`${prefix}/`, req.url));
    }

    // Optional second factor for /admin/* pages: ADMIN_SITE_PASSWORD gate.
    // (Skipped for API and for the gate page itself.)
    if (adminPage && auth.kind === "session" && adminSitePasswordConfigured()) {
      const stripped = stripLocalePrefix(pathname);
      if (stripped !== "/admin/gate") {
        const gateVal = req.cookies.get(ADMIN_GATE_COOKIE)?.value;
        if (!verifyAdminGateCookie(gateVal)) {
          const prefix = localePrefixFromPathname(pathname);
          const gateUrl = new URL(`${prefix}/admin/gate`, req.url);
          gateUrl.searchParams.set("callbackUrl", pathname);
          return NextResponse.redirect(gateUrl);
        }
      }
    }

    // Admin authenticated. API paths skip i18n; page paths fall through to
    // next-intl below.
    if (adminApi) return NextResponse.next();
    return handleI18nRouting(req);
  }

  // ── Non-admin API i18n bypass ────────────────────────────────────────
  if (bypassesI18nRouting(pathname)) {
    return NextResponse.next();
  }

  // ── Generic protected paths (any logged-in user) ─────────────────────
  if (isProtectedPath(pathname)) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret && process.env.NODE_ENV === "development") {
      console.error(
        "[middleware] NEXTAUTH_SECRET is missing — login cookies cannot be verified. Set it in .env.local (openssl rand -base64 32).",
      );
    }
    const token = await getToken({ req, secret });
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
