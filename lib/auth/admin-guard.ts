/**
 * Admin authentication guard — single source of truth for "is this caller an admin?".
 *
 * Two ways to authenticate as admin:
 *   1) Primary: NextAuth session with `role === ADMIN` (production path).
 *   2) Fallback: `ADMIN_SECRET` matched via `x-admin-secret` header or
 *      `xthex_admin_secret` cookie. Intended as a temporary mechanism for
 *      pre-Phase-3 testing/setup. Set the env var to enable; leave unset to
 *      disable entirely.
 *
 * Phase 3 swap: when migrating away from NextAuth, replace the session branch
 * here. Middleware and per-route guards (`requireAdminApi`, `gateAdminDashboard`)
 * all funnel through this module — there is no other place to change.
 *
 * Edge-runtime safe: no `node:crypto`, no Prisma, no `next/headers`.
 * The middleware-facing function uses `next-auth/jwt#getToken`.
 */
import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Avoid importing `@prisma/client` here — it pulls Prisma into the Edge
// runtime bundle (~160 kB). The JWT role claim is a plain string anyway.
const ADMIN_ROLE = "ADMIN" as const;

export const ADMIN_SECRET_HEADER = "x-admin-secret";
export const ADMIN_SECRET_COOKIE = "xthex_admin_secret";

export type AdminAuthResult =
  | { kind: "session"; userId: string; role: "ADMIN" }
  | { kind: "secret" }
  | { kind: "none"; reason: "no-token" | "wrong-role" };

/** Constant-time string comparison without depending on `node:crypto`. */
function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Returns `true` only if `ADMIN_SECRET` is configured AND the candidate
 * matches in constant time. Returns `false` when the env var is unset, so
 * a missing env never grants access.
 */
export function adminSecretMatches(candidate: string | null | undefined): boolean {
  const expected = process.env.ADMIN_SECRET?.trim();
  if (!expected) return false;
  if (!candidate) return false;
  const trimmed = candidate.trim();
  if (!trimmed) return false;
  return timingSafeStringEqual(trimmed, expected);
}

/** Read header or cookie and check against `ADMIN_SECRET`. */
export function adminSecretFromRequest(req: NextRequest): boolean {
  const header = req.headers.get(ADMIN_SECRET_HEADER);
  if (adminSecretMatches(header)) return true;
  const cookie = req.cookies.get(ADMIN_SECRET_COOKIE)?.value;
  return adminSecretMatches(cookie);
}

/**
 * Middleware-side admin authentication. Reads the NextAuth JWT directly so
 * we can run inside the Edge runtime without a DB call.
 */
export async function authenticateAdminInMiddleware(
  req: NextRequest,
): Promise<AdminAuthResult> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) {
    const token = await getToken({ req, secret });
    if (token) {
      const role = (token as { role?: string }).role;
      if (role === ADMIN_ROLE) {
        const userId =
          (token.sub as string | undefined) ??
          ((token as { id?: string }).id ?? "");
        return { kind: "session", userId, role: "ADMIN" };
      }
      // Logged in but not an admin — treat as forbidden, do not fall through
      // to ADMIN_SECRET (otherwise a leaked secret could be combined with
      // any session to escalate; we intentionally don't blend the two).
      return { kind: "none", reason: "wrong-role" };
    }
  }
  // No session — accept ADMIN_SECRET if configured.
  if (adminSecretFromRequest(req)) {
    return { kind: "secret" };
  }
  return { kind: "none", reason: "no-token" };
}
