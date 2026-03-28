import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const PutSchema = z
  .object({
    url: z.string().trim().max(2000).url().optional(),
    enabled: z.boolean().optional(),
  })
  .refine((d) => d.url !== undefined || d.enabled !== undefined, {
    message: "Provide url and/or enabled",
  });

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hook = await prisma.partnerMediaWebhook.findUnique({
    where: { userId: session.user.id },
    select: { url: true, enabled: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, webhook: hook });
}

export async function PUT(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.partnerMediaWebhook.findUnique({
    where: { userId: session.user.id },
    select: { url: true, enabled: true },
  });

  const urlRaw = parsed.data.url?.trim() ?? existing?.url?.trim();
  if (!urlRaw) {
    return NextResponse.json({ error: "URL required for new webhook" }, { status: 400 });
  }
  if (!urlRaw.toLowerCase().startsWith("https://")) {
    return NextResponse.json({ error: "URL must use https://" }, { status: 400 });
  }

  const hook = await prisma.partnerMediaWebhook.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      url: urlRaw,
      enabled: parsed.data.enabled ?? true,
    },
    update: {
      url: urlRaw,
      ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
    },
    select: { url: true, enabled: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, webhook: hook });
}

export async function DELETE() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.partnerMediaWebhook.delete({ where: { userId: session.user.id } });
  } catch {
    /* no row */
  }

  return NextResponse.json({ ok: true });
}
