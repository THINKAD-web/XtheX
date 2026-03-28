"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NotificationType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Star, StarOff, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { NOTIFICATION_CATEGORIES } from "@/lib/notifications/prefs-shared";

type Row = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  starred: boolean;
  createdAt: string;
};

const TYPE_ORDER: NotificationType[] = [...NOTIFICATION_CATEGORIES];

const CATEGORY_TKEY: Record<
  NotificationType,
  | "cat_inquiry"
  | "cat_media_approved"
  | "cat_media_rejected"
  | "cat_campaign"
  | "cat_system"
> = {
  INQUIRY_RECEIVED: "cat_inquiry",
  MEDIA_APPROVED: "cat_media_approved",
  MEDIA_REJECTED: "cat_media_rejected",
  CAMPAIGN_UPDATE: "cat_campaign",
  SYSTEM: "cat_system",
};

function NotificationHref({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function NotificationHistoryClient() {
  const t = useTranslations("notificationHistory");
  const tPrefs = useTranslations("notificationsPrefs");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");
  const [starredFilter, setStarredFilter] = useState<"all" | "1" | "0">("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (category !== "all") p.set("type", category);
    p.set("read", readFilter);
    p.set("starred", starredFilter);
    p.set("take", "50");
    return p.toString();
  }, [from, to, category, readFilter, starredFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications/history?${queryString}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setError(t("load_error"));
        setRows([]);
        setTotal(0);
        return;
      }
      const data = (await res.json()) as {
        notifications: Row[];
        total: number;
      };
      setRows(data.notifications ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError(t("load_error"));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [queryString, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchRow = async (
    id: string,
    patch: { read?: boolean; starred?: boolean },
  ) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { notification: Row | null };
      if (data.notification) {
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...data.notification } : r)),
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setBusyId("__all__");
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (res.ok) void load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-2">
            <Label htmlFor="nh-from">{t("filter_from")}</Label>
            <Input
              id="nh-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nh-to">{t("filter_to")}</Label>
            <Input
              id="nh-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("filter_category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter_category_all")}</SelectItem>
                {TYPE_ORDER.map((ty) => (
                  <SelectItem key={ty} value={ty}>
                    {tPrefs(CATEGORY_TKEY[ty])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("filter_read_label")}</Label>
            <Select
              value={readFilter}
              onValueChange={(v) => setReadFilter(v as typeof readFilter)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter_read_all")}</SelectItem>
                <SelectItem value="read">{t("filter_read_read")}</SelectItem>
                <SelectItem value="unread">{t("filter_read_unread")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("filter_starred_label")}</Label>
            <Select
              value={starredFilter}
              onValueChange={(v) => setStarredFilter(v as typeof starredFilter)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter_starred_all")}</SelectItem>
                <SelectItem value="1">{t("filter_starred_only")}</SelectItem>
                <SelectItem value="0">{t("filter_starred_off")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void load()}
              disabled={loading}
            >
              {t("refresh")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void markAllRead()}
              disabled={loading || busyId === "__all__"}
            >
              {t("mark_all_read")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm">{t("date_utc_hint")}</p>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-muted-foreground text-sm">
        {t("total_count", { count: total })}
      </p>

      {loading && rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("loading")}</p>
      ) : null}

      {!loading && rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : null}

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>{t("col_date")}</TableHead>
              <TableHead>{t("col_category")}</TableHead>
              <TableHead>{t("col_title")}</TableHead>
              <TableHead className="text-right">{t("col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.id}
                className={cn(!r.read && "bg-muted/40")}
              >
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0"
                    disabled={busyId === r.id}
                    aria-label={
                      r.starred ? t("star_remove_aria") : t("star_add_aria")
                    }
                    onClick={() =>
                      void patchRow(r.id, { starred: !r.starred })
                    }
                  >
                    {r.starred ? (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    ) : (
                      <StarOff className="text-muted-foreground h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(r.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">
                  {tPrefs(CATEGORY_TKEY[r.type])}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-muted-foreground line-clamp-2 text-sm">
                    {r.message}
                  </div>
                  {r.link ? (
                    <Link
                      href={r.link}
                      className="text-primary mt-1 inline-block text-sm hover:underline"
                    >
                      {t("open_link")}
                    </Link>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {r.read ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void patchRow(r.id, { read: false })}
                      >
                        <Circle className="mr-1 h-3.5 w-3.5" />
                        {t("mark_unread")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void patchRow(r.id, { read: true })}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        {t("mark_read")}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Card
            key={r.id}
            className={cn(
              "border-zinc-200 dark:border-zinc-800",
              !r.read && "bg-muted/40",
            )}
          >
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-muted-foreground text-xs">
                    {new Date(r.createdAt).toLocaleString()} ·{" "}
                    {tPrefs(CATEGORY_TKEY[r.type])}
                  </div>
                  <div className="mt-1 font-medium">{r.title}</div>
                  <p className="text-muted-foreground mt-1 text-sm">{r.message}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0"
                  disabled={busyId === r.id}
                  aria-label={
                    r.starred ? t("star_remove_aria") : t("star_add_aria")
                  }
                  onClick={() => void patchRow(r.id, { starred: !r.starred })}
                >
                  {r.starred ? (
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                  ) : (
                    <StarOff className="text-muted-foreground h-4 w-4" />
                  )}
                </Button>
              </div>
              {r.link ? (
                <NotificationHref
                  href={r.link}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  {t("open_link")}
                </NotificationHref>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {r.read ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => void patchRow(r.id, { read: false })}
                  >
                    {t("mark_unread")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => void patchRow(r.id, { read: true })}
                  >
                    {t("mark_read")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
