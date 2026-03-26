"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { landing } from "@/lib/landing-theme";
import { cn } from "@/lib/utils";
import { MEDIA_OWNER_FORM_TYPES } from "@/lib/media/media-owner-form-types";

type Initial = {
  id: string;
  mediaName: string;
  mediaType: string;
  address: string;
  lat: string;
  lng: string;
  dailyImpressions: string;
  weeklyPrice: string;
  description: string;
  availabilityStart: string;
  availabilityEnd: string;
  images: string[];
};

type Props = {
  backHref: string;
  title: string;
  subtitle: string;
  initial: Initial;
};

export function MediaOwnerEditForm({ backHref, title, subtitle, initial }: Props) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [kept, setKept] = React.useState<string[]>(initial.images);
  const [replaceAll, setReplaceAll] = React.useState(false);

  function onPickFiles(next: File[]) {
    const filtered = next.filter((f) => f.size > 0);
    if (filtered.length > 5) {
      toast.error("새 이미지는 최대 5장까지 업로드할 수 있습니다.");
      return;
    }
    setFiles(filtered);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.delete("images");
    for (const f of files) fd.append("images", f);

    fd.set("replaceImages", replaceAll ? "1" : "0");
    fd.set("keepImages", JSON.stringify(kept));

    setPending(true);
    try {
      const res = await fetch(`/api/media-owner/medias/${initial.id}`, {
        method: "PUT",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "수정에 실패했습니다.");
        return;
      }
      toast.success("미디어가 수정되었습니다.");
      router.push(backHref);
      router.refresh();
    } catch (err) {
      toast.error("네트워크 오류가 발생했습니다.", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={backHref}
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← 목록으로
        </Link>
        <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className={`${landing.surface} border-emerald-100/80 p-6 dark:border-zinc-700 sm:p-8`}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mediaName">이름</Label>
            <Input id="mediaName" name="mediaName" defaultValue={initial.mediaName} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mediaType">타입</Label>
            <select
              id="mediaType"
              name="mediaType"
              defaultValue={initial.mediaType}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              {MEDIA_OWNER_FORM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.labelKo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="address">주소</Label>
            <Input id="address" name="address" defaultValue={initial.address} required />
            <p className="text-xs text-zinc-500">
              위/경도가 있으면 지도 탐색에 더 잘 노출됩니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lat">위도</Label>
            <Input id="lat" name="lat" defaultValue={initial.lat} placeholder="예: 37.5665" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">경도</Label>
            <Input id="lng" name="lng" defaultValue={initial.lng} placeholder="예: 126.9780" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyImpressions">일일 노출량</Label>
            <Input
              id="dailyImpressions"
              name="dailyImpressions"
              type="number"
              min={1}
              defaultValue={initial.dailyImpressions}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeklyPrice">주간 가격 (원)</Label>
            <Input
              id="weeklyPrice"
              name="weeklyPrice"
              type="number"
              min={1}
              defaultValue={initial.weeklyPrice}
              required
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              name="description"
              rows={6}
              defaultValue={initial.description}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availabilityStart">등록 시작일</Label>
            <Input
              id="availabilityStart"
              name="availabilityStart"
              type="date"
              defaultValue={initial.availabilityStart}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availabilityEnd">등록 종료일</Label>
            <Input
              id="availabilityEnd"
              name="availabilityEnd"
              type="date"
              defaultValue={initial.availabilityEnd}
              required
            />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">이미지</p>
              <p className="text-xs text-zinc-500">
                기존 이미지는 유지/삭제할 수 있고, 새 이미지를 추가하거나 전체 교체할 수 있습니다.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={replaceAll}
                onChange={(e) => setReplaceAll(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              기존 이미지 전체 교체
            </label>
          </div>

          <input type="hidden" name="keepImages" value="[]" />
          <input type="hidden" name="replaceImages" value="0" />

          {initial.images.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {initial.images.map((url) => {
                const removed = !kept.includes(url);
                return (
                  <div
                    key={url}
                    className={cn(
                      "overflow-hidden rounded-xl border bg-white dark:bg-zinc-950",
                      removed
                        ? "border-rose-300/60 opacity-60"
                        : "border-zinc-200 dark:border-zinc-800",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-32 w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 p-3">
                      <span className="truncate text-xs text-zinc-600">{url}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setKept((prev) =>
                            prev.includes(url)
                              ? prev.filter((x) => x !== url)
                              : [...prev, url],
                          )
                        }
                        className={cn(
                          "inline-flex h-8 items-center justify-center rounded-md px-2 text-xs font-semibold",
                          removed
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-rose-600 text-white hover:bg-rose-700",
                        )}
                        title={removed ? "복구" : "삭제"}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {removed ? "복구" : "삭제"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">기존 이미지가 없습니다.</p>
          )}

          <div className="mt-4 rounded-xl border border-dashed border-emerald-300/60 bg-emerald-50/30 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-zinc-700 dark:text-zinc-200">
                새 이미지 추가 (선택)
                <p className="text-xs text-zinc-500">최대 5장, 각 8MB 이하</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={pending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  파일 선택
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFiles([])}
                  disabled={pending || files.length === 0}
                >
                  초기화
                </Button>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              name="images"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onPickFiles(Array.from(e.currentTarget.files ?? []))}
            />

            {files.length > 0 ? (
              <ul className="mt-3 grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
                {files.map((f) => (
                  <li key={`${f.name}-${f.size}`} className="truncate">
                    {f.name} · {(f.size / (1024 * 1024)).toFixed(1)}MB
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={pending}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? "수정 중…" : "미디어 수정하기"}
          </Button>
          <Link
            href={backHref}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pending && "pointer-events-none opacity-50",
            )}
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}

