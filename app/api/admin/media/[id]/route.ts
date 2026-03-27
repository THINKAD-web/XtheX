import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { revalidateMediaReviewSurfaces } from "@/lib/admin/revalidate-media-public";

const updateSchema = z.object({
  mediaName: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
  price: z.number().int().nullable().optional(),
  cpm: z.number().int().nullable().optional(),
  targetAudience: z.string().max(2000).nullable().optional(),
  audienceTags: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  pros: z.string().max(3000).nullable().optional(),
  cons: z.string().max(3000).nullable().optional(),
  exposureJson: z
    .object({
      daily_traffic: z.number().nullable().optional(),
      monthly_impressions: z.number().nullable().optional(),
      reach: z.number().nullable().optional(),
      frequency: z.number().nullable().optional(),
      target_age: z.string().nullable().optional(),
      cpm: z.number().nullable().optional(),
      engagement_rate: z.number().nullable().optional(),
      visibility_score: z.number().nullable().optional(),
    })
    .optional(),
  locationJson: z
    .object({
      address: z.string().nullable().optional(),
      district: z.string().nullable().optional(),
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
    })
    .optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { exposureJson, locationJson, ...scalar } = parsed.data;

  const data: Record<string, unknown> = { ...scalar };

  if (exposureJson !== undefined) {
    const prev = (existing.exposureJson ?? {}) as Record<string, unknown>;
    data.exposureJson = { ...prev, ...exposureJson };
  }
  if (locationJson !== undefined) {
    const prev = (existing.locationJson ?? {}) as Record<string, unknown>;
    data.locationJson = { ...prev, ...locationJson };
  }

  const updated = await prisma.media.update({ where: { id }, data });

  revalidateMediaReviewSurfaces(id);

  return NextResponse.json({ ok: true, id: updated.id });
}
