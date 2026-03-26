"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Upload } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { landing } from "@/lib/landing-theme";
import { cn } from "@/lib/utils";
import {
  MEDIA_OWNER_FORM_TYPES,
} from "@/lib/media/media-owner-form-types";

type Props = {
  backLabel: string;
  backHref: string;
  title: string;
  subtitle: string;
  labels: {
    mediaName: string;
    mediaType: string;
    address: string;
    mapHint: string;
    lat: string;
    lng: string;
    dailyImpressions: string;
    weeklyPrice: string;
    description: string;
    images: string;
    imagesHint: string;
    availabilityStart: string;
    availabilityEnd: string;
    submit: string;
    submitting: string;
  };
};

export function MediaOwnerUploadForm({
  backLabel,
  backHref,
  title,
  subtitle,
  labels,
}: Props) {
  const [pending, setPending] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) {
      toast.error(labels.imagesHint);
      return;
    }
    if (files.length > 5) {
      toast.error(labels.imagesHint);
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.delete("images");
    for (const f of files) {
      fd.append("images", f);
    }

    setPending(true);
    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        review?: { score: number; summary_ko?: string; comment: string };
        mediaId?: string;
      };

      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "업로드에 실패했습니다.");
        return;
      }

      toast.success("AI 심사가 완료되었습니다.", {
        description:
          data.review?.summary_ko ??
          data.review?.comment?.slice(0, 200) ??
          "등록이 접수되었습니다.",
        duration: 8000,
      });
      form.reset();
      setFiles([]);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
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
          ← {backLabel}
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
        className={cn(
          landing.surface,
          "relative space-y-8 border-emerald-200/50 p-6 shadow-lg dark:border-zinc-700 lg:p-8",
        )}
      >
        {pending ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80"
            aria-busy
            aria-live="polite"
          >
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {labels.submitting}
            </p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="mediaName">{labels.mediaName}</Label>
            <Input
              id="mediaName"
              name="mediaName"
              required
              minLength={2}
              maxLength={200}
              placeholder="예: 강남역 4번 출구 DOOH"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mediaType">{labels.mediaType}</Label>
            <select
              id="mediaType"
              name="mediaType"
              required
              disabled={pending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {MEDIA_OWNER_FORM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.labelKo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weeklyPrice">{labels.weeklyPrice}</Label>
            <Input
              id="weeklyPrice"
              name="weeklyPrice"
              type="number"
              required
              min={1}
              step={1}
              placeholder="5000000"
              disabled={pending}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="address">{labels.address}</Label>
            <Input
              id="address"
              name="address"
              required
              minLength={2}
              placeholder="서울특별시 강남구 …"
              disabled={pending}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <div
              className={cn(
                "flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 text-center dark:border-zinc-600 dark:bg-zinc-900/40",
              )}
            >
              <MapPin className="mb-2 h-8 w-8 text-zinc-400" aria-hidden />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {labels.mapHint}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lat">{labels.lat}</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              placeholder="37.498"
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">{labels.lng}</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              placeholder="127.028"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyImpressions">{labels.dailyImpressions}</Label>
            <Input
              id="dailyImpressions"
              name="dailyImpressions"
              type="number"
              required
              min={1}
              placeholder="120000"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availabilityStart">{labels.availabilityStart}</Label>
            <Input
              id="availabilityStart"
              name="availabilityStart"
              type="date"
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availabilityEnd">{labels.availabilityEnd}</Label>
            <Input
              id="availabilityEnd"
              name="availabilityEnd"
              type="date"
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="description">{labels.description}</Label>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              rows={6}
              disabled={pending}
              placeholder="매체 설명, 타겟, 주변 환경 등을 자유롭게 입력하세요."
              className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="images">{labels.images}</Label>
            <p className="text-xs text-muted-foreground">{labels.imagesHint}</p>
            <input
              ref={inputRef}
              id="images"
              type="file"
              name="images"
              accept="image/*"
              multiple
              disabled={pending}
              className="sr-only"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                setFiles(list.slice(0, 5));
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                파일 선택
              </Button>
              <span className="text-sm text-muted-foreground">
                {files.length > 0
                  ? `${files.length}장 선택됨`
                  : "선택된 파일 없음"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="submit"
            disabled={pending}
            className="min-w-[200px] bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {labels.submitting}
              </>
            ) : (
              labels.submit
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
