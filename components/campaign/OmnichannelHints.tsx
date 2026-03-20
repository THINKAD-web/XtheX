"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  estimateOmnichannelReach,
  getOmnichannelPackages,
} from "@/lib/campaign/omnichannel-hints";

type Props = {
  locale: string;
  filterJson: any;
  defaultBudgetKrw?: number;
};

function extractTagCodes(filterJson: any): string[] {
  const groups = filterJson?.groups;
  if (!Array.isArray(groups)) return [];
  const out: string[] = [];
  for (const g of groups) {
    const tags = g?.tags;
    if (Array.isArray(tags)) {
      for (const c of tags) if (typeof c === "string" && c) out.push(c);
    }
  }
  return Array.from(new Set(out));
}

function formatKrw(n: number) {
  try {
    return new Intl.NumberFormat("ko-KR").format(Math.round(n));
  } catch {
    return String(Math.round(n));
  }
}

export function OmnichannelHints({
  locale,
  filterJson,
  defaultBudgetKrw = 10000000,
}: Props) {
  const isKo = locale === "ko";
  const [budgetInput, setBudgetInput] = React.useState(String(defaultBudgetKrw));

  const budgetKrw = React.useMemo(() => {
    const digits = budgetInput.replace(/[^\d]/g, "");
    const n = Number(digits);
    return Number.isFinite(n) ? n : 0;
  }, [budgetInput]);

  const tagCodes = React.useMemo(() => extractTagCodes(filterJson), [filterJson]);

  const packages = React.useMemo(
    () => getOmnichannelPackages({ tagCodes, budgetKrw }),
    [tagCodes, budgetKrw],
  );

  return (
    <Card className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none">
      <CardHeader className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {isKo ? "옴니채널 패키지 추천 (룰베이스)" : "Omnichannel package suggestions (rule-based)"}
            </CardTitle>
            <p className="mt-1 text-xs text-zinc-400">
              {isKo
                ? "타겟팅(filterJson) + 예산으로 DOOH + 카카오/IG 연계 조합을 추천합니다."
                : "Uses targeting (filterJson) + budget to recommend DOOH + Kakao/IG bundles."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{isKo ? "예산" : "Budget"}</span>
            <Input
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              inputMode="numeric"
              placeholder={isKo ? "예: 10000000" : "e.g. 10000000"}
              className="h-9 w-[160px] border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {tagCodes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tagCodes.slice(0, 8).map((c) => (
              <Badge
                key={c}
                variant="outline"
                className="border-zinc-700 bg-zinc-900 text-zinc-300"
              >
                {c}
              </Badge>
            ))}
            {tagCodes.length > 8 ? (
              <span className="text-xs text-zinc-500">+{tagCodes.length - 8}</span>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            {isKo ? "타겟팅 태그를 고르면 추천 정확도가 올라가요." : "Select targeting tags to improve suggestions."}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0">
        {packages.map((p) => {
          const est = estimateOmnichannelReach(
            { tagCodes, budgetKrw },
            p.allocation,
          );
          const title = isKo ? p.titleKo : p.titleEn;
          const bullets = isKo ? p.bulletsKo : p.bulletsEn;

          return (
            <div
              key={p.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-zinc-100">{title}</div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <Badge className="bg-orange-500/15 text-orange-200 hover:bg-orange-500/15">
                    DOOH {Math.round(p.allocation.dooh * 100)}%
                  </Badge>
                  <Badge className="bg-blue-500/15 text-blue-200 hover:bg-blue-500/15">
                    Kakao {Math.round(p.allocation.kakao * 100)}%
                  </Badge>
                  <Badge className="bg-pink-500/15 text-pink-200 hover:bg-pink-500/15">
                    IG {Math.round(p.allocation.ig * 100)}%
                  </Badge>
                </div>
              </div>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                {bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-zinc-800 bg-zinc-950/40 p-2">
                  <div className="text-xs text-zinc-500">
                    {isKo ? "예상 도달(Reach, 데모)" : "Estimated reach (demo)"}
                  </div>
                  <div className="text-sm font-semibold text-zinc-50">
                    {formatKrw(est.totalReach)} {isKo ? "명" : "people"}
                  </div>
                </div>
                <div className="rounded-md border border-zinc-800 bg-zinc-950/40 p-2">
                  <div className="text-xs text-zinc-500">
                    {isKo ? "예상 노출(Impressions, 데모)" : "Estimated impressions (demo)"}
                  </div>
                  <div className="text-sm font-semibold text-zinc-50">
                    {formatKrw(est.totalImpressions)}
                  </div>
                </div>
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                {isKo
                  ? `가정: CPM(₩) DOOH 9,000 / Kakao 3,500 / IG 4,500. 총 예산 ${formatKrw(budgetKrw)}원 기준.`
                  : `Assumptions: CPM(₩) DOOH 9,000 / Kakao 3,500 / IG 4,500. Based on budget ₩${formatKrw(budgetKrw)}.`}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

