"use client";

import * as React from "react";
import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import type { MediaCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { landing } from "@/lib/landing-theme";
import { LeafletLocationPreview } from "@/components/admin/review/LeafletLocationPreview";

const CATEGORIES: { value: MediaCategory; label: string }[] = [
  { value: "BILLBOARD", label: "빌보드" },
  { value: "DIGITAL_BOARD", label: "디지털 보드" },
  { value: "TRANSIT", label: "대중교통" },
  { value: "STREET_FURNITURE", label: "가로 시설물" },
  { value: "WALL", label: "월/벽면" },
  { value: "ETC", label: "기타" },
];

function num(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function numReq(s: string): number | undefined {
  const n = num(s);
  return n === null ? undefined : n;
}

export function MediaOwnerManualRegistrationForm() {
  const router = useRouter();
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [mediaName, setMediaName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<MediaCategory>("BILLBOARD");
  const [subCategory, setSubCategory] = React.useState("");
  const [tagsInput, setTagsInput] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [city, setCity] = React.useState("");
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);
  const [mapLink, setMapLink] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [priceNote, setPriceNote] = React.useState("");
  const [cpm, setCpm] = React.useState("");
  const [widthM, setWidthM] = React.useState("");
  const [heightM, setHeightM] = React.useState("");
  const [resolution, setResolution] = React.useState("");
  const [operatingHours, setOperatingHours] = React.useState("");
  const [dailyFootfall, setDailyFootfall] = React.useState("");
  const [weekdayFootfall, setWeekdayFootfall] = React.useState("");
  const [targetAge, setTargetAge] = React.useState("");
  const [targetAudience, setTargetAudience] = React.useState("");
  const [impressions, setImpressions] = React.useState("");
  const [reach, setReach] = React.useState("");
  const [frequency, setFrequency] = React.useState("");
  const [engagementRate, setEngagementRate] = React.useState("");
  const [visibilityScore, setVisibilityScore] = React.useState("");
  const [effectMemo, setEffectMemo] = React.useState("");
  const [pros, setPros] = React.useState("");
  const [cons, setCons] = React.useState("");
  const [trustScore, setTrustScore] = React.useState("");
  const [availabilityStart, setAvailabilityStart] = React.useState("");
  const [availabilityEnd, setAvailabilityEnd] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaName.trim() || mediaName.trim().length < 2) {
      toast.error("매체명을 2자 이상 입력해 주세요.");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("설명은 10자 이상 입력해 주세요.");
      return;
    }
    if (!address.trim()) {
      toast.error("주소는 필수입니다.");
      return;
    }
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error("위도·경도를 입력하거나 지도에서 선택해 주세요.");
      return;
    }
    const priceN = numReq(price);
    if (priceN == null || priceN <= 0) {
      toast.error("월 가격(원)을 올바르게 입력해 주세요.");
      return;
    }
    if (files.length === 0) {
      toast.error("이미지를 1장 이상 선택해 주세요. (최대 10장)");
      return;
    }
    if (files.length > 10) {
      toast.error("이미지는 최대 10장입니다.");
      return;
    }

    const tags = tagsInput
      .split(/[,#]/g)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 40);

    const payload = {
      mediaName: mediaName.trim(),
      description: description.trim(),
      category,
      subCategory: subCategory.trim() || null,
      tags,
      locationJson: {
        address: address.trim(),
        district: district.trim() || null,
        city: city.trim() || null,
        lat,
        lng,
        map_link: mapLink.trim() || null,
      },
      price: Math.round(priceN),
      priceNote: priceNote.trim() || null,
      widthM: num(widthM),
      heightM: num(heightM),
      resolution: resolution.trim() || null,
      operatingHours: operatingHours.trim() || null,
      dailyFootfall: num(dailyFootfall),
      weekdayFootfall: num(weekdayFootfall),
      targetAge: targetAge.trim() || null,
      targetAudience: targetAudience.trim() || null,
      impressions: num(impressions),
      reach: num(reach),
      frequency: num(frequency),
      cpm: num(cpm) != null ? Math.round(num(cpm)!) : null,
      engagementRate: num(engagementRate),
      visibilityScore: num(visibilityScore) != null ? Math.round(num(visibilityScore)!) : null,
      effectMemo: effectMemo.trim() || null,
      pros: pros.trim() || null,
      cons: cons.trim() || null,
      trustScore: num(trustScore) != null ? Math.round(num(trustScore)!) : null,
      availabilityStart: availabilityStart.trim() || null,
      availabilityEnd: availabilityEnd.trim() || null,
    };

    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));
    for (const f of files) {
      fd.append("images", f);
    }

    setPending(true);
    try {
      const res = await fetch("/api/media-owner/register-manual", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        mediaId?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "등록에 실패했습니다.");
        return;
      }
      toast.success("등록 신청이 완료되었습니다.", {
        description: "검토 화면에서 내용을 다듬을 수 있습니다.",
        duration: 5000,
      });
      if (data.mediaId) {
        router.push(`/${locale}/dashboard/media-owner/medias/${data.mediaId}/review`);
        router.refresh();
      } else {
        router.push(`/${locale}/dashboard/media-owner/medias`);
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500";

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        landing.surface,
        "space-y-6 border-emerald-900/40 bg-zinc-950 p-6 dark:border-zinc-800 lg:p-8",
      )}
    >
      {pending ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm"
          aria-busy
        >
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm text-zinc-200">등록 처리 중…</p>
        </div>
      ) : null}

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-base text-white">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-zinc-300">매체명 *</Label>
            <Input
              value={mediaName}
              onChange={(e) => setMediaName(e.target.value)}
              className={inputClass}
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">카테고리 *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as MediaCategory)}>
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">하위 카테고리</Label>
            <Input
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className={inputClass}
              placeholder="예: LED 전광판"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-zinc-300">태그 (쉼표로 구분)</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className={inputClass}
              placeholder="강남, 야간, 고가"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-zinc-300">설명 * (10자 이상)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              rows={5}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-base text-white">위치 *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-zinc-300">주소 *</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">시/도</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">구/군</Label>
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">위도 *</Label>
              <Input
                type="number"
                step="any"
                value={lat ?? ""}
                onChange={(e) =>
                  setLat(e.target.value === "" ? null : Number(e.target.value))
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">경도 *</Label>
              <Input
                type="number"
                step="any"
                value={lng ?? ""}
                onChange={(e) =>
                  setLng(e.target.value === "" ? null : Number(e.target.value))
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-zinc-300">지도 링크</Label>
              <Input
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <LeafletLocationPreview
            lat={lat}
            lng={lng}
            onChange={(la, ln) => {
              setLat(Number(la.toFixed(6)));
              setLng(Number(ln.toFixed(6)));
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-base text-white">가격 · 사양</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-zinc-300">월 가격(원) *</Label>
            <Input
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-zinc-300">가격 비고</Label>
            <Input value={priceNote} onChange={(e) => setPriceNote(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">CPM(원)</Label>
            <Input type="number" min={0} value={cpm} onChange={(e) => setCpm(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">가로(m)</Label>
            <Input type="number" step="any" value={widthM} onChange={(e) => setWidthM(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">세로(m)</Label>
            <Input type="number" step="any" value={heightM} onChange={(e) => setHeightM(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">해상도</Label>
            <Input value={resolution} onChange={(e) => setResolution(e.target.value)} className={inputClass} placeholder="1920x1080" />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label className="text-zinc-300">운영 시간</Label>
            <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} className={inputClass} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-base text-white">유동인구 · 타겟 · 효과 지표</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-zinc-300">일 유동인구</Label>
            <Input type="number" min={0} value={dailyFootfall} onChange={(e) => setDailyFootfall(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">주간 유동인구</Label>
            <Input type="number" min={0} value={weekdayFootfall} onChange={(e) => setWeekdayFootfall(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">타겟 연령</Label>
            <Input value={targetAge} onChange={(e) => setTargetAge(e.target.value)} className={inputClass} placeholder="20–39세" />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label className="text-zinc-300">타겟 오디언스</Label>
            <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">월 노출수</Label>
            <Input type="number" min={0} value={impressions} onChange={(e) => setImpressions(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">도달률(%)</Label>
            <Input type="number" step="any" value={reach} onChange={(e) => setReach(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">빈도</Label>
            <Input type="number" step="any" value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">참여율(%)</Label>
            <Input type="number" step="any" value={engagementRate} onChange={(e) => setEngagementRate(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">가시성(0–100)</Label>
            <Input type="number" min={0} max={100} value={visibilityScore} onChange={(e) => setVisibilityScore(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label className="text-zinc-300">효과 메모</Label>
            <Textarea value={effectMemo} onChange={(e) => setEffectMemo(e.target.value)} className={inputClass} rows={3} />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label className="text-zinc-300">장점 / 유의사항 (선택)</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <Textarea value={pros} onChange={(e) => setPros(e.target.value)} className={inputClass} rows={2} placeholder="장점" />
              <Textarea value={cons} onChange={(e) => setCons(e.target.value)} className={inputClass} rows={2} placeholder="유의사항" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">신뢰 점수(0–100)</Label>
            <Input type="number" min={0} max={100} value={trustScore} onChange={(e) => setTrustScore(e.target.value)} className={inputClass} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-base text-white">이미지 * (최대 10장)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              setFiles(list.slice(0, 10));
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="border-zinc-600"
          >
            <Upload className="mr-2 h-4 w-4" />
            이미지 선택
          </Button>
          <p className="text-sm text-zinc-400">{files.length}장 선택됨</p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-base text-white">노출 가능 기간 (선택)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">시작일</Label>
            <Input type="date" value={availabilityStart} onChange={(e) => setAvailabilityStart(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">종료일</Label>
            <Input type="date" value={availabilityEnd} onChange={(e) => setAvailabilityEnd(e.target.value)} className={inputClass} />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={pending}
        className="h-12 min-w-[240px] bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-semibold text-white hover:from-emerald-700 hover:to-teal-700"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            제출 중…
          </>
        ) : (
          "등록 신청"
        )}
      </Button>
      <p className="text-xs text-zinc-500">
        제출 시 관리자 검토 후 승인 시 공개됩니다.
      </p>
    </form>
  );
}
