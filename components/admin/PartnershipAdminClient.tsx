"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  PartnershipApplicationStatus,
  PartnershipContractStatus,
  PartnershipType,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ApplicationRow = {
  id: string;
  createdAt: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  website: string | null;
  type: PartnershipType;
  message: string;
  status: PartnershipApplicationStatus;
  adminMemo: string | null;
  reviewedAt: string | null;
};

type ContractRow = {
  id: string;
  createdAt: string;
  applicationId: string | null;
  title: string;
  summary: string | null;
  documentUrl: string | null;
  effectiveDate: string | null;
  endDate: string | null;
  status: PartnershipContractStatus;
  application: {
    id: string;
    companyName: string;
    email: string;
  } | null;
};

function statusAppClass(s: PartnershipApplicationStatus) {
  if (s === "APPROVED") return "bg-emerald-600/15 text-emerald-800 dark:text-emerald-200";
  if (s === "REJECTED") return "bg-red-600/15 text-red-800 dark:text-red-200";
  return "bg-amber-500/15 text-amber-900 dark:text-amber-100";
}

function statusContractClass(s: PartnershipContractStatus) {
  if (s === "ACTIVE") return "bg-emerald-600/15 text-emerald-800 dark:text-emerald-200";
  if (s === "TERMINATED" || s === "EXPIRED") return "bg-zinc-500/15 text-zinc-700 dark:text-zinc-200";
  return "bg-blue-600/15 text-blue-800 dark:text-blue-200";
}

function toInputDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function dateOnlyToIso(dateStr: string): string | null {
  if (!dateStr.trim()) return null;
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function PartnershipAdminClient({ locale }: { locale: string }) {
  const t = useTranslations("admin.partnerships");
  const [applications, setApplications] = React.useState<ApplicationRow[]>([]);
  const [contracts, setContracts] = React.useState<ContractRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<PartnershipApplicationStatus | "ALL">("ALL");

  const [detail, setDetail] = React.useState<ApplicationRow | null>(null);
  const [memo, setMemo] = React.useState("");
  const [reviewBusy, setReviewBusy] = React.useState(false);

  const [contractDialog, setContractDialog] = React.useState<ContractRow | "new" | null>(null);
  const [cTitle, setCTitle] = React.useState("");
  const [cSummary, setCSummary] = React.useState("");
  const [cUrl, setCUrl] = React.useState("");
  const [cAppId, setCAppId] = React.useState<string>("");
  const [cStart, setCStart] = React.useState("");
  const [cEnd, setCEnd] = React.useState("");
  const [cStatus, setCStatus] = React.useState<PartnershipContractStatus>(
    PartnershipContractStatus.DRAFT,
  );
  const [contractBusy, setContractBusy] = React.useState(false);

  const dl =
    locale === "ko"
      ? "ko-KR"
      : locale === "ja"
        ? "ja-JP"
        : locale === "zh"
          ? "zh-CN"
          : locale === "es"
            ? "es-ES"
            : "en-US";

  const loadApplications = React.useCallback(async () => {
    const q = filter === "ALL" ? "" : `?status=${filter}`;
    const aRes = await fetch(`/api/admin/partnership-applications${q}`, { credentials: "include" });
    const aJson = (await aRes.json()) as { ok?: boolean; applications?: ApplicationRow[] };
    if (!aRes.ok || !aJson.ok) throw new Error("apps");
    setApplications(aJson.applications ?? []);
  }, [filter]);

  const loadContracts = React.useCallback(async () => {
    const cRes = await fetch("/api/admin/partnership-contracts", { credentials: "include" });
    const cJson = (await cRes.json()) as { ok?: boolean; contracts?: ContractRow[] };
    if (!cRes.ok || !cJson.ok) throw new Error("contracts");
    setContracts(cJson.contracts ?? []);
  }, []);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadApplications(), loadContracts()]);
    } catch {
      toast.error(t("load_error"));
    } finally {
      setLoading(false);
    }
  }, [loadApplications, loadContracts, t]);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  React.useEffect(() => {
    if (detail) setMemo(detail.adminMemo ?? "");
  }, [detail]);

  const openNewContract = (applicationId?: string) => {
    setContractDialog("new");
    setCTitle("");
    setCSummary("");
    setCUrl("");
    setCAppId(applicationId ?? "");
    setCStart("");
    setCEnd("");
    setCStatus(PartnershipContractStatus.DRAFT);
  };

  const openEditContract = (c: ContractRow) => {
    setContractDialog(c);
    setCTitle(c.title);
    setCSummary(c.summary ?? "");
    setCUrl(c.documentUrl ?? "");
    setCAppId(c.applicationId ?? "");
    setCStart(toInputDate(c.effectiveDate));
    setCEnd(toInputDate(c.endDate));
    setCStatus(c.status);
  };

  const closeContractDialog = () => setContractDialog(null);

  const saveContract = async () => {
    if (!cTitle.trim()) {
      toast.error(t("contract_title_required"));
      return;
    }
    setContractBusy(true);
    try {
      const body = {
        title: cTitle.trim(),
        summary: cSummary.trim() || undefined,
        documentUrl: cUrl.trim() || undefined,
        applicationId: cAppId.trim() || null,
        effectiveDate: dateOnlyToIso(cStart),
        endDate: dateOnlyToIso(cEnd),
        status: cStatus,
      };
      if (contractDialog === "new") {
        const res = await fetch("/api/admin/partnership-contracts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          toast.error(t("save_error"), { description: json.error });
          return;
        }
        toast.success(t("contract_created"));
      } else if (contractDialog) {
        const res = await fetch(`/api/admin/partnership-contracts/${contractDialog.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          toast.error(t("save_error"), { description: json.error });
          return;
        }
        toast.success(t("contract_updated"));
      }
      closeContractDialog();
      await loadContracts();
    } finally {
      setContractBusy(false);
    }
  };

  const deleteContract = async (id: string) => {
    if (!window.confirm(t("confirm_delete_contract"))) return;
    const res = await fetch(`/api/admin/partnership-contracts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error(t("delete_error"));
      return;
    }
    toast.success(t("contract_deleted"));
    closeContractDialog();
    await loadContracts();
  };

  const submitReview = async (status: "APPROVED" | "REJECTED") => {
    if (!detail) return;
    setReviewBusy(true);
    try {
      const res = await fetch(`/api/admin/partnership-applications/${detail.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminMemo: memo.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(t("review_error"), { description: json.error });
        return;
      }
      toast.success(status === "APPROVED" ? t("approved_ok") : t("rejected_ok"));
      setDetail(null);
      await loadApplications();
    } finally {
      setReviewBusy(false);
    }
  };

  const approvedApps = applications.filter((a) => a.status === "APPROVED");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void loadAll()} disabled={loading}>
          {t("refresh")}
        </Button>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList>
          <TabsTrigger value="applications">{t("tab_applications")}</TabsTrigger>
          <TabsTrigger value="contracts">{t("tab_contracts")}</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("filter_status")}</span>
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filter_all")}</SelectItem>
                <SelectItem value={PartnershipApplicationStatus.PENDING}>
                  {t("status_PENDING")}
                </SelectItem>
                <SelectItem value={PartnershipApplicationStatus.APPROVED}>
                  {t("status_APPROVED")}
                </SelectItem>
                <SelectItem value={PartnershipApplicationStatus.REJECTED}>
                  {t("status_REJECTED")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("col_company")}</TableHead>
                    <TableHead>{t("col_email")}</TableHead>
                    <TableHead>{t("col_type")}</TableHead>
                    <TableHead>{t("col_status")}</TableHead>
                    <TableHead>{t("col_date")}</TableHead>
                    <TableHead className="text-right">{t("col_actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        {t("empty_apps")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.companyName}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{t(`types.${row.type}`)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("font-normal", statusAppClass(row.status))}>
                            {t(`status_${row.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(row.createdAt).toLocaleString(dl)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setDetail(row)}>
                            {t("open")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="contracts" className="mt-4 space-y-4">
          <Button type="button" onClick={() => openNewContract()}>
            {t("new_contract")}
          </Button>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("contract_title")}</TableHead>
                    <TableHead>{t("contract_application")}</TableHead>
                    <TableHead>{t("col_status")}</TableHead>
                    <TableHead>{t("col_date")}</TableHead>
                    <TableHead className="text-right">{t("col_actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        {t("empty_contracts")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    contracts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.application ? c.application.companyName : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("font-normal", statusContractClass(c.status))}
                          >
                            {t(`contract_status_${c.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString(dl)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="ghost" size="sm" onClick={() => openEditContract(c)}>
                            {t("edit")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("detail_title")}</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium">{t("col_company")}:</span> {detail.companyName}
              </p>
              <p>
                <span className="font-medium">{t("contact_name")}:</span> {detail.contactName}
              </p>
              <p>
                <span className="font-medium">{t("col_email")}:</span> {detail.email}
              </p>
              {detail.phone ? (
                <p>
                  <span className="font-medium">{t("phone")}:</span> {detail.phone}
                </p>
              ) : null}
              {detail.website ? (
                <p>
                  <span className="font-medium">{t("website")}:</span>{" "}
                  <a href={detail.website} className="text-primary underline" target="_blank" rel="noreferrer">
                    {detail.website}
                  </a>
                </p>
              ) : null}
              <p>
                <span className="font-medium">{t("col_type")}:</span> {t(`types.${detail.type}`)}
              </p>
              <p>
                <span className="font-medium">{t("col_status")}:</span> {t(`status_${detail.status}`)}
              </p>
              <div>
                <p className="font-medium">{t("message")}</p>
                <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-muted-foreground">
                  {detail.message}
                </p>
              </div>
              {detail.status === "PENDING" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("admin_memo")}</label>
                  <Textarea rows={3} value={memo} onChange={(e) => setMemo(e.target.value)} />
                </div>
              ) : (
                detail.adminMemo && (
                  <div>
                    <p className="font-medium">{t("admin_memo")}</p>
                    <p className="mt-1 text-muted-foreground">{detail.adminMemo}</p>
                  </div>
                )
              )}
            </div>
          ) : null}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {detail?.status === "PENDING" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={reviewBusy}
                  onClick={() => void submitReview("REJECTED")}
                >
                  {t("reject")}
                </Button>
                <Button type="button" disabled={reviewBusy} onClick={() => void submitReview("APPROVED")}>
                  {t("approve")}
                </Button>
              </>
            ) : null}
            {detail?.status === "APPROVED" ? (
              <Button type="button" variant="outline" onClick={() => openNewContract(detail.id)}>
                {t("create_contract")}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contractDialog !== null} onOpenChange={(o) => !o && closeContractDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {contractDialog === "new" ? t("new_contract") : t("edit_contract")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("contract_title")}</label>
              <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("contract_application")}</label>
              <Select value={cAppId || "__none__"} onValueChange={(v) => setCAppId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("optional_link")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("none")}</SelectItem>
                  {approvedApps.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.companyName} ({a.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("summary")}</label>
              <Textarea rows={4} value={cSummary} onChange={(e) => setCSummary(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("document_url")}</label>
              <Input value={cUrl} onChange={(e) => setCUrl(e.target.value)} placeholder="https://" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("effective")}</label>
                <Input type="date" value={cStart} onChange={(e) => setCStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("end_date")}</label>
                <Input type="date" value={cEnd} onChange={(e) => setCEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("col_status")}</label>
              <Select
                value={cStatus}
                onValueChange={(v) => setCStatus(v as PartnershipContractStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      PartnershipContractStatus.DRAFT,
                      PartnershipContractStatus.ACTIVE,
                      PartnershipContractStatus.EXPIRED,
                      PartnershipContractStatus.TERMINATED,
                    ] as const
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`contract_status_${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {contractDialog && contractDialog !== "new" ? (
              <Button
                type="button"
                variant="danger"
                className="sm:mr-auto"
                onClick={() => void deleteContract(contractDialog.id)}
              >
                {t("delete")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={closeContractDialog}>
                {t("cancel")}
              </Button>
              <Button type="button" disabled={contractBusy} onClick={() => void saveContract()}>
                {t("save")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
