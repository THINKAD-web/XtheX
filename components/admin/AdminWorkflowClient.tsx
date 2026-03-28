"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CampaignInvoiceStatus, CampaignWorkflowStage } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Overview = {
  campaigns: Array<{
    id: string;
    title: string | null;
    status: string;
    workflowStage: CampaignWorkflowStage;
    budget_krw: number;
    createdAt: string;
    user: { email: string };
  }>;
  schedules: Array<{
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    notes: string | null;
    campaignTitle: string | null;
    mediaName: string | null;
  }>;
  invoices: Array<{
    id: string;
    amountKrw: number;
    status: CampaignInvoiceStatus;
    dueAt: string;
    paidAt: string | null;
    campaignTitle: string | null;
    userEmail: string;
  }>;
  contracts: Array<{
    id: string;
    status: string;
    agreedBudgetKrw: number | null;
    agreedPeriod: string | null;
    advertiserEmail: string;
    mediaName: string;
    inquiryStatus: string;
  }>;
  mediaBookings: Array<{
    id: string;
    mediaName: string;
    openInquiries: number;
  }>;
  todos: Array<{
    id: string;
    title: string;
    body: string | null;
    done: boolean;
    priority: number;
    dueAt: string | null;
    assigneeEmail: string | null;
    createdByEmail: string;
  }>;
  crmNotes: Array<{
    id: string;
    entityType: string;
    entityId: string;
    body: string;
    createdAt: string;
    authorEmail: string;
  }>;
  revenue: {
    year: number;
    months: Array<{ key: string; label: string; paidKrw: number }>;
    openPipelineKrw: number;
  };
};

const STAGES: CampaignWorkflowStage[] = [
  CampaignWorkflowStage.PROPOSAL,
  CampaignWorkflowStage.CONTRACT,
  CampaignWorkflowStage.LIVE,
  CampaignWorkflowStage.COMPLETED,
];

export function AdminWorkflowClient() {
  const t = useTranslations("admin.workflow");
  const [data, setData] = React.useState<Overview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [month, setMonth] = React.useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const [bTitle, setBTitle] = React.useState("");
  const [bStart, setBStart] = React.useState("");
  const [bEnd, setBEnd] = React.useState("");
  const [crmType, setCrmType] = React.useState("CAMPAIGN");
  const [crmId, setCrmId] = React.useState("");
  const [crmBody, setCrmBody] = React.useState("");
  const [todoTitle, setTodoTitle] = React.useState("");
  const [todoDue, setTodoDue] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/workflow/overview", { credentials: "include" });
      const json = (await res.json()) as Overview & { ok?: boolean; error?: string };
      if (!res.ok) {
        toast.error(t("load_error"), { description: json.error });
        setData(null);
        return;
      }
      setData(json as Overview);
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function patchStage(campaignId: string, workflowStage: CampaignWorkflowStage) {
    const res = await fetch(`/api/admin/campaigns/${campaignId}/workflow-stage`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowStage }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(t("save_error"), { description: j.error });
      return;
    }
    toast.success(t("saved"));
    await load();
  }

  async function addSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!bTitle.trim() || !bStart || !bEnd) return;
    const res = await fetch("/api/admin/workflow/broadcasts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: bTitle.trim(),
        startAt: new Date(bStart).toISOString(),
        endAt: new Date(bEnd).toISOString(),
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(t("save_error"), { description: j.error });
      return;
    }
    toast.success(t("schedule_added"));
    setBTitle("");
    setBStart("");
    setBEnd("");
    await load();
  }

  async function delSchedule(id: string) {
    if (!window.confirm(t("confirm_delete_schedule"))) return;
    const res = await fetch(`/api/admin/workflow/broadcasts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error(t("save_error"));
      return;
    }
    await load();
  }

  async function addCrm(e: React.FormEvent) {
    e.preventDefault();
    if (!crmId.trim() || !crmBody.trim()) return;
    const res = await fetch("/api/admin/workflow/crm-notes", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: crmType,
        entityId: crmId.trim(),
        body: crmBody.trim(),
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(t("save_error"), { description: j.error });
      return;
    }
    toast.success(t("crm_saved"));
    setCrmBody("");
    await load();
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!todoTitle.trim()) return;
    const res = await fetch("/api/admin/workflow/todos", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: todoTitle.trim(),
        dueAt: todoDue ? new Date(todoDue).toISOString() : null,
      }),
    });
    if (!res.ok) {
      toast.error(t("save_error"));
      return;
    }
    toast.success(t("todo_added"));
    setTodoTitle("");
    setTodoDue("");
    await load();
  }

  async function toggleTodo(id: string, done: boolean) {
    const res = await fetch(`/api/admin/workflow/todos/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !done }),
    });
    if (!res.ok) {
      toast.error(t("save_error"));
      return;
    }
    await load();
  }

  async function deleteTodo(id: string) {
    const res = await fetch(`/api/admin/workflow/todos/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error(t("save_error"));
      return;
    }
    await load();
  }

  async function markPaid(id: string) {
    const res = await fetch(`/api/admin/invoices/${id}/mark-paid`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error(t("save_error"));
      return;
    }
    toast.success(t("marked_paid"));
    await load();
  }

  const stageLabel = (s: CampaignWorkflowStage) =>
    t(`stage_${s}` as "stage_PROPOSAL");

  const schedulesInMonth =
    data?.schedules.filter((s) => {
      const d = new Date(s.startAt);
      return d.getFullYear() === month.y && d.getMonth() === month.m;
    }) ?? [];

  const maxRev = Math.max(1, ...(data?.revenue.months.map((m) => m.paidKrw) ?? [1]));

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {t("refresh")}
        </Button>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="pipeline">{t("tab_pipeline")}</TabsTrigger>
          <TabsTrigger value="calendar">{t("tab_calendar")}</TabsTrigger>
          <TabsTrigger value="commercial">{t("tab_commercial")}</TabsTrigger>
          <TabsTrigger value="media">{t("tab_media")}</TabsTrigger>
          <TabsTrigger value="crm">{t("tab_crm")}</TabsTrigger>
          <TabsTrigger value="todos">{t("tab_todos")}</TabsTrigger>
          <TabsTrigger value="revenue">{t("tab_revenue")}</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col_campaign")}</TableHead>
                  <TableHead>{t("col_advertiser")}</TableHead>
                  <TableHead>{t("col_budget")}</TableHead>
                  <TableHead>{t("col_system_status")}</TableHead>
                  <TableHead>{t("col_stage")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.title?.trim() || t("untitled")}
                    </TableCell>
                    <TableCell className="text-xs">{c.user.email}</TableCell>
                    <TableCell>{c.budget_krw.toLocaleString()} KRW</TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell>
                      <Select
                        value={c.workflowStage}
                        onValueChange={(v) =>
                          void patchStage(c.id, v as CampaignWorkflowStage)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {stageLabel(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {data.campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      {t("empty_campaigns")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setMonth((m) => {
                  const nm = m.m - 1;
                  if (nm < 0) return { y: m.y - 1, m: 11 };
                  return { y: m.y, m: nm };
                })
              }
            >
              {t("calendar_prev")}
            </Button>
            <span className="text-sm font-medium">
              {month.y}-{String(month.m + 1).padStart(2, "0")}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setMonth((m) => {
                  const nm = m.m + 1;
                  if (nm > 11) return { y: m.y + 1, m: 0 };
                  return { y: m.y, m: nm };
                })
              }
            >
              {t("calendar_next")}
            </Button>
          </div>

          <form onSubmit={addSchedule} className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">{t("calendar_add_title")}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>{t("schedule_title")}</Label>
                <Input value={bTitle} onChange={(e) => setBTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("schedule_start")}</Label>
                <Input
                  type="datetime-local"
                  value={bStart}
                  onChange={(e) => setBStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("schedule_end")}</Label>
                <Input
                  type="datetime-local"
                  value={bEnd}
                  onChange={(e) => setBEnd(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" size="sm">
              {t("schedule_add")}
            </Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("schedule_title")}</TableHead>
                  <TableHead>{t("schedule_start")}</TableHead>
                  <TableHead>{t("schedule_end")}</TableHead>
                  <TableHead>{t("col_links")}</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedulesInMonth.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell className="text-xs">{s.startAt.slice(0, 16)}</TableCell>
                    <TableCell className="text-xs">{s.endAt.slice(0, 16)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[s.campaignTitle, s.mediaName].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void delSchedule(s.id)}
                      >
                        {t("schedule_delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {schedulesInMonth.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      {t("empty_schedules")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="commercial" className="mt-4 space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t("commercial_invoices")}</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("col_campaign")}</TableHead>
                    <TableHead>{t("col_advertiser")}</TableHead>
                    <TableHead>{t("col_amount")}</TableHead>
                    <TableHead>{t("col_due")}</TableHead>
                    <TableHead>{t("col_status")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.invoices.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.campaignTitle ?? "—"}</TableCell>
                      <TableCell className="text-xs">{i.userEmail}</TableCell>
                      <TableCell>{i.amountKrw.toLocaleString()} KRW</TableCell>
                      <TableCell className="text-xs">{i.dueAt.slice(0, 10)}</TableCell>
                      <TableCell>{i.status}</TableCell>
                      <TableCell>
                        {i.status === CampaignInvoiceStatus.OPEN ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void markPaid(i.id)}
                          >
                            {t("mark_paid")}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        {t("empty_invoices")}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">{t("commercial_contracts")}</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("col_media")}</TableHead>
                    <TableHead>{t("col_advertiser")}</TableHead>
                    <TableHead>{t("col_amount")}</TableHead>
                    <TableHead>{t("col_status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.mediaName}</TableCell>
                      <TableCell className="text-xs">{c.advertiserEmail}</TableCell>
                      <TableCell>
                        {c.agreedBudgetKrw != null
                          ? `${c.agreedBudgetKrw.toLocaleString()} KRW`
                          : "—"}
                      </TableCell>
                      <TableCell>{c.status}</TableCell>
                    </TableRow>
                  ))}
                  {data.contracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        {t("empty_contracts")}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col_media")}</TableHead>
                  <TableHead>{t("col_open_inquiries")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.mediaBookings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.mediaName}</TableCell>
                    <TableCell>{m.openInquiries}</TableCell>
                  </TableRow>
                ))}
                {data.mediaBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      {t("empty_media")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="crm" className="mt-4 space-y-4">
          <form onSubmit={addCrm} className="space-y-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("crm_entity_type")}</Label>
                <Select value={crmType} onValueChange={setCrmType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAMPAIGN">CAMPAIGN</SelectItem>
                    <SelectItem value="INQUIRY">INQUIRY</SelectItem>
                    <SelectItem value="MEDIA">MEDIA</SelectItem>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="INVOICE">INVOICE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("crm_entity_id")}</Label>
                <Input value={crmId} onChange={(e) => setCrmId(e.target.value)} placeholder="UUID" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("crm_body")}</Label>
              <Textarea value={crmBody} onChange={(e) => setCrmBody(e.target.value)} rows={3} />
            </div>
            <Button type="submit" size="sm">
              {t("crm_add")}
            </Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("crm_when")}</TableHead>
                  <TableHead>{t("crm_entity")}</TableHead>
                  <TableHead>{t("crm_author")}</TableHead>
                  <TableHead>{t("crm_body")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.crmNotes.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {n.createdAt.slice(0, 16)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {n.entityType} · {n.entityId.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-xs">{n.authorEmail}</TableCell>
                    <TableCell className="max-w-md text-sm">{n.body}</TableCell>
                  </TableRow>
                ))}
                {data.crmNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      {t("empty_crm")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="todos" className="mt-4 space-y-4">
          <form onSubmit={addTodo} className="flex flex-wrap items-end gap-2 rounded-lg border p-4">
            <div className="space-y-1">
              <Label>{t("todo_title")}</Label>
              <Input value={todoTitle} onChange={(e) => setTodoTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("todo_due")}</Label>
              <Input
                type="datetime-local"
                value={todoDue}
                onChange={(e) => setTodoDue(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm">
              {t("todo_add")}
            </Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t("todo_done")}</TableHead>
                  <TableHead>{t("todo_title")}</TableHead>
                  <TableHead>{t("todo_due")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.todos.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={x.done}
                        onChange={() => void toggleTodo(x.id, x.done)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell className={x.done ? "text-muted-foreground line-through" : ""}>
                      {x.title}
                    </TableCell>
                    <TableCell className="text-xs">{x.dueAt?.slice(0, 16) ?? "—"}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void deleteTodo(x.id)}
                      >
                        {t("todo_delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data.todos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      {t("empty_todos")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("revenue_year", { year: data.revenue.year })}
          </p>
          <p className="text-sm">
            {t("revenue_open_pipeline")}:{" "}
            <strong>{data.revenue.openPipelineKrw.toLocaleString()} KRW</strong>
          </p>
          <div className="flex h-48 items-end gap-1 border-b pb-2">
            {data.revenue.months.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${(m.paidKrw / maxRev) * 100}%`, minHeight: m.paidKrw ? 4 : 0 }}
                  title={`${m.paidKrw.toLocaleString()} KRW`}
                />
                <span className="text-[10px] text-muted-foreground">{m.key.slice(5)}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
