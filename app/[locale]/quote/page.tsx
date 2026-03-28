import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { FileText } from "lucide-react";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { appMainContainerClass } from "@/lib/layout/app-chrome";
import { landing } from "@/lib/landing-theme";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { QuoteFormClient } from "@/components/quote/QuoteFormClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quote Generator | XtheX",
  description: "Get an instant cost estimate for outdoor advertising campaigns.",
};

export default async function QuotePage() {
  const locale = await getLocale();
  const t = await getTranslations("quote");
  const isKo = locale === "ko";

  let medias: { id: string; mediaName: string; category: string; price: number | null }[] = [];

  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.media.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { mediaName: "asc" },
        select: { id: true, mediaName: true, category: true, price: true },
      });
      medias = rows;
    } catch {
      medias = [];
    }
  }

  return (
    <AppSiteChrome mainClassName="min-h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-50">
      <section className="relative overflow-hidden border-b border-zinc-900 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#f97316_0,_transparent_55%)]" />
        </div>
        <div className={`relative ${landing.container} py-12 lg:py-16`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <FileText className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("page_title")}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">{t("page_subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${landing.container} py-10 lg:py-14`}>
        <QuoteFormClient medias={medias} locale={locale} />
      </section>
    </AppSiteChrome>
  );
}
