import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Heart, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { WishlistButton } from "@/components/medias/WishlistButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Wishlist | XtheX",
  description: "Your saved media wishlist.",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const user = await gateAdvertiserDashboard();
  const locale = await getLocale();
  const isKo = locale === "ko";

  const items = await prisma.wishlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      media: {
        select: {
          id: true,
          mediaName: true,
          category: true,
          description: true,
          price: true,
          sampleImages: true,
          images: true,
          locationJson: true,
          status: true,
        },
      },
    },
  });

  const published = items.filter((w) => w.media.status === "PUBLISHED");

  return (
    <main className={`${landing.container} space-y-8 py-10 lg:py-14`}>
      <section>
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-rose-500" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isKo ? "위시리스트" : "Wishlist"}
          </h1>
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
            {published.length}
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {isKo
            ? "관심 있는 매체를 저장하고 한눈에 비교하세요."
            : "Save media you're interested in and compare them at a glance."}
        </p>
      </section>

      {published.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
          <Heart className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-4 font-medium text-zinc-700 dark:text-zinc-300">
            {isKo ? "아직 저장된 매체가 없습니다." : "No saved media yet."}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isKo
              ? "매체 상세 페이지에서 하트 아이콘을 눌러 추가하세요."
              : "Tap the heart icon on a media detail page to add it."}
          </p>
          <Link
            href="/explore"
            className={`${landing.btnPrimary} mt-6 inline-flex min-w-0`}
          >
            {isKo ? "매체 탐색하기" : "Explore Media"}
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((w) => {
            const loc = (w.media.locationJson ?? {}) as any;
            const imgs = [
              ...(w.media.sampleImages ?? []),
              ...(w.media.images ?? []),
            ];
            const thumb = imgs.find((u: string) =>
              /^https?:\/\//i.test(String(u).trim()),
            );

            return (
              <div
                key={w.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-shadow hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-900/90"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={w.media.mediaName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400">
                      <Heart className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <WishlistButton
                      mediaId={w.media.id}
                      size="sm"
                      className="rounded-full bg-black/40 backdrop-blur-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                    {w.media.category}
                  </p>
                  <Link
                    href={`/medias/${w.media.id}`}
                    className="line-clamp-1 text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {w.media.mediaName}
                  </Link>
                  {w.media.description && (
                    <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {w.media.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
                    <span className="truncate">
                      {loc.address ?? (isKo ? "주소 미등록" : "No address")}
                    </span>
                    {w.media.price != null && (
                      <span className="ml-2 flex-shrink-0 font-medium text-zinc-200">
                        {w.media.price.toLocaleString()}
                        {isKo ? "원" : " KRW"}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/medias/${w.media.id}`}
                  className="flex items-center justify-center gap-1 border-t border-border px-4 py-2.5 text-xs font-medium text-blue-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-sky-400 dark:hover:bg-zinc-800"
                >
                  <ExternalLink className="h-3 w-3" />
                  {isKo ? "상세 보기" : "View Detail"}
                </Link>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
