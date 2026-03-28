"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

type Props = {
  /** 접근성용 영역 설명 */
  ariaLabel: string;
  /** 모바일에서만 표시되는 스와이프 안내 (선택) */
  hint?: string;
  className?: string;
  /** 각 슬라이드 폭 비율 (기본 88%) */
  slideBasis?: string;
  children: React.ReactNode;
};

/**
 * 모바일에서 좌우 스와이프로 넘기는 가로 캐러셀 (Embla).
 * 데스크톱에서는 사용하지 않고 그리드 등과 병행하는 패턴을 권장.
 */
export function MobileHorizontalSwipe({
  ariaLabel,
  hint,
  className,
  slideBasis = "88%",
  children,
}: Props) {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    align: "start",
    dragFree: false,
    containScroll: "trimSnaps",
  });
  const [selected, setSelected] = React.useState(0);
  const slides = React.Children.toArray(children).filter(Boolean);

  React.useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  if (slides.length === 0) return null;

  return (
    <div
      className={cn("space-y-3", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      {hint ? (
        <p className="text-muted-foreground text-center text-xs">{hint}</p>
      ) : null}
      <div ref={emblaRef} className="touch-pan-y overflow-hidden">
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={i}
              className="min-w-0 shrink-0 grow-0 pr-3 last:pr-0"
              style={{ flexBasis: slideBasis, maxWidth: slideBasis }}
              aria-roledescription="slide"
              aria-hidden={i !== selected}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 ? (
        <div
          className="flex justify-center gap-1.5"
          role="tablist"
          aria-label="Carousel pagination"
        >
          {slides.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === selected
                  ? "w-5 bg-primary"
                  : "w-1.5 bg-zinc-300 dark:bg-zinc-600",
              )}
              aria-current={i === selected ? "true" : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
