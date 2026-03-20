"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiUploadForm } from "@/components/admin/ai-upload/ai-upload-form";
import { landing } from "@/lib/landing-theme";
import { useLocalDaypart } from "@/hooks/use-local-daypart";
import { cn } from "@/lib/utils";

type Messages = {
  back: string;
  mock_no_key_title: string;
  mock_env_title: string;
  mock_no_key_body: string;
  card_title: string;
  card_desc_live: string;
  card_desc_mock: string;
};

export function AdminAiUploadPageInner({
  locale,
  llmConfigured,
  forceMock,
  messages: m,
}: {
  locale: string;
  llmConfigured: boolean;
  forceMock: boolean;
  messages: Messages;
}) {
  const isDay = useLocalDaypart() === "day";

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-500",
        isDay ? "bg-zinc-50 text-zinc-900" : "bg-zinc-950 text-zinc-100",
      )}
    >
      <div className={`${landing.container} max-w-5xl py-10 lg:py-14`}>
        <div className="mb-8 flex items-center gap-4">
          <Link
            href={`/${locale}/admin`}
            className={cn(
              "inline-flex h-11 items-center rounded-lg px-2 text-sm font-medium transition-colors",
              isDay
                ? "text-zinc-600 hover:text-blue-600"
                : "text-zinc-400 hover:text-blue-400",
            )}
          >
            ← {m.back}
          </Link>
        </div>

        {!llmConfigured || forceMock ? (
          <div
            className={cn(
              "mb-4 rounded-lg border px-4 py-3 text-sm",
              isDay
                ? "border-amber-300 bg-amber-50 text-amber-950"
                : "border-amber-500/40 bg-amber-950/40 text-amber-100",
            )}
            role="alert"
          >
            <p
              className={cn(
                "font-semibold",
                isDay ? "text-amber-900" : "text-amber-200",
              )}
            >
              {!llmConfigured ? m.mock_no_key_title : m.mock_env_title}
            </p>
            {!llmConfigured ? (
              <p
                className={cn(
                  "mt-2",
                  isDay ? "text-amber-900/90" : "text-amber-100/90",
                )}
              >
                {m.mock_no_key_body}
              </p>
            ) : null}
          </div>
        ) : null}

        <Card
          className={cn(
            "transition-colors duration-500 hover:scale-[1.01]",
            isDay
              ? "border-zinc-200 bg-white shadow-md"
              : `${landing.cardDark} border-zinc-800`,
          )}
        >
          <CardHeader className="space-y-2 pb-2">
            <CardTitle
              className={cn(
                "text-2xl font-bold tracking-tight lg:text-3xl",
                isDay ? "text-zinc-900" : "text-white",
              )}
            >
              {m.card_title}
            </CardTitle>
            <p
              className={cn(
                "text-base leading-relaxed",
                isDay ? "text-zinc-600" : "text-zinc-400",
              )}
            >
              {llmConfigured && !forceMock ? m.card_desc_live : m.card_desc_mock}
            </p>
          </CardHeader>
          <CardContent>
            <AiUploadForm locale={locale} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
