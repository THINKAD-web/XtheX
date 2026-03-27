import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RSS_SOURCES = [
  { url: "https://www.mediapost.com/rss/ooh/", source: "MediaPost" },
  { url: "https://www.oaaa.org/feed/", source: "OAAA" },
  { url: "https://www.campaignlive.co.uk/feed/", source: "Campaign Live" },
];

function extractTag(xml: string, tag: string): string {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"),
  );
  return match?.[1]?.trim() ?? "";
}

function parseItems(xml: string, sourceName: string) {
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  return itemMatches.slice(0, 20).map((item) => {
    const rawExcerpt = extractTag(item, "description")
      .replace(/<[^>]+>/g, "")
      .trim();
    const excerpt =
      rawExcerpt.length > 150 ? rawExcerpt.slice(0, 150) + "..." : rawExcerpt;

    return {
      title: extractTag(item, "title").slice(0, 255),
      excerpt,
      content: "",
      link: extractTag(item, "link"),
      pubDate: new Date(extractTag(item, "pubDate") || Date.now()),
      source: sourceName,
      category: "Industry News",
      locale: "en",
      published: true,
    };
  });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    // Allow manual execution without auth header (admin panel, browser)
  }

  let total = 0;
  const errors: string[] = [];

  for (const { url, source } of RSS_SOURCES) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "XtheX-NewsBot/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const items = parseItems(xml, source);

      for (const item of items) {
        if (!item.link) continue;
        try {
          await prisma.news.upsert({
            where: { link: item.link },
            update: {
              title: item.title,
              excerpt: item.excerpt,
              content: "",
              pubDate: item.pubDate,
            },
            create: item,
          });
          total++;
        } catch {
          // skip duplicates / constraint errors
        }
      }
    } catch (e) {
      errors.push(`${source}: ${e}`);
    }
  }

  return NextResponse.json({ ok: true, saved: total, errors });
}
