import { createHash, randomBytes } from "crypto";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** 전체 키 1회만 노출; DB에는 해시만 저장 */
export function generatePartnerApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const suffix = randomBytes(24).toString("hex");
  const rawKey = `xtx_live_${suffix}`;
  return {
    rawKey,
    keyPrefix: `${rawKey.slice(0, 18)}…`,
    keyHash: sha256Hex(rawKey),
  };
}

export function extractApiKeyFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const t = header.slice(7).trim();
    if (t) return t;
  }
  const x = req.headers.get("x-api-key")?.trim();
  if (x) return x;
  return null;
}
