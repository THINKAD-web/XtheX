"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { LatLng } from "@/lib/filters/location-latlng";

export type MediaOwnerMapMarker = {
  code: string;
  label: string;
  position: LatLng;
  intensity?: number;
  status?: string;
  price?: number | null;
  viewCount?: number;
  updatedAt?: string;
};

const SeoulMiniMap = dynamic(
  () =>
    import("@/components/map/SeoulMiniMap").then((m) => ({
      default: m.SeoulMiniMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full animate-pulse rounded-xl border border-dashed border-sky-300/60 bg-muted/40 dark:border-emerald-900/50" />
    ),
  },
);

type Props = {
  markers?: MediaOwnerMapMarker[];
};

export function MediaOwnerMapPreview({ markers = [] }: Props) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || markers.length === 0) {
    return (
      <div className="h-48 w-full overflow-hidden rounded-xl border border-sky-200/60 bg-muted/30 shadow-inner ring-1 ring-emerald-200/30 dark:border-zinc-700 dark:ring-emerald-900/40">
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          아직 지도에 표시할 매체 위치가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <SeoulMiniMap
      markers={markers}
      className="h-48 w-full overflow-hidden rounded-xl border border-sky-200/60 shadow-inner ring-1 ring-emerald-200/30 dark:border-zinc-700 dark:ring-emerald-900/40"
    />
  );
}
