import { NextResponse } from "next/server";
import {
  ADMIN_GATE_COOKIE,
  adminGateMaxAgeSec,
  signAdminGateValue,
  adminSitePasswordConfigured,
  verifyAdminSitePassword,
} from "@/lib/admin-site-gate";

export const runtime = "nodejs";

/**
 * Optional second factor for /admin pages when ADMIN_SITE_PASSWORD is set.
 * Sets HttpOnly cookie (7 days). Does not replace NextAuth — user must still be logged in as ADMIN.
 */
export async function POST(req: Request) {
  if (!adminSitePasswordConfigured()) {
    return NextResponse.json({ error: "Admin site gate not configured" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password =
    json && typeof json === "object" && "password" in json && typeof (json as { password?: unknown }).password === "string"
      ? (json as { password: string }).password
      : "";

  if (!verifyAdminSitePassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const value = await signAdminGateValue();
  if (!value) {
    return NextResponse.json(
      { error: "ADMIN_GATE_SECRET or NEXTAUTH_SECRET required to sign cookie" },
      { status: 503 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_GATE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: adminGateMaxAgeSec(),
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_GATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
