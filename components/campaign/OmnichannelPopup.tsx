"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { saveCampaignDraft } from "@/lib/campaign/actions";

export type OmnichannelChannels = {
  dooh: boolean;
  web: boolean;
  mobile: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  mediaIds: string[];
  locale: string;
};

export function OmnichannelPopup({ open, onClose, mediaIds, locale }: Props) {
  const t = useTranslations("omnichannel");
  const router = useRouter();
  const { toast } = useToast();
  const [channels, setChannels] = React.useState<OmnichannelChannels>({
    dooh: true,
    web: false,
    mobile: false,
  });
  const [campaignName, setCampaignName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const isKo = locale === "ko";

  const toggle = (key: keyof OmnichannelChannels) =>
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = [channels.dooh && "DOOH", channels.web && "Web", channels.mobile && "Mobile"].filter(Boolean);
    if (selected.length === 0) {
      toast({
        variant: "destructive",
        title: isKo ? "채널을 하나 이상 선택해 주세요." : "Please select at least one channel.",
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
      });
      if (result.ok && result.draftId) {
        setCampaignName("");
        onClose();
        toast({
          title: isKo ? "캠페인 초안으로 이동합니다" : "Opening campaign draft…",
          description: isKo
            ? `매체 ${mediaIds.length}개 · ${selected.join(", ")}`
            : `${mediaIds.length} media · ${selected.join(", ")}`,
        });
        router.push(`/${locale}/campaigns/${result.draftId}`);
      } else if (!result.ok) {
        toast({
          variant: "destructive",
          title: result.error === "no_media"
            ? (isKo ? "선택된 매체가 없습니다." : "No media selected.")
            : (isKo ? "저장에 실패했습니다." : "Failed to save."),
        });
      } else {
        toast({
          variant: "destructive",
          title: isKo ? "저장에 실패했습니다." : "Failed to save.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: isKo ? "저장 중 오류가 발생했습니다." : "An error occurred while saving.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="omnichannel-title"
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="omnichannel-title" className="text-lg font-semibold text-white">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {t("subtitle", { count: mediaIds.length })}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">
              {t("channels_label")}
            </p>
            <div className="flex flex-wrap gap-3">
              {(["dooh", "web", "mobile"] as const).map((key) => (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    channels[key]
                      ? "border-orange-500/60 bg-orange-500/10 text-orange-200"
                      : "border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={channels[key]}
                    onChange={() => toggle(key)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500"
                  />
                  {t(`channel_${key}`)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="campaign-name" className="mb-1 block text-sm font-medium text-zinc-300">
              {t("campaign_name_label")}
            </label>
            <Input
              id="campaign-name"
              type="text"
              placeholder={t("campaign_name_placeholder")}
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-zinc-600 text-zinc-300">
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {submitting ? (isKo ? "저장 중…" : "Saving…") : t("confirm")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
