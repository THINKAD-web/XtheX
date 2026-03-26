import { NextResponse } from "next/server";
import { MediaStatus, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { formTypeToCategory } from "@/lib/media/media-owner-form-types";

export const runtime = "nodejs";

const fieldSchema = z.object({
  mediaName: z.string().min(2).max(200),
  mediaType: z.string().min(1),
  address: z.string().min(2).max(500),
  lat: z.string().optional(),
  lng: z.string().optional(),
  dailyImpressions: z.coerce.number().int().min(1).max(10_000_000_000),
  weeklyPrice: z.coerce.number().int().min(1).max(1_000_000_000_000),
  description: z.string().min(10).max(8000),
  availabilityStart: z.string().min(1),
  availabilityEnd: z.string().min(1),
  replaceImages: z.string().optional(),
  keepImages: z.string().optional(),
});

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

function parseOptionalCoord(s: string | undefined): number | null {
  if (s == null || s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function estimateCpm(weeklyPrice: number, dailyImpressions: number): number {
  if (dailyImpressions <= 0) return 0;
  const dailyCost = weeklyPrice / 7;
  return Math.round((dailyCost / dailyImpressions) * 1000);
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;

  if (!userId || role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.media.findUnique({
    where: { id },
    select: { id: true, createdById: true, status: true, images: true },
  });
  if (!existing || existing.createdById !== userId) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid multipart body" },
      { status: 400 },
    );
  }

  const raw = {
    mediaName: String(formData.get("mediaName") ?? ""),
    mediaType: String(formData.get("mediaType") ?? ""),
    address: String(formData.get("address") ?? ""),
    lat: formData.get("lat")?.toString(),
    lng: formData.get("lng")?.toString(),
    dailyImpressions: formData.get("dailyImpressions"),
    weeklyPrice: formData.get("weeklyPrice"),
    description: String(formData.get("description") ?? ""),
    availabilityStart: String(formData.get("availabilityStart") ?? ""),
    availabilityEnd: String(formData.get("availabilityEnd") ?? ""),
    replaceImages: formData.get("replaceImages")?.toString(),
    keepImages: formData.get("keepImages")?.toString(),
  };

  const parsed = fieldSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat()[0] ?? "입력값을 확인해 주세요.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const v = parsed.data;
  const start = new Date(v.availabilityStart);
  const end = new Date(v.availabilityEnd);
  if (Number.isNaN(+start) || Number.isNaN(+end) || end < start) {
    return NextResponse.json(
      { ok: false, error: "등록 기간(시작~종료)을 확인해 주세요." },
      { status: 400 },
    );
  }

  const replaceImages = v.replaceImages === "1";
  let keepImages: string[] = [];
  try {
    const arr = JSON.parse(v.keepImages ?? "[]");
    if (Array.isArray(arr)) keepImages = arr.filter((x) => typeof x === "string");
  } catch {
    // ignore
  }
  const prevImages = (existing.images ?? []).filter((u) => typeof u === "string");
  const kept = replaceImages ? [] : keepImages.filter((u) => prevImages.includes(u));

  const files = formData.getAll("images") as File[];
  const imageFiles = files.filter((f) => f instanceof File && f.size > 0);
  if (imageFiles.length > 5) {
    return NextResponse.json(
      { ok: false, error: "새 이미지는 최대 5장까지 업로드할 수 있습니다." },
      { status: 400 },
    );
  }

  const uploadRoot = path.join(process.cwd(), "public", "uploads", "media-owner");
  const batchId = crypto.randomUUID();
  const userDir = path.join(uploadRoot, userId, batchId);
  if (imageFiles.length > 0) await mkdir(userDir, { recursive: true });

  const publicUrls: string[] = [];
  for (const file of imageFiles) {
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "각 이미지는 8MB 이하로 업로드해 주세요." },
        { status: 400 },
      );
    }
    const safe = sanitizeFilename(file.name || "image.jpg");
    const destName = `${crypto.randomUUID().slice(0, 8)}_${safe}`;
    const diskPath = path.join(userDir, destName);
    await writeFile(diskPath, buf);
    const url = `/uploads/media-owner/${userId}/${batchId}/${destName}`;
    publicUrls.push(url);
  }

  const nextImages = [...kept, ...publicUrls].slice(0, 8);
  if (nextImages.length === 0) {
    return NextResponse.json(
      { ok: false, error: "이미지를 1장 이상 유지하거나 새로 업로드해 주세요." },
      { status: 400 },
    );
  }

  const lat = parseOptionalCoord(v.lat);
  const lng = parseOptionalCoord(v.lng);
  const { category } = formTypeToCategory(v.mediaType);
  const cpm = estimateCpm(v.weeklyPrice, v.dailyImpressions);

  const updated = await prisma.media.update({
    where: { id },
    data: {
      mediaName: v.mediaName,
      category,
      description: v.description,
      locationJson: {
        address: v.address,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        form_type: v.mediaType,
      },
      price: v.weeklyPrice,
      cpm,
      exposureJson: {
        daily_impressions: v.dailyImpressions,
        weekly_price_krw: v.weeklyPrice,
      },
      images: nextImages,
      availabilityStart: start,
      availabilityEnd: end,
      // keep status as-is; admin workflow controls publish/reject
    },
    select: { id: true, mediaName: true, status: true, updatedAt: true },
  });

  revalidatePath("/dashboard/media-owner/medias");
  revalidatePath("/dashboard/media-owner");
  revalidatePath("/explore");

  return NextResponse.json({ ok: true, media: updated, message: "Updated" });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;

  if (!userId || role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const media = await prisma.media.findUnique({
    where: { id },
    select: { id: true, status: true, createdById: true },
  });
  if (!media || media.createdById !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Published media: archive instead of hard delete.
  if (media.status === MediaStatus.PUBLISHED) {
    await prisma.media.update({
      where: { id },
      data: { status: MediaStatus.ARCHIVED },
    });
  } else {
    await prisma.media.delete({ where: { id } });
  }

  // Best-effort revalidation (localized paths depend on caller; we revalidate common ones).
  revalidatePath("/dashboard/media-owner/medias");
  revalidatePath("/dashboard/media-owner");
  revalidatePath("/explore");

  return NextResponse.json({ ok: true });
}

