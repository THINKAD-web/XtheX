"use client";

import dynamic from "next/dynamic";

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

export function MediaOwnerMapPreview() {
  return (
    <SeoulMiniMap
      markers={[]}
      className="h-48 w-full overflow-hidden rounded-xl border border-sky-200/60 shadow-inner ring-1 ring-emerald-200/30 dark:border-zinc-700 dark:ring-emerald-900/40"
    />
  );
}
