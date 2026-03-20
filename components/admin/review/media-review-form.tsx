"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  updateMediaDraft,
  publishMedia,
  type MediaReviewFormPayload,
} from "@/app/[locale]/admin/review/[mediaId]/actions";
import { cn } from "@/lib/utils";
import type { MediaCategory, Prisma } from "@prisma/client";
import { Loader2, Info } from "lucide-react";
import { useFootfallData } from "@/hooks/useFootfallData";
import { isSeongsuArea } from "@/lib/footfall/address-parser";
import { calcCpmFromPriceAndImpressions } from "@/lib/footfall/cpm";

const MEDIA_CATEGORIES: { value: MediaCategory; label: string }[] = [
  { value: "BILLBOARD", label: "빌보드" },
  { value: "DIGITAL_BOARD", label: "디지털 보드" },
  { value: "TRANSIT", label: "대중교통" },
  { value: "STREET_FURNITURE", label: "가로 시설물" },
  { value: "WALL", label: "월/벽면" },
  { value: "ETC", label: "기타" },
];

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

type MediaReviewFormProps = {
  media: MediaWithCreatedBy;
  locale: string;
  /** AI 업로드 목록 등에서 전체 폼을 바로 펼침 */
  embedMode?: boolean;
  /** embedMode에서 접기 / 취소 대체 */
  onRequestClose?: () => void;
};

const reviewExpandedStorageKey = (mediaId: string) =>
  `xthex-media-review-expanded-${mediaId}`;

export function MediaReviewForm({
  media,
  locale,
  embedMode = false,
  onRequestClose,
}: MediaReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [tagInput, setTagInput] = React.useState("");
  const [audienceTagInput, setAudienceTagInput] = React.useState("");
  const [reparseLoading, setReparseLoading] = React.useState(false);
  const [footfallSourceLabel, setFootfallSourceLabel] = React.useState<string | null>(null);
  const { fetchByAddress, loading: footfallLoading } = useFootfallData();
  const isDraft = media.status === "DRAFT";
  const [detailOpen, setDetailOpen] = React.useState(
    embedMode ? true : !isDraft,
  );

  React.useEffect(() => {
    if (embedMode) {
      setDetailOpen(true);
      return;
    }
    if (!isDraft) {
      setDetailOpen(true);
      return;
    }
    setDetailOpen(false);
    try {
      if (localStorage.getItem(reviewExpandedStorageKey(media.id)) === "1") {
        setDetailOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [embedMode, isDraft, media.id]);

  const openDetailsForReview = () => {
    try {
      localStorage.setItem(reviewExpandedStorageKey(media.id), "1");
    } catch {
      /* ignore */
    }
    setDetailOpen(true);
  };

  const location = parseLocationJson(media.locationJson);
  const exposure = parseExposureJson(media.exposureJson);

  const form = useForm<MediaReviewFormPayload>({
    defaultValues: {
      mediaName: media.mediaName,
      description: media.description ?? "",
      category: media.category,
      locationJson: {
        address: location.address ?? "",
        district: location.district ?? "",
        city: location.city ?? "",
        lat: location.lat ?? null,
        lng: location.lng ?? null,
        map_link: location.map_link ?? "",
      },
      price: media.price ?? null,
      cpm: media.cpm ?? null,
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
    },
  });

  const tags = form.watch("tags");
  const audienceTags = form.watch("audienceTags");
  const images = form.watch("images");
  const sampleImages = form.watch("sampleImages");

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

  const addAudienceTag = () => {
    const v = audienceTagInput.trim().replace(/,/g, "");
    if (!v) return;
    const current = form.getValues("audienceTags") ?? [];
    if (current.includes(v)) return;
    form.setValue("audienceTags", [...current, v]);
    setAudienceTagInput("");
  };

  const removeAudienceTag = (index: number) => {
    const next = (form.getValues("audienceTags") ?? []).filter((_, i) => i !== index);
    form.setValue("audienceTags", next);
  };

  const handleAddressBlur = React.useCallback(async () => {
    const address = form.getValues("locationJson.address");
    const district = form.getValues("locationJson.district");
    const city = form.getValues("locationJson.city");
    const addrStr = String(address ?? "").trim();
    if (!addrStr) return;
    if (isSeongsuArea(addrStr, district)) {
      toast({ title: "성수 상권 데이터 조회 중..." });
    }
    const suggestion = await fetchByAddress(addrStr, district, city);
    if (suggestion) {
      form.setValue("exposureJson.daily_traffic", suggestion.footfall);
      form.setValue("exposureJson.monthly_impressions", suggestion.dailyImpressions * 30);
      form.setValue("exposureJson.reach", suggestion.reach);
      form.setValue("exposureJson.frequency", suggestion.frequency);
      setFootfallSourceLabel(suggestion.sourceLabel);
      const price = form.getValues("price");
      const cpm = calcCpmFromPriceAndImpressions(price ?? null, suggestion.dailyImpressions);
      if (cpm != null) form.setValue("cpm", cpm);
      toast({
        title: suggestion.isFallback ? "근처 상권(성수 메인) 기준으로 제안됨" : "상권 데이터 반영됨",
        description: suggestion.sourceLabel,
      });
    }
  }, [form, fetchByAddress, toast]);

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
  });

  const handleSaveDraft = () => {
    startTransition(async () => {
      const result = await updateMediaDraft(media.id, buildPayload());
      if (result.ok) {
        toast({ title: "임시 저장되었습니다." });
      } else {
        toast({ title: "저장 실패", description: result.error, variant: "destructive" });
      }
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishMedia(media.id, buildPayload());
      if (result.ok) {
        toast({ title: "공개되었습니다.", description: "미디어 목록으로 이동합니다." });
        onRequestClose?.();
        router.push(`/${locale}/admin/medias`);
      } else {
        toast({ title: "공개 실패", description: result.error, variant: "destructive" });
      }
    });
  };

  const applyReparsePayload = (p: MediaReviewFormPayload) => {
    form.reset({
      mediaName: p.mediaName,
      description: p.description ?? "",
      category: p.category as MediaCategory,
      locationJson: {
        address: String(p.locationJson?.address ?? ""),
        district: String(p.locationJson?.district ?? ""),
        city: String(p.locationJson?.city ?? ""),
        lat: p.locationJson?.lat ?? null,
        lng: p.locationJson?.lng ?? null,
        map_link: String(p.locationJson?.map_link ?? ""),
      },
      price: p.price,
      cpm: p.cpm,
      exposureJson: p.exposureJson ?? {
        daily_traffic: null,
        monthly_impressions: null,
        reach: null,
        frequency: null,
      },
      targetAudience: p.targetAudience ?? "",
      images: p.images ?? [],
      tags: p.tags ?? [],
      audienceTags: p.audienceTags ?? [],
      pros: p.pros ?? "",
      cons: p.cons ?? "",
      trustScore: p.trustScore ?? 0,
      sampleImages: p.sampleImages ?? [],
      sampleDescriptions: p.sampleDescriptions ?? [],
    });
  };

  const handleReparseWithHints = async () => {
    const v = form.getValues();
    setReparseLoading(true);
    try {
      const res = await fetch("/api/reparse-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          draftId: media.id,
          mediaId: media.id,
          updatedData: {
            locationJson: {
              address: v.locationJson?.address?.trim() || undefined,
              district: v.locationJson?.district?.trim() || undefined,
              city: v.locationJson?.city?.trim() || undefined,
            },
            mediaName: v.mediaName,
            description: v.description,
            category: v.category,
            price: v.price,
            cpm: v.cpm,
            targetAudience: v.targetAudience,
            tags: v.tags,
            pros: v.pros,
          },
        }),
      });
      const result = (await res.json()) as
        | { ok: true; payload: MediaReviewFormPayload }
        | { ok: false; error: string };
      if (!result.ok) {
        toast({
          title: "재파싱 실패",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      applyReparsePayload(result.payload);
      toast({
        title: "재파싱 완료! 확인해주세요",
        description: "AI가 주소와 사진 데이터를 다시 분석했습니다. 필요 시 임시 저장하세요.",
      });
    } catch {
      toast({
        title: "재파싱 실패",
        description: "네트워크 오류",
        variant: "destructive",
      });
    } finally {
      setReparseLoading(false);
    }
  };

  const addrWatch = form.watch("locationJson.address");
  const districtWatch = form.watch("locationJson.district");
  const addrStr = String(addrWatch ?? "").trim();
  const districtStr = String(districtWatch ?? "").trim();
  const addressMissing =
    (addrStr.length < 2 && districtStr.length < 2) ||
    (!addrStr && !districtStr);

  const inputClass =
    "rounded-lg border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500 focus-visible:border-orange-500/50";
  const labelClass = "text-zinc-300";

  const categoryLabel =
    MEDIA_CATEGORIES.find((c) => c.value === media.category)?.label ?? media.category;

  return (
    <form className="space-y-6">
      {isDraft && !detailOpen && !embedMode ? (
        <Card className="border-zinc-700 bg-zinc-950 shadow-none ring-1 ring-orange-500/20">
          <CardContent className="space-y-5 px-6 py-10 text-center">
            <p className="text-sm font-medium text-orange-400">
              AI 추출 초안 · 검토 전
            </p>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-white">{media.mediaName}</p>
              <p className="text-sm text-zinc-500">{categoryLabel}</p>
            </div>
            <p className="mx-auto max-w-md text-sm text-zinc-400">
              내용을 펼치기 전에는 상세 필드가 보이지 않습니다. 확인 후 수정·공개할 수
              있습니다.
            </p>
            <Button
              type="button"
              onClick={openDetailsForReview}
              className="bg-orange-600 px-8 text-white hover:bg-orange-500"
            >
              확인하고 상세 편집
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div
        className={cn(
          "space-y-6",
          isDraft && !detailOpen && !embedMode && "hidden",
        )}
      >
      {/* 설치 위치 · 재파싱 (주소 최우선) */}
      <Card className="border-2 border-cyan-900/50 bg-gradient-to-b from-zinc-950 to-zinc-900/80 shadow-lg shadow-cyan-950/20">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg text-white">
              설치 위치 <span className="text-cyan-400">(주소)</span>
            </CardTitle>
            {addressMissing ? (
              <Badge
                variant="outline"
                className="border-red-500/70 bg-red-950/50 text-red-300"
              >
                주소가 누락됐습니다. 입력 후 재파싱 추천
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-emerald-600/50 text-emerald-400"
              >
                주소 입력됨
              </Badge>
            )}
          </div>
          {addressMissing ? (
            <p className="text-sm text-red-300/90">
              주소가 누락됐어요. 아래에 직접 입력한 뒤{" "}
              <strong className="text-cyan-300">주소 수정 후 재파싱</strong>을
              누르면 PDF·Vision과 함께 AI가 다시 추출합니다.
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              주소를 고친 뒤 재파싱하면 Grok이 전체 제안서를 다시 읽고 폼을
              갱신합니다.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/50 p-4 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              주소 (full_address · district · city)
            </p>
            <div className="space-y-2">
              <Label htmlFor="addr-full" className={labelClass}>
                상세 주소 (full_address)
              </Label>
              <Input
                id="addr-full"
                {...form.register("locationJson.address")}
                onBlur={() => void handleAddressBlur()}
                placeholder="예: 서울특별시 성동구 연무장길 62"
                className={cn(inputClass, "h-11 text-base")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr-district" className={labelClass}>
                  구·군 (district)
                </Label>
                <Input
                  id="addr-district"
                  {...form.register("locationJson.district")}
                  placeholder="예: 강남구"
                  className={cn(inputClass, "h-10")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-city" className={labelClass}>
                  시·도 (city)
                </Label>
                <Input
                  id="addr-city"
                  {...form.register("locationJson.city")}
                  placeholder="예: 서울특별시"
                  className={cn(inputClass, "h-10")}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
            <div className="space-y-2">
              <Label htmlFor="lat2" className={labelClass}>
                위도
              </Label>
              <Input
                id="lat2"
                type="number"
                step="any"
                {...form.register("locationJson.lat", {
                  setValueAs: (v) => (v === "" ? null : Number(v)),
                })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng2" className={labelClass}>
                경도
              </Label>
              <Input
                id="lng2"
                type="number"
                step="any"
                {...form.register("locationJson.lng", {
                  setValueAs: (v) => (v === "" ? null : Number(v)),
                })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="map2" className={labelClass}>
              지도 링크 (선택)
            </Label>
            <Input
              id="map2"
              {...form.register("locationJson.map_link")}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div className="border-t border-zinc-800 pt-4">
            {reparseLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-cyan-800/40 bg-cyan-950/20 py-8">
                <Loader2
                  className="h-10 w-10 animate-spin text-cyan-400"
                  aria-hidden
                />
                <p className="text-center text-sm text-cyan-100/90">
                  AI가 주소와 사진 데이터를 다시 분석 중입니다…
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void handleReparseWithHints()}
                  disabled={reparseLoading}
                  className="flex h-11 w-full max-w-md items-center justify-center rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-8 text-sm font-semibold text-white shadow-md transition-all hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 sm:w-auto"
                >
                  주소 수정 후 재파싱
                </button>
                <p className="mt-2 text-xs text-zinc-500">
                  주소 입력 후 재파싱하면 AI가 더 정확하게 사진과 연계합니다.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 기본 정보 */}
      <Card className="border-zinc-800 bg-zinc-950 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-white">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mediaName" className={labelClass}>
              미디어명
            </Label>
            <Input
              id="mediaName"
              {...form.register("mediaName", { required: true })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className={labelClass}>
              설명
            </Label>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className={labelClass}>
              카테고리
            </Label>
            <Select
              id="category"
              {...form.register("category")}
              className={cn(inputClass, "cursor-pointer")}
            >
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={labelClass}>타깃 오디언스</Label>
            <Input
              {...form.register("targetAudience")}
              placeholder="예: 20~30대 직장인"
              className={inputClass}
            />
          </div>
        </CardContent>
      </Card>

      {/* 가격 / 노출 */}
      <Card className="border-zinc-800 bg-zinc-950 shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base text-white">가격 · 노출</CardTitle>
            <a
              href="https://data.seoul.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-cyan-400"
              title="서울 열린데이터 광장"
              aria-label="데이터 출처 (서울시)"
            >
              <Info className="h-4 w-4" />
            </a>
          </div>
          {footfallSourceLabel ? (
            <p className="mt-1 text-xs text-zinc-500" title={footfallSourceLabel}>
              {footfallSourceLabel}
            </p>
          ) : null}
          {footfallLoading ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-cyan-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              성수 상권 데이터 조회 중…
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className={labelClass}>
                가격 (원)
              </Label>
              <Input
                id="price"
                type="number"
                {...form.register("price", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpm" className={labelClass}>
                CPM (원)
              </Label>
              <Input
                id="cpm"
                type="number"
                {...form.register("cpm", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>일 유동인구 (Daily Footfall)</Label>
              <Input
                {...form.register("exposureJson.daily_traffic")}
                placeholder="예: 70000"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>월 노출수 (일×30)</Label>
              <Input
                {...form.register("exposureJson.monthly_impressions")}
                placeholder="예: 24000000"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>리치 (Reach)</Label>
              <Input
                {...form.register("exposureJson.reach")}
                placeholder="예: 35000"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>빈도 (Frequency)</Label>
              <Input
                {...form.register("exposureJson.frequency")}
                placeholder="예: 4.5"
                className={inputClass}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이미지 미리보기 */}
      <Card className="border-zinc-800 bg-zinc-950 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-white">이미지 / 설명</CardTitle>
          <p className="text-xs text-zinc-500">현재 텍스트 목록 (추후 Vision URL로 교체)</p>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <p className="text-sm text-zinc-500">등록된 이미지 없음</p>
          ) : (
            <ul className="space-y-1 text-sm text-zinc-300">
              {images.map((img, i) => (
                <li key={i} className="truncate">
                  {typeof img === "string" ? img : JSON.stringify(img)}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* PDF Vision → Supabase 샘플 */}
      <Card className="border-zinc-800 bg-zinc-950 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-white">제안서 샘플 이미지 (Vision)</CardTitle>
          <p className="text-xs text-zinc-500">
            PDF 페이지 렌더 후 Grok Vision이 고른 장면 · Supabase 업로드 URL (상세/탐색 캐러셀 우선)
          </p>
        </CardHeader>
        <CardContent>
          {(sampleImages ?? []).filter((u) => /^https?:\/\//i.test(String(u).trim()))
            .length === 0 ? (
            <p className="text-sm text-zinc-500">
              없음 · Supabase 환경변수·버킷 설정 시 업로드됩니다.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(sampleImages ?? [])
                .filter((u) => /^https?:\/\//i.test(String(u).trim()))
                .map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg ring-1 ring-zinc-700"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="h-24 w-36 object-cover"
                    />
                  </a>
                ))}
            </div>
          )}
          {(form.watch("sampleDescriptions") ?? []).length > 0 && (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="mb-2 text-xs font-medium text-zinc-400">
                매체 사진 설명 (업로드·Vision)
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                {(form.watch("sampleDescriptions") ?? []).map((d, i) => (
                  <li key={i} className="rounded-lg bg-zinc-900/50 px-3 py-2">
                    <span className="text-orange-400/90">#{i + 1}</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 태그 */}
      <Card className="border-zinc-800 bg-zinc-950 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-white">태그</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                className="border-orange-500/50 bg-orange-500/10 text-orange-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  className="ml-1 rounded hover:bg-orange-500/30"
                  aria-label="태그 제거"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="태그 입력 후 Enter"
              className={inputClass}
            />
            <Button type="button" variant="outline" onClick={addTag} className="border-zinc-600 text-zinc-300">
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 타겟 태그 (탐색 검색용, 타겟 문구 기반 자동 병합) */}
      <Card className="border-zinc-800 bg-zinc-950 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-white">타겟 태그</CardTitle>
          <p className="text-xs text-zinc-500">
            저장 시 타깃 오디언스 문구에서 자동 추출된 태그와 아래 목록이 합쳐집니다. 탐색 검색에 활용됩니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(audienceTags ?? []).map((tag, i) => (
              <Badge
                key={`${tag}-${i}`}
                variant="outline"
                className="border-sky-500/50 bg-sky-500/10 text-sky-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeAudienceTag(i)}
                  className="ml-1 rounded hover:bg-sky-500/30"
                  aria-label="타겟 태그 제거"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={audienceTagInput}
              onChange={(e) => setAudienceTagInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addAudienceTag())
              }
              placeholder="추가 태그 (예: 프리미엄층)"
              className={inputClass}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addAudienceTag}
              className="border-zinc-600 text-zinc-300"
            >
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 장단점 */}
      <Card className="border-zinc-800 bg-zinc-950 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-white">장단점</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pros" className={labelClass}>
              장점
            </Label>
            <Textarea
              id="pros"
              {...form.register("pros")}
              rows={2}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cons" className={labelClass}>
              단점
            </Label>
            <Textarea
              id="cons"
              {...form.register("cons")}
              rows={2}
              className={inputClass}
            />
          </div>
        </CardContent>
      </Card>

      {/* 신뢰도 */}
      <Card className="border-zinc-800 bg-zinc-950 shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-white">신뢰도 (0~100)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Slider
              min={0}
              max={100}
              step={1}
              value={form.watch("trustScore") ?? 0}
              onValueChange={(v) => form.setValue("trustScore", v)}
              className="flex-1"
            />
            <span className="w-10 text-right font-medium text-orange-400">
              {form.watch("trustScore") ?? 0}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 관리자 메모 (읽기 전용) */}
      {media.adminMemo ? (
        <Card className="border-zinc-800 bg-zinc-950 shadow-none">
          <CardHeader>
            <CardTitle className="text-base text-white">관리자 메모</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-zinc-400">{media.adminMemo}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* 액션 버튼 */}
      <Card className="border-zinc-800 bg-zinc-950 shadow-none">
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="bg-orange-600 text-white hover:bg-orange-500"
          >
            {isPending ? "처리 중…" : "저장 및 공개"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isPending}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            임시 저장
          </Button>
          {onRequestClose ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onRequestClose()}
              disabled={isPending}
              className="text-zinc-400 hover:text-zinc-200"
            >
              접기
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isPending}
              className="text-zinc-400 hover:text-zinc-200"
            >
              취소
            </Button>
          )}
          {embedMode ? (
            <a
              href={`/${locale}/admin/review/${media.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-zinc-500 underline-offset-4 hover:text-orange-400 hover:underline"
            >
              전체 화면에서 열기
            </a>
          ) : null}
        </CardContent>
      </Card>
      </div>
    </form>
  );
}
