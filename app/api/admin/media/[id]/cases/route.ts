import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { revalidateMediaReviewSurfaces } from "@/lib/admin/revalidate-media-public";

const caseSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  client: z.string().max(200).optional(),
  result: z.string().max(3000).optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id: mediaId } = await context.params;

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true },
  });
  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = caseSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const cs = await prisma.caseStudy.create({
    data: {
      mediaId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      client: parsed.data.client ?? null,
      result: parsed.data.result ?? null,
      images: parsed.data.images ?? [],
    },
  });

  revalidateMediaReviewSurfaces(mediaId);

  return NextResponse.json({ ok: true, caseStudy: cs }, { status: 201 });
}
