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
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";

type KeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

type UsagePayload = {
  ok?: boolean;
  summary?: { totalRequests: number; days: number; since: string };
  daily?: { date: string; count: number }[];
  topPaths?: { path: string; count: number }[];
};

export function PartnerApiDashboardClient() {
  const t = useTranslations("dashboard.partnerApi");
  const [keys, setKeys] = React.useState<KeyRow[]>([]);
  const [usage, setUsage] = React.useState<UsagePayload | null>(null);
  const [webhook, setWebhook] = React.useState<{ url: string; enabled: boolean } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [days, setDays] = React.useState(14);
  const [newName, setNewName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [secretDialog, setSecretDialog] = React.useState<string | null>(null);
  const [whUrl, setWhUrl] = React.useState("");
  const [whEnabled, setWhEnabled] = React.useState(true);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, uRes, wRes] = await Promise.all([
        fetch("/api/dashboard/partner-api/keys", { credentials: "include" }),
        fetch(`/api/dashboard/partner-api/usage?days=${days}`, { credentials: "include" }),
        fetch("/api/dashboard/partner-api/webhook", { credentials: "include" }),
      ]);
      const kJson = (await kRes.json()) as { ok?: boolean; keys?: KeyRow[] };
      const uJson = (await uRes.json()) as UsagePayload;
      const wJson = (await wRes.json()) as {
        ok?: boolean;
        webhook: { url: string; enabled: boolean } | null;
      };
      if (!kRes.ok || !kJson.ok) throw new Error("keys");
      if (!uRes.ok || !uJson.ok) throw new Error("usage");
      if (!wRes.ok || !wJson.ok) throw new Error("webhook");
      setKeys(kJson.keys ?? []);
      setUsage(uJson);
      const wh = wJson.webhook;
      setWebhook(wh);
      setWhUrl(wh?.url ?? "");
      setWhEnabled(wh?.enabled ?? true);
    } catch {
      toast.error(t("load_error"));
    } finally {
      setLoading(false);
    }
  }, [days, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const createKey = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/partner-api/keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = (await res.json()) as { ok?: boolean; secret?: string; error?: string };
      if (!res.ok || !json.ok || !json.secret) {
        toast.error(json.error ?? t("load_error"));
        return;
      }
      setSecretDialog(json.secret);
      setNewName("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm(t("revoke_confirm"))) return;
    const res = await fetch(`/api/dashboard/partner-api/keys/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error(t("load_error"));
      return;
    }
    await load();
  };

  const saveWebhook = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/partner-api/webhook", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: whUrl.trim(), enabled: whEnabled }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? t("load_error"));
        return;
      }
      toast.success(t("webhook_save"));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const removeWebhook = async () => {
    const res = await fetch("/api/dashboard/partner-api/webhook", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error(t("load_error"));
      return;
    }
    setWhUrl("");
    setWebhook(null);
    await load();
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error(t("load_error"));
    }
  };

  const daily = usage?.daily ?? [];
  const topPaths = usage?.topPaths ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          {t("refresh")}
        </Button>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="keys">{t("tab_keys")}</TabsTrigger>
          <TabsTrigger value="webhook">{t("tab_webhook")}</TabsTrigger>
          <TabsTrigger value="usage">{t("tab_usage")}</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("keys_heading")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("keys_hint")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder={t("key_name_placeholder")}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <Button type="button" onClick={() => void createKey()} disabled={busy || !newName.trim()}>
                  {t("new_key")}
                </Button>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("key_name_placeholder")}</TableHead>
                      <TableHead>{t("col_prefix")}</TableHead>
                      <TableHead>{t("col_status")}</TableHead>
                      <TableHead>{t("last_used")}</TableHead>
                      <TableHead className="text-right">{t("col_actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          —
                        </TableCell>
                      </TableRow>
                    ) : (
                      keys.map((k) => (
                        <TableRow key={k.id}>
                          <TableCell className="font-medium">{k.name}</TableCell>
                          <TableCell className="font-mono text-xs">{k.keyPrefix}</TableCell>
                          <TableCell>{k.revokedAt ? t("revoked") : t("active")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : t("never")}
                          </TableCell>
                          <TableCell className="text-right">
                            {!k.revokedAt ? (
                              <Button type="button" variant="ghost" size="sm" onClick={() => void revokeKey(k.id)}>
                                {t("revoke")}
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("docs_heading")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("docs_list")}</p>
              <p className="text-xs text-muted-foreground">{t("since_hint")}</p>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-xs break-all">
              <p className="font-sans text-sm font-medium">{t("curl_list")}</p>
              <pre className="rounded-md bg-muted p-3 whitespace-pre-wrap">
                {`curl -s "${baseUrl}/api/partner/v1/medias?limit=50" \\\n  -H "Authorization: Bearer YOUR_KEY"`}
              </pre>
              <p className="font-sans text-sm font-medium pt-2">{t("curl_since_title")}</p>
              <pre className="rounded-md bg-muted p-3 whitespace-pre-wrap">
                {`curl -s "${baseUrl}/api/partner/v1/medias?since=2025-01-01T00:00:00.000Z&limit=100" \\\n  -H "Authorization: Bearer YOUR_KEY"`}
              </pre>
              <p className="font-sans text-sm font-medium pt-2">{t("curl_one")}</p>
              <pre className="rounded-md bg-muted p-3 whitespace-pre-wrap">
                {`curl -s "${baseUrl}/api/partner/v1/medias/MEDIA_UUID" \\\n  -H "X-API-Key: YOUR_KEY"`}
              </pre>
              <p className="font-sans text-sm font-medium pt-2">{t("curl_patch_title")}</p>
              <p className="text-xs text-muted-foreground">{t("docs_patch")}</p>
              <pre className="rounded-md bg-muted p-3 whitespace-pre-wrap">
                {`curl -X PATCH "${baseUrl}/api/partner/v1/medias/MEDIA_UUID" \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"price":990000,"mediaName":"Updated name"}'`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("webhook_heading")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("webhook_lead")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("webhook_url")}</label>
                <Input value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://" />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="wh-en"
                  type="checkbox"
                  className="h-4 w-4 rounded border border-input"
                  checked={whEnabled}
                  onChange={(e) => setWhEnabled(e.target.checked)}
                />
                <label htmlFor="wh-en" className="text-sm">
                  {t("webhook_enabled")}
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void saveWebhook()} disabled={busy || !whUrl.trim()}>
                  {t("webhook_save")}
                </Button>
                {webhook ? (
                  <Button type="button" variant="outline" onClick={() => void removeWebhook()}>
                    {t("webhook_remove")}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-muted-foreground">{t("usage_days")}</label>
            <Input
              type="number"
              min={1}
              max={90}
              className="w-24"
              value={days}
              onChange={(e) => setDays(Math.min(90, Math.max(1, Number(e.target.value) || 14)))}
            />
          </div>
          {loading && !usage ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : (
            <>
              <p className="text-sm">
                {t("total_requests")}:{" "}
                <span className="font-semibold tabular-nums">{usage?.summary?.totalRequests ?? 0}</span>
              </p>
              {daily.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("empty_usage")}</p>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis width={32} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name={t("chart_daily")} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("table_paths")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("col_path")}</TableHead>
                        <TableHead className="text-right">{t("col_count")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPaths.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-muted-foreground">
                            —
                          </TableCell>
                        </TableRow>
                      ) : (
                        topPaths.map((r) => (
                          <TableRow key={r.path}>
                            <TableCell className="font-mono text-xs">{r.path}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!secretDialog} onOpenChange={(o) => !o && setSecretDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("secret_title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("secret_warn")}</p>
          <pre className="break-all rounded-md bg-muted p-3 text-xs font-mono">{secretDialog}</pre>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => secretDialog && void copyText(secretDialog)}>
              <Copy className="mr-2 h-4 w-4" />
              {t("copy")}
            </Button>
            <Button type="button" onClick={() => setSecretDialog(null)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
