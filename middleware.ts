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
    path.startsWith("/recommend") ||
    path.startsWith("/community")
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

  // NextAuth: JSON만 반환해야 함 (HTML이면 CLIENT_FETCH_ERROR).
  // matcher에서 /api/auth/* 는 제외해 이 분기가 필요 없지만, 실수로 matcher에
  // /api/auth 가 다시 들어오면 여기서 즉시 통과시킨다.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (isApiAuthBypassI18n(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret && process.env.NODE_ENV === "development") {
      console.error(
        "[middleware] NEXTAUTH_SECRET is missing — login cookies cannot be verified. Set it in .env.local (openssl rand -base64 32).",
      );
    }
    const token = await getToken({
      req,
      secret,
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
    // /api/auth/* 는 matcher에 넣지 않음 — middleware가 돌면 일부 환경에서
    // 세션 요청이 비정상 처리될 수 있고, 어차피 첫 패턴이 api를 제외함.
  ],
};
