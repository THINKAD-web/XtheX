import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function dateLocale(locale: string) {
  if (locale === "ko") return "ko-KR";
  if (locale === "ja") return "ja-JP";
  if (locale === "zh") return "zh-CN";
  if (locale === "es") return "es-ES";
  return "en-US";
}

export const metadata: Metadata = {
  title: "Admin Inquiries | XtheX",
  description: "Monitor inquiry lifecycle and advertiser-media interactions.",
  robots: { index: false, follow: false },
};

function statusBadge(status: string) {
  if (status === "REPLIED") return "bg-emerald-600/10 text-emerald-800";
  if (status === "CLOSED") return "bg-zinc-600/10 text-zinc-800";
  return "bg-amber-500/10 text-amber-900";
}

export default async function AdminInquiriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const ti = await getTranslations("admin.inquiries");
  const user = await getCurrentUser();
  const dl = dateLocale(locale);

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-6xl rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-700">{t("common.signIn")}</p>
        </div>
      </div>
    );
  }

  if (user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-6xl rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-700">{t("common.adminOnly")}</p>
        </div>
      </div>
    );
  }

  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const order = typeof sp.order === "string" ? sp.order : "createdDesc";
  const status = typeof sp.status === "string" ? sp.status : "ALL";

  const inquiries = await prisma.inquiry.findMany({
    where: {
      ...(status !== "ALL" ? { status: status as any } : {}),
      ...(q
        ? {
            OR: [
              { message: { contains: q, mode: "insensitive" } },
              { contactEmail: { contains: q, mode: "insensitive" } },
              { contactPhone: { contains: q, mode: "insensitive" } },
              { advertiser: { email: { contains: q, mode: "insensitive" } } },
              { media: { mediaName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy:
      order === "budgetDesc"
        ? [{ budget: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    take: 100,
    include: {
      media: {
        select: {
          id: true,
          mediaName: true,
        },
      },
      advertiser: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-6">
          <div>
            <h1 className="text-2xl font-semibold">{ti("title")}</h1>
            <p className="mt-1 text-sm text-zinc-600">{ti("subtitle")}</p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <form method="get" className="flex items-center gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder={ti("searchPlaceholder")}
                className="h-8 rounded-md border border-zinc-300 px-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
              />
              <select
                name="order"
                defaultValue={order}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 focus:border-zinc-500 focus:outline-none"
              >
                <option value="createdDesc">{ti("orderCreated")}</option>
                <option value="budgetDesc">{ti("orderBudget")}</option>
              </select>
              <select
                name="status"
                defaultValue={status}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 focus:border-zinc-500 focus:outline-none"
              >
                <option value="ALL">ALL</option>
                <option value="PENDING">PENDING</option>
                <option value="REPLIED">REPLIED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
              <button
                type="submit"
                className="inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800"
              >
                {t("common.apply")}
              </button>
            </form>
            <Link
              href={`/${locale}/admin`}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              {t("common.adminHome")}
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ti("col_media")}</TableHead>
                <TableHead>{ti("col_contact")}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{ti("col_budget")}</TableHead>
                <TableHead>{ti("col_message")}</TableHead>
                <TableHead>{ti("col_time")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm">
                    <Link
                      href={`/${locale}/medias/${row.media.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {row.media.mediaName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    <div className="font-medium">{row.advertiser.email}</div>
                    {row.contactEmail && (
                      <div className="text-xs text-zinc-500">{row.contactEmail}</div>
                    )}
                    {row.contactPhone && (
                      <div className="text-xs text-zinc-500">{row.contactPhone}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-medium ${statusBadge(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {row.budget != null
                      ? `${row.budget.toLocaleString(dl)} ${ti("won")}`
                      : t("common.dash")}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-zinc-700">
                    <span className="line-clamp-3">{row.message}</span>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {row.createdAt.toLocaleString(dl)}
                  </TableCell>
                </TableRow>
              ))}
              {inquiries.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-zinc-500"
                  >
                    {ti("empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
