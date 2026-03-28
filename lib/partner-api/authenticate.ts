import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractApiKeyFromRequest, sha256Hex } from "./key-crypto";

export type PartnerApiContext = { keyId: string; userId: string };

export async function authenticatePartnerApi(
  req: Request,
): Promise<{ ok: true; ctx: PartnerApiContext } | { ok: false; response: NextResponse }> {
  const raw = extractApiKeyFromRequest(req);
  if (!raw || raw.length < 20) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Missing or invalid API key" }, { status: 401 }),
    };
  }
  const keyHash = sha256Hex(raw);
  const row = await prisma.partnerApiKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { id: true, userId: true },
  });
  if (!row) {
    return { ok: false, response: NextResponse.json({ error: "Invalid API key" }, { status: 401 }) };
  }
  return { ok: true, ctx: { keyId: row.id, userId: row.userId } };
}

export async function touchPartnerApiKey(keyId: string): Promise<void> {
  try {
    await prisma.partnerApiKey.update({
      where: { id: keyId },
      data: { lastUsedAt: new Date() },
    });
  } catch {
    /* ignore */
  }
}

export async function logPartnerApiUsage(params: {
  keyId: string;
  path: string;
  method: string;
  status: number;
}): Promise<void> {
  try {
    await prisma.partnerApiUsage.create({
      data: {
        keyId: params.keyId,
        path: params.path.slice(0, 500),
        method: params.method.slice(0, 16),
        status: params.status,
      },
    });
  } catch {
    /* ignore */
  }
}
