"use client";

import * as React from "react";
import { addRecentlyViewed } from "@/hooks/useRecentlyViewed";

type Props = {
  mediaId: string;
};

export function ViewCountTracker({ mediaId }: Props) {
  React.useEffect(() => {
    if (!mediaId) return;
    addRecentlyViewed(mediaId);
    fetch(`/api/media/${encodeURIComponent(mediaId)}/view`, {
      method: "POST",
    }).catch(() => {});
  }, [mediaId]);

  return null;
}

