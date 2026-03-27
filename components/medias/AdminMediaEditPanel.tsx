"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type ExposureData = {
  daily_traffic?: number | null;
  monthly_impressions?: number | null;
  reach?: number | null;
  frequency?: number | null;
  target_age?: string | null;
  cpm?: number | null;
  engagement_rate?: number | null;
  visibility_score?: number | null;
};

type LocationData = {
  address?: string | null;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type AdminMediaData = {
  id: string;
  mediaName: string;
  description: string | null;
  price: number | null;
  cpm: number | null;
  exposureJson: ExposureData;
  locationJson: LocationData;
  targetAudience: string | null;
  audienceTags: string[];
  tags: string[];
  pros: string | null;
  cons: string | null;
  sampleImages?: string[];
};

export function AdminMediaEditPanel({ media }: { media: AdminMediaData }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<string[]>(media.sampleImages ?? []);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [form, setForm] = React.useState(() => buildForm(media));

  function buildForm(m: AdminMediaData) {
    return {
      mediaName: m.mediaName,
      description: m.description ?? "",
      price: m.price?.toString() ?? "",
      cpm: m.cpm?.toString() ?? "",
      targetAudience: m.targetAudience ?? "",
      audienceTags: m.audienceTags.join(", "),
      tags: m.tags.join(", "),
      pros: m.pros ?? "",
      cons: m.cons ?? "",
      daily_traffic: m.exposureJson.daily_traffic?.toString() ?? "",
      monthly_impressions: m.exposureJson.monthly_impressions?.toString() ?? "",
      reach: m.exposureJson.reach?.toString() ?? "",
      frequency: m.exposureJson.frequency?.toString() ?? "",
      target_age: m.exposureJson.target_age ?? "",
      exposure_cpm: m.exposureJson.cpm?.toString() ?? "",
      engagement_rate: m.exposureJson.engagement_rate?.toString() ?? "",
      visibility_score: m.exposureJson.visibility_score?.toString() ?? "",
      address: m.locationJson.address ?? "",
      district: m.locationJson.district ?? "",
      lat: m.locationJson.lat?.toString() ?? "",
      lng: m.locationJson.lng?.toString() ?? "",
    };
  }

  function handleOpen() {
    setForm(buildForm(media));
    setImages(media.sampleImages ?? []);
    setError(null);
    setOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("mediaSamples", file);
      });

      const res = await fetch("/api/admin/media-samples", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("업로드 실패");

      const data = await res.json();
      if (data.urls && data.urls.length > 0) {
        setImages((prev) => [...prev, ...data.urls]);
      }
      if (data.warnings && data.warnings.length > 0) {
        setError(data.warnings.join(", "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function parseNum(v: string): number | null {
    if (!v.trim()) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  function parseIntVal(v: string): number | null {
    if (!v.trim()) return null;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  }

  function parseTags(v: string): string[] {
    return v
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        mediaName: form.mediaName,
        description: form.description || null,
        price: parseIntVal(form.price),
        cpm: parseIntVal(form.cpm),
        targetAudience: form.targetAudience || null,
        audienceTags: parseTags(form.audienceTags),
        tags: parseTags(form.tags),
        pros: form.pros || null,
        cons: form.cons || null,
        sampleImages: images,
        exposureJson: {
          daily_traffic: parseNum(form.daily_traffic),
          monthly_impressions: parseNum(form.monthly_impressions),
          reach: parseNum(form.reach),
          frequency: parseNum(form.frequency),
          target_age: form.target_age || null,
          cpm: parseNum(form.exposure_cpm),
          engagement_rate: parseNum(form.engagement_rate),
          visibility_score: parseNum(form.visibility_score),
        },
        locationJson: {
          address: form.address || null,
          district: form.district || null,
          lat: parseNum(form.lat),
          lng: parseNum(form.lng),
        },
      };

      const res = await fetch(`/api/admin/media/${media.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";
  const labelCls = "block text-xs font-medium text-zinc-400 mb-1";

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-6 z-40 flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-400 transition-colors"
      >
        <Pencil className="h-4 w-4" />
        편집 모드
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle className="text-zinc-100">매체 정보 편집</SheetTitle>
            <SheetDescription className="text-zinc-400">
              변경 후 저장을 누르면 즉시 반영됩니다.
            </SheetDescription>
          </SheetHeader>

          {error && (
            <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-6">
            {/* Basic Info */}
            <Section title="기본 정보">
              <Field label="매체명">
                <input
                  className={inputCls}
                  value={form.mediaName}
                  onChange={(e) => set("mediaName", e.target.value)}
                />
              </Field>
              <Field label="설명">
                <textarea
                  className={`${inputCls} min-h-[80px] resize-y`}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </Section>

            {/* Pricing */}
            <Section title="가격">
              <div className="grid grid-cols-2 gap-3">
                <Field label="월 광고비 (원)">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                  />
                </Field>
                <Field label="CPM (원)">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.cpm}
                    onChange={(e) => set("cpm", e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* Exposure */}
            <Section title="노출 데이터">
              <div className="grid grid-cols-2 gap-3">
                <Field label="일일 유동인구">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.daily_traffic}
                    onChange={(e) => set("daily_traffic", e.target.value)}
                  />
                </Field>
                <Field label="월 노출수">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.monthly_impressions}
                    onChange={(e) => set("monthly_impressions", e.target.value)}
                  />
                </Field>
                <Field label="도달률 (%)">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.reach}
                    onChange={(e) => set("reach", e.target.value)}
                  />
                </Field>
                <Field label="빈도 (회)">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.frequency}
                    onChange={(e) => set("frequency", e.target.value)}
                  />
                </Field>
                <Field label="타겟 연령대">
                  <input
                    className={inputCls}
                    value={form.target_age}
                    onChange={(e) => set("target_age", e.target.value)}
                  />
                </Field>
                <Field label="노출 CPM">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.exposure_cpm}
                    onChange={(e) => set("exposure_cpm", e.target.value)}
                  />
                </Field>
                <Field label="참여율">
                  <input
                    className={inputCls}
                    type="number"
                    step="0.01"
                    value={form.engagement_rate}
                    onChange={(e) => set("engagement_rate", e.target.value)}
                  />
                </Field>
                <Field label="가시성 점수">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.visibility_score}
                    onChange={(e) => set("visibility_score", e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* Target Audience */}
            <Section title="타겟 오디언스">
              <Field label="타겟 설명">
                <textarea
                  className={`${inputCls} min-h-[60px] resize-y`}
                  value={form.targetAudience}
                  onChange={(e) => set("targetAudience", e.target.value)}
                />
              </Field>
              <Field label="오디언스 태그 (콤마 구분)">
                <input
                  className={inputCls}
                  value={form.audienceTags}
                  onChange={(e) => set("audienceTags", e.target.value)}
                  placeholder="20대, 직장인, 여성"
                />
              </Field>
              <Field label="매체 태그 (콤마 구분)">
                <input
                  className={inputCls}
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="LED, 대형, 강남"
                />
              </Field>
            </Section>

            {/* Location */}
            <Section title="위치 정보">
              <Field label="주소">
                <input
                  className={inputCls}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
              <Field label="상권/구역">
                <input
                  className={inputCls}
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="위도 (lat)">
                  <input
                    className={inputCls}
                    type="number"
                    step="0.00001"
                    value={form.lat}
                    onChange={(e) => set("lat", e.target.value)}
                  />
                </Field>
                <Field label="경도 (lng)">
                  <input
                    className={inputCls}
                    type="number"
                    step="0.00001"
                    value={form.lng}
                    onChange={(e) => set("lng", e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* Images */}
            <Section title="매체 이미지">
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`이미지 ${i + 1}`}
                        className="h-20 w-full rounded-md object-cover border border-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-600 bg-zinc-900/50 px-4 py-4 text-sm text-zinc-400 hover:border-orange-500 hover:bg-zinc-900 hover:text-orange-400 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    이미지 추가 (최대 5장)
                  </>
                )}
              </button>
            </Section>

            {/* Pros & Cons */}
            <Section title="장단점">
              <Field label="강점 (Pros)">
                <textarea
                  className={`${inputCls} min-h-[60px] resize-y`}
                  value={form.pros}
                  onChange={(e) => set("pros", e.target.value)}
                />
              </Field>
              <Field label="주의점 (Cons)">
                <textarea
                  className={`${inputCls} min-h-[60px] resize-y`}
                  value={form.cons}
                  onChange={(e) => set("cons", e.target.value)}
                />
              </Field>
            </Section>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center gap-3 border-t border-zinc-800 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !form.mediaName.trim()}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              저장
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              <X className="mr-2 h-4 w-4" />
              취소
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
