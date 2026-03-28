import { MediaStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidateMediaReviewSurfaces } from "@/lib/admin/revalidate-media-public";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { firePartnerMediaWebhook } from "@/lib/partner-api/notify-media-webhook";

const bodySchema = z.object({
  reason: z.string().max(5000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (media.status !== MediaStatus.PENDING) {
    return NextResponse.json(
      { error: "Only PENDING media can be rejected" },
      { status: 409 },
    );
  }

  const reason = parsed.data.reason?.trim();
  const memoParts = [media.adminMemo?.trim(), reason ? `Rejected: ${reason}` : "Rejected (no reason)"]
    .filter(Boolean)
    .join("\n");

  await prisma.media.update({
    where: { id },
    data: {
      status: MediaStatus.REJECTED,
      adminMemo: memoParts || null,
    },
  });

  if (media.createdById) {
    firePartnerMediaWebhook(media.createdById, {
      source: "xthex",
      event: "media.status_changed",
      mediaId: id,
      status: MediaStatus.REJECTED,
      updatedAt: new Date().toISOString(),
    });
  }

  revalidateMediaReviewSurfaces(id);

  return NextResponse.json({ ok: true, id, status: MediaStatus.REJECTED });
}
