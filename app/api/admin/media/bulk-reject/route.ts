import { MediaStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidateMediaReviewSurfaces } from "@/lib/admin/revalidate-media-public";
import { requireAdminApi } from "@/lib/auth/require-admin-api";

export const runtime = "nodejs";

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  reason: z.string().max(5000).optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ids = [...new Set(parsed.data.ids)];
  const reason = parsed.data.reason?.trim();
  const rejectLine = reason
    ? `Rejected: ${reason}`
    : "Rejected (bulk, no reason provided)";

  const pending = await prisma.media.findMany({
    where: { id: { in: ids }, status: MediaStatus.PENDING },
    select: { id: true, adminMemo: true },
  });

  if (pending.length === 0) {
    return NextResponse.json({
      ok: true,
      rejected: [] as string[],
      skipped: ids,
    });
  }

  await prisma.$transaction(
    pending.map((m) => {
      const memoParts = [m.adminMemo?.trim(), rejectLine].filter(Boolean).join("\n");
      return prisma.media.update({
        where: { id: m.id },
        data: {
          status: MediaStatus.REJECTED,
          adminMemo: memoParts || rejectLine,
        },
      });
    }),
  );

  for (const m of pending) {
    revalidateMediaReviewSurfaces(m.id);
  }

  const rejected = pending.map((p) => p.id);
  const skipped = ids.filter((id) => !rejected.includes(id));

  return NextResponse.json({ ok: true, rejected, skipped });
}
