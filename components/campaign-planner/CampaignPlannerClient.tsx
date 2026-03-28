"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sparkles, ShoppingCart, FileDown, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOmniCart } from "@/hooks/useOmniCart";
import type { OmniCartItem, OmniMediaCategory } from "@/lib/omni-cart/types";
import type { CampaignPlannerResult } from "@/app/api/campaign-planner/route";

const MEDIA_TYPE_CATEGORY_MAP: Record<string, OmniMediaCategory> = {
  BILLBOARD: "BILLBOARD",
  DIGITAL_BOARD: "DIGITAL_BOARD",
  TRANSIT: "TRANSIT",
  STREET_FURNITURE: "STREET_FURNITURE",
  WALL: "WALL",
  ETC: "ETC",
};

function formatNumber(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString();
}

export function CampaignPlannerClient() {
  const t = useTranslations("campaign_planner");
  const { addMany } = useOmniCart();

  const [budget, setBudget] = useState(3000);
  const [targetAge, setTargetAge] = useState("20s");
  const [region, setRegion] = useState("서울");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CampaignPlannerResult | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error("캠페인 기간을 선택해 주세요.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/campaign-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, targetAge, region, startDate, endDate }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as CampaignPlannerResult;
      setResult(data);

      if (data.demo) {
        toast.info(t("error_no_llm"));
      }
    } catch {
      toast.error(t("error_failed"));
    } finally {
      setLoading(false);
    }
  }, [budget, targetAge, region, startDate, endDate, t]);

  const handleAddAllToCart = useCallback(() => {
    if (!result) return;
    const items: OmniCartItem[] = result.medias.map((m) => ({
      id: m.id,
      mediaName: m.name,
      category: m.mediaType,
      mediaCategory: MEDIA_TYPE_CATEGORY_MAP[m.mediaType] ?? "UNKNOWN",
      priceMin: m.estimatedCost,
      priceMax: m.estimatedCost,
      source: "mix" as const,
    }));
    addMany(items);
    toast.success(t("added_to_cart"));
  }, [result, addMany, t]);

  const handleExportPdf = useCallback(() => {
    toast.info(t("pdf_coming_soon"));
  }, [t]);

  const ageOptions = [
    { value: "20s", label: t("age_20s") },
    { value: "30s", label: t("age_30s") },
    { value: "40+", label: t("age_40plus") },
  ];

  const regionOptions = [
    { value: "서울", label: t("region_seoul") },
    { value: "도쿄", label: t("region_tokyo") },
    { value: "뉴욕", label: t("region_new_york") },
    { value: "상하이", label: t("region_shanghai") },
    { value: "전체", label: t("region_all") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("page_title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("page_subtitle")}</p>
      </div>

      {/* Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            {t("ai_recommend")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Budget */}
            <div className="sm:col-span-2">
              <Label>{t("budget")}</Label>
              <div className="mt-2 flex items-center gap-4">
                <Slider
                  min={100}
                  max={50000}
                  step={100}
                  value={budget}
                  onValueChange={(v) => setBudget(v)}
                  className="flex-1"
                />
                <div className="flex min-w-[120px] items-center gap-1.5">
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) =>
                      setBudget(Math.max(0, Number(e.target.value)))
                    }
                    className="w-24 text-right"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {t("budget_unit")}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ≈ {(budget * 10000).toLocaleString()} {t("won")}
              </p>
            </div>

            {/* Target Age */}
            <div>
              <Label>{t("target_age")}</Label>
              <Select value={targetAge} onValueChange={setTargetAge}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ageOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region */}
            <div>
              <Label>{t("region")}</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Period */}
            <div>
              <Label>{t("start_date")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>{t("end_date")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loading")}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t("ai_recommend")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("total_cost")}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatNumber(result.totalCost)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {t("won")}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("total_impressions")}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatNumber(result.totalImpressions)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {t("impressions_unit")}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("total_reach")}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatNumber(result.totalReach)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {t("people_unit")}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleAddAllToCart} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t("add_all_to_cart")}
            </Button>
            <Button variant="outline" onClick={handleExportPdf} className="gap-2">
              <FileDown className="h-4 w-4" />
              {t("export_pdf")}
            </Button>
            <Link
              href="/contact"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-orange-400 active:scale-95 animate-cta-pulse"
            >
              <MessageCircle className="h-4 w-4" />
              {t("inquiry_cta") ?? "문의하기"}
            </Link>
          </div>

          {/* Recommended title */}
          <h2 className="text-xl font-semibold text-foreground">
            {t("results_title")}
            {result.demo && (
              <Badge variant="outline" className="ml-2 text-xs">
                Demo
              </Badge>
            )}
          </h2>

          {/* Media Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.medias.map((media) => (
              <Card
                key={media.id}
                className="flex flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {media.name}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {media.mediaType.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">
                      {t("reason")}:
                    </span>{" "}
                    {media.reason}
                  </p>
                  <div className="mt-auto grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground">{t("est_cost")}</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {formatNumber(media.estimatedCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t("est_impressions")}
                      </p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {formatNumber(media.estimatedImpressions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("est_reach")}</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {formatNumber(media.estimatedReach)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
