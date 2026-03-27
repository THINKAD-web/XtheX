import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type BlogFrontmatter = {
  title: string;
  slug: string;
  locale: string;
  date: string;
  author: string;
  category: string;
  excerpt: string;
  coverImage: string;
  tags: string[];
};

export type BlogPost = {
  frontmatter: BlogFrontmatter;
  content: string;
  readingTime: string;
};

export function getAllPosts(locale?: string): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const filePath = path.join(BLOG_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const rt = readingTime(content);

    return {
      frontmatter: {
        ...data,
        slug: data.slug ?? filename.replace(/\.mdx$/, ""),
      } as BlogFrontmatter,
      content,
      readingTime: rt.text,
    };
  });

  const filtered = locale
    ? posts.filter((p) => p.frontmatter.locale === locale)
    : posts;

  return filtered.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const rt = readingTime(content);

  return {
    frontmatter: {
      ...data,
      slug: data.slug ?? slug,
    } as BlogFrontmatter,
    content,
    readingTime: rt.text,
  };
}

export async function renderMarkdown(source: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(source);
  return String(result);
}

export function getRelatedPosts(
  currentSlug: string,
  _locale: string,
  limit = 3,
): BlogPost[] {
  const all = getAllPosts();
  return all
    .filter((p) => p.frontmatter.slug !== currentSlug)
    .slice(0, limit);
}
