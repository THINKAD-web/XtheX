"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RecommendForm } from "@/components/recommend/RecommendForm";
import { RecommendResults } from "@/components/recommend/RecommendResults";
import type { MediaRecommendationItem } from "@/lib/recommend/types";
import { landing } from "@/lib/landing-theme";
import { cn } from "@/lib/utils";

type ApiOk = {
  ok: true;
  brief: {
    budgetKrw: number;
    durationWeeks: number;
    locationKeywords: string[];
    audienceTags: string[];
    styleNotes: string;
  };
  recommendations: MediaRecommendationItem[];
  usedMockMedias: boolean;
  usedMockLlm: boolean;
};

function RecommendSkeleton() {
  return (
    <div
      className="space-y-4 py-6"
      aria-busy="true"
      aria-label="Loading recommendations"
    >
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl border border-border bg-muted/50"
          />
        ))}
      </div>
    </div>
  );
}

export function RecommendExperience() {
  const t = useTranslations("dashboard.advertiser.recommend");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<MediaRecommendationItem[] | null>(
    null,
  );
  const [summary, setSummary] = React.useState<string | null>(null);

  async function handleSubmit(brief: string, file: File | null) {
    setLoading(true);
    setItems(null);
    setSummary(null);
    const toastId = toast.loading(t("toast_loading"));
    try {
      const fd = new FormData();
      fd.append("brief", brief);
      if (file) fd.append("creative", file);

      const res = await fetch("/api/recommend", {
        method: "POST",
        body: fd,
      });

      const raw = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(raw) as ApiOk | { ok: false; error?: string };
      } catch {
        toast.error(t("toast_ai_failed"), {
          description: t("toast_network"),
          id: toastId,
        });
        return;
      }

      if (!res.ok || !json || typeof json !== "object" || !("ok" in json)) {
        toast.error(t("toast_ai_failed"), {
          description: t("toast_error_generic"),
          id: toastId,
        });
        return;
      }

      if (!json.ok) {
        const errObj = json as { ok: false; error?: string };
        const msg = errObj.error ?? t("toast_error_generic");
        toast.error(t("toast_ai_failed"), { description: msg, id: toastId });
        return;
      }

      const data = json as ApiOk;
      setItems(data.recommendations);
      const parts = [
        t("summary_budget", {
          amount: data.brief.budgetKrw.toLocaleString(),
        }),
        t("summary_weeks", { n: data.brief.durationWeeks }),
        data.brief.locationKeywords.length
          ? t("summary_loc", {
              loc: data.brief.locationKeywords.join(", "),
            })
          : null,
      ].filter(Boolean);
      setSummary(parts.join(" · "));
      if (data.usedMockLlm) {
        toast.message(t("toast_mock_llm"), { id: toastId });
      } else if (data.usedMockMedias) {
        toast.message(t("toast_mock_medias"), { id: toastId });
      } else {
        toast.success(t("toast_done"), { id: toastId });
      }
    } catch {
      toast.error(t("toast_ai_failed"), {
        description: t("toast_network"),
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <RecommendForm
        disabled={loading}
        briefLabel={t("field_brief")}
        briefPlaceholder={t("brief_placeholder")}
        creativeLabel={t("field_creative")}
        creativeHint={t("creative_hint")}
        submitLabel={t("submit")}
        onSubmit={handleSubmit}
        className={cn(landing.surface, "border-sky-100/80 p-6 dark:border-zinc-700")}
      />

      {loading ? <RecommendSkeleton /> : null}

      {!loading && summary ? (
        <p className="text-sm text-muted-foreground">{summary}</p>
      ) : null}

      {!loading && items ? <RecommendResults items={items} /> : null}
    </div>
  );
}
