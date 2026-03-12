"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ProposalForm } from "@/components/partner/proposal-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";

type ProposalRow = {
  id: string;
  title: string;
  mediaType: string;
  status: string;
  priceMin: number | null;
  priceMax: number | null;
  createdAt: string;
};

type Props = {
  initialProposals: ProposalRow[];
};

export function PartnerDashboardClient({ initialProposals }: Props) {
  const t = useTranslations("dashboard.partner");
  const [proposals, setProposals] = React.useState<ProposalRow[]>(initialProposals);
  const [toast, setToast] = React.useState<string | null>(null);

  function handleCreated(id: string, values: { title: string; mediaType: string }) {
    const optimistic: ProposalRow = {
      id,
      title: values.title,
      mediaType: values.mediaType,
      status: "PENDING",
      priceMin: null,
      priceMax: null,
      createdAt: new Date().toISOString(),
    };
    setProposals((prev) => [optimistic, ...prev]);
    setToast(t("toast_created"));
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="space-y-8">
      <ProposalForm onCreated={handleCreated} />

      {toast ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          {toast}
        </div>
      ) : null}

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
                <TableHead>{t("table_header_type")}</TableHead>
                <TableHead>{t("table_header_status")}</TableHead>
                <TableHead>{t("table_header_price")}</TableHead>
                <TableHead>{t("table_header_created")}</TableHead>
                <TableHead className="text-right">{t("table_header_action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.mediaType}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>
                    {p.priceMin != null && p.priceMax != null
                      ? `${p.priceMin.toLocaleString()} ~ ${p.priceMax.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(p.createdAt).toLocaleString()}
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

