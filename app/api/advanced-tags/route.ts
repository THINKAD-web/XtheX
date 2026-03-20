import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const loadTags = unstable_cache(
  async () =>
    prisma.tag.findMany({
      include: { category: true },
      orderBy: [{ category: { order: "asc" } }, { ko: "asc" }],
    }),
  ["xthex-advanced-tags-raw-v1"],
  { revalidate: 300 },
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  const tags = await loadTags();

  const filtered =
    q.length === 0
      ? tags
      : tags.filter((t) =>
          [t.ko, t.en, (t as { ja?: string }).ja, ...(t.aliases ?? [])]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(q)),
        );

  return NextResponse.json(
    filtered.map((t) => ({
      code: t.code,
      labelKo: t.ko,
      labelEn: t.en,
      labelJa: (t as { ja?: string | null }).ja ?? null,
      categoryKo: t.category.ko,
      categoryEn: t.category.en,
      categoryJa: (t.category as { ja?: string | null }).ja ?? null,
    })),
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    },
  );
}
