"use client";

import * as React from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  ids: string[];
  locale: string;
  labelKo?: string;
  labelEn?: string;
  className?: string;
};

export function ShareCompareButton({
  ids,
  locale,
  labelKo = "이 비교 공유하기",
  labelEn = "Share this comparison",
  className,
}: Props) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/${locale}/compare?ids=${ids.join(",")}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        toast.success(locale === "ko" ? "링크가 복사되었습니다" : "Link copied");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error(locale === "ko" ? "복사에 실패했습니다" : "Copy failed");
      });
  }, [ids, locale]);

  const isKo = locale === "ko";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={className ?? "border-zinc-600 text-zinc-200 hover:bg-zinc-800"}
    >
      <Share2 className="mr-2 h-4 w-4" />
      {copied ? (isKo ? "복사됨" : "Copied") : isKo ? labelKo : labelEn}
    </Button>
  );
}
