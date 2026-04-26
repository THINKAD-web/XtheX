/**
 * Optional second-factor lock for `/admin/*` pages on top of NextAuth.
 *
 * When `ADMIN_SITE_PASSWORD` is set, hitting an admin page requires both:
 *   1. NextAuth session with `role === ADMIN`, and
 *   2. A signed `xthex_admin_gate` cookie obtained by submitting the
 *      password to `POST /api/admin/site-gate`.
 *
 * Edge-runtime safe: uses Web Crypto (`crypto.subtle`) instead of
 * `node:crypto`. Sign / verify are async because Web Crypto's HMAC API is
 * promise-based.
 *
 * Format of the cookie value: `${expMs}.${hmacHex}` where `hmacHex` is
 * HMAC-SHA256(secret, expMs).
 */

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

/** Constant-time string compare without `node:crypto`. */
function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

/** Returns the signed cookie value, or `null` when no secret is configured. */
export async function signAdminGateValue(): Promise<string | null> {
  const secret = gateSecret();
  if (!secret) return null;
  const expMs = Date.now() + GATE_MAX_AGE_SEC * 1000;
  const sig = await hmacSha256Hex(secret, String(expMs));
  return `${expMs}.${sig}`;
}

export async function verifyAdminGateCookie(
  raw: string | undefined,
): Promise<boolean> {
  if (!raw) return false;
  const secret = gateSecret();
  if (!secret) return false;
  const idx = raw.indexOf(".");
  if (idx < 1) return false;
  const expMs = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  if (!/^\d+$/.test(expMs) || !/^[a-f0-9]+$/i.test(sig)) return false;
  if (Number(expMs) < Date.now()) return false;
  const expected = await hmacSha256Hex(secret, expMs);
  return timingSafeStringEqual(sig, expected);
}

export function adminSitePasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_SITE_PASSWORD?.trim());
}

export function verifyAdminSitePassword(candidate: string): boolean {
  const expected = process.env.ADMIN_SITE_PASSWORD?.trim();
  if (!expected) return false;
  return timingSafeStringEqual(candidate, expected);
}
