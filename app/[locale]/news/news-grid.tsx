"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { landing } from "@/lib/landing-theme";
import { Newspaper, ArrowRight } from "lucide-react";

type Article = {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  category: string;
  coverImage: string | null;
  imageUrl: string | null;
  source: string | null;
  link: string | null;
  pubDate: string | null;
  createdAt: string;
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

type Props = {
  articles: Article[];
  categoryLabels: Record<string, string>;
  categories: string[];
  allLabel: string;
  noArticlesTitle: string;
  noArticlesDesc: string;
  readMoreLabel: string;
};

export function NewsGrid({
  articles,
  categoryLabels,
  categories,
  allLabel,
  noArticlesTitle,
  noArticlesDesc,
  readMoreLabel,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? articles.filter((a) => a.category === activeCategory)
    : articles;

  return (
    <>
      {/* Category filter tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === null
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {allLabel}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {categoryLabels[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Grid or Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Newspaper className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {noArticlesTitle}
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            {noArticlesDesc}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => {
            const image = article.coverImage || article.imageUrl;
            const displayDate = article.pubDate || article.createdAt;
            const isExternal = !article.slug && article.link;

            const cardContent = (
              <>
                {image ? (
                  <div className="-mx-6 -mt-6 mb-4 aspect-[16/9] overflow-hidden">
                    <img
                      src={image}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="-mx-6 -mt-6 mb-4 flex aspect-[16/9] items-center justify-center bg-muted/60">
                    <Newspaper className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}

                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      CATEGORY_BADGE[article.category] ??
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {categoryLabels[article.category] ?? article.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(displayDate).toLocaleDateString()}
                  </span>
                  {article.source && (
                    <span className="text-xs text-muted-foreground">
                      · {article.source}
                    </span>
                  )}
                </div>

                <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground group-hover:text-blue-500 dark:group-hover:text-blue-400">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {article.excerpt}
                  </p>
                )}

                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                  {readMoreLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </>
            );

            if (isExternal) {
              return (
                <a
                  key={article.id}
                  href={article.link!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${landing.card} group flex flex-col overflow-hidden`}
                >
                  {cardContent}
                </a>
              );
            }

            return (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className={`${landing.card} group flex flex-col overflow-hidden`}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
