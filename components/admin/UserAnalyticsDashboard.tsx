"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type LogRow = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
  action: string;
  category: string;
  meta: unknown;
  createdAt: string;
};

type Anomaly = {
  code: "HIGH_VOLUME" | "BURST_WINDOW" | "NEW_ACCOUNT_SPIKE";
  severity: "medium" | "high";
  userId: string;
  count: number;
};

const CATEGORY_OPTIONS = [
  "ALL",
  "AUTH",
  "NAV",
  "API",
  "SECURITY",
  "DATA",
  "SYSTEM",
] as const;

const PIE_COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

function formatDay(isoDate: string) {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export function UserAnalyticsDashboard() {
  const t = useTranslations("admin.userAnalytics");

  const [fromYmd, setFromYmd] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return d.toISOString().slice(0, 10);
  });
  const [toYmd, setToYmd] = React.useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [email, setEmail] = React.useState("");
  const [actionQ, setActionQ] = React.useState("");
  const [category, setCategory] = React.useState<string>("ALL");

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [seriesByDay, setSeriesByDay] = React.useState<
    Array<{ date: string; count: number }>
  >([]);
  const [byCategory, setByCategory] = React.useState<
    Array<{ category: string; count: number }>
  >([]);
  const [logs, setLogs] = React.useState<LogRow[]>([]);
  const [anomalies, setAnomalies] = React.useState<Anomaly[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fromIso = new Date(`${fromYmd}T00:00:00.000Z`).toISOString();
      const toIso = new Date(`${toYmd}T23:59:59.999Z`).toISOString();
      const p = new URLSearchParams();
      p.set("from", fromIso);
      p.set("to", toIso);
      p.set("limit", "200");
      if (email.trim()) p.set("email", email.trim());
      if (actionQ.trim()) p.set("action", actionQ.trim());
      if (category !== "ALL") p.set("category", category);

      const res = await fetch(`/api/admin/user-analytics?${p}`, {
        credentials: "include",
      });
      const json = (await res.json().catch(() => null)) as
        | {
            seriesByDay?: typeof seriesByDay;
            byCategory?: typeof byCategory;
            logs?: LogRow[];
            anomalies?: Anomaly[];
            error?: string;
          }
        | null;

      if (!res.ok) {
        setError(json?.error ?? t("load_error"));
        return;
      }
      setSeriesByDay(json?.seriesByDay ?? []);
      setByCategory(json?.byCategory ?? []);
      setLogs(json?.logs ?? []);
      setAnomalies(json?.anomalies ?? []);
    } catch {
      setError(t("load_error"));
    } finally {
      setLoading(false);
    }
  }, [fromYmd, toYmd, email, actionQ, category, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function anomalyText(a: Anomaly) {
    switch (a.code) {
      case "HIGH_VOLUME":
        return t("anomaly_high_volume", { count: a.count });
      case "BURST_WINDOW":
        return t("anomaly_burst", { count: a.count });
      case "NEW_ACCOUNT_SPIKE":
        return t("anomaly_new_user", { count: a.count });
      default:
        return a.code;
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("filters_title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="ua-from">{t("filter_from")}</Label>
            <Input
              id="ua-from"
              type="date"
              value={fromYmd}
              onChange={(e) => setFromYmd(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ua-to">{t("filter_to")}</Label>
            <Input
              id="ua-to"
              type="date"
              value={toYmd}
              onChange={(e) => setToYmd(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ua-email">{t("filter_email")}</Label>
            <Input
              id="ua-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ua-action">{t("filter_action")}</Label>
            <Input
              id="ua-action"
              value={actionQ}
              onChange={(e) => setActionQ(e.target.value)}
              placeholder="PAGE_VIEW"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("filter_category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "ALL" ? t("category_all") : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end sm:col-span-2">
            <Button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {t("apply_filters")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("chart_daily_title")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] w-full pt-0">
            {seriesByDay.length === 0 && !loading ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                {t("empty_charts")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seriesByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={formatDay}
                  />
                  <YAxis width={36} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    labelFormatter={(v) => formatDay(String(v))}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name={t("chart_events")}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("chart_category_title")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] w-full pt-0">
            {byCategory.length === 0 && !loading ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                {t("empty_charts")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={false}
                  >
                    {byCategory.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]!}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/[0.06] dark:bg-amber-950/20">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-base">{t("anomalies_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {anomalies.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("anomalies_empty")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {anomalies.map((a, i) => (
                <li
                  key={`${a.code}-${a.userId}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border/80 bg-background/80 px-3 py-2"
                >
                  <span
                    className={cn(
                      "font-medium",
                      a.severity === "high"
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-amber-900 dark:text-amber-100",
                    )}
                  >
                    {anomalyText(a)}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {a.userId.slice(0, 8)}…
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground mt-3 text-xs">{t("anomalies_hint")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("log_title")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading && logs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("loading")}
            </p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("log_empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col_time")}</TableHead>
                  <TableHead>{t("col_user")}</TableHead>
                  <TableHead>{t("col_category")}</TableHead>
                  <TableHead>{t("col_action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate text-sm font-medium">{row.email}</div>
                      <div className="text-muted-foreground text-xs">{row.role}</div>
                    </TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell className="max-w-[240px]">
                      <span className="text-sm">{row.action}</span>
                      {row.meta != null && typeof row.meta === "object" ? (
                        <pre className="text-muted-foreground mt-1 max-h-16 overflow-auto text-[10px]">
                          {JSON.stringify(row.meta).slice(0, 120)}
                          {JSON.stringify(row.meta).length > 120 ? "…" : ""}
                        </pre>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
