import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { landing } from "@/lib/landing-theme";
import { Link } from "@/i18n/navigation";
import { isDatabaseConfigured } from "@/lib/prisma";
import { ArrowLeft, ExternalLink, Calendar } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

const CATEGORY_BADGE: Record<string, string> = {
  "Industry News":
    "bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Trend:
    "bg-purple-500/15 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  "Case Study":
    "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "Market Report":
    "bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
};

async function getArticle(slug: string, locale: string) {
  if (!isDatabaseConfigured()) return null;

  const { getPrisma } = await import("@/lib/prisma");
  const prisma = getPrisma();

  try {
    let article = await (prisma as any).news.findFirst({
      where: { slug, published: true, locale },
    });

    if (!article && locale !== "en") {
      article = await (prisma as any).news.findFirst({
        where: { slug, published: true, locale: "en" },
      });
    }

    return article;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const article = await getArticle(slug, locale);

  if (!article) {
    return { title: "Not Found | XtheX" };
  }

  return {
    title: `${article.title} | XtheX`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      ...(article.coverImage && { images: [article.coverImage] }),
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("news");

  const article = await getArticle(slug, locale);
  if (!article) notFound();

  if (article.link) {
    redirect(article.link);
  }

  const categoryLabels: Record<string, string> = {
    "Industry News": t("industry_news"),
    Trend: t("trend"),
    "Case Study": t("case_study"),
    "Market Report": t("market_report"),
  };

  return (
    <AppSiteChrome>
      <main className="min-h-[70vh]">
        <article className={`${landing.container} max-w-3xl py-12 lg:py-16`}>
          {/* Back link */}
          <Link
            href="/news"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back_to_list")}
          </Link>

          {/* Category + Date */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                CATEGORY_BADGE[article.category] ??
                "bg-muted text-muted-foreground"
              }`}
            >
              {categoryLabels[article.category] ?? article.category}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            {article.title}
          </h1>

          {/* Cover image */}
          {article.coverImage && (
            <div className="mb-8 overflow-hidden rounded-xl">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400">
            {article.content.split("\n").map((paragraph: string, i: number) =>
              paragraph.trim() ? <p key={i}>{paragraph}</p> : null,
            )}
          </div>

          {/* Source link */}
          {article.source && (
            <div className="mt-10 rounded-lg border border-border bg-muted/40 p-4">
              <span className="text-sm font-medium text-muted-foreground">
                {t("source")}:{" "}
              </span>
              <a
                href={article.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {new URL(article.source).hostname}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Back to list */}
          <div className="mt-12 border-t border-border pt-8">
            <Link
              href="/news"
              className={landing.btnSecondary}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back_to_list")}
            </Link>
          </div>
        </article>
      </main>
    </AppSiteChrome>
  );
}
