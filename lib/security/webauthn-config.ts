/** RP ID for WebAuthn (must match the sign-in origin’s host). */
export function webauthnRpId(hostHeader: string | null): string {
  const fromEnv = process.env.WEBAUTHN_RP_ID?.trim();
  if (fromEnv) return fromEnv;
  const host = (hostHeader ?? "localhost").split(":")[0]!;
  if (host === "localhost" || host === "127.0.0.1") return "localhost";
  return host;
}

export function webauthnOrigin(req: Request): string {
  const fromEnv = process.env.WEBAUTHN_ORIGIN?.trim();
  if (fromEnv) return fromEnv;
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
