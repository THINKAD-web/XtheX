"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { landing } from "@/lib/landing-theme";
import { getExploreSearchSignalsForApi } from "@/lib/recommend/explore-search-signals";
import type { PersonalizedRecoItem } from "@/lib/recommend/personalized-engine";
import { usePreferredCurrency } from "@/components/usePreferredCurrency";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { usePersonalizedRecoDismissed } from "@/hooks/usePersonalizedRecoDismissed";
import { PersonalizedRecoCard } from "@/components/recommend/PersonalizedRecoCard";
import type { RecommendationCurrency } from "@/lib/recommend/recommendations-ui-types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

type Variant = "home" | "explore";

export function PersonalizedRecommendationsSection({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  const t = useTranslations("personalizedRecommendations");
  const params = useParams();
  const locale = (params?.locale as string) ?? "ko";
  const preferredCurrency = usePreferredCurrency(locale) as unknown as RecommendationCurrency;
  const { status } = useSession();
  const { ids: recentlyViewedIds } = useRecentlyViewed();
  const { dismissed, dismiss } = usePersonalizedRecoDismissed();

  const [items, setItems] = React.useState<PersonalizedRecoItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const dismissedKey = dismissed.join("|");
  const recentKey = recentlyViewedIds.join("|");
  const dismissedRef = React.useRef(dismissed);
  const recentRef = React.useRef(recentlyViewedIds);
  dismissedRef.current = dismissed;
  recentRef.current = recentlyViewedIds;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const searchSignals = getExploreSearchSignalsForApi();
      const res = await fetch("/api/personalized-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          searchSignals,
          dismissedIds: dismissedRef.current,
          recentlyViewedIds: recentRef.current,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; items?: PersonalizedRecoItem[] };
      if (!res.ok || !json.ok || !json.items) {
        setItems([]);
        return;
      }
      setItems(json.items.slice(0, 5));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  React.useEffect(() => {
    void load();
  }, [load, dismissedKey, recentKey]);

  async function persistFeedback(mediaId: string, action: "dismiss" | "negative") {
    try {
      await fetch("/api/personalized-recommendations/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, action }),
      });
    } catch {
      // local dismiss still applies
    }
  }

  function handleDismiss(mediaId: string) {
    dismiss(mediaId);
    void persistFeedback(mediaId, "dismiss");
    setItems((prev) => prev.filter((i) => i.id !== mediaId));
    toast.message(t("toast_dismissed"));
  }

  function handleNegative(mediaId: string) {
    dismiss(mediaId);
    void persistFeedback(mediaId, "negative");
    setItems((prev) => prev.filter((i) => i.id !== mediaId));
    toast.message(t("toast_feedback_thanks"));
  }

  if (loading && items.length === 0) {
    return (
      <section
        className={cn(
          variant === "home"
            ? "border-b border-zinc-100 bg-gradient-to-b from-violet-50/40 to-white py-10 dark:border-zinc-800 dark:from-violet-950/20 dark:to-zinc-950"
            : "border-b border-violet-200/30 bg-gradient-to-b from-violet-50/50 to-transparent py-8 dark:border-zinc-800 dark:from-violet-950/25",
          className,
        )}
      >
        <div className={cn(landing.container)}>
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex gap-4 overflow-hidden pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[320px] w-[280px] shrink-0 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <section
        className={cn(
          variant === "home"
            ? "border-b border-zinc-100 bg-gradient-to-b from-violet-50/40 to-white py-10 dark:border-zinc-800 dark:from-violet-950/20 dark:to-zinc-950"
            : "border-b border-violet-200/30 bg-gradient-to-b from-violet-50/50 to-transparent py-8 dark:border-zinc-800 dark:from-violet-950/25",
          className,
        )}
      >
        <div className={cn(landing.container)}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 text-violet-600 dark:text-violet-300">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">{t("kicker")}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {t("title")}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                {t("subtitle")}
              </p>
            </div>
            {status !== "authenticated" && (
              <p className="text-xs text-violet-700 dark:text-violet-300">{t("login_hint")}</p>
            )}
          </div>

          <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin px-1">
            {items.map((item) => (
              <PersonalizedRecoCard
                key={item.id}
                item={item}
                displayCurrency={preferredCurrency as RecommendationCurrency}
                onDismiss={handleDismiss}
                onNegativeFeedback={handleNegative}
              />
            ))}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
