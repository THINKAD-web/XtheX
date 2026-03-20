"use client";

import * as React from "react";
import { Share2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  ids: string[];
  locale: string;
  className?: string;
};

export function CompareShareExport({ ids, locale, className }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const isKo = locale === "ko";

  const handleCopyLink = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/${locale}/compare?ids=${ids.join(",")}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        toast({ title: isKo ? "링크가 복사되었습니다" : "Link copied" });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: isKo ? "복사에 실패했습니다" : "Copy failed",
        });
      });
  }, [ids, locale, toast, isKo]);

  const handleSavePdf = React.useCallback(() => {
    if (typeof window === "undefined") return;
    toast({
      title: isKo ? "인쇄 대화상자에서 'PDF로 저장'을 선택하세요" : "Choose 'Save as PDF' in the print dialog",
    });
    window.print();
  }, [toast, isKo]);

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="no-print border-zinc-600 text-zinc-200 hover:bg-zinc-800"
      >
        <Share2 className="mr-2 h-4 w-4" />
        {copied ? (isKo ? "복사됨" : "Copied") : isKo ? "링크 복사" : "Copy link"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSavePdf}
        className="no-print border-zinc-600 text-zinc-200 hover:bg-zinc-800"
      >
        <FileDown className="mr-2 h-4 w-4" />
        {isKo ? "PDF로 저장" : "Save as PDF"}
      </Button>
    </div>
  );
}
