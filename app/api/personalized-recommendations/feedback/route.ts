import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  mediaId: z.string().uuid(),
  action: z.enum(["dismiss", "negative"]),
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const session = await getAuthSession();
  const userId =
    session?.user && "id" in session.user && typeof session.user.id === "string"
      ? session.user.id
      : null;

  if (userId) {
    const note =
      parsed.data.action === "negative"
        ? [parsed.data.reason?.trim(), "negative_feedback"].filter(Boolean).join(" | ") || "negative_feedback"
        : parsed.data.reason?.trim() ?? null;

    await prisma.recommendationDismissal.upsert({
      where: {
        userId_mediaId: { userId, mediaId: parsed.data.mediaId },
      },
      create: {
        userId,
        mediaId: parsed.data.mediaId,
        reason: note,
      },
      update: {
        reason: note,
      },
    });
  }

  return NextResponse.json({ ok: true, persisted: Boolean(userId) });
}
