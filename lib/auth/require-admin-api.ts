import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import {
  ADMIN_SECRET_COOKIE,
  ADMIN_SECRET_HEADER,
  adminSecretMatches,
} from "@/lib/auth/admin-guard";

/**
 * Result userId is `null` when authenticated via `ADMIN_SECRET` (no DB user
 * attached). Handlers that need a user id MUST handle the null case — most
 * audit-logged handlers should treat secret auth as "system" or reject it.
 */
export async function requireAdminApi(): Promise<
  | { ok: true; userId: string | null; via: "session" | "secret" }
  | { ok: false; response: NextResponse }
> {
  const session = await getAuthSession();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role === UserRole.ADMIN) {
      return { ok: true, userId: session.user.id, via: "session" };
    }
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  // Fallback: ADMIN_SECRET via header or cookie.
  const hdrs = await headers();
  if (adminSecretMatches(hdrs.get(ADMIN_SECRET_HEADER))) {
    return { ok: true, userId: null, via: "secret" };
  }
  const ck = await cookies();
  if (adminSecretMatches(ck.get(ADMIN_SECRET_COOKIE)?.value ?? null)) {
    return { ok: true, userId: null, via: "secret" };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
