/**
 * CSRF protection for API routes.
 *
 * Validates that the request Origin (or Referer) matches the expected host.
 * NextAuth already protects its own endpoints; this is for custom API routes.
 */

const ALLOWED_ORIGINS = new Set<string>();

function getAllowedOrigins(): Set<string> {
  if (ALLOWED_ORIGINS.size > 0) return ALLOWED_ORIGINS;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const authUrl = process.env.NEXTAUTH_URL;
  const vercelUrl = process.env.VERCEL_URL;

  if (appUrl) ALLOWED_ORIGINS.add(new URL(appUrl).origin);
  if (authUrl) ALLOWED_ORIGINS.add(new URL(authUrl).origin);
  if (vercelUrl) ALLOWED_ORIGINS.add(`https://${vercelUrl}`);

  ALLOWED_ORIGINS.add("http://localhost:3000");
  ALLOWED_ORIGINS.add("http://localhost:3001");
  ALLOWED_ORIGINS.add("http://localhost:3003");

  return ALLOWED_ORIGINS;
}

export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!origin && !referer) {
    // Server-to-server or same-origin navigations may not include Origin;
    // allow by default (rate-limiting handles abuse).
    return true;
  }

  const allowed = getAllowedOrigins();

  if (origin && allowed.has(origin)) return true;

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (allowed.has(refOrigin)) return true;
    } catch {
      return false;
    }
  }

  return false;
}
