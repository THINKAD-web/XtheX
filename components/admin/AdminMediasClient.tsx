"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AdvancedFilterBuilder } from "@/components/filters/AdvancedFilterBuilder";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  searchMediasWithAdvancedFilter,
  listFilterPresets,
  saveFilterPreset,
} from "@/app/[locale]/admin/medias/filter-actions";
import { Button } from "@/components/ui/button";
import {
  getIndustryTemplateList,
  type IndustryTemplate,
} from "@/lib/filters/industry-templates";
import type { AdvancedFilter } from "@/lib/filters/schema";
import { getLatLngForTag } from "@/lib/filters/location-latlng";
import { SuccessCaseGallery } from "@/components/case-studies/SuccessCaseGallery";
import { SUCCESS_CASES } from "@/lib/case-studies/success-cases";
import { PackageDiscountWidget } from "@/components/campaign/PackageDiscountWidget";
import { OmnichannelHints } from "@/components/campaign/OmnichannelHints";
import { useLocalDaypart } from "@/hooks/use-local-daypart";
import { cn } from "@/lib/utils";

const SeoulMiniMap = dynamic(
  () =>
    import("@/components/map/SeoulMiniMap").then((m) => ({
      default: m.SeoulMiniMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full rounded-lg bg-zinc-300 dark:bg-zinc-700" />
    ),
  },
);

type MediaWithCreator = {
  id: string;
  mediaName: string;
  description?: string;
  category: string;
  price: number | null;
  cpm: number | null;
  status: string;
  updatedAt: string;
  createdBy: { email: string | null; name: string | null } | null;
};

type TagOption = {
  code: string;
  labelKo: string;
  labelEn: string;
  labelJa?: string | null;
  categoryKo: string;
  categoryEn: string;
  categoryJa?: string | null;
};

type BuilderGroup = {
  id: string;
  label?: string;
  logic: "AND" | "OR";
  tags: TagOption[];
};

function resolveTemplateToGroups(
  filterJson: AdvancedFilter,
  allTags: TagOption[],
): BuilderGroup[] {
  return filterJson.groups.map((g) => ({
    id: crypto.randomUUID(),
    label: g.label,
    logic: g.logic,
    tags: g.tags
      .map((code) => allTags.find((t) => t.code === code))
      .filter((t): t is TagOption => t != null),
  }));
}

async function fetchAllTagOptions(): Promise<TagOption[]> {
  const res = await fetch("/api/advanced-tags?q=");
  if (!res.ok) return [];
  return (await res.json()) as TagOption[];
}

type Props = {
  locale: string;
  initialMedias: MediaWithCreator[];
};

const industryTemplates = getIndustryTemplateList();

function dateLocale(locale: string) {
  if (locale === "ko") return "ko-KR";
  if (locale === "ja") return "ja-JP";
  if (locale === "zh") return "zh-CN";
  if (locale === "es") return "es-ES";
  return "en-US";
}

function tagDisplayLabel(tag: TagOption | undefined, code: string, loc: string) {
  if (!tag) return code;
  if (loc === "ko") return tag.labelKo;
  if (loc === "ja" && tag.labelJa) return tag.labelJa;
  return tag.labelEn;
}

export function AdminMediasClient({ locale, initialMedias }: Props) {
  const tm = useTranslations("admin.mediasClient");
  const isDay = useLocalDaypart() === "day";
  const [medias, setMedias] = React.useState<MediaWithCreator[]>(initialMedias);
  const [loading, setLoading] = React.useState(false);
  const [currentFilter, setCurrentFilter] = React.useState<any | null>(null);
  const [presets, setPresets] = React.useState<
    { id: string; nameKo: string; nameEn: string; filterJson: any; isGlobal: boolean }[]
  >([]);
  const [allTags, setAllTags] = React.useState<TagOption[]>([]);
  const [appliedTemplateId, setAppliedTemplateId] = React.useState<string | null>(null);
  const [appliedTemplateGroups, setAppliedTemplateGroups] = React.useState<BuilderGroup[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());

  const isKo = locale === "ko";
  const dl = dateLocale(locale);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const packageSelectedMedias = React.useMemo(
    () =>
      medias
        .filter((m) => selectedIds.has(m.id))
        .map((m) => ({ id: m.id, price: m.price ?? 0 })),
    [medias, selectedIds],
  );

  const avgCpm = React.useMemo(() => {
    const cpms = medias
      .map((m) => m.cpm)
      .filter((c): c is number => typeof c === "number" && c > 0);
    if (cpms.length === 0) return null;
    return Math.round(cpms.reduce((a, b) => a + b, 0) / cpms.length);
  }, [medias]);

  const locationMarkers = React.useMemo(() => {
    const codes: string[] =
      currentFilter?.groups?.flatMap((g: any) => (g?.tags ?? [])) ?? [];

    const counts = new Map<string, number>();
    for (const c of codes) {
      if (typeof c !== "string") continue;
      const ll = getLatLngForTag(c);
      if (!ll) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([code, intensity]) => {
      const tag = allTags.find((t) => t.code === code);
      const label = tagDisplayLabel(tag, code, locale);
      const position = getLatLngForTag(code)!;
      return { code, label, position, intensity };
    });
  }, [allTags, currentFilter, locale]);

  React.useEffect(() => {
    const load = async () => {
      const tags = await fetchAllTagOptions();
      setAllTags(tags);
    };
    void load();
  }, []);

  React.useEffect(() => {
    const load = async () => {
      const list = await listFilterPresets();
      setPresets(list as any);
    };
    void load();
  }, []);

  const handleFilterChange = React.useCallback(async (json: any) => {
    setCurrentFilter(json);
    setLoading(true);
    try {
      const next = await searchMediasWithAdvancedFilter(json);
      const mapped: MediaWithCreator[] = next.map((m: any) => ({
        id: m.id,
        mediaName: m.mediaName,
        description: m.description ?? undefined,
        category: m.category,
        price: m.price ?? null,
        cpm: m.cpm ?? null,
        status: m.status,
        updatedAt:
          typeof m.updatedAt === "string"
            ? m.updatedAt
            : new Date(m.updatedAt).toISOString(),
        createdBy: m.createdBy ?? null,
      }));
      setMedias(mapped);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  const applyIndustryTemplate = React.useCallback(
    async (template: IndustryTemplate) => {
      const tags = allTags.length > 0 ? allTags : await fetchAllTagOptions();
      if (tags.length > 0) setAllTags(tags);
      const groups = resolveTemplateToGroups(template.filterJson, tags);
      setAppliedTemplateId(template.id);
      setAppliedTemplateGroups(groups);
      await handleFilterChange(template.filterJson);
    },
    [allTags.length, handleFilterChange],
  );

  const applySuccessCase = React.useCallback(
    async (caseId: string) => {
      const sc = SUCCESS_CASES.find((c) => c.id === caseId);
      if (!sc) return;
      const tags = allTags.length > 0 ? allTags : await fetchAllTagOptions();
      if (tags.length > 0) setAllTags(tags);
      const groups = resolveTemplateToGroups(sc.filterJson, tags);
      setAppliedTemplateId(`successCase:${sc.id}`);
      setAppliedTemplateGroups(groups);
      await handleFilterChange(sc.filterJson);
    },
    [allTags.length, handleFilterChange],
  );

  React.useEffect(() => {
    // Auto-apply from URL query (?successCase=... or ?filter=...)
    const sp = new URLSearchParams(window.location.search);
    const successCaseId = sp.get("successCase");
    const rawFilter = sp.get("filter");

    if (successCaseId) {
      void applySuccessCase(successCaseId);
      return;
    }

    if (rawFilter) {
      try {
        const json = JSON.parse(decodeURIComponent(rawFilter));
        setCurrentFilter(json);
        void handleFilterChange(json);
      } catch {
        // ignore malformed filter
      }
    }
  }, [applySuccessCase, handleFilterChange]);

  return (
    <>
      <div className="mb-6">
        <SuccessCaseGallery
          locale={locale}
          cases={SUCCESS_CASES}
          onApply={(id) => applySuccessCase(id)}
          headingTitle={tm("gallery_title")}
          headingSubtitle={tm("gallery_subtitle")}
          avgCpm={avgCpm}
          tone={isDay ? "light" : "dark"}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-xs font-medium",
            isDay ? "text-zinc-600" : "text-zinc-400",
          )}
        >
          {tm("industry")}
        </span>
        {industryTemplates.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={appliedTemplateId === t.id ? "default" : "outline"}
            className={
              appliedTemplateId === t.id
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : isDay
                  ? "border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                  : "border-zinc-600 text-zinc-200 hover:border-zinc-400"
            }
            onClick={() => applyIndustryTemplate(t)}
          >
            {isKo ? t.nameKo : t.nameEn}
          </Button>
        ))}
      </div>

      {locationMarkers.length > 0 ? (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span
              className={cn(
                "text-xs font-medium",
                isDay ? "text-zinc-600" : "text-zinc-400",
              )}
            >
              {tm("seoulMapTitle")}
            </span>
            <span
              className={cn(
                "text-[11px]",
                isDay ? "text-zinc-500" : "text-zinc-500",
              )}
            >
              {tm("seoulMapHint")}
            </span>
          </div>
          <SeoulMiniMap markers={locationMarkers} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-xs font-medium",
              isDay ? "text-zinc-600" : "text-zinc-400",
            )}
          >
            {tm("savedPresets")}
          </span>
          {presets.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant="outline"
              className={cn(
                "text-xs",
                isDay
                  ? "border-zinc-300 text-zinc-800 hover:bg-zinc-50"
                  : "border-zinc-600 text-zinc-200 hover:border-zinc-400",
              )}
              onClick={() => handleFilterChange(p.filterJson)}
            >
              {isKo ? p.nameKo : p.nameEn}
              {p.isGlobal && (
                <span
                  className={cn(
                    "ml-1 text-[10px]",
                    isDay ? "text-zinc-500" : "text-zinc-400",
                  )}
                >
                  {tm("globalBadge")}
                </span>
              )}
            </Button>
          ))}
          {presets.length === 0 && (
            <span
              className={cn(
                "text-[11px]",
                isDay ? "text-zinc-500" : "text-zinc-500",
              )}
            >
              {tm("noPresets")}
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!currentFilter}
          className={
            isDay
              ? "border-zinc-300 text-zinc-800"
              : "border-zinc-600 text-zinc-200"
          }
          onClick={async () => {
            if (!currentFilter) return;
            const nameKo = window.prompt(tm("prompt_name_ko")) ?? "";
            const nameEn = window.prompt(tm("prompt_name_en")) ?? "";
            try {
              const created = await saveFilterPreset(
                nameKo.trim(),
                nameEn.trim(),
                currentFilter,
              );
              setPresets((prev) => [created as any, ...prev]);
            } catch (e) {
              console.error(e);
              window.alert(tm("presetFail"));
            }
          }}
        >
          {tm("savePreset")}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!currentFilter}
            className={
              isDay
                ? "border-zinc-300 text-zinc-800"
                : "border-zinc-600 text-zinc-200"
            }
            onClick={() => {
              if (!currentFilter) return;
              try {
                const url = new URL(window.location.href);
                url.searchParams.set("filter", encodeURIComponent(JSON.stringify(currentFilter)));
                navigator.clipboard.writeText(url.toString());
                window.alert(tm("copyLink_ok"));
              } catch {
                window.alert(tm("copyLink_fail"));
              }
            }}
          >
            {tm("copyLink")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!currentFilter}
            className={
              isDay
                ? "border-zinc-300 text-zinc-800"
                : "border-zinc-600 text-zinc-200"
            }
            onClick={() => {
              if (!currentFilter) return;
              try {
                navigator.clipboard.writeText(JSON.stringify(currentFilter, null, 2));
                window.alert(tm("copyJson_ok"));
              } catch {
                window.alert(tm("copyJson_fail"));
              }
            }}
          >
            {tm("copyJson")}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <AdvancedFilterBuilder
          key={appliedTemplateId ?? "default"}
          initialGroups={appliedTemplateGroups}
          locale={locale}
          onChange={handleFilterChange}
        />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <PackageDiscountWidget selectedMedias={packageSelectedMedias} />
        <OmnichannelHints
          locale={locale}
          filterJson={currentFilter ?? { groups: [] }}
        />
      </div>

      <Card
        className={cn(
          "shadow-none",
          isDay
            ? "border-zinc-200 bg-white"
            : "border-zinc-800 bg-zinc-950",
        )}
      >
        <CardHeader>
          <CardTitle
            className={cn("text-xl", isDay ? "text-zinc-900" : "text-white")}
          >
            {tm("list_title")}
            {loading && (
              <span
                className={cn(
                  "ml-2 text-xs font-normal",
                  isDay ? "text-zinc-500" : "text-zinc-400",
                )}
              >
                {tm("loading")}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow
                className={cn(
                  "hover:bg-transparent",
                  isDay ? "border-zinc-200" : "border-zinc-800",
                )}
              >
                <TableHead
                  className={cn("w-10", isDay ? "text-zinc-600" : "text-zinc-400")}
                >
                  {tm("sel")}
                </TableHead>
                <TableHead className={isDay ? "text-zinc-600" : "text-zinc-400"}>
                  {tm("col_name")}
                </TableHead>
                <TableHead className={isDay ? "text-zinc-600" : "text-zinc-400"}>
                  {tm("col_category")}
                </TableHead>
                <TableHead className={isDay ? "text-zinc-600" : "text-zinc-400"}>
                  {tm("col_status")}
                </TableHead>
                <TableHead className={isDay ? "text-zinc-600" : "text-zinc-400"}>
                  {tm("col_owner")}
                </TableHead>
                <TableHead className={isDay ? "text-zinc-600" : "text-zinc-400"}>
                  {tm("col_updated")}
                </TableHead>
                <TableHead className={isDay ? "text-zinc-600" : "text-zinc-400"}>
                  {tm("col_action")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medias.map((m) => (
                <TableRow
                  key={m.id}
                  className={isDay ? "border-zinc-200" : "border-zinc-800"}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                      className={cn(
                        "h-4 w-4 rounded",
                        isDay
                          ? "border-zinc-400 bg-white"
                          : "border-zinc-600 bg-zinc-900",
                      )}
                      aria-label={m.mediaName}
                    />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-medium",
                      isDay ? "text-zinc-900" : "text-zinc-200",
                    )}
                  >
                    {m.mediaName}
                    {m.description && (
                      <div
                        className={cn(
                          "mt-0.5 text-xs line-clamp-1",
                          isDay ? "text-zinc-500" : "text-zinc-500",
                        )}
                      >
                        {m.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className={isDay ? "text-zinc-600" : "text-zinc-400"}>
                    {m.category}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        m.status === "DRAFT"
                          ? "border-amber-500/50 text-amber-400"
                          : m.status === "PUBLISHED"
                            ? "border-emerald-500/50 text-emerald-400"
                            : m.status === "REJECTED"
                              ? "border-red-500/50 text-red-400"
                              : "border-zinc-600 text-zinc-400"
                      }
                    >
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={isDay ? "text-zinc-600" : "text-zinc-400"}>
                    {m.createdBy?.name ?? m.createdBy?.email ?? "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-sm",
                      isDay ? "text-zinc-500" : "text-zinc-500",
                    )}
                  >
                    {new Date(m.updatedAt).toLocaleDateString(dl)}
                  </TableCell>
                  <TableCell className="space-x-3">
                    <Link
                      href={`/${locale}/admin/review/${m.id}`}
                      className="text-sm text-orange-600 hover:underline dark:text-orange-400"
                    >
                      {tm("review")}
                    </Link>
                    {m.status === "PUBLISHED" && (
                      <Link
                        href={`/${locale}/medias/${m.id}`}
                        className={cn(
                          "text-sm hover:underline",
                          isDay
                            ? "text-zinc-600 hover:text-zinc-900"
                            : "text-zinc-400 hover:text-zinc-200",
                        )}
                      >
                        {tm("publicDetail")}
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {medias.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className={cn(
                      "py-10 text-center",
                      isDay ? "text-zinc-500" : "text-zinc-500",
                    )}
                  >
                    {tm("empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
