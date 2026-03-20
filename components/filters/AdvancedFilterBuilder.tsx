"use client";

import * as React from "react";
import { Plus, X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRelatedCodes } from "@/lib/filters/suggestions";
import { CreativeHintsPopup } from "@/components/hints/CreativeHintsPopup";
import { CreativeHintsAlert } from "@/components/hints/CreativeHintsAlert";
import { OmnichannelHints } from "@/components/campaign/OmnichannelHints";
import { SeoulEventAlert } from "@/components/hints/SeoulEventAlert";
import { TimeMessageAlert } from "@/components/hints/TimeMessageAlert";
import { AbMessageVariantsCard } from "@/components/hints/AbMessageVariantsCard";
import { OverlapWarningAlert } from "@/components/hints/OverlapWarningAlert";

type TagOption = {
  code: string;
  labelKo: string;
  labelEn: string;
  labelJa?: string | null;
  categoryKo: string;
  categoryEn: string;
  categoryJa?: string | null;
};

type FilterLogic = "AND" | "OR";

type FilterGroup = {
  id: string;
  label?: string;
  logic: FilterLogic;
  tags: TagOption[];
};

type Props = {
  initialGroups?: FilterGroup[];
  locale: string;
  onChange?: (json: any) => void;
};

function isAbortError(e: unknown): boolean {
  return (
    e instanceof DOMException && e.name === "AbortError"
  ) || (e instanceof Error && e.name === "AbortError");
}

export function AdvancedFilterBuilder({
  initialGroups = [],
  locale,
  onChange,
}: Props) {
  const [groups, setGroups] = React.useState<FilterGroup[]>(initialGroups);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<TagOption[]>([]);
  const [allTags, setAllTags] = React.useState<TagOption[]>([]);
  const [activeGroupId, setActiveGroupId] = React.useState<string | null>(null);
  const [suggested, setSuggested] = React.useState<TagOption[]>([]);
  const [lastSelected, setLastSelected] = React.useState<TagOption | null>(null);

  const isKo = locale === "ko";
  const isJa = locale === "ja";

  const selectedTagCodes = React.useMemo(() => {
    const codes = new Set<string>();
    groups.forEach((g) => g.tags.forEach((t) => codes.add(t.code)));
    return Array.from(codes);
  }, [groups]);

  React.useEffect(() => {
    const controller = new AbortController();
    const fetchOptions = async () => {
      try {
        const q = query.trim();
        const res = await fetch(
          `/api/advanced-tags?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!res.ok || controller.signal.aborted) return;
        const json = (await res.json()) as TagOption[];
        if (!controller.signal.aborted) setOptions(json);
      } catch (e) {
        if (isAbortError(e)) return;
        console.error("[AdvancedFilterBuilder] fetchOptions", e);
      }
    };
    void fetchOptions();
    return () => controller.abort();
  }, [query]);

  React.useEffect(() => {
    const controller = new AbortController();
    const fetchAll = async () => {
      try {
        const res = await fetch(`/api/advanced-tags?q=`, {
          signal: controller.signal,
        });
        if (!res.ok || controller.signal.aborted) return;
        const json = (await res.json()) as TagOption[];
        if (!controller.signal.aborted) setAllTags(json);
      } catch (e) {
        if (isAbortError(e)) return;
        console.error("[AdvancedFilterBuilder] fetchAll", e);
      }
    };
    void fetchAll();
    return () => controller.abort();
  }, []);

  React.useEffect(() => {
    if (!onChange) return;
    const json = {
      groups: groups.map((g) => ({
        id: g.id,
        label: g.label,
        logic: g.logic,
        tags: g.tags.map((t) => t.code),
      })),
    };
    onChange(json);
  }, [groups]);

  const addGroup = () => {
    const g: FilterGroup = {
      id: crypto.randomUUID(),
      label:
        groups.length === 0
          ? "위치 / 상권"
          : groups.length === 1
            ? "시간 / 컨텍스트"
            : "추가 조건",
      logic: "OR",
      tags: [],
    };
    setGroups((prev) => [...prev, g]);
    setActiveGroupId(g.id);
  };

  const toggleLogic = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, logic: g.logic === "AND" ? "OR" : "AND" } : g,
      ),
    );
  };

  const addTagToGroup = (groupId: string, tag: TagOption) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.tags.find((t) => t.code === tag.code)
          ? { ...g, tags: [...g.tags, tag] }
          : g,
      ),
    );
    setQuery("");
    setLastSelected(tag);

    // 연관 태그 제안
    const relatedCodes = getRelatedCodes(tag.code);
    if (relatedCodes.length > 0) {
      // 이미 선택된 태그는 제외
      const selectedCodes = new Set(
        groups.flatMap((g) => g.tags.map((t) => t.code)),
      );
      const next = options.filter(
        (o) => relatedCodes.includes(o.code) && !selectedCodes.has(o.code),
      );
      setSuggested(next);
    } else {
      setSuggested([]);
    }
  };

  const removeTag = (groupId: string, code: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, tags: g.tags.filter((t) => t.code !== code) }
          : g,
      ),
    );
  };

  const displayLabel = (t: TagOption) => {
    const primary = isKo ? t.labelKo : isJa ? (t.labelJa ?? t.labelEn) : t.labelEn;
    const secondary = isKo ? t.labelEn : t.labelKo;
    return `${primary} (${secondary})`;
  };

  const applySmartCombo = React.useCallback(
    (codes: string[]) => {
      const tagByCode = new Map(allTags.map((t) => [t.code, t]));
      const resolved = codes
        .map((c) => tagByCode.get(c))
        .filter((t): t is TagOption => Boolean(t));

      if (resolved.length === 0) return;

      const LOCATION = new Set(["gangnam_station", "coex", "yeouido", "hongdae"]);
      const TIME = new Set(["morning_rush", "evening_rush", "weekend", "nightlife"]);
      const AUDIENCE = new Set([
        "twenties",
        "thirties",
        "teens",
        "office_workers",
        "high_income",
        "luxury",
        "premium",
        "couples",
        "families",
      ]);

      setGroups((prev) => {
        const next = [...prev];
        const ensureGroup = (label: string) => {
          const found = next.find((g) => g.label === label);
          if (found) return found.id;
          const g: FilterGroup = {
            id: crypto.randomUUID(),
            label,
            logic: "OR",
            tags: [],
          };
          next.push(g);
          return g.id;
        };

        const locId = ensureGroup("위치 / 상권");
        const timeId = ensureGroup("시간 / 컨텍스트");
        const audId = ensureGroup("추가 조건");

        const addTo = (groupId: string, tag: TagOption) => {
          const gIdx = next.findIndex((g) => g.id === groupId);
          if (gIdx < 0) return;
          if (next[gIdx].tags.some((t) => t.code === tag.code)) return;
          next[gIdx] = { ...next[gIdx], tags: [...next[gIdx].tags, tag] };
        };

        for (const t of resolved) {
          if (LOCATION.has(t.code)) addTo(locId, t);
          else if (TIME.has(t.code)) addTo(timeId, t);
          else if (AUDIENCE.has(t.code)) addTo(audId, t);
          else addTo(audId, t);
        }

        return next;
      });
    },
    [allTags],
  );

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <OverlapWarningAlert
        locale={locale}
        tagCodes={selectedTagCodes}
        className="border-amber-300/60 bg-amber-50"
      />

      <Card className="border-zinc-200 bg-white text-zinc-950 shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-sm">
            {isKo ? "스마트 추천 조합" : "Smart recommended combos"}
          </CardTitle>
          <p className="mt-1 text-xs text-zinc-500">
            {isKo
              ? "자주 쓰는 타겟팅 조합을 버튼 한 번에 추가합니다."
              : "Apply common targeting combos in one click."}
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 p-4 pt-0">
          {(() => {
            const combos: Array<{
              id: string;
              requires: string;
              labelKo: string;
              labelEn: string;
              codes: string[];
            }> = [
              {
                id: "gangnam_combo",
                requires: "gangnam_station",
                labelKo: "강남 + 출퇴근 + 20~30대 + 고소득",
                labelEn: "Gangnam + commute + 20s/30s + high income",
                codes: [
                  "gangnam_station",
                  "morning_rush",
                  "evening_rush",
                  "twenties",
                  "thirties",
                  "high_income",
                  "office_workers",
                ],
              },
              {
                id: "yeouido_combo",
                requires: "yeouido",
                labelKo: "여의도 + 출퇴근 + 직장인 + 고소득",
                labelEn: "Yeouido + commute + office + high income",
                codes: [
                  "yeouido",
                  "morning_rush",
                  "evening_rush",
                  "office_workers",
                  "high_income",
                  "premium",
                ],
              },
              {
                id: "coex_combo",
                requires: "coex",
                labelKo: "코엑스 + 주말 + 가족/쇼핑",
                labelEn: "COEX + weekend + family/shopping",
                codes: ["coex", "weekend", "families", "shopping_mall_visitors"],
              },
              {
                id: "hongdae_combo",
                requires: "hongdae_trendy",
                labelKo: "홍대 + 저녁 + 10~20대 + 데이트/나이트",
                labelEn: "Hongdae + evening + youth + nightlife",
                codes: [
                  "hongdae_trendy",
                  "evening_rush",
                  "nightlife",
                  "teens",
                  "twenties",
                  "couples",
                ],
              },
            ];

            const visible = combos.filter((c) => selectedTagCodes.includes(c.requires));
            if (visible.length === 0) {
              return (
                <span className="text-xs text-zinc-500">
                  {isKo
                    ? "예: 강남/여의도/코엑스/홍대 태그를 선택하면 추천 조합 버튼이 표시돼요."
                    : "Select Gangnam/Yeouido/COEX/Hongdae tags to see combo buttons."}
                </span>
              );
            }

            return visible.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applySmartCombo(c.codes)}
              >
                {isKo ? c.labelKo : c.labelEn}
              </Button>
            ));
          })()}
        </CardContent>
      </Card>

      <AbMessageVariantsCard locale={locale} tagCodes={selectedTagCodes} />

      <TimeMessageAlert
        locale={locale}
        tagCodes={selectedTagCodes}
        dismissKey="xthex:advanced-filter:time-message:dismissed:v1"
        className="border-amber-300/60 bg-amber-50"
      />

      <SeoulEventAlert
        locale={locale}
        tagCodes={selectedTagCodes}
        dismissKey="xthex:advanced-filter:seoul-event:dismissed:v1"
        className="border-amber-300/60 bg-amber-50"
      />

      <CreativeHintsAlert
        locale={locale}
        tagCodes={selectedTagCodes}
        className="border-amber-300/60 bg-amber-50"
        dismissKey="xthex:advanced-filter:creative-alert:dismissed:v1"
      />

      <CreativeHintsPopup
        locale={locale}
        context={{ tagCodes: selectedTagCodes }}
        compact
        autoOpenOnceKey="advanced-filter-creative-hints"
      />

      <OmnichannelHints
        locale={locale}
        filterJson={{
          groups: groups.map((g) => ({
            id: g.id,
            label: g.label,
            logic: g.logic,
            tags: g.tags.map((t) => t.code),
          })),
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1 text-sm font-semibold text-zinc-900">
            <Settings2 className="h-4 w-4" />
            {isKo ? "고급 타겟팅" : "Advanced targeting"}
          </h3>
          <p className="text-xs text-zinc-500">
            {isKo
              ? "그룹은 서로 AND, 그룹 내 태그는 AND/OR로 조합할 수 있어요."
              : "Groups are combined with AND; tags inside a group use AND/OR."}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addGroup}>
          {isKo ? "조건 그룹 추가" : "Add group"}
        </Button>
      </div>

      <div className="space-y-3">
        {groups.map((g, idx) => (
          <div
            key={g.id}
            className={cn(
              "rounded-lg border px-3 py-2",
              activeGroupId === g.id ? "border-zinc-900" : "border-zinc-200",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">
                  {isKo ? `그룹 ${idx + 1}` : `Group ${idx + 1}`}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => toggleLogic(g.id)}
                  className="h-6 px-2 text-[11px]"
                >
                  {g.logic === "AND"
                    ? isKo
                      ? "내부 AND"
                      : "Inner AND"
                    : isKo
                      ? "내부 OR"
                      : "Inner OR"}
                </Button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {g.tags.map((t) => (
                <Badge
                  key={t.code}
                  variant="outline"
                  className="flex items-center gap-1 rounded-full px-2 py-0.5"
                >
                  {displayLabel(t)}
                  <button
                    type="button"
                    onClick={() => removeTag(g.id, t.code)}
                    className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-zinc-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-500 hover:border-zinc-400"
                onClick={() => setActiveGroupId(g.id)}
              >
                <Plus className="h-3 w-3" />
                {isKo ? "태그 추가" : "Add tag"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeGroupId && (
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-medium text-zinc-600">
            {isKo ? "태그 검색" : "Search tags"}
          </p>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isKo ? "강남, 명품, 야구, luxury ..." : "Gangnam, luxury, baseball ..."
            }
            className="h-8 text-sm"
          />
          <div className="max-h-48 space-y-1 overflow-y-auto pt-1 text-xs">
            {options.map((o) => (
              <button
                key={o.code}
                type="button"
                className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-zinc-100"
                onClick={() => addTagToGroup(activeGroupId, o)}
              >
                <span className="flex-1 truncate">{displayLabel(o)}</span>
                <span className="ml-2 text-[11px] text-zinc-400">
                  {isKo ? o.categoryKo : o.categoryEn}
                </span>
              </button>
            ))}
            {options.length === 0 && (
              <p className="px-1 py-2 text-[11px] text-zinc-400">
                {isKo ? "검색 결과가 없습니다." : "No results."}
              </p>
            )}
          </div>
          {lastSelected && suggested.length > 0 && (
            <div className="mt-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-[11px] text-zinc-700">
              <p className="mb-1 font-medium">
                {isKo
                  ? `"${lastSelected.labelKo}"와 함께 많이 쓰이는 조건`
                  : `Conditions often used with "${lastSelected.labelEn}"`}
              </p>
              <div className="flex flex-wrap gap-1">
                {suggested.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => activeGroupId && addTagToGroup(activeGroupId, t)}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] hover:bg-zinc-50"
                  >
                    {displayLabel(t)}
                    <span className="text-[10px] text-zinc-400">
                      {isKo ? t.categoryKo : t.categoryEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

