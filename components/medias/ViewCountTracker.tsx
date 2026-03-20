"use client";

import * as React from "react";

type Props = {
  mediaId: string;
};

export function ViewCountTracker({ mediaId }: Props) {
  React.useEffect(() => {
    if (!mediaId) return;
    // fire-and-forget (field 없으면 서버에서 skipped)
    fetch(`/api/media/${encodeURIComponent(mediaId)}/view`, {
      method: "POST",
    }).catch(() => {});
  }, [mediaId]);

  return null;
}

