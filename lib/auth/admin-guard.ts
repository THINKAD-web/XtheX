/**
 * Admin authentication guard — single source of truth for "is this caller an admin?".
 *
 * Authenticates via NextAuth session with `role === ADMIN`. The middleware
 * uses this to gate `/api/admin/*` and `/[locale]/admin/*` before any
 * downstream handler/layout runs.
 *
 * Phase-3 swap point: when migrating IdPs (e.g. NextAuth v5 / Auth.js),
 * replace the `getToken` call below. Middleware and per-route guards
 * (`requireAdminApi`, `gateAdminDashboard`) all funnel through here — there
 * is no other place to change for the role contract.
 *
 * Edge-runtime safe: no `node:crypto`, no Prisma, no `next/headers`.
 */
import { type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Avoid importing `@prisma/client` here — it pulls Prisma into the Edge
// runtime bundle (~160 kB). The JWT role claim is a plain string anyway.
const ADMIN_ROLE = "ADMIN" as const;

export type AdminAuthResult =
  | { kind: "session"; userId: string; role: "ADMIN" }
  | { kind: "none"; reason: "no-token" | "wrong-role" };

/**
 * Middleware-side admin authentication. Reads the NextAuth JWT directly so
 * we can run inside the Edge runtime without a DB call.
 */
export async function authenticateAdminInMiddleware(
  req: NextRequest,
): Promise<AdminAuthResult> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return { kind: "none", reason: "no-token" };

  const token = await getToken({ req, secret });
  if (!token) return { kind: "none", reason: "no-token" };

  const role = (token as { role?: string }).role;
  if (role !== ADMIN_ROLE) return { kind: "none", reason: "wrong-role" };

  const userId =
    (token.sub as string | undefined) ??
    ((token as { id?: string }).id ?? "");
  return { kind: "session", userId, role: "ADMIN" };
}
