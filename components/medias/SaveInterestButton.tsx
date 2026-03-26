"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "xthex:interested-medias:v1";

type Props = {
  mediaId: string;
  mediaName: string;
  labels: {
    save: string;
    saved: string;
  };
};

export function SaveInterestButton({ mediaId, mediaName, labels }: Props) {
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      setSaved(Array.isArray(parsed) && parsed.includes(mediaId));
    } catch {
      // ignore invalid local storage payload
    }
  }, [mediaId]);

  const handleSave = React.useCallback(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      const current = Array.isArray(parsed) ? parsed : [];
      if (current.includes(mediaId)) {
        setSaved(true);
        return;
      }
      const next = [...current, mediaId];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(true);
      window.dispatchEvent(
        new CustomEvent("xthex:interested-media", {
          detail: { mediaId, mediaName },
        }),
      );
    } catch {
      // no-op
    }
  }, [mediaId, mediaName]);

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      className="h-11 w-full"
      onClick={handleSave}
    >
      {saved ? labels.saved : labels.save}
    </Button>
  );
}
