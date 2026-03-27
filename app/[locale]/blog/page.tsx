import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { getAllPosts } from "@/lib/blog";
import { landing } from "@/lib/landing-theme";
import { Calendar, Clock, Tag } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  const title = isKo
    ? "블로그 — XtheX 옥외광고 인사이트"
    : "Blog — XtheX OOH Advertising Insights";
  const description = isKo
    ? "옥외광고 트렌드, 가이드, 성공 사례를 만나보세요."
    : "Discover OOH advertising trends, guides, and success stories.";
  return {
    title,
    description,
    openGraph: { title, description, url: `/${locale}/blog`, siteName: "XtheX" },
  };
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isKo = locale === "ko";
  const posts = getAllPosts();

  return (
    <AppSiteChrome>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className={landing.container}>
          <div className="mb-12 text-center">
            <h1 className={landing.h2}>
              {isKo ? "블로그" : "Blog"}
            </h1>
            <p className={landing.lead}>
              {isKo
                ? "옥외광고 트렌드, 전략 가이드, 글로벌 인사이트"
                : "OOH advertising trends, strategy guides, and global insights"}
            </p>
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground">
              {isKo ? "아직 게시된 글이 없습니다." : "No posts yet."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {posts.map((post) => (
                <Link
                  key={post.frontmatter.slug}
                  href={`/blog/${post.frontmatter.slug}`}
                  className={`${landing.card} group flex flex-col overflow-hidden !p-0`}
                >
                  <div className="aspect-[16/9] w-full bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-zinc-900/30 dark:from-blue-950/40 dark:via-zinc-900/30 dark:to-zinc-950/50" />

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        <Tag className="mr-1 h-3 w-3" />
                        {post.frontmatter.category}
                      </span>
                      <span className="text-xs uppercase text-muted-foreground">
                        {post.frontmatter.locale}
                      </span>
                    </div>

                    <h2 className="mb-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {post.frontmatter.title}
                    </h2>

                    <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {post.frontmatter.excerpt}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.frontmatter.date).toLocaleDateString(
                          locale,
                          { year: "numeric", month: "short", day: "numeric" },
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readingTime}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppSiteChrome>
  );
}
