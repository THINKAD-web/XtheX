"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";

type ImageCarouselProps = {
  images: string[];
  height?: number;
  onClickImage?: (index: number) => void;
};

export function ImageCarousel({ images, height = 160, onClickImage }: ImageCarouselProps) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelectedIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
  }, [embla]);

  if (!images.length) return null;

  return (
    <div className="space-y-2">
      <div
        ref={emblaRef}
        className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
        style={{ height }}
      >
        <div className="flex h-full">
          {images.map((src, index) => (
            <div
              key={src}
              className="relative h-full min-w-0 flex-[0_0_100%]"
              onClick={onClickImage ? () => onClickImage(index) : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1">
          {images.map((_, i) => (
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
}

