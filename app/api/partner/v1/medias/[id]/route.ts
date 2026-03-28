import { NextResponse } from "next/server";
import { MediaStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/security/rate-limit";
import {
  authenticatePartnerApi,
  logPartnerApiUsage,
  touchPartnerApiKey,
} from "@/lib/partner-api/authenticate";
import { firePartnerMediaWebhook } from "@/lib/partner-api/notify-media-webhook";
import { toPartnerMediaDto } from "@/lib/partner-api/serialize-media";

export const runtime = "nodejs";

const PatchBodySchema = z
  .object({
    mediaName: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(8000).optional().nullable(),
    price: z.coerce.number().int().min(0).max(1_000_000_000_000).optional().nullable(),
    globalCountryCode: z
      .union([
        z
          .string()
          .trim()
          .length(2)
          .transform((s) => s.toUpperCase()),
        z.null(),
      ])
      .optional(),
    tags: z.array(z.string().trim().max(80)).max(60).optional(),
    audienceTags: z.array(z.string().trim().max(80)).max(60).optional(),
    location: z
      .object({
        address: z.string().trim().max(500).optional(),
        lat: z.number().finite().optional(),
        lng: z.number().finite().optional(),
      })
      .optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty_body" });

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const rl = withRateLimit(req, { limit: 120, windowMs: 60_000 });
  if (rl) return rl;

  const pathname = new URL(req.url).pathname;
  const auth = await authenticatePartnerApi(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    const res = NextResponse.json({ error: "Invalid id" }, { status: 400 });
    void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "GET", status: res.status });
    return res;
  }

  const media = await prisma.media.findFirst({
    where: { id, createdById: auth.ctx.userId },
  });

  if (!media) {
    const res = NextResponse.json({ error: "Not found" }, { status: 404 });
    void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "GET", status: res.status });
    return res;
  }

  const res = NextResponse.json({ ok: true, data: toPartnerMediaDto(media) });
  void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "GET", status: res.status });
  void touchPartnerApiKey(auth.ctx.keyId);
  return res;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const rl = withRateLimit(req, { limit: 60, windowMs: 60_000 });
  if (rl) return rl;

  const pathname = new URL(req.url).pathname;
  const auth = await authenticatePartnerApi(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    const res = NextResponse.json({ error: "Invalid id" }, { status: 400 });
    void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "PATCH", status: res.status });
    return res;
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    const res = NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "PATCH", status: res.status });
    return res;
  }

  const parsed = PatchBodySchema.safeParse(json);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
    void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "PATCH", status: res.status });
    return res;
  }

  const media = await prisma.media.findFirst({
    where: { id, createdById: auth.ctx.userId },
  });

  if (!media) {
    const res = NextResponse.json({ error: "Not found" }, { status: 404 });
    void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "PATCH", status: res.status });
    return res;
  }

  if (media.status === MediaStatus.ARCHIVED) {
    const res = NextResponse.json({ error: "Cannot update archived media" }, { status: 409 });
    void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "PATCH", status: res.status });
    return res;
  }

  const b = parsed.data;
  let locationJson: object | undefined;
  if (b.location && Object.keys(b.location).length > 0) {
    const loc = { ...((media.locationJson ?? {}) as Record<string, unknown>) };
    if (b.location.address !== undefined) loc.address = b.location.address;
    if (b.location.lat !== undefined) loc.lat = b.location.lat;
    if (b.location.lng !== undefined) loc.lng = b.location.lng;
    locationJson = loc;
  }

  const updated = await prisma.media.update({
    where: { id },
    data: {
      ...(b.mediaName !== undefined ? { mediaName: b.mediaName } : {}),
      ...(b.description !== undefined ? { description: b.description } : {}),
      ...(b.price !== undefined ? { price: b.price } : {}),
      ...(b.globalCountryCode !== undefined
        ? { globalCountryCode: b.globalCountryCode }
        : {}),
      ...(b.tags !== undefined ? { tags: b.tags } : {}),
      ...(b.audienceTags !== undefined ? { audienceTags: b.audienceTags } : {}),
      ...(locationJson !== undefined ? { locationJson } : {}),
    },
  });

  firePartnerMediaWebhook(auth.ctx.userId, {
    source: "xthex",
    event: "media.updated",
    mediaId: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  });

  const res = NextResponse.json({ ok: true, data: toPartnerMediaDto(updated) });
  void logPartnerApiUsage({ keyId: auth.ctx.keyId, path: pathname, method: "PATCH", status: res.status });
  void touchPartnerApiKey(auth.ctx.keyId);
  return res;
}
