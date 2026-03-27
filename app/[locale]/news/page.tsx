import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { landing } from "@/lib/landing-theme";
import { isDatabaseConfigured } from "@/lib/prisma";
import { Newspaper } from "lucide-react";
import { NewsGrid } from "./news-grid";

export const revalidate = 300;

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
  slug: string | null;
  title: string;
  excerpt: string | null;
  category: string;
  coverImage: string | null;
  imageUrl: string | null;
  source: string | null;
  link: string | null;
  pubDate: Date | null;
  createdAt: Date;
};

async function fetchNews(locale: string): Promise<NewsRow[]> {
  if (!isDatabaseConfigured()) return [];

  const { getPrisma } = await import("@/lib/prisma");
  const prisma = getPrisma();

  try {
    let articles = await (prisma as any).news.findMany({
      where: { published: true, locale },
      orderBy: [{ pubDate: "desc" }, { createdAt: "desc" }],
      take: 30,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        coverImage: true,
        imageUrl: true,
        source: true,
        link: true,
        pubDate: true,
        createdAt: true,
      },
    });

    if (articles.length === 0 && locale !== "en") {
      articles = await (prisma as any).news.findMany({
        where: { published: true, locale: "en" },
        orderBy: [{ pubDate: "desc" }, { createdAt: "desc" }],
        take: 30,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          coverImage: true,
          imageUrl: true,
          source: true,
          link: true,
          pubDate: true,
          createdAt: true,
        },
      });
    }

    if (articles.length === 0) {
      await fetch(
        `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/cron/fetch-news`,
      ).catch(() => {});
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
          {articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Newspaper className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">뉴스를 불러오는 중...</p>
            </div>
          ) : (
            <NewsGrid
              articles={JSON.parse(JSON.stringify(articles))}
              categoryLabels={categoryLabels}
              categories={CATEGORIES as unknown as string[]}
              allLabel={t("all")}
              noArticlesTitle={t("no_articles")}
              noArticlesDesc={t("no_articles_desc")}
              readMoreLabel={t("read_more")}
            />
          )}
        </section>
      </main>
    </AppSiteChrome>
  );
}
