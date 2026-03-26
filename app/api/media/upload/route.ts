import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { MediaStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { reviewMediaListing } from "@/lib/ai/reviewMediaListing";
import { formTypeToCategory } from "@/lib/media/media-owner-form-types";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 120;

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

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await findUserById(session.user.id);
  if (!dbUser || dbUser.role !== UserRole.MEDIA_OWNER) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
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

  const files = formData.getAll("images") as File[];
  const imageFiles = files.filter((f) => f instanceof File && f.size > 0);

  if (imageFiles.length === 0) {
    return NextResponse.json(
      { ok: false, error: "사진을 1장 이상 업로드해 주세요." },
      { status: 400 },
    );
  }
  if (imageFiles.length > 5) {
    return NextResponse.json(
      { ok: false, error: "사진은 최대 5장까지 업로드할 수 있습니다." },
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

  const lat = parseOptionalCoord(v.lat);
  const lng = parseOptionalCoord(v.lng);
  const { category, labelKo } = formTypeToCategory(v.mediaType);
  const cpm = estimateCpm(v.weeklyPrice, v.dailyImpressions);

  const uploadRoot = path.join(process.cwd(), "public", "uploads", "media-owner");
  const batchId = crypto.randomUUID();
  const userDir = path.join(uploadRoot, dbUser.id, batchId);
  await mkdir(userDir, { recursive: true });

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
    const url = `/uploads/media-owner/${dbUser.id}/${batchId}/${destName}`;
    publicUrls.push(url);
  }

  const availabilityNote = `${v.availabilityStart} ~ ${v.availabilityEnd}`;

  let review: Awaited<ReturnType<typeof reviewMediaListing>>;
  try {
    review = await reviewMediaListing({
      mediaName: v.mediaName,
      categoryLabel: `${v.mediaType} (${labelKo})`,
      description: v.description,
      address: v.address,
      lat,
      lng,
      dailyImpressions: v.dailyImpressions,
      weeklyPriceKrw: v.weeklyPrice,
      cpm,
      availabilityNote,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI 심사 중 알 수 없는 오류가 발생했습니다.";
    review = {
      score: 60,
      suitability: "AI 심사 중 오류",
      location_fit: "—",
      pricing_fit: "—",
      summary_ko: msg,
      comment: msg,
    };
  }

  const media = await prisma.media.create({
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
      images: publicUrls,
      tags: [`formType:${v.mediaType}`, "media-owner-upload"],
      audienceTags: [],
      status: MediaStatus.PENDING,
      createdById: dbUser.id,
      availabilityStart: start,
      availabilityEnd: end,
      trustScore: review.score,
      aiReviewScore: review.score,
      aiReviewComment: review.comment,
      pros: review.suitability,
      cons: `${review.location_fit} / ${review.pricing_fit}`.slice(0, 2000),
    },
  });

  return NextResponse.json({
    ok: true,
    mediaId: media.id,
    review: {
      score: review.score,
      summary_ko: review.summary_ko,
      comment: review.comment,
    },
  });
}
