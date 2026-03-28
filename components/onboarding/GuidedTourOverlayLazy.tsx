"use client";

import dynamic from "next/dynamic";

const GuidedTourOverlay = dynamic(
  () =>
    import("./GuidedTourOverlay").then((m) => ({
      default: m.GuidedTourOverlay,
    })),
  { ssr: false, loading: () => null },
);

export function GuidedTourOverlayLazy() {
  return <GuidedTourOverlay />;
}
