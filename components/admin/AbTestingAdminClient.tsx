"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";

type Aggregates = {
  impressionA: number;
  impressionB: number;
  conversionA: number;
  conversionB: number;
};

type ExperimentRow = {
  id: string;
  slug: string;
  name: string;
  status: "DRAFT" | "RUNNING" | "STOPPED" | "CONCLUDED";
  trafficSplitA: number;
  winnerVariant: "A" | "B" | null;
  minImpressionsAuto: number;
  aggregates: Aggregates;
};

export function AbTestingAdminClient() {
  const t = useTranslations("admin.abTesting");
  const [experiments, setExperiments] = React.useState<ExperimentRow[]>([]);
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ab/experiments", { credentials: "include" });
      const data = (await res.json()) as { ok?: boolean; experiments?: ExperimentRow[] };
      if (!res.ok || !data.ok || !data.experiments) {
        toast.error(t("load_error"));
        return;
      }
      setExperiments(data.experiments);
      setSelectedSlug((prev) => {
        if (prev && data.experiments!.some((e) => e.slug === prev)) return prev;
        return data.experiments![0]?.slug ?? null;
      });
    } catch {
      toast.error(t("load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const selected = experiments.find((e) => e.slug === selectedSlug) ?? null;

  const impressionChart = selected
    ? [
        { variant: "A", count: selected.aggregates.impressionA },
        { variant: "B", count: selected.aggregates.impressionB },
      ]
    : [];

  const conversionChart = selected
    ? [
        { variant: "A", count: selected.aggregates.conversionA },
        { variant: "B", count: selected.aggregates.conversionB },
      ]
    : [];

  const rate = (imp: number, conv: number) =>
    imp <= 0 ? 0 : Math.round((conv / imp) * 10_000) / 100;

  const patch = async (slug: string, body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ab/experiments/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error(t("toast_error"));
        return;
      }
      toast.success(t("toast_patched"));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const autoWinner = async (slug: string) => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/ab/experiments/${encodeURIComponent(slug)}/auto-winner`,
        { method: "POST", credentials: "include" },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        result?: { applied: boolean; winner?: string; reason: string };
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? t("toast_error"));
        return;
      }
      if (data.result?.applied && data.result.winner) {
        toast.success(t("toast_auto_applied", { variant: data.result.winner }));
      } else {
        toast.message(t("toast_auto_skipped"));
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (experiments.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("col_slug")}</TableHead>
              <TableHead>{t("col_name")}</TableHead>
              <TableHead>{t("col_status")}</TableHead>
              <TableHead>{t("col_winner")}</TableHead>
              <TableHead className="text-right">{t("col_split")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiments.map((e) => (
              <TableRow
                key={e.id}
                className={cn(
                  "cursor-pointer",
                  selectedSlug === e.slug && "bg-muted/50",
                )}
                onClick={() => setSelectedSlug(e.slug)}
              >
                <TableCell className="font-mono text-sm">{e.slug}</TableCell>
                <TableCell>{e.name}</TableCell>
                <TableCell>{t(`status_${e.status}`)}</TableCell>
                <TableCell>{e.winnerVariant ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{e.trafficSplitA}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t("chart_impressions")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px] pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={impressionChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="variant" tick={{ fill: MUTED, fontSize: 12 }} />
                  <YAxis tick={{ fill: MUTED, fontSize: 11 }} width={36} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">{t("chart_conversions")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px] pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="variant" tick={{ fill: MUTED, fontSize: 12 }} />
                  <YAxis tick={{ fill: MUTED, fontSize: 11 }} width={36} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selected ? (
        <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            {t("rate_a", {
              rate: rate(selected.aggregates.impressionA, selected.aggregates.conversionA),
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("rate_b", {
              rate: rate(selected.aggregates.impressionB, selected.aggregates.conversionB),
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("min_auto_hint", { n: selected.minImpressionsAuto })}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {selected.status !== "RUNNING" ? (
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() =>
                  patch(selected.slug, { status: "RUNNING", winnerVariant: null })
                }
              >
                {t("btn_run")}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => patch(selected.slug, { status: "STOPPED" })}
              >
                {t("btn_stop")}
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || selected.status === "CONCLUDED"}
              onClick={() =>
                patch(selected.slug, { status: "CONCLUDED", winnerVariant: "A" })
              }
            >
              {t("btn_conclude_a")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || selected.status === "CONCLUDED"}
              onClick={() =>
                patch(selected.slug, { status: "CONCLUDED", winnerVariant: "B" })
              }
            >
              {t("btn_conclude_b")}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={busy || selected.status !== "RUNNING"}
              onClick={() => autoWinner(selected.slug)}
            >
              {t("btn_auto_winner")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
