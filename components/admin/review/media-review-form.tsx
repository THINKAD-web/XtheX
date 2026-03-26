"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTransition } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  updateMediaDraft,
  publishMedia,
} from "@/app/[locale]/admin/review/[mediaId]/actions";
import type { MediaReviewFormPayload } from "@/lib/media/media-review-form-payload";
import {
  saveOwnerPendingMedia,
  submitForReview,
} from "@/app/[locale]/dashboard/media-owner/owner-media-review-actions";
import type { MediaCategory, Prisma } from "@prisma/client";
import { LeafletLocationPreview } from "@/components/admin/review/LeafletLocationPreview";
import {
  formatOwnerSubmittedForAdmin,
  getOwnerSubmittedForReviewAt,
  hasOwnerSubmittedForReview,
} from "@/lib/media/owner-review-submission";
import { cn } from "@/lib/utils";
import { parseRejectionFromAdminMemo } from "@/lib/media/admin-memo-rejection";

const MEDIA_CATEGORIES: { value: MediaCategory; label: string }[] = [
  { value: "BILLBOARD", label: "빌보드" },
  { value: "DIGITAL_BOARD", label: "디지털 보드" },
  { value: "TRANSIT", label: "대중교통" },
  { value: "STREET_FURNITURE", label: "가로 시설물" },
  { value: "WALL", label: "월/벽면" },
  { value: "ETC", label: "기타" },
];

const SUB_CATEGORY_PRESETS: Record<MediaCategory, string[]> = {
  BILLBOARD: ["초대형 빌보드", "옥상 빌보드", "교차로 코너 빌보드"],
  DIGITAL_BOARD: ["LED 전광판", "디지털 사이니지", "대형 DOOH 보드"],
  TRANSIT: ["지하철 역사", "지하철 PSD", "버스 내부/외부"],
  STREET_FURNITURE: ["버스쉘터", "키오스크", "가로등 배너"],
  WALL: ["건물 외벽", "월랩핑", "미디어 파사드"],
  ETC: ["엘리베이터", "택시탑", "기타"],
};

const reviewFormSchema = z.object({
  mediaName: z.string().min(1, "매체명은 필수입니다."),
  locationJson: z.object({
    address: z.string().min(1, "주소는 필수입니다."),
    lat: z.number(),
    lng: z.number(),
  }),
  price: z.number().positive("월 가격은 0보다 커야 합니다."),
});

type MediaWithCreatedBy = {
  id: string;
  mediaName: string;
  category: MediaCategory;
  description: string | null;
  locationJson: Prisma.JsonValue;
  price: number | null;
  cpm: number | null;
  exposureJson: Prisma.JsonValue;
  targetAudience: string | null;
  images: string[];
  tags: string[];
  audienceTags: string[];
  pros: string | null;
  cons: string | null;
  trustScore: number | null;
  sampleImages: string[];
  sampleDescriptions: string[];
  parseHistory?: Prisma.JsonValue;
  status: string;
  adminMemo: string | null;
  createdBy: { id: string; email: string; name: string | null } | null;
};

function parseLocationJson(json: Prisma.JsonValue): MediaReviewFormPayload["locationJson"] {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return {
      address: "",
      district: "",
      city: "",
      lat: null,
      lng: null,
      map_link: "",
    };
  }
  const o = json as Record<string, unknown>;
  return {
    address: (o?.address as string) ?? "",
    district: (o?.district as string) ?? "",
    city: (o?.city as string) ?? "",
    lat: o?.lat != null ? Number(o.lat) : null,
    lng: o?.lng != null ? Number(o.lng) : null,
    map_link: (o?.map_link as string) ?? "",
  };
}

function toExposureValue(v: unknown): number | string | null {
  if (v == null) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  return null;
}

function formatNumberHint(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value.toLocaleString("ko-KR");
}

function parseExposureJson(json: Prisma.JsonValue): MediaReviewFormPayload["exposureJson"] {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  return {
    daily_traffic: toExposureValue(o?.daily_traffic),
    monthly_impressions: toExposureValue(o?.monthly_impressions),
    reach: toExposureValue(o?.reach),
    frequency: toExposureValue(o?.frequency),
  };
}

function parseReviewFormV2(json: Prisma.JsonValue): {
  subCategory?: string | null;
  priceNote?: string | null;
  effectMemo?: string | null;
  extractedImages?: string[];
} {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  const root = json as Record<string, unknown>;
  const v2 =
    root.reviewFormV2 && typeof root.reviewFormV2 === "object"
      ? (root.reviewFormV2 as Record<string, unknown>)
      : {};
  return {
    subCategory: typeof v2.sub_category === "string" ? v2.sub_category : null,
    priceNote: typeof v2.price_note === "string" ? v2.price_note : null,
    effectMemo: typeof v2.effect_memo === "string" ? v2.effect_memo : null,
    extractedImages: Array.isArray(v2.extracted_images)
      ? (v2.extracted_images as unknown[]).map(String)
      : [],
  };
}

type MediaReviewFormProps = {
  media: MediaWithCreatedBy;
  locale: string;
  /** AI 업로드 목록 등에서 전체 폼을 바로 펼침 */
  embedMode?: boolean;
  /** embedMode에서 접기 / 취소 대체 */
  onRequestClose?: () => void;
  /** admin_review: 승인/반려 · owner_pending: 임시 저장/최종 신청 */
  mode?: "admin_review" | "owner_pending";
};

export function MediaReviewForm({
  media,
  locale,
  embedMode = false,
  onRequestClose,
  mode = "admin_review",
}: MediaReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [tagInput, setTagInput] = React.useState("");
  const [selectedImageSet, setSelectedImageSet] = React.useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [resubmitConfirmOpen, setResubmitConfirmOpen] = React.useState(false);

  const location = parseLocationJson(media.locationJson);
  const exposure = parseExposureJson(media.exposureJson);
  const locationRecord =
    media.locationJson && typeof media.locationJson === "object" && !Array.isArray(media.locationJson)
      ? (media.locationJson as Record<string, unknown>)
      : {};
  const exposureRecord =
    media.exposureJson && typeof media.exposureJson === "object" && !Array.isArray(media.exposureJson)
      ? (media.exposureJson as Record<string, unknown>)
      : {};
  const parseHistory = parseReviewFormV2(media.parseHistory ?? null);
  const ownerSubmittedAt = getOwnerSubmittedForReviewAt(media.parseHistory ?? null);
  const ownerAlreadySubmitted = hasOwnerSubmittedForReview(media.parseHistory ?? null);
  const ownerOutcomeLocked =
    mode === "owner_pending" &&
    (media.status === "PUBLISHED" || media.status === "REJECTED");
  const rejectionInfo = parseRejectionFromAdminMemo(media.adminMemo ?? null);
  const initialExtractedCandidates = Array.from(
    new Set(
      [
        ...(media.images ?? []),
        ...(media.sampleImages ?? []),
        ...(parseHistory.extractedImages ?? []),
      ]
        .map(String)
        .filter((u) => /^https?:\/\//i.test(u)),
    ),
  ).slice(0, 10);
  const form = useForm<MediaReviewFormPayload>({
    defaultValues: {
      mediaName: media.mediaName,
      description: media.description ?? "",
      category: media.category,
      subCategory:
        parseHistory.subCategory ??
        (typeof locationRecord.sub_category === "string"
          ? locationRecord.sub_category
          : ""),
      locationJson: {
        address: location.address ?? "",
        district: location.district ?? "",
        city: location.city ?? "",
        lat: location.lat ?? null,
        lng: location.lng ?? null,
        map_link: location.map_link ?? "",
      },
      price: media.price ?? null,
      priceNote:
        parseHistory.priceNote ??
        (typeof exposureRecord.price_note === "string"
          ? exposureRecord.price_note
          : ""),
      widthM:
        typeof locationRecord.width_m === "number" ? locationRecord.width_m : null,
      heightM:
        typeof locationRecord.height_m === "number" ? locationRecord.height_m : null,
      resolution:
        typeof locationRecord.resolution === "string"
          ? locationRecord.resolution
          : "",
      operatingHours:
        typeof locationRecord.operating_hours === "string"
          ? locationRecord.operating_hours
          : "",
      dailyFootfall:
        typeof exposureRecord.daily_traffic === "number"
          ? exposureRecord.daily_traffic
          : null,
      weekdayFootfall:
        typeof exposureRecord.weekday_traffic === "number"
          ? exposureRecord.weekday_traffic
          : null,
      targetAge:
        typeof exposureRecord.target_age === "string"
          ? exposureRecord.target_age
          : "",
      impressions:
        typeof exposureRecord.monthly_impressions === "number"
          ? exposureRecord.monthly_impressions
          : null,
      reach: typeof exposureRecord.reach === "number" ? exposureRecord.reach : null,
      frequency:
        typeof exposureRecord.frequency === "number"
          ? exposureRecord.frequency
          : null,
      cpm: media.cpm ?? null,
      engagementRate:
        typeof exposureRecord.engagement_rate === "number"
          ? exposureRecord.engagement_rate
          : null,
      visibilityScore:
        typeof exposureRecord.visibility_score === "number"
          ? exposureRecord.visibility_score
          : null,
      effectMemo: parseHistory.effectMemo ?? media.pros ?? "",
      exposureJson: exposure ?? {
        daily_traffic: null,
        monthly_impressions: null,
        reach: null,
        frequency: null,
      },
      targetAudience: media.targetAudience ?? "",
      images: media.images ?? [],
      tags: media.tags ?? [],
      audienceTags: media.audienceTags ?? [],
      pros: media.pros ?? "",
      cons: media.cons ?? "",
      trustScore: media.trustScore ?? 0,
      sampleImages: media.sampleImages ?? [],
      sampleDescriptions: media.sampleDescriptions ?? [],
      extractedImages: initialExtractedCandidates,
    },
  });

  const watchedImages = form.watch("images") ?? media.images ?? [];
  const watchedSampleImages = form.watch("sampleImages") ?? media.sampleImages ?? [];
  const extractedCandidates = React.useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...(watchedImages ?? []),
            ...(watchedSampleImages ?? []),
            ...(parseHistory.extractedImages ?? []),
          ]
            .map(String)
            .filter((u) => /^https?:\/\//i.test(u)),
        ),
      ).slice(0, 10),
    [watchedImages, watchedSampleImages, parseHistory.extractedImages],
  );

  const tags = form.watch("tags");
  const selectedImages = form.watch("extractedImages") ?? [];
  const selectedCategory = form.watch("category") as MediaCategory;
  const watchedSubCategory = (form.watch("subCategory") ?? "").trim();
  const aiOriginalSubCategory = (
    parseHistory.subCategory ??
    (typeof locationRecord.sub_category === "string"
      ? locationRecord.sub_category
      : "")
  ).trim();
  const subCategoryOptions =
    SUB_CATEGORY_PRESETS[selectedCategory] ?? SUB_CATEGORY_PRESETS.ETC;
  const isSubCategoryRecommended = subCategoryOptions.includes(watchedSubCategory);
  const isSubCategoryEditedFromAi =
    !!aiOriginalSubCategory &&
    !!watchedSubCategory &&
    aiOriginalSubCategory !== watchedSubCategory;

  React.useEffect(() => {
    setSelectedImageSet(new Set(selectedImages));
  }, [selectedImages.join("|")]);

  React.useEffect(() => {
    const current = form.getValues("extractedImages") ?? [];
    const merged = Array.from(new Set([...current, ...extractedCandidates])).slice(0, 10);
    if (merged.join("|") !== current.join("|")) {
      form.setValue("extractedImages", merged, { shouldDirty: true });
    }
  }, [extractedCandidates, form]);

  const addTag = () => {
    const v = tagInput.trim().replace(/,/g, "");
    if (!v) return;
    const current = form.getValues("tags");
    if (current.includes(v)) return;
    form.setValue("tags", [...current, v]);
    setTagInput("");
  };

  const removeTag = (index: number) => {
    const next = form.getValues("tags").filter((_, i) => i !== index);
    form.setValue("tags", next);
  };

  const toggleImage = (url: string) => {
    const next = new Set(selectedImageSet);
    if (next.has(url)) next.delete(url);
    else if (next.size < 10) next.add(url);
    form.setValue("extractedImages", Array.from(next));
  };
  const selectAllImages = () =>
    form.setValue("extractedImages", extractedCandidates.slice(0, 10));
  const clearAllImages = () => form.setValue("extractedImages", []);

  const buildPayload = (): MediaReviewFormPayload => ({
    ...form.getValues(),
    description: form.getValues("description") || null,
    targetAudience: form.getValues("targetAudience") || null,
    pros: form.getValues("pros") || null,
    cons: form.getValues("cons") || null,
    exposureJson: form.getValues("exposureJson"),
    audienceTags: form.getValues("audienceTags") ?? [],
    sampleImages: form.getValues("sampleImages") ?? [],
    sampleDescriptions: form.getValues("sampleDescriptions") ?? [],
    extractedImages: form.getValues("extractedImages") ?? [],
  });

  const validateRequired = (): string | null => {
    const v = form.getValues();
    const parsed = reviewFormSchema.safeParse({
      mediaName: String(v.mediaName ?? ""),
      locationJson: {
        address: String(v.locationJson?.address ?? ""),
        lat: Number(v.locationJson?.lat),
        lng: Number(v.locationJson?.lng),
      },
      price: Number(v.price),
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return first?.message ?? "필수 필드를 확인해 주세요.";
    }
    return null;
  };

  const handleSaveDraft = () => {
    const err = validateRequired();
    if (err) {
      toast({ title: "입력값 확인", description: err, variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const payload = buildPayload();
      if (mode === "owner_pending") {
        const result = await saveOwnerPendingMedia(media.id, payload);
        if (result.ok) {
          toast({
            title: "임시 저장되었습니다.",
            description: "입력 내용이 저장되었습니다. 최종 제출 전까지 계속 수정할 수 있습니다.",
          });
        } else {
          toast({ title: "저장 실패", description: result.error, variant: "destructive" });
        }
        return;
      }
      const result = await updateMediaDraft(media.id, payload);
      if (result.ok) {
        toast({ title: "임시 저장되었습니다." });
      } else {
        toast({ title: "저장 실패", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleFinalRegisterSubmit = () => {
    const err = validateRequired();
    if (err) {
      toast({ title: "입력값 확인", description: err, variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const payload = buildPayload();
      const saved = await saveOwnerPendingMedia(media.id, payload);
      if (!saved.ok) {
        toast({ title: "저장 실패", description: saved.error, variant: "destructive" });
        return;
      }
      const submitted = await submitForReview(media.id);
      if (!submitted.ok) {
        toast({
          title: "최종 신청 실패",
          description: submitted.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "등록 신청이 완료되었습니다.",
        description:
          "관리자 승인 대기 중입니다. 내 미디어 목록에서 상태가 곧바로 반영돼요. 승인 후에는 탐색·추천에 노출됩니다.",
      });
      router.push(`/${locale}/dashboard/media-owner/medias`);
    });
  };

  const handleAdminApprove = () => {
    const err = validateRequired();
    if (err) {
      toast({ title: "입력값 확인", description: err, variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const result = await publishMedia(media.id, buildPayload());
      if (result.ok) {
        toast({
          title: "미디어가 성공적으로 승인되었습니다.",
          description: "매체사에게 승인 사실이 전달되었습니다.",
        });
        setRejectOpen(false);
        setRejectReason("");
        onRequestClose?.();
        router.push(`/${locale}/admin/medias`);
      } else {
        toast({ title: "승인 실패", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleAdminReject = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/media/${media.id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: rejectReason.trim() || undefined,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast({
            title: "반려 실패",
            description: data.error ?? res.statusText,
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "미디어가 반려되었습니다.",
          description: "매체사가 반려 사유를 확인할 수 있습니다.",
        });
        setRejectOpen(false);
        setRejectReason("");
        onRequestClose?.();
        router.push(`/${locale}/admin/medias`);
      } catch (e) {
        toast({
          title: "반려 실패",
          description: e instanceof Error ? e.message : String(e),
          variant: "destructive",
        });
      }
    });
  };

  const handleResubmitFromReject = () => {
    setResubmitConfirmOpen(false);
    startTransition(async () => {
      const r = await submitForReview(media.id);
      if (!r.ok) {
        toast({
          title: "요청에 실패했습니다",
          description: r.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "다시 검토 요청했어요.",
        description:
          "관리자가 순서대로 확인합니다. 내 미디어 목록에서 ‘승인 대기’ 상태를 확인해 주세요.",
      });
      router.push(`/${locale}/dashboard/media-owner/medias`);
      router.refresh();
    });
  };

  const inputClass =
    "rounded-lg border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500 focus-visible:border-orange-500/50";
  const labelClass = "text-zinc-300";
  const cardClass = "border-zinc-800/90 bg-zinc-950/95 shadow-none";
  const sectionTitleClass = "text-base font-semibold text-white";
  const sectionDescClass = "text-xs text-zinc-400";

  return (
    <Form {...form}>
      <form className="space-y-6">
      {mode === "owner_pending" ? (
        <div className="space-y-4">
          {media.status === "PUBLISHED" ? (
            <Card className="border-emerald-500/45 bg-emerald-950/30 shadow-none ring-1 ring-emerald-500/30">
              <CardContent className="space-y-3 pt-6">
                <Badge className="w-fit border-emerald-400/55 bg-emerald-500/25 text-emerald-50">
                  승인 완료
                </Badge>
                <p className="text-base font-semibold text-emerald-50">
                  축하합니다! 이 미디어가 승인되었습니다.
                </p>
                <p className="text-sm leading-relaxed text-emerald-100/90">
                  이제 광고주 추천과 미디어 탐색에 노출되고 있습니다.
                </p>
                <p className="text-sm leading-relaxed text-zinc-400">
                  내용을 바꾸려면 미디어 수정 페이지에서 편집해 주세요. 아래에서 실제 공개 페이지도
                  확인할 수 있어요.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/medias/${media.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    공개 페이지 보기
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : media.status === "REJECTED" ? (
            <Card className="border-rose-500/45 bg-rose-950/25 shadow-none ring-1 ring-rose-500/25">
              <CardContent className="space-y-3 pt-6">
                <Badge className="w-fit border-rose-400/50 bg-rose-500/20 text-rose-100">
                  반려됨
                </Badge>
                <p className="text-sm font-medium text-rose-100">
                  안내에 맞게 내용을 손본 뒤, 다시 검토를 요청해 주세요.
                </p>
                {rejectionInfo.hasRejectedRecord && rejectionInfo.reasonText ? (
                  <div className="rounded-lg border border-rose-500/35 bg-rose-950/45 px-3 py-2.5 text-sm text-rose-50/95">
                    <p className="text-xs font-semibold text-rose-200/90">관리자 안내</p>
                    <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-rose-100/95">
                      {rejectionInfo.reasonText}
                    </p>
                  </div>
                ) : rejectionInfo.hasRejectedRecord ? (
                  <p className="text-xs text-zinc-500">
                    별도 반려 사유 문구는 남지 않았어요. 등록 기준에 맞게 다시 정리해 주세요.
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    사유가 메모에 없을 수 있어요. 수정 후 아래에서 다시 요청해 주세요.
                  </p>
                )}
                <p className="rounded-lg border border-rose-500/25 bg-rose-950/30 px-3 py-2.5 text-sm leading-relaxed text-rose-100/90">
                  반려 사유를 반영해 내용을 손본 뒤,{" "}
                  <span className="font-medium text-rose-50">「수정 후 다시 검토 요청」</span>을 누르기
                  전에 안내를 꼭 확인해 주세요. 관리자가 다시 검토합니다.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/dashboard/media-owner/medias/${media.id}/edit`}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-600 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
                  >
                    내용 수정하기
                  </Link>
                  <Button
                    type="button"
                    className="h-10 bg-emerald-600 hover:bg-emerald-500"
                    disabled={isPending}
                    onClick={() => setResubmitConfirmOpen(true)}
                  >
                    {isPending ? "처리 중…" : "수정 후 다시 검토 요청"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {ownerAlreadySubmitted ? (
                <Card className="border-sky-500/45 bg-sky-950/25 shadow-none ring-1 ring-sky-500/20">
                  <CardContent className="space-y-2 pt-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-sky-400/50 bg-sky-500/20 text-sky-100">
                        검토 요청 완료
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-amber-400/50 text-amber-200"
                      >
                        관리자 승인 대기 중
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-zinc-100">
                      이미 관리자 승인 요청을 완료하셨습니다.
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      지금은 내용을 수정하거나 다시 제출할 수 없습니다. 담당자가 순서대로 검토하고
                      있으니, 조금만 기다려 주세요. 승인·반려 결과는 내 미디어 목록에서 확인하실 수
                      있어요.
                    </p>
                    {ownerSubmittedAt ? (
                      <p className="text-xs text-zinc-500">
                        요청 일시:{" "}
                        {(() => {
                          try {
                            return new Date(ownerSubmittedAt).toLocaleString("ko-KR");
                          } catch {
                            return ownerSubmittedAt;
                          }
                        })()}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {!ownerAlreadySubmitted ? (
                <Card className="border-amber-500/45 bg-amber-500/[0.07] shadow-none ring-1 ring-amber-500/25">
                  <CardHeader className="space-y-3 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-amber-400/60 bg-amber-500/20 text-amber-100">
                        관리자 승인 대기 중
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        아래 정보를 확인한 뒤 저장하거나 최종 신청을 진행해 주세요
                      </span>
                    </div>
                    <CardTitle className="text-lg text-white">
                      매체 등록 · 검토 단계
                    </CardTitle>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      <span className="text-zinc-200">최종 등록 신청</span>을 완료하시면 관리자가
                      내용을 검토한 뒤 승인 여부를 결정합니다. 승인되면 서비스에 노출되며, 보완이
                      필요하면 반려 안내를 드릴 수 있어요.
                    </p>
                  </CardHeader>
                </Card>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {mode === "admin_review" ? (
        <div className="space-y-4">
          <Card className="border-zinc-700/90 bg-zinc-950/90 shadow-none ring-1 ring-zinc-700/60">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    검토 대상 매체
                  </p>
                  <CardTitle className="text-xl font-semibold leading-snug text-white sm:text-2xl">
                    {media.mediaName}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-fit w-fit shrink-0 border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                    media.status === "PENDING" &&
                      "border-amber-400/55 bg-amber-500/15 text-amber-100",
                    media.status === "PUBLISHED" &&
                      "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
                    media.status === "REJECTED" &&
                      "border-rose-400/50 bg-rose-500/15 text-rose-100",
                    media.status !== "PENDING" &&
                      media.status !== "PUBLISHED" &&
                      media.status !== "REJECTED" &&
                      "border-zinc-500/50 text-zinc-300",
                  )}
                >
                  {media.status}
                </Badge>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
                {ownerSubmittedAt ? (
                  <p>
                    매체사가{" "}
                    <span className="font-mono font-semibold text-zinc-100">
                      {formatOwnerSubmittedForAdmin(ownerSubmittedAt) ?? ownerSubmittedAt}
                    </span>
                    에 최종 등록 신청했습니다.
                  </p>
                ) : (
                  <p className="text-zinc-400">
                    매체사 최종 등록 신청 시각이 기록되어 있지 않습니다. (이전 데이터이거나 수동
                    등록일 수 있습니다.)
                  </p>
                )}
              </div>
            </CardHeader>
          </Card>

          <Card className="border-emerald-500/35 bg-emerald-500/[0.06] shadow-none ring-1 ring-emerald-500/20">
            <CardHeader className="space-y-3 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-emerald-400/50 bg-emerald-500/20 text-emerald-100">
                  관리자 검토 가이드
                </Badge>
              </div>
              <CardTitle className="text-base font-semibold text-white">
                승인·반려 전 확인 사항
              </CardTitle>
              <p className="text-sm leading-relaxed text-zinc-300">
                매체사가 입력한 정보를 검토하고, 부족한 부분을 보완한 뒤 승인 또는 반려해 주세요.
              </p>
              <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-zinc-400">
                <li>
                  <span className="text-zinc-200">위치</span> — 주소·좌표·구역이 실제 매체와
                  일치하는지, 지도 표시가 적절한지 확인합니다.
                </li>
                <li>
                  <span className="text-zinc-200">가격·조건</span> — 월 단가, 노출 단가(CPM) 등이
                  합리적이고 설명과 맞는지 봅니다.
                </li>
                <li>
                  <span className="text-zinc-200">이미지</span> — 해상도·구도·실제 매체 여부;
                  저작권·품질 문제가 없는지 확인합니다.
                </li>
                <li>
                  <span className="text-zinc-200">효과 지표</span> — 유동·노출·리치 등 효과 수치가
                  과장되지 않았는지, 출처가 있으면 메모에 남깁니다.
                </li>
              </ul>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <div
        className={cn(
          "space-y-6",
          ownerOutcomeLocked && "pointer-events-none select-none opacity-[0.67]",
        )}
      >
      <Card className={cardClass}>
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className={sectionTitleClass}>기본 정보</CardTitle>
          <p className={sectionDescClass}>
            매체 식별에 필요한 핵심 정보를 입력하세요.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="mediaName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>매체명 *</FormLabel>
                <FormControl>
                  <Input {...field} className={inputClass} />
                </FormControl>
                <FormMessage className="text-xs text-red-400">
                  {form.formState.errors.mediaName?.message as unknown as string}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>카테고리</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                    {MEDIA_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>하위 카테고리</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormItem>
            <div className="flex items-center justify-between gap-2">
              <FormLabel className={labelClass}>추천 하위 카테고리</FormLabel>
              {watchedSubCategory ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={
                          isSubCategoryRecommended
                            ? "cursor-help border-emerald-500/50 text-emerald-300"
                            : "cursor-help border-amber-500/50 text-amber-300"
                        }
                      >
                        {isSubCategoryRecommended
                          ? isSubCategoryEditedFromAi
                            ? "추천값(수정됨)"
                            : "추천/AI 추출 일치"
                          : "커스텀 값"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {aiOriginalSubCategory ? (
                        <div className="space-y-1 text-xs leading-relaxed">
                          <p>
                            <span className="text-zinc-400">원본값:</span>{" "}
                            {aiOriginalSubCategory}
                          </p>
                          <p>
                            <span className="text-zinc-400">현재값:</span>{" "}
                            {watchedSubCategory || "미입력"}
                          </p>
                        </div>
                      ) : (
                        <p>AI 원본 sub_category 없음</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
            <FormControl>
              <Select
                value={form.watch("subCategory") || ""}
                onValueChange={(v) => form.setValue("subCategory", v)}
              >
                <SelectTrigger
                  className={`${inputClass} ${
                    watchedSubCategory
                      ? isSubCategoryRecommended
                        ? "border-emerald-500/50"
                        : "border-amber-500/50"
                      : ""
                  }`}
                >
                  <SelectValue placeholder="추천값에서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {subCategoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
          <FormField
            control={form.control}
            name="targetAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>타겟 연령대</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className={labelClass}>설명</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="space-y-2 pb-2">
          <CardTitle className={sectionTitleClass}>위치 정보</CardTitle>
          <p className={sectionDescClass}>
            주소와 좌표를 정확히 맞추고 지도에서 핀으로 미세 조정하세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="locationJson.address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>주소 *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className={inputClass}
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-400">
                  {form.formState.errors.locationJson?.address?.message as unknown as string}
                </FormMessage>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="locationJson.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>시/도</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} className={inputClass} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationJson.district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>구/군</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} className={inputClass} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="locationJson.lat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>위도 *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      value={field.value ?? ""}
                      placeholder="예: 37.5665"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-400">
                    {form.formState.errors.locationJson?.lat?.message as unknown as string}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationJson.lng"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>경도 *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      value={field.value ?? ""}
                      placeholder="예: 126.9780"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-400">
                    {form.formState.errors.locationJson?.lng?.message as unknown as string}
                  </FormMessage>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="locationJson.map_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>지도 링크</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
              </FormItem>
            )}
          />
          <LeafletLocationPreview
            lat={form.watch("locationJson.lat") ?? null}
            lng={form.watch("locationJson.lng") ?? null}
            onChange={(lat, lng) => {
              form.setValue("locationJson.lat", Number(lat.toFixed(6)));
              form.setValue("locationJson.lng", Number(lng.toFixed(6)));
            }}
          />
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className={sectionTitleClass}>가격 및 사양</CardTitle>
          <p className={sectionDescClass}>
            집행 비용과 매체 규격 정보를 구조화해 입력하세요.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>가격 (원/월) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.value ?? ""}
                      placeholder="예: 3500000"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-12`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      원
                    </span>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-400">
                  {form.formState.errors.price?.message as unknown as string}
                </FormMessage>
                {formatNumberHint(field.value) ? (
                  <p className="text-xs text-zinc-500">
                    표시: {formatNumberHint(field.value)}원
                  </p>
                ) : null}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>가격 비고</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpm"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>CPM</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-12`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      원
                    </span>
                  </div>
                </FormControl>
                {formatNumberHint(field.value) ? (
                  <p className="text-xs text-zinc-500">
                    표시: {formatNumberHint(field.value)}원
                  </p>
                ) : null}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="widthM"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>가로(m)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-10`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      m
                    </span>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="heightM"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>세로(m)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-10`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      m
                    </span>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="resolution"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>해상도</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="operatingHours"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel className={labelClass}>운영 시간</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className={sectionTitleClass}>유동인구 및 타겟</CardTitle>
          <p className={sectionDescClass}>
            오디언스 규모와 타겟 정보를 확인해 추천 정확도를 높입니다.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="dailyFootfall"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>일 유동인구</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-12`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      명
                    </span>
                  </div>
                </FormControl>
                {formatNumberHint(field.value) ? (
                  <p className="text-xs text-zinc-500">
                    표시: {formatNumberHint(field.value)}명
                  </p>
                ) : null}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weekdayFootfall"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>주간 유동인구</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-12`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      명
                    </span>
                  </div>
                </FormControl>
                {formatNumberHint(field.value) ? (
                  <p className="text-xs text-zinc-500">
                    표시: {formatNumberHint(field.value)}명
                  </p>
                ) : null}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>타겟 오디언스</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className={sectionTitleClass}>효과 지표</CardTitle>
          <p className={sectionDescClass}>
            노출/도달/빈도/가시성 지표를 함께 검토하고 보정하세요.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="impressions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>노출수 (Impressions)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-12`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      회
                    </span>
                  </div>
                </FormControl>
                {formatNumberHint(field.value) ? (
                  <p className="text-xs text-zinc-500">
                    표시: {formatNumberHint(field.value)}회
                  </p>
                ) : null}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reach"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>도달률 (%)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-10`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      %
                    </span>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>빈도 (Frequency)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-12`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      회
                    </span>
                  </div>
                </FormControl>
                {formatNumberHint(field.value) ? (
                  <p className="text-xs text-zinc-500">
                    표시: {formatNumberHint(field.value)}회
                  </p>
                ) : null}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="engagementRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>참여율 (%)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-10`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      %
                    </span>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="visibilityScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>가시성 점수 (0-100)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      className={`${inputClass} pr-10`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      점
                    </span>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="effectMemo"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel className={labelClass}>효과 메모</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className={sectionTitleClass}>추출 이미지 선택</CardTitle>
            <p className={sectionDescClass}>대표 이미지로 사용할 항목을 최대 10개 선택합니다.</p>
          </div>
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-300">
            {selectedImages.length}/10개 선택됨
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={selectAllImages}>
              전체 선택
            </Button>
            <Button type="button" variant="outline" onClick={clearAllImages}>
              전체 해제
            </Button>
          </div>
          {extractedCandidates.length === 0 ? (
            <p className="text-sm text-zinc-500">추출 가능한 이미지가 없습니다.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {extractedCandidates.map((url) => (
                <label
                  key={url}
                  className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-2 transition-colors hover:border-zinc-500"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedImageSet.has(url)}
                      onChange={() => toggleImage(url)}
                    />
                    <span className="text-xs text-zinc-300">선택</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-28 w-full rounded object-cover" />
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className={sectionTitleClass}>태그</CardTitle>
          <p className={sectionDescClass}>
            검색성과 추천 품질을 위해 지역/특징 중심으로 태그를 정리하세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="border-orange-500/50 text-orange-300">
                {tag}
                <button type="button" onClick={() => removeTag(i)} className="ml-1">
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className={inputClass} />
            <Button type="button" variant="outline" onClick={addTag}>
              추가
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      <Card className={`${cardClass} sticky bottom-3 z-10 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/85`}>
        <CardContent className="space-y-4 pt-6">
          {mode === "owner_pending" ? (
            ownerOutcomeLocked ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-zinc-600"
                  onClick={() => router.push(`/${locale}/dashboard/media-owner/medias`)}
                >
                  내 미디어 목록
                </Button>
                {media.status === "PUBLISHED" ? (
                  <Link
                    href={`/medias/${media.id}`}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    공개 페이지 보기
                  </Link>
                ) : null}
                {media.status === "REJECTED" ? (
                  <>
                    <Link
                      href={`/dashboard/media-owner/medias/${media.id}/edit`}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-600 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
                    >
                      내용 수정하기
                    </Link>
                    <Button
                      type="button"
                      className="h-11 bg-emerald-600 hover:bg-emerald-500"
                      disabled={isPending}
                      onClick={() => setResubmitConfirmOpen(true)}
                    >
                      {isPending ? "처리 중…" : "수정 후 다시 검토 요청"}
                    </Button>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {!ownerAlreadySubmitted ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-400">
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <div className="space-y-1 border-zinc-800 sm:border-r sm:pr-4">
                        <p className="font-medium text-zinc-200">임시 저장</p>
                        <p className="text-xs leading-relaxed">
                          나중에 다시 수정할 수 있어요. 아직 관리자에게 검토 요청은 보내지 않습니다.
                        </p>
                      </div>
                      <div className="space-y-1 sm:pl-0">
                        <p className="font-medium text-amber-200/90">최종 등록 신청하기</p>
                        <p className="text-xs leading-relaxed">
                          관리자에게 검토 요청을 보냅니다. 신청 후에는 이 화면에서 내용을 수정할 수
                          없어요.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isPending || ownerAlreadySubmitted}
                    className="h-11 min-w-[120px] border-zinc-600"
                  >
                    임시 저장
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinalRegisterSubmit}
                    disabled={isPending || ownerAlreadySubmitted}
                    className="h-12 min-w-[260px] bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
                  >
                    {isPending ? "처리 중…" : "최종 등록 신청하기"}
                  </Button>
                  {onRequestClose ? (
                    <Button type="button" variant="ghost" onClick={() => onRequestClose()}>
                      접기
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                      취소
                    </Button>
                  )}
                </div>
              </div>
            )
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isPending}
                    className="h-11 min-w-[120px] border-zinc-600"
                  >
                    임시 저장
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAdminApprove}
                    disabled={isPending}
                    className="h-12 min-w-[220px] bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
                  >
                    {isPending ? "처리 중…" : "승인하기"}
                  </Button>
                  {!rejectOpen ? (
                    <Button
                      type="button"
                      variant="danger"
                      disabled={isPending}
                      className="h-12 min-w-[120px]"
                      onClick={() => setRejectOpen(true)}
                    >
                      반려하기
                    </Button>
                  ) : null}
                  {onRequestClose ? (
                    <Button type="button" variant="ghost" onClick={() => onRequestClose()}>
                      접기
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                      취소
                    </Button>
                  )}
                </div>
                {rejectOpen ? (
                  <div className="max-w-xl space-y-3 rounded-lg border border-rose-500/45 border-l-4 border-l-rose-500 bg-rose-950/25 p-4 shadow-sm ring-1 ring-rose-500/15">
                    <div>
                      <p className="text-sm font-semibold text-rose-100">반려 처리</p>
                      <p className="mt-2 text-sm leading-relaxed text-rose-200/85">
                        반려 사유를 자세히 입력하면 매체사가 무엇을 수정해야 할지 이해하기 쉽고, 보완 후
                        다시 신청할 수 있습니다.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-zinc-400">반려 사유</p>
                      <Textarea
                        rows={4}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="예: 실측 주소와 좌표 불일치, 대표 이미지 해상도 부족, 노출 수치 근거 요청 등"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        variant="danger"
                        disabled={isPending}
                        onClick={handleAdminReject}
                      >
                        반려 확정
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isPending}
                        className="text-zinc-300 hover:bg-zinc-800"
                        onClick={() => {
                          setRejectOpen(false);
                          setRejectReason("");
                        }}
                      >
                        닫기
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </form>

      {resubmitConfirmOpen ? (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resubmit-confirm-title"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl ring-1 ring-zinc-600/40">
            <h3
              id="resubmit-confirm-title"
              className="text-lg font-semibold text-white"
            >
              다시 검토 요청
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              반려 사유를 수정한 후 다시 최종 등록 신청을 해주세요. 관리자가 재검토합니다.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              내용을 충분히 반영했는지 한 번 더 확인한 뒤 보내 주시면 검토가 더 수월합니다.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-zinc-600"
                disabled={isPending}
                onClick={() => setResubmitConfirmOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-500"
                disabled={isPending}
                onClick={() => handleResubmitFromReject()}
              >
                {isPending ? "처리 중…" : "검토 요청 보내기"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Form>
  );
}
