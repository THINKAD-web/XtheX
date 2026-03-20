"use client";

import dynamic from "next/dynamic";
import type { MixMapMarker } from "@/components/mix-media/MixMediaMap";

const MixMediaMapInner = dynamic(
  () =>
    import("@/components/mix-media/MixMediaMap").then((m) => ({
      default: m.MixMediaMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[50vh] min-h-[280px] w-full animate-pulse rounded-2xl bg-muted lg:h-[60vh]"
        aria-hidden
      />
    ),
  },
);

/** 지도 마커 초기 로드 제한 (성능: 50개까지, zoom 시 추가 로드는 추후 확장) */
const INITIAL_MARKERS_LIMIT = 50;

export function MixMediaMapLazy({ markers }: { markers: MixMapMarker[] }) {
  const limited =
    markers.length <= INITIAL_MARKERS_LIMIT
      ? markers
      : markers.slice(0, INITIAL_MARKERS_LIMIT);
  return <MixMediaMapInner markers={limited} />;
}

export type { MixMapMarker } from "@/components/mix-media/MixMediaMap";
