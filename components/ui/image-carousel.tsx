"use client";

import React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

type ImageCarouselProps = {
  images: string[];
  height?: number;
  onClickImage?: (index: number) => void;
  /** Next/Image sizes for responsive loading (default for card grid) */
  sizes?: string;
};

/** AI 추출 플레이스홀더(「현장 사진」 등)는 img src로 쓰면 404 → 제외 */
function isRenderableImageSrc(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith("data:image/") || t.startsWith("blob:")) return true;
  return /^https?:\/\//i.test(t);
}

export const ImageCarousel = React.memo(function ImageCarousel({
  images,
  height = 160,
  onClickImage,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: ImageCarouselProps) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelectedIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
  }, [embla]);

  const urls = React.useMemo(
    () => images.filter(isRenderableImageSrc),
    [images],
  );
  if (!urls.length) return null;

  return (
    <div className="space-y-2">
      <div
        ref={emblaRef}
        className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
        style={{ height }}
      >
        <div className="flex h-full">
          {urls.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative h-full min-w-0 flex-[0_0_100%]"
              onClick={onClickImage ? () => onClickImage(index) : undefined}
            >
              {src.startsWith("data:") || src.startsWith("blob:") ? (
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes={sizes}
                  loading="lazy"
                  unoptimized
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {urls.length > 1 && (
        <div className="flex justify-center gap-1">
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => embla?.scrollTo(i)}
              className={`h-1.5 w-4 rounded-full ${
                i === selectedIndex ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});
