"use client";

import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiUploadForm } from "@/components/admin/ai-upload/ai-upload-form";
import { cn } from "@/lib/utils";

/** 이 화면은 메인과 같이 항상 밝은 ‘종이’ UI (html.dark여도 대비 유지) */
const shell =
  "min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 text-zinc-900 antialiased dark:from-zinc-100 dark:to-zinc-50 dark:text-zinc-900";

const paperCard =
  "rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-md ring-1 ring-zinc-200/80 dark:border-zinc-200 dark:bg-white dark:text-zinc-900 dark:ring-zinc-200/80";

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
  return (
    <div className={shell}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex h-11 items-center rounded-lg px-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            {m.back}
          </Link>
        </div>

        {!llmConfigured || forceMock ? (
          <div
            className="mb-4 rounded-lg border border-amber-400/90 bg-amber-100 px-4 py-3 text-sm text-amber-950"
            role="alert"
          >
            <p className="font-semibold text-amber-950">{!llmConfigured ? m.mock_no_key_title : m.mock_env_title}</p>
            {!llmConfigured ? <p className="mt-2 leading-relaxed text-amber-950/95">{m.mock_no_key_body}</p> : null}
          </div>
        ) : null}

        <Card className={paperCard}>
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 lg:text-3xl">{m.card_title}</CardTitle>
            <p className="text-base leading-relaxed text-zinc-600">
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
