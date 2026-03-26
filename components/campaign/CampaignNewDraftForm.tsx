"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Plus, X } from "lucide-react";
import { saveCampaignDraft } from "@/lib/campaign/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
  initialMediaIds: string[];
  availableMedias: Array<{
    id: string;
    mediaName: string;
    category: string;
    city: string;
    locationText: string;
    countryCode: string;
    priceMonthlyKrw: number | null;
  }>;
};

type Channels = {
  dooh: boolean;
  web: boolean;
  mobile: boolean;
};

function flagFromCountryCode(code: string): string {
  const normalized = (code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "🏳️";
  const base = 127397;
  return String.fromCodePoint(
    normalized.charCodeAt(0) + base,
    normalized.charCodeAt(1) + base,
  );
}

export function CampaignNewDraftForm({ locale, initialMediaIds, availableMedias }: Props) {
  const t = useTranslations("omnichannel");
  const router = useRouter();
  const { toast } = useToast();
  const [mediaIds, setMediaIds] = React.useState<string[]>(() => [...new Set(initialMediaIds)]);
  const [pendingAddId, setPendingAddId] = React.useState<string>("");
  const [comboboxOpen, setComboboxOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [campaignName, setCampaignName] = React.useState("");
  const [campaignPeriod, setCampaignPeriod] = React.useState("");
  const [campaignBudget, setCampaignBudget] = React.useState("");
  const [channels, setChannels] = React.useState<Channels>({
    dooh: true,
    web: false,
    mobile: false,
  });
  const [submitting, setSubmitting] = React.useState(false);

  const isKo = locale === "ko";
  const MAX_SELECTED = 10;
  const mediaMap = React.useMemo(
    () => new Map(availableMedias.map((m) => [m.id, m])),
    [availableMedias],
  );

  const addableOptions = React.useMemo(
    () => availableMedias.filter((m) => !mediaIds.includes(m.id)),
    [availableMedias, mediaIds],
  );
  const filteredAddableOptions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return addableOptions;
    return addableOptions.filter((m) =>
      `${m.mediaName} ${m.city} ${m.locationText}`.toLowerCase().includes(q),
    );
  }, [addableOptions, searchQuery]);

  const estimatedBudgetRangeText = React.useMemo(() => {
    const selected = mediaIds
      .map((id) => mediaMap.get(id)?.priceMonthlyKrw ?? null)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const fallbackPerMedia = 1_200_000;
    const sum = selected.length
      ? selected.reduce((acc, cur) => acc + cur, 0)
      : mediaIds.length * fallbackPerMedia;
    const min = Math.round(sum * 0.85);
    const max = Math.round(sum * 1.15);
    const f = new Intl.NumberFormat(isKo ? "ko-KR" : "en-US", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    });
    return `${f.format(min)} - ${f.format(max)}`;
  }, [isKo, mediaIds, mediaMap]);

  React.useEffect(() => {
    if (!pendingAddId && addableOptions.length > 0) {
      setPendingAddId(addableOptions[0]?.id ?? "");
      return;
    }
    if (pendingAddId && !addableOptions.some((m) => m.id === pendingAddId)) {
      setPendingAddId(addableOptions[0]?.id ?? "");
    }
  }, [addableOptions, pendingAddId]);

  const toggle = (key: keyof Channels) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const removeMedia = (id: string) => {
    setMediaIds((prev) => prev.filter((v) => v !== id));
  };

  const addMedia = () => {
    if (!pendingAddId) return;
    if (mediaIds.length >= MAX_SELECTED) {
      toast({
        variant: "destructive",
        title: isKo ? "최대 10개까지 선택할 수 있습니다." : "You can select up to 10 media.",
      });
      return;
    }
    setMediaIds((prev) => (prev.includes(pendingAddId) ? prev : [...prev, pendingAddId]));
    setSearchQuery("");
    setComboboxOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaIds.length === 0) {
      toast({
        variant: "destructive",
        title: isKo ? "최소 1개 이상의 미디어를 선택해주세요" : "Please select at least one media.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await saveCampaignDraft({
        mediaIds,
        channelDooh: channels.dooh,
        channelWeb: channels.web,
        channelMobile: channels.mobile,
        name: campaignName.trim() || undefined,
        campaignPeriod: campaignPeriod.trim() || undefined,
        totalBudgetRaw: campaignBudget.trim() || undefined,
      });

      if (result.ok && result.draftId) {
        toast({
          title: isKo ? "캠페인 초안을 저장했습니다." : "Campaign draft saved.",
          description: isKo
            ? `선택 매체 ${mediaIds.length}개가 초안에 반영되었습니다.`
            : `${mediaIds.length} selected media were added to the draft.`,
        });
        router.push(`/${locale}/campaigns/${result.draftId}`);
        return;
      }

      toast({
        variant: "destructive",
        title: ("error" in result && result.error === "no_media")
          ? (isKo ? "최소 1개 이상의 미디어를 선택해주세요" : "Please select at least one media.")
          : ("error" in result && result.error === "at_least_one_channel")
            ? (isKo ? "채널을 하나 이상 선택해 주세요." : "Please select at least one channel.")
            : (isKo ? "저장에 실패했습니다." : "Failed to save."),
      });
    } catch {
      toast({
        variant: "destructive",
        title: isKo ? "저장 중 오류가 발생했습니다." : "An error occurred while saving.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="campaign-new-draft-form"
      onSubmit={handleSubmit}
      className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]"
    >
      {mediaIds.map((id) => (
        <input key={id} type="hidden" name="mediaIds" value={id} />
      ))}

      <div className="space-y-4">
        <Card className="border-zinc-200 bg-white/95 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {isKo ? `선택된 매체 (${mediaIds.length}/${MAX_SELECTED})` : `Selected media (${mediaIds.length}/${MAX_SELECTED})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {mediaIds.length > 0 ? (
                mediaIds.map((id) => {
                  const media = mediaMap.get(id);
                  return (
                    <Badge
                      key={id}
                      variant="outline"
                      className="inline-flex items-center gap-1.5 border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-400/40 dark:bg-blue-950/30 dark:text-blue-200"
                    >
                      <span className="max-w-[220px] truncate">
                        {media ? `${media.mediaName} · ${media.city}` : id}
                      </span>
                      {media ? (
                        <span className="rounded border border-blue-300/80 bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-700 dark:border-blue-400/50 dark:bg-blue-950/40 dark:text-blue-200">
                          {flagFromCountryCode(media.countryCode)} {media.countryCode}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeMedia(id)}
                        className="rounded p-0.5 text-blue-500 transition hover:bg-blue-200 hover:text-blue-900 dark:hover:bg-blue-800/70 dark:hover:text-blue-100"
                        aria-label={isKo ? "매체 제거" : "Remove media"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  );
                })
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  {isKo ? "최소 1개 이상의 미디어를 선택해주세요" : "Please select at least one media."}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    className="bg-blue-600 text-white hover:bg-blue-500"
                    disabled={addableOptions.length === 0 || mediaIds.length >= MAX_SELECTED}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    {isKo ? "매체 추가" : "Add media"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(92vw,620px)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      placeholder={isKo ? "미디어명/위치/도시 검색" : "Search by media name, location, city"}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isKo ? "검색 결과가 없습니다." : "No media found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredAddableOptions.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={m.id}
                            onSelect={() => setPendingAddId(m.id)}
                            className="flex items-center justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{m.mediaName}</p>
                              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                {m.city} · {m.category}
                              </p>
                            </div>
                            <span className="mr-2 rounded border border-blue-300/70 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-700 dark:border-blue-400/50 dark:bg-blue-950/40 dark:text-blue-200">
                              {flagFromCountryCode(m.countryCode)} {m.countryCode}
                            </span>
                            <Check
                              className={cn(
                                "ml-1 h-4 w-4",
                                pendingAddId === m.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="outline"
                onClick={addMedia}
                disabled={!pendingAddId || addableOptions.length === 0 || mediaIds.length >= MAX_SELECTED}
                className="sm:w-44"
              >
                {pendingAddId && mediaMap.get(pendingAddId)
                  ? isKo
                    ? "선택 항목 추가"
                    : "Add selected"
                  : isKo
                    ? "추가할 매체 선택"
                    : "Choose media to add"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/95 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardContent className="space-y-4 pt-6">
            <div>
              <label htmlFor="campaign-name-inline" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {t("campaign_name_label")}
              </label>
              <Input
                id="campaign-name-inline"
                type="text"
                placeholder={t("campaign_name_placeholder")}
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {t("channels_label")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(["dooh", "web", "mobile"] as const).map((key) => (
                  <label
                    key={key}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      channels[key]
                        ? "border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-200"
                        : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={channels[key]}
                      onChange={() => toggle(key)}
                      className="h-4 w-4 rounded border-zinc-400"
                    />
                    {t(`channel_${key}`)}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="border-blue-200/70 bg-white/95 shadow-sm dark:border-blue-400/20 dark:bg-zinc-900/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {isKo ? "캠페인 요약" : "Campaign summary"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">{isKo ? "선택 매체 수" : "Selected media"}</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{mediaIds.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500 dark:text-zinc-400">{isKo ? "예상 예산 범위(월)" : "Estimated budget range (mo)"}</span>
              <span className="text-right font-semibold text-zinc-900 dark:text-zinc-100">{estimatedBudgetRangeText}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {isKo ? "캠페인 기간" : "Campaign period"}
              </label>
              <Input
                value={campaignPeriod}
                onChange={(e) => setCampaignPeriod(e.target.value)}
                placeholder={isKo ? "예: 2026-04-01 ~ 2026-06-30" : "e.g. 2026-04-01 ~ 2026-06-30"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {isKo ? "총 예산" : "Total budget"}
              </label>
              <Input
                value={campaignBudget}
                onChange={(e) => setCampaignBudget(e.target.value)}
                placeholder={isKo ? "예: KRW 50,000,000" : "e.g. KRW 50,000,000"}
              />
            </div>
            {mediaIds.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-300">
                {isKo ? "최소 1개 이상의 미디어를 선택해주세요" : "Please select at least one media."}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={submitting || mediaIds.length === 0}
              className="h-11 w-full bg-blue-600 text-base font-semibold text-white hover:bg-blue-500"
            >
              {submitting
                ? (isKo ? "저장 중…" : "Saving…")
                : (isKo ? "초안 저장하기" : "Save draft")}
            </Button>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

