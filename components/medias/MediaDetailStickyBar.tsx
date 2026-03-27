"use client";

import { useLocale } from "next-intl";
import { MessageSquare } from "lucide-react";

export function MediaDetailStickyBar({
  mediaId,
  mediaName,
}: {
  mediaId: string;
  mediaName: string;
}) {
  const locale = useLocale();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-3 backdrop-blur-sm md:hidden">
      <div className="flex gap-2">
        <a
          href={`/${locale}/medias/${mediaId}/contact`}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <MessageSquare className="h-4 w-4" />
          {locale.startsWith("ko")
            ? "문의하기"
            : locale.startsWith("ja")
              ? "お問い合わせ"
              : locale.startsWith("zh")
                ? "咨询"
                : "Inquire"}
        </a>
      </div>
    </div>
  );
}
