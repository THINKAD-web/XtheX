"use client";

import * as React from "react";
import { ImageCarousel } from "@/components/ui/image-carousel";

type Props = {
  images: string[];
  mediaName: string;
  className?: string;
};

export function MediaGallery({ images, mediaName, className }: Props) {
  const slides = images.slice(0, 5);

  if (slides.length === 0) {
    return (
      <div
        className={
          className ??
          "flex aspect-[4/3] w-full items-center justify-center rounded-3xl bg-zinc-900/80 text-sm text-zinc-500 ring-1 ring-zinc-800"
        }
      >
        이미지가 등록되지 않았습니다.
      </div>
    );
  }

  return (
    <div className={className ?? "overflow-hidden rounded-3xl bg-zinc-900/80 ring-1 ring-zinc-800"}>
      <ImageCarousel
        images={slides}
        height={320}
      />
    </div>
  );
}
