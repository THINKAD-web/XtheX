import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import {
  getPostBySlug,
  getAllPosts,
  getRelatedPosts,
  renderMarkdown,
} from "@/lib/blog";
import { landing } from "@/lib/landing-theme";
import { ArrowLeft, Calendar, Clock, Tag, User } from "lucide-react";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  const { title, excerpt, coverImage } = post.frontmatter;
  const ogImages = coverImage
    ? [{ url: coverImage, width: 1200, height: 630, alt: title }]
    : [{ url: "/og-image.png", width: 1200, height: 630, alt: "XtheX Blog" }];
  return {
    title: `${title} — XtheX Blog`,
    description: excerpt,
    openGraph: {
      title,
      description: excerpt,
      url: `/${locale}/blog/${slug}`,
      siteName: "XtheX",
      images: ogImages,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: excerpt,
      images: ogImages.map((i) => i.url),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const isKo = locale === "ko";
  const html = await renderMarkdown(post.content);
  const related = getRelatedPosts(slug, locale);

  return (
    <AppSiteChrome>
      <article className="py-12 sm:py-16 lg:py-20">
        <div className={`${landing.container} max-w-3xl`}>
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {isKo ? "블로그 목록" : "Back to blog"}
          </Link>

          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                <Tag className="mr-1 h-3 w-3" />
                {post.frontmatter.category}
              </span>
              {post.frontmatter.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
              {post.frontmatter.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.frontmatter.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.frontmatter.date).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readingTime}
              </span>
            </div>
          </header>

          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border py-12 sm:py-16">
          <div className={landing.container}>
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
              {isKo ? "관련 글" : "Related Posts"}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rp) => (
                <Link
                  key={rp.frontmatter.slug}
                  href={`/blog/${rp.frontmatter.slug}`}
                  className={`${landing.card} group flex flex-col !p-5`}
                >
                  <span className="mb-2 inline-flex w-fit items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {rp.frontmatter.category}
                  </span>
                  <h3 className="mb-2 text-base font-semibold text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {rp.frontmatter.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {rp.frontmatter.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </AppSiteChrome>
  );
}
