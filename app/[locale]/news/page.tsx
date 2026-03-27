import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { landing } from "@/lib/landing-theme";
import { isDatabaseConfigured } from "@/lib/prisma";
import { Newspaper } from "lucide-react";
import { NewsGrid } from "./news-grid";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("news");
  return {
    title: `${t("title")} | XtheX`,
    description: t("subtitle"),
  };
}

const CATEGORIES = [
  "Industry News",
  "Trend",
  "Case Study",
  "Market Report",
] as const;

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage: string | null;
  source: string | null;
  createdAt: Date;
};

async function fetchNews(locale: string): Promise<NewsRow[]> {
  if (!isDatabaseConfigured()) return [];

  const { getPrisma } = await import("@/lib/prisma");
  const prisma = getPrisma();

  try {
    let articles = await (prisma as any).news.findMany({
      where: { published: true, locale },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        coverImage: true,
        source: true,
        createdAt: true,
      },
    });

    if (articles.length === 0 && locale !== "en") {
      articles = await (prisma as any).news.findMany({
        where: { published: true, locale: "en" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          coverImage: true,
          source: true,
          createdAt: true,
        },
      });
    }

    return articles;
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const locale = await getLocale();
  const t = await getTranslations("news");
  const articles = await fetchNews(locale);

  const categoryLabels: Record<string, string> = {
    "Industry News": t("industry_news"),
    Trend: t("trend"),
    "Case Study": t("case_study"),
    "Market Report": t("market_report"),
  };

  return (
    <AppSiteChrome>
      <main className="min-h-[70vh]">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-muted/40 via-background to-background py-14 lg:py-20">
          <div className={`${landing.container} text-center`}>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
              <Newspaper className="h-7 w-7" />
            </div>
            <h1 className={landing.h1}>{t("title")}</h1>
            <p className={landing.lead}>{t("subtitle")}</p>
          </div>
        </section>

        {/* Content */}
        <section className={`${landing.container} py-12 lg:py-16`}>
          <NewsGrid
            articles={JSON.parse(JSON.stringify(articles))}
            categoryLabels={categoryLabels}
            categories={CATEGORIES as unknown as string[]}
            allLabel={t("all")}
            noArticlesTitle={t("no_articles")}
            noArticlesDesc={t("no_articles_desc")}
            readMoreLabel={t("read_more")}
          />
        </section>
      </main>
    </AppSiteChrome>
  );
}
