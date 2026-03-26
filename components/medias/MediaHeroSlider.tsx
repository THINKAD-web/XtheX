"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
  autoPlay?: boolean;
  intervalMs?: number;
  className?: string;
};

export function MediaHeroSlider({
  images,
  alt,
  autoPlay = true,
  intervalMs = 4200,
  className,
}: Props) {
  const safe = React.useMemo(
    () => images.filter((u) => /^https?:\/\//i.test(u)),
    [images],
  );
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!autoPlay || safe.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safe.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [autoPlay, intervalMs, safe.length]);

  if (!safe.length) {
    return (
      <div
        className={cn(
          "flex h-[360px] items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
          className,
        )}
      >
        No image available
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={safe[index]}
        alt={alt}
        className="h-[420px] w-full object-cover"
      />

      {safe.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white hover:bg-black/60"
            onClick={() =>
              setIndex((prev) => (prev - 1 + safe.length) % safe.length)
            }
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white hover:bg-black/60"
            onClick={() => setIndex((prev) => (prev + 1) % safe.length)}
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-3 py-1.5">
            {safe.map((_, i) => (
              <button
                key={i}
                type="button"
                className={cn(
                  "h-1.5 w-4 rounded-full",
                  i === index ? "bg-white" : "bg-white/40",
                )}
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
