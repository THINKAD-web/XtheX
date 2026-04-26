/** HttpOnly cookie set after POST /api/admin/site-gate succeeds */
export const ADMIN_GATE_COOKIE = "xthex_admin_gate";

const GATE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

const te = new TextEncoder();

/**
 * HMAC-SHA256(secret, message) as lowercase hex, compatible with
 * `createHmac("sha256", secret).update(message).digest("hex")` in Node
 * (UTF-8 key and message).
 */
async function hmacSha256HexUtf8(secret: string, message: string): Promise<string> {
  const c = globalThis.crypto;
  if (!c?.subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available");
  }
  const key = await c.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await c.subtle.sign("HMAC", key, te.encode(message));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Byte-wise timing-safe string compare (UTF-8). Replaces `timingSafeEqual` on
 * UTF-8 buffers; avoids `node:crypto` so the module is Edge-safe.
 */
function timingSafeEqualUtf8String(a: string, b: string): boolean {
  const ab = te.encode(a);
  const bb = te.encode(b);
  if (ab.length !== bb.length) return false;
  let out = 0;
  for (let i = 0; i < ab.length; i++) out |= ab[i]! ^ bb[i]!;
  return out === 0;
}

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
export async function signAdminGateValue(): Promise<string | null> {
  const secret = gateSecret();
  if (!secret) return null;
  const expMs = Date.now() + GATE_MAX_AGE_SEC * 1000;
  const expStr = String(expMs);
  const sig = await hmacSha256HexUtf8(secret, expStr);
  return `${expStr}.${sig}`;
}

export async function verifyAdminGateCookie(raw: string | undefined): Promise<boolean> {
  try {
    if (!raw) return false;
    const secret = gateSecret();
    if (!secret) return false;
    const idx = raw.indexOf(".");
    if (idx < 1) return false;
    const expMs = raw.slice(0, idx);
    const sig = raw.slice(idx + 1);
    if (!/^\d+$/.test(expMs) || !/^[a-f0-9]+$/i.test(sig)) return false;
    if (Number(expMs) < Date.now()) return false;
    const expected = await hmacSha256HexUtf8(secret, expMs);
    return timingSafeEqualUtf8String(sig, expected);
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
  return timingSafeEqualUtf8String(candidate, expected);
}
