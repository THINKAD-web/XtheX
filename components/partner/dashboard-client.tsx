"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ProposalForm } from "@/components/partner/proposal-form";
import { SimpleProposalForm } from "@/components/partner/simple-proposal-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";

type ProposalRow = {
  id: string;
  title: string;
  status: string;
  description?: string | null;
  summary?: string | null;
  mediaType?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  createdAt: string;
};

type Props = {
  initialProposals: ProposalRow[];
};

function formatKoreanDate(dateIso: string) {
  const d = new Date(dateIso);
  return d
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
    .replace(/\./g, ". ")
    .trim();
}

export function PartnerDashboardClient({ initialProposals }: Props) {
  const t = useTranslations("dashboard.partner");
  const [proposals, setProposals] = React.useState<ProposalRow[]>(initialProposals);

  function handleCreated(id: string, values: { title: string; mediaType: string }) {
    const optimistic: ProposalRow = {
      id,
      title: values.title,
      status: "PENDING",
      mediaType: values.mediaType,
      priceMin: null,
      priceMax: null,
      createdAt: new Date().toISOString(),
    };
    setProposals((prev) => [optimistic, ...prev]);
  }

  return (
    <div className="space-y-8">
      <SimpleProposalForm onCreated={handleCreated} />

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t("table_title")}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("table_subtitle")}
            </p>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("table_total", { count: proposals.length })}
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table_header_title")}</TableHead>
                <TableHead>{t("table_header_status")}</TableHead>
                <TableHead>{t("table_header_created")}</TableHead>
                <TableHead className="text-right">{t("table_header_action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-md">
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      {p.title}
                    </div>
                    {p.summary ? (
                      <p
                        className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400"
                        title={p.summary}
                      >
                        {p.summary}
                      </p>
                    ) : p.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {p.description}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        p.status === "APPROVED" || p.status === "ANALYZED"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-100"
                          : p.status === "REJECTED"
                            ? "border-red-500 bg-red-50 text-red-800 dark:border-red-500/60 dark:bg-red-950/40 dark:text-red-100"
                            : p.status === "ANALYZING"
                              ? "border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-400/60 dark:bg-sky-950/40 dark:text-sky-100"
                              : "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-400/60 dark:bg-amber-950/40 dark:text-amber-100"
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatKoreanDate(p.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/partner/${p.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-transparent px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      {t("view")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {proposals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    {t("no_proposals")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

