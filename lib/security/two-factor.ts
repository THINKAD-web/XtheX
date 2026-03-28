import { generateSecret, generateURI, verifySync } from "otplib";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

/** ±30s drift (~1 TOTP step) */
const TOTP_EPOCH_TOLERANCE_SEC = 30;

export function generateTotpSecret(): string {
  return generateSecret();
}

export function buildOtpauthUrl(email: string, secret: string, issuer = "XtheX"): string {
  return generateURI({ issuer, label: email, secret });
}

export function verifyTotpToken(secret: string, token: string): boolean {
  const t = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(t)) return false;
  try {
    const result = verifySync({
      secret,
      token: t,
      epochTolerance: TOTP_EPOCH_TOLERANCE_SEC,
    });
    return result.valid;
  } catch {
    return false;
  }
}

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(4).toString("hex").toUpperCase(),
  );
}

export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((c) => bcrypt.hashSync(c.replace(/\s/g, ""), 10));
}

/** Returns true if code matched a backup code (and removes that hash from JSON array string). */
export async function verifyAndConsumeBackupCode(
  userId: string,
  rawCode: string,
  updateUser: (nextHashesJson: string | null) => Promise<void>,
  currentHashesJson: string | null,
): Promise<boolean> {
  if (!currentHashesJson) return false;
  let hashes: string[];
  try {
    hashes = JSON.parse(currentHashesJson) as string[];
  } catch {
    return false;
  }
  if (!Array.isArray(hashes) || hashes.length === 0) return false;
  const code = rawCode.replace(/\s/g, "").toUpperCase();
  const idx = hashes.findIndex((h) => bcrypt.compareSync(code, h));
  if (idx === -1) return false;
  hashes.splice(idx, 1);
  await updateUser(hashes.length ? JSON.stringify(hashes) : null);
  return true;
}
