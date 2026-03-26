"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { MediaReviewForm } from "@/components/admin/review/media-review-form";
import {
  getMediaDraftForReview,
  type MediaDraftForReviewClient,
} from "@/app/[locale]/admin/review/[mediaId]/actions";
import type { MediaCategory } from "@prisma/client";

function toFormMedia(m: MediaDraftForReviewClient) {
  return {
    ...m,
    category: m.category as MediaCategory,
  };
}

type Props = {
  draftId: string;
  locale: string;
  onClose: () => void;
};

export function InlineDraftEditor({ draftId, locale, onClose }: Props) {
  const [media, setMedia] = React.useState<MediaDraftForReviewClient | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMedia(null);
    (async () => {
      const res = await getMediaDraftForReview(draftId);
      if (cancelled) return;
      if (res.ok) {
        setMedia(res.media);
      } else {
        setError(res.error);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        초안 불러오는 중…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!media) return null;

  return (
    <div className="max-h-[min(78vh,880px)] overflow-y-auto pr-1">
      <p className="mb-4 text-xs text-zinc-500">
        추출된 데이터를 아래에서 수정·확인한 뒤 임시 저장 또는 공개할 수 있습니다.
      </p>
      <MediaReviewForm
        media={toFormMedia(media)}
        locale={locale}
        mode="admin_review"
        embedMode
        onRequestClose={onClose}
      />
    </div>
  );
}
