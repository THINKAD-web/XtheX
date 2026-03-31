import { createHmac, timingSafeEqual } from "crypto";

/** HttpOnly cookie set after POST /api/admin/site-gate succeeds */
export const ADMIN_GATE_COOKIE = "xthex_admin_gate";

const GATE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export function adminGateMaxAgeSec(): number {
  return GATE_MAX_AGE_SEC;
}

function gateSecret(): string | null {
  const s =
    process.env.ADMIN_GATE_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "";
  return s.length > 0 ? s : null;
}

/** Payload: `{expMs}.{hmacHex}` */
export function signAdminGateValue(): string | null {
  const secret = gateSecret();
  if (!secret) return null;
  const expMs = Date.now() + GATE_MAX_AGE_SEC * 1000;
  const sig = createHmac("sha256", secret).update(String(expMs)).digest("hex");
  return `${expMs}.${sig}`;
}

export function verifyAdminGateCookie(raw: string | undefined): boolean {
  if (!raw) return false;
  const secret = gateSecret();
  if (!secret) return false;
  const idx = raw.indexOf(".");
  if (idx < 1) return false;
  const expMs = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  if (!/^\d+$/.test(expMs) || !/^[a-f0-9]+$/i.test(sig)) return false;
  if (Number(expMs) < Date.now()) return false;
  const expected = createHmac("sha256", secret).update(expMs).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

export function adminSitePasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_SITE_PASSWORD?.trim());
}

export function verifyAdminSitePassword(candidate: string): boolean {
  const expected = process.env.ADMIN_SITE_PASSWORD?.trim();
  if (!expected) return false;
  try {
    return timingSafeEqual(
      Buffer.from(candidate, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}
