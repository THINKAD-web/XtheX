"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import type { AdminMediaListRowSerialized } from "@/lib/admin/format-admin-media-list-row";
import type { AdminMediasReviewFilter } from "@/lib/admin/admin-medias-list-query";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  rows: AdminMediaListRowSerialized[];
  filter: AdminMediasReviewFilter;
  page: number;
  pageSize: number;
  total: number;
  q: string;
};

function formatKrw(n: number | null, dash: string) {
  if (n == null) return dash;
  return new Intl.NumberFormat("ko-KR").format(n);
}

function listHref(filter: AdminMediasReviewFilter, pageNum: number, query: string) {
  const params = new URLSearchParams();
  params.set("review", filter);
  if (pageNum > 1) params.set("page", String(pageNum));
  const t = query.trim();
  if (t) params.set("q", t);
  return `/admin/medias?${params.toString()}`;
}

function shortCategoryLabel(full: string) {
  const first = full.split(/[\s·]/)[0] ?? full;
  return first.length > 5 ? `${first.slice(0, 5)}…` : first;
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string | null;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-14 text-center dark:border-zinc-600 dark:bg-zinc-900/30">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function AdminMediasList({ rows, filter, page, pageSize, total, q }: Props) {
  const t = useTranslations("admin.mediaList");
  const tc = useTranslations("admin.mediaReview.category");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const dl = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";

  const [input, setInput] = React.useState(q);
  const prevQRef = React.useRef(q);
  React.useEffect(() => {
    if (q !== prevQRef.current) {
      prevQRef.current = q;
      setInput(q);
    }
  }, [q]);

  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      if (input.trim() === q.trim()) return;
      const params = new URLSearchParams();
      params.set("review", filter);
      params.set("page", "1");
      const trimmed = input.trim();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input, filter, pathname, q, router]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const qTrim = q.trim();

  const goReview = React.useCallback(
    (id: string) => {
      router.push(`/admin/review/${id}`);
    },
    [router],
  );

  const emptyContent = React.useMemo(() => {
    if (rows.length > 0) return null;
    if (qTrim) {
      return { title: t("empty_search_title"), description: null as string | null };
    }
    if (filter === "pending") {
      return {
        title: t("empty_pending_title"),
        description: t("empty_pending_desc"),
      };
    }
    return { title: t("empty"), description: null as string | null };
  }, [rows.length, qTrim, filter, t]);

  function statusBadge(status: string) {
    if (status === "PENDING") {
      return (
        <Badge
          variant="outline"
          className="border-amber-500/70 bg-amber-500/10 font-medium text-amber-800 dark:text-amber-200"
        >
          {t("status_pending")}
        </Badge>
      );
    }
    if (status === "PUBLISHED") {
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/70 bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-200"
        >
          {t("status_published")}
        </Badge>
      );
    }
    if (status === "REJECTED") {
      return (
        <Badge
          variant="outline"
          className="border-rose-500/70 bg-rose-500/10 font-medium text-rose-800 dark:text-rose-200"
        >
          {t("status_rejected")}
        </Badge>
      );
    }
    if (status === "DRAFT") {
      return (
        <Badge variant="outline" className="border-zinc-500/60 text-zinc-600 dark:text-zinc-300">
          {t("status_draft")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {status}
      </Badge>
    );
  }

  const filters: { key: AdminMediasReviewFilter; label: string }[] = [
    { key: "all", label: t("filter_all") },
    { key: "pending", label: t("filter_pending") },
    { key: "published", label: t("filter_published") },
    { key: "rejected", label: t("filter_rejected") },
  ];

  const rowTextClass = (pending: boolean) =>
    cn(
      pending && "font-semibold text-zinc-900 dark:text-zinc-50",
      !pending && "font-medium text-zinc-900 dark:text-zinc-50",
    );

  const secondaryText = (pending: boolean) =>
    cn(
      "text-sm",
      pending ? "font-semibold text-zinc-700 dark:text-zinc-200" : "text-zinc-600 dark:text-zinc-400",
    );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
          </div>
          <p className="text-sm font-medium text-zinc-500">{t("total_count", { count: total })}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map(({ key, label }) => (
            <Link
              key={key}
              href={listHref(key, 1, qTrim)}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                filter === key
                  ? "border-emerald-500/60 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("search_placeholder")}
              autoComplete="off"
              aria-busy={isPending}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white pr-10 pl-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-zinc-400">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : null}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {qTrim || input.trim() ? (
              <Link
                href={listHref(filter, 1, "")}
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                {t("search_reset")}
              </Link>
            ) : null}
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{t("search_hint")}</span>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:block">
          {rows.length === 0 && emptyContent ? (
            <div className="p-4">
              <EmptyState title={emptyContent.title} description={emptyContent.description} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 hover:bg-transparent dark:border-zinc-800">
                  <TableHead className="min-w-[140px] text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("col_name")}
                  </TableHead>
                  <TableHead className="min-w-[100px] text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("col_owner")}
                  </TableHead>
                  <TableHead className="min-w-[160px] text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("col_location")}
                  </TableHead>
                  <TableHead className="min-w-[88px] text-right text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("col_price")}
                  </TableHead>
                  <TableHead className="min-w-[80px] text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("col_status")}
                  </TableHead>
                  <TableHead className="min-w-[108px] text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("col_submitted")}
                  </TableHead>
                  <TableHead className="w-[96px] text-right text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("col_action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => {
                  const pending = m.status === "PENDING";
                  const fullType = tc(m.category);
                  return (
                    <TableRow
                      key={m.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => goReview(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goReview(m.id);
                        }
                      }}
                      className={cn(
                        "group/row cursor-pointer border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/80",
                        pending &&
                          "border-l-[5px] border-l-amber-500 bg-amber-50/70 dark:bg-amber-500/[0.09]",
                      )}
                    >
                      <TableCell className="max-w-[220px] align-middle">
                        <span className={cn("line-clamp-2 text-sm", rowTextClass(pending))}>
                          {m.mediaName}
                        </span>
                        <p className="mt-1 hidden text-[11px] leading-snug text-zinc-400 group-hover/row:block dark:text-zinc-500">
                          <span className="block">
                            등록 {new Date(m.createdAt).toLocaleDateString(dl)}
                          </span>
                          <span className="block">
                            수정 {new Date(m.updatedAt).toLocaleDateString(dl)}
                          </span>
                        </p>
                      </TableCell>
                      <TableCell className={cn("max-w-[140px] align-middle", secondaryText(pending))}>
                        <span className="line-clamp-2">{m.ownerLabel}</span>
                      </TableCell>
                      <TableCell className={cn("max-w-[200px] align-middle", secondaryText(pending))}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="line-clamp-1 min-w-0 flex-1">{m.locationShort}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="shrink-0 rounded-md border border-zinc-300/80 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 outline-none ring-offset-2 hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {shortCategoryLabel(fullType)}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px]">
                              <p className="font-medium">{fullType}</p>
                              {m.subCategory ? (
                                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                                  {m.subCategory}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-zinc-500">{t("tooltip_no_sub")}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "align-middle text-right text-sm tabular-nums text-zinc-800 dark:text-zinc-200",
                          pending && "font-semibold",
                        )}
                      >
                        {formatKrw(m.priceKrw, t("dash"))}
                      </TableCell>
                      <TableCell className="align-middle">{statusBadge(m.status)}</TableCell>
                      <TableCell
                        className={cn(
                          "whitespace-nowrap align-middle text-xs tabular-nums text-zinc-600 dark:text-zinc-400",
                          pending && "font-semibold text-zinc-700 dark:text-zinc-300",
                        )}
                      >
                        {m.submittedDisplayShort ?? t("dash")}
                      </TableCell>
                      <TableCell className="text-right align-middle" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/review/${m.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-emerald-600/45 bg-white px-3 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 dark:border-emerald-700/50 dark:bg-zinc-950 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        >
                          {t("action_review")}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Mobile */}
        <ul className="grid gap-3 lg:hidden">
          {rows.length === 0 && emptyContent ? (
            <li>
              <EmptyState title={emptyContent.title} description={emptyContent.description} />
            </li>
          ) : (
            rows.map((m) => {
              const pending = m.status === "PENDING";
              const fullType = tc(m.category);
              return (
                <li
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => goReview(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goReview(m.id);
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:active:bg-zinc-900",
                    pending &&
                      "border-l-[5px] border-l-amber-500 bg-amber-50/60 dark:bg-amber-500/[0.1]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn("text-base", rowTextClass(pending))}>{m.mediaName}</p>
                      <p className={cn("mt-1 text-xs", secondaryText(pending))}>{m.ownerLabel}</p>
                    </div>
                    {statusBadge(m.status)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <span className={cn(pending && "font-semibold")}>{m.locationShort}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="rounded-md border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {shortCategoryLabel(fullType)}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[240px]">
                        <p className="font-medium">{fullType}</p>
                        {m.subCategory ? (
                          <p className="mt-1 text-xs">{m.subCategory}</p>
                        ) : (
                          <p className="mt-1 text-xs text-zinc-500">{t("tooltip_no_sub")}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-medium text-zinc-500">{t("col_price")}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-sm tabular-nums text-zinc-900 dark:text-zinc-100",
                          pending && "font-semibold",
                        )}
                      >
                        {formatKrw(m.priceKrw, t("dash"))}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-500">{t("col_submitted")}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-sm tabular-nums text-zinc-700 dark:text-zinc-200",
                          pending && "font-semibold",
                        )}
                      >
                        {m.submittedDisplayShort ?? t("dash")}
                      </p>
                    </div>
                  </div>
                  <details
                    className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <summary className="cursor-pointer select-none font-medium text-zinc-500 dark:text-zinc-400">
                      {t("dates_toggle")}
                    </summary>
                    <p className="mt-1 pl-0.5">
                      등록 {new Date(m.createdAt).toLocaleDateString(dl)} · 수정{" "}
                      {new Date(m.updatedAt).toLocaleDateString(dl)}
                    </p>
                  </details>
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/review/${m.id}`}
                      className="flex h-10 w-full items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white shadow hover:bg-emerald-500"
                    >
                      {t("action_review")}
                    </Link>
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {totalPages > 1 ? (
          <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("page_indicator", { page, totalPages })}</span>
            <div className="flex flex-wrap gap-2">
              {page <= 1 ? (
                <span className="inline-flex h-9 cursor-not-allowed items-center rounded-md border border-zinc-200 px-3 text-zinc-400 dark:border-zinc-700">
                  {t("prev")}
                </span>
              ) : (
                <Link
                  href={listHref(filter, page - 1, qTrim)}
                  className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  {t("prev")}
                </Link>
              )}
              {page >= totalPages ? (
                <span className="inline-flex h-9 cursor-not-allowed items-center rounded-md border border-zinc-200 px-3 text-zinc-400 dark:border-zinc-700">
                  {t("next")}
                </span>
              ) : (
                <Link
                  href={listHref(filter, page + 1, qTrim)}
                  className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  {t("next")}
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
