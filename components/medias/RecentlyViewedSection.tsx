"use client";

import * as React from "react";
import { Clock, MapPin } from "lucide-react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { cn } from "@/lib/utils";

type MediaSummary = {
  id: string;
  mediaName: string;
  category: string;
  location: string | null;
  image: string | null;
  price: number | null;
};

export function RecentlyViewedSection({ className }: { className?: string }) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ko";
  const isKo = locale === "ko";
  const { ids } = useRecentlyViewed();
  const [medias, setMedias] = React.useState<MediaSummary[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (ids.length === 0) {
      setMedias([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search/recently-viewed?ids=${ids.join(",")}`)
      .then((res) => (res.ok ? res.json() : { medias: [] }))
      .then((json: { medias: MediaSummary[] }) => {
        if (!cancelled) {
          const ordered = ids
            .map((id) => json.medias.find((m) => m.id === id))
            .filter((m): m is MediaSummary => m != null);
          setMedias(ordered);
        }
      })
      .catch(() => {
        if (!cancelled) setMedias([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (ids.length === 0 && !loading) return null;

  return (
    <section className={cn("py-8", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            {isKo ? "최근 본 매체" : "Recently Viewed"}
          </h2>
        </div>
        {loading && medias.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: Math.min(ids.length, 5) }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {medias.slice(0, 10).map((m) => (
              <Link
                key={m.id}
                href={`/medias/${m.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  {m.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.image}
                      alt={m.mediaName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      {isKo ? "이미지 없음" : "No image"}
                    </div>
                  )}
                  <span className="absolute right-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
                    {m.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2.5">
                  <p className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-primary">
                    {m.mediaName}
                  </p>
                  {m.location && (
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </p>
                  )}
                  {m.price != null && (
                    <p className="mt-auto text-xs font-semibold text-foreground">
                      {m.price.toLocaleString()}
                      {isKo ? "원" : " KRW"}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
