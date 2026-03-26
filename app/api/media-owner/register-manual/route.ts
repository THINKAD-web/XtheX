import { NextResponse } from "next/server";
import { MediaStatus, UserRole } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { reviewMediaListing } from "@/lib/ai/reviewMediaListing";
import type { MediaReviewFormPayload } from "@/lib/media/media-review-form-payload";
import {
  getMediaCreateDataFromReviewPayload,
  validateMediaReviewPayload,
} from "@/lib/media/persist-media-review-payload";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const maxDuration = 120;

const categoryEnum = z.enum([
  "BILLBOARD",
  "DIGITAL_BOARD",
  "TRANSIT",
  "STREET_FURNITURE",
  "WALL",
  "ETC",
]);

const payloadSchema = z.object({
  mediaName: z.string().min(2).max(200),
  description: z.string().min(10).max(8000),
  category: categoryEnum,
  subCategory: z.string().max(200).optional().nullable(),
  tags: z.array(z.string().max(80)).max(40).default([]),
  locationJson: z.object({
    address: z.string().min(2).max(500),
    district: z.string().max(120).optional().nullable(),
    city: z.string().max(120).optional().nullable(),
    lat: z.number().finite(),
    lng: z.number().finite(),
    map_link: z.string().max(2000).optional().nullable(),
  }),
  price: z.number().int().positive(),
  priceNote: z.string().max(2000).optional().nullable(),
  widthM: z.number().finite().optional().nullable(),
  heightM: z.number().finite().optional().nullable(),
  resolution: z.string().max(120).optional().nullable(),
  operatingHours: z.string().max(500).optional().nullable(),
  dailyFootfall: z.number().int().nonnegative().optional().nullable(),
  weekdayFootfall: z.number().int().nonnegative().optional().nullable(),
  targetAge: z.string().max(120).optional().nullable(),
  targetAudience: z.string().max(2000).optional().nullable(),
  impressions: z.number().int().nonnegative().optional().nullable(),
  reach: z.number().finite().optional().nullable(),
  frequency: z.number().finite().optional().nullable(),
  cpm: z.number().int().nonnegative().optional().nullable(),
  engagementRate: z.number().finite().optional().nullable(),
  visibilityScore: z.number().int().min(0).max(100).optional().nullable(),
  effectMemo: z.string().max(8000).optional().nullable(),
  pros: z.string().max(4000).optional().nullable(),
  cons: z.string().max(4000).optional().nullable(),
  trustScore: z.number().int().min(0).max(100).optional().nullable(),
  availabilityStart: z.string().optional().nullable(),
  availabilityEnd: z.string().optional().nullable(),
});

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

function toPayload(v: z.infer<typeof payloadSchema>): MediaReviewFormPayload {
  return {
    mediaName: v.mediaName,
    description: v.description,
    category: v.category,
    subCategory: v.subCategory ?? null,
    locationJson: {
      address: v.locationJson.address,
      district: v.locationJson.district ?? null,
      city: v.locationJson.city ?? null,
      lat: v.locationJson.lat,
      lng: v.locationJson.lng,
      map_link: v.locationJson.map_link ?? null,
    },
    price: v.price,
    priceNote: v.priceNote ?? null,
    widthM: v.widthM ?? null,
    heightM: v.heightM ?? null,
    resolution: v.resolution ?? null,
    operatingHours: v.operatingHours ?? null,
    dailyFootfall: v.dailyFootfall ?? null,
    weekdayFootfall: v.weekdayFootfall ?? null,
    targetAge: v.targetAge ?? null,
    impressions: v.impressions ?? null,
    reach: v.reach ?? null,
    frequency: v.frequency ?? null,
    cpm: v.cpm ?? null,
    engagementRate: v.engagementRate ?? null,
    visibilityScore: v.visibilityScore ?? null,
    effectMemo: v.effectMemo ?? null,
    exposureJson: {
      daily_traffic: v.dailyFootfall ?? null,
      monthly_impressions: v.impressions ?? null,
      reach: v.reach ?? null,
      frequency: v.frequency ?? null,
    },
    targetAudience: v.targetAudience ?? null,
    images: [],
    tags: v.tags.length ? v.tags : ["media-owner-manual"],
    audienceTags: [],
    pros: v.pros ?? null,
    cons: v.cons ?? null,
    trustScore: v.trustScore ?? null,
    sampleImages: [],
    sampleDescriptions: [],
    extractedImages: [],
  };
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
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") {
    return NextResponse.json({ ok: false, error: "payload 필드가 필요합니다." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawPayload);
  } catch {
    return NextResponse.json({ ok: false, error: "payload JSON 오류" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json(
      { ok: false, error: "이미지를 1장 이상 업로드해 주세요. (최대 10장)" },
      { status: 400 },
    );
  }
  if (files.length > 10) {
    return NextResponse.json(
      { ok: false, error: "이미지는 최대 10장까지 업로드할 수 있습니다." },
      { status: 400 },
    );
  }

  const v = parsed.data;
  if (Math.abs(v.locationJson.lat) > 90 || Math.abs(v.locationJson.lng) > 180) {
    return NextResponse.json({ ok: false, error: "위도/경도 범위를 확인해 주세요." }, { status: 400 });
  }

  const uploadRoot = path.join(process.cwd(), "public", "uploads", "media-owner");
  const batchId = crypto.randomUUID();
  const userDir = path.join(uploadRoot, dbUser.id, batchId);
  await mkdir(userDir, { recursive: true });

  const publicUrls: string[] = [];
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "각 이미지는 8MB 이하로 업로드해 주세요." },
        { status: 400 },
      );
    }
    const safe = sanitizeFilename(file.name || "image.jpg");
    const destName = `${crypto.randomUUID().slice(0, 8)}_${safe}`;
    await writeFile(path.join(userDir, destName), buf);
    publicUrls.push(`/uploads/media-owner/${dbUser.id}/${batchId}/${destName}`);
  }

  let payload = toPayload(v);
  payload = { ...payload, images: publicUrls, extractedImages: publicUrls.slice(0, 10) };

  const err = validateMediaReviewPayload(payload);
  if (err) {
    return NextResponse.json({ ok: false, error: err }, { status: 400 });
  }

  const dailyImp = v.dailyFootfall ?? 0;
  const monthlyPrice = v.price;
  let cpm = payload.cpm ?? 0;
  if (!cpm && dailyImp > 0) {
    const dailyCost = monthlyPrice / 30;
    cpm = Math.round((dailyCost / dailyImp) * 1000);
  }
  payload = { ...payload, cpm: cpm || null };

  let review: Awaited<ReturnType<typeof reviewMediaListing>>;
  try {
    review = await reviewMediaListing({
      mediaName: v.mediaName,
      categoryLabel: v.category,
      description: v.description,
      address: v.locationJson.address,
      lat: v.locationJson.lat,
      lng: v.locationJson.lng,
      dailyImpressions: dailyImp || 1,
      weeklyPriceKrw: Math.max(1, Math.round(monthlyPrice / 4.33)),
      cpm: cpm > 0 ? cpm : null,
      availabilityNote:
        v.availabilityStart && v.availabilityEnd
          ? `${v.availabilityStart} ~ ${v.availabilityEnd}`
          : "미정",
    });
  } catch {
    review = {
      score: 65,
      suitability: "수동 등록",
      location_fit: "—",
      pricing_fit: "—",
      summary_ko: "수동 등록 매체",
      comment: "관리자 검토 대기",
    };
  }

  const availabilityStart =
    v.availabilityStart && v.availabilityStart.trim()
      ? new Date(v.availabilityStart)
      : null;
  const availabilityEnd =
    v.availabilityEnd && v.availabilityEnd.trim() ? new Date(v.availabilityEnd) : null;
  if (
    availabilityStart &&
    availabilityEnd &&
    (!Number.isFinite(+availabilityStart) ||
      !Number.isFinite(+availabilityEnd) ||
      availabilityEnd < availabilityStart)
  ) {
    return NextResponse.json(
      { ok: false, error: "노출 가능 기간을 확인해 주세요." },
      { status: 400 },
    );
  }

  const createData = getMediaCreateDataFromReviewPayload(
    payload,
    MediaStatus.PENDING,
    dbUser.id,
  );

  const baseTags = Array.isArray(payload.tags) ? payload.tags : [];
  const mergedTags = [...new Set([...baseTags, "media-owner-manual"])];

  const media = await prisma.media.create({
    data: {
      ...createData,
      aiReviewScore: review.score,
      aiReviewComment: review.comment,
      pros: payload.pros ?? review.suitability,
      cons: payload.cons ?? `${review.location_fit} / ${review.pricing_fit}`.slice(0, 2000),
      trustScore: review.score,
      availabilityStart: availabilityStart ?? undefined,
      availabilityEnd: availabilityEnd ?? undefined,
      tags: mergedTags,
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/media-owner");
  revalidatePath("/dashboard/media-owner/medias");
  revalidatePath("/admin/medias");

  return NextResponse.json({ ok: true, mediaId: media.id });
}
