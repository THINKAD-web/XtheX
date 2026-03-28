import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";
import {
  authenticatePartnerApi,
  logPartnerApiUsage,
  touchPartnerApiKey,
} from "@/lib/partner-api/authenticate";
import { toPartnerMediaDto } from "@/lib/partner-api/serialize-media";

export const runtime = "nodejs";

const QuerySchema = z.object({
  since: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(req: Request) {
  const rl = withRateLimit(req, { limit: 120, windowMs: 60_000 });
  if (rl) return rl;

  const pathname = new URL(req.url).pathname;
  const auth = await authenticatePartnerApi(req);
  if (!auth.ok) return auth.response;

  const sp = new URL(req.url).searchParams;
  const parsed = QuerySchema.safeParse({
    since: sp.get("since") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    const res = NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
    void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "GET", status: res.status });
    return res;
  }

  const limit = parsed.data.limit ?? 50;
  let sinceDate: Date | undefined;
  if (parsed.data.since?.trim()) {
    const d = new Date(parsed.data.since);
    if (Number.isNaN(d.getTime())) {
      const res = NextResponse.json({ error: "Invalid since (ISO 8601)" }, { status: 400 });
      void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "GET", status: res.status });
      return res;
    }
    sinceDate = d;
  }

  const rows = await prisma.media.findMany({
    where: {
      createdById: auth.ctx.userId,
      ...(sinceDate ? { updatedAt: { gt: sinceDate } } : {}),
    },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: limit,
  });

  const res = NextResponse.json({
    ok: true,
    data: rows.map(toPartnerMediaDto),
    page: {
      limit,
      count: rows.length,
      hint:
        rows.length === limit ?
          "If you need more rows, call again with since=<last item updatedAt ISO>"
        : undefined,
    },
  });

  void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "GET", status: res.status });
  void touchPartnerApiKey(auth.ctx.keyId);
  return res;
}
