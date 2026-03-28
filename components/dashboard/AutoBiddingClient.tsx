"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type RuleRow = {
  id: string;
  name: string;
  maxBudgetKrw: number;
  countryCodes: unknown;
  periodStart: string;
  periodEnd: string;
  status: "ACTIVE" | "PAUSED";
  messageTemplate: string;
  maxInquiriesPerRun: number;
  minHoursBetweenRuns: number;
  lastRunAt: string | null;
};

function parseCountriesInput(s: string): string[] {
  return [
    ...new Set(
      s
        .split(/[,;\s]+/)
        .map((x) => x.trim().toUpperCase())
        .filter((x) => /^[A-Z]{2}$/.test(x)),
    ),
  ];
}

export function AutoBiddingClient() {
  const t = useTranslations("dashboard.autoBidding");
  const [rules, setRules] = React.useState<RuleRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const [name, setName] = React.useState("");
  const [maxBudget, setMaxBudget] = React.useState("5000000");
  const [countries, setCountries] = React.useState("");
  const [periodStart, setPeriodStart] = React.useState("");
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [messageTemplate, setMessageTemplate] = React.useState("");
  const [maxPerRun, setMaxPerRun] = React.useState("5");
  const [minHours, setMinHours] = React.useState("6");
  const [createStatus, setCreateStatus] = React.useState<"ACTIVE" | "PAUSED">("PAUSED");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/auto-bid/rules", { credentials: "include" });
      const json = (await res.json()) as { ok?: boolean; rules?: RuleRow[] };
      if (!res.ok || !json.ok) throw new Error("load");
      setRules(json.rules ?? []);
    } catch {
      toast.error(t("load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (dialogOpen && !messageTemplate) {
      setMessageTemplate(t("default_template"));
    }
  }, [dialogOpen, messageTemplate, t]);

  const openCreate = () => {
    setName("");
    setMaxBudget("5000000");
    setCountries("");
    const today = new Date();
    const end = new Date(today);
    end.setMonth(end.getMonth() + 1);
    setPeriodStart(today.toISOString().slice(0, 10));
    setPeriodEnd(end.toISOString().slice(0, 10));
    setMessageTemplate(t("default_template"));
    setMaxPerRun("5");
    setMinHours("6");
    setCreateStatus("PAUSED");
    setDialogOpen(true);
  };

  const createRule = async () => {
    if (!name.trim()) {
      toast.error(t("name_required"));
      return;
    }
    const budget = Number.parseInt(maxBudget.replace(/\D/g, ""), 10);
    if (!Number.isFinite(budget) || budget < 1) {
      toast.error(t("budget_invalid"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/auto-bid/rules", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          maxBudgetKrw: budget,
          countryCodes: parseCountriesInput(countries),
          periodStart: `${periodStart}T00:00:00.000Z`,
          periodEnd: `${periodEnd}T23:59:59.999Z`,
          status: createStatus,
          messageTemplate: messageTemplate.trim(),
          maxInquiriesPerRun: Math.min(20, Math.max(1, Number(maxPerRun) || 5)),
          minHoursBetweenRuns: Math.min(168, Math.max(1, Number(minHours) || 6)),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? t("save_error"));
        return;
      }
      toast.success(t("rule_created"));
      setDialogOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const patchStatus = async (id: string, status: "ACTIVE" | "PAUSED") => {
    const res = await fetch(`/api/dashboard/auto-bid/rules/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error(t("save_error"));
      return;
    }
    toast.success(t("rule_updated"));
    await load();
  };

  const removeRule = async (id: string) => {
    if (!window.confirm(t("delete_confirm"))) return;
    const res = await fetch(`/api/dashboard/auto-bid/rules/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error(t("save_error"));
      return;
    }
    toast.success(t("rule_deleted"));
    await load();
  };

  const runRule = async (id: string, force: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/auto-bid/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId: id, force }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        results?: { created: number; error?: string }[];
      };
      if (!res.ok) {
        if (res.status === 429) toast.message(t("cooldown"));
        else toast.error(json.error ?? t("run_error"));
        return;
      }
      const created = json.results?.[0]?.created ?? 0;
      if (created > 0) toast.success(t("run_ok", { count: created }));
      else toast.message(t("run_none"));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const runAll = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/auto-bid/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        results?: { created: number; error?: string }[];
      };
      if (!res.ok) {
        toast.error(t("run_error"));
        return;
      }
      const total = json.results?.reduce((a, r) => a + r.created, 0) ?? 0;
      toast.success(t("run_all_ok", { count: total }));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const countryLabel = (raw: unknown) => {
    if (!Array.isArray(raw) || raw.length === 0) return t("countries_all");
    return raw.join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {t("refresh")}
        </Button>
        <Button type="button" size="sm" onClick={openCreate}>
          {t("new_rule")}
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void runAll()}>
          {t("run_all")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("explain_title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("explain_body")}</p>
          <p className="text-xs text-muted-foreground">{t("notify_hint")}</p>
        </CardHeader>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("col_name")}</TableHead>
                <TableHead>{t("col_budget")}</TableHead>
                <TableHead>{t("col_region")}</TableHead>
                <TableHead>{t("col_period")}</TableHead>
                <TableHead>{t("col_status")}</TableHead>
                <TableHead>{t("col_last_run")}</TableHead>
                <TableHead className="text-right">{t("col_actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="tabular-nums">{r.maxBudgetKrw.toLocaleString()}₩</TableCell>
                    <TableCell className="text-sm">{countryLabel(r.countryCodes)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {r.periodStart.slice(0, 10)} → {r.periodEnd.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          r.status === "ACTIVE"
                            ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-200"
                            : "bg-zinc-500/15 text-zinc-700 dark:text-zinc-200",
                        )}
                      >
                        {r.status === "ACTIVE" ? t("status_active") : t("status_paused")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void runRule(r.id, true)}
                        >
                          {t("run_now")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void patchStatus(r.id, r.status === "ACTIVE" ? "PAUSED" : "ACTIVE")}
                        >
                          {r.status === "ACTIVE" ? t("pause") : t("activate")}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void removeRule(r.id)}>
                          {t("delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-sm">
        <Link href="/dashboard/advertiser/inquiries" className="text-primary underline-offset-4 hover:underline">
          {t("link_inquiries")}
        </Link>
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dialog_title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("col_name")}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("col_budget")}</label>
              <Input value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("countries_label")}</label>
              <Input
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                placeholder="KR, US, JP"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("period_start")}</label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("period_end")}</label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("max_per_run")}</label>
                <Input type="number" min={1} max={20} value={maxPerRun} onChange={(e) => setMaxPerRun(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("min_hours")}</label>
                <Input type="number" min={1} max={168} value={minHours} onChange={(e) => setMinHours(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("initial_status")}</label>
              <Select
                value={createStatus}
                onValueChange={(v) => setCreateStatus(v as "ACTIVE" | "PAUSED")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAUSED">{t("status_paused")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("status_active")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("message_template")}</label>
              <p className="text-xs text-muted-foreground">{t("placeholders_hint")}</p>
              <Textarea rows={5} value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void createRule()}>
              {t("save_rule")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
