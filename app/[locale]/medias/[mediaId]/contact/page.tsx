import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { submitInquiry } from "./actions";

type PageProps = {
  params: Promise<{ locale: string; mediaId: string }>;
};

export default async function MediaContactPage({ params }: PageProps) {
  const { locale, mediaId } = await params;
  const t = await getTranslations("contact");

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: {
      id: true,
      mediaName: true,
      category: true,
      locationJson: true,
    },
  });

  if (!media) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-24 text-zinc-50">
        <div className="mx-auto max-w-xl">
          <p className="text-sm text-zinc-400">
            {t("not_found", { defaultValue: "The media could not be found." })}
          </p>
          <Link
            href={`/${locale}/explore`}
            className="mt-4 inline-flex text-sm text-orange-400 hover:underline"
          >
            {t("back_to_map", { defaultValue: "Back to map" })}
          </Link>
        </div>
      </div>
    );
  }

  const loc = (media.locationJson ?? {}) as any;
  const isKo = locale === "ko";

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-24 text-zinc-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="space-y-2">
          <Link
            href={`/${locale}/medias/${media.id}`}
            className="text-xs text-zinc-400 hover:text-orange-400"
          >
            ← {isKo ? "매체 상세로 돌아가기" : "Back to media detail"}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isKo ? "이 매체로 문의하기" : "Contact about this media"}
          </h1>
          <p className="text-sm text-zinc-400">
            {media.mediaName}
            {loc.address ? ` · ${loc.address}` : ""}
          </p>
        </header>

        <form
          action={submitInquiry}
          className="space-y-4 rounded-2xl bg-zinc-900/80 p-6 ring-1 ring-zinc-800"
        >
          <input type="hidden" name="mediaId" value={media.id} />
          <input type="hidden" name="locale" value={locale} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">
                {isKo ? "이름" : "Name"}
              </label>
              <input
                name="name"
                required
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none ring-offset-zinc-950 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                placeholder={isKo ? "홍길동" : "Your name"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">
                {isKo ? "이메일" : "Email"}
              </label>
              <input
                name="email"
                type="email"
                required
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none ring-offset-zinc-950 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                placeholder={isKo ? "you@example.com" : "you@example.com"}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">
                {isKo ? "회사 / 브랜드" : "Company / Brand"}
              </label>
              <input
                name="company"
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none ring-offset-zinc-950 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                placeholder={isKo ? "XtheX Inc." : "Your company or brand"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">
                {isKo ? "예상 예산 (원)" : "Estimated budget (KRW)"}
              </label>
              <input
                name="budget"
                type="number"
                min={0}
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-50 outline-none ring-offset-zinc-950 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                placeholder={isKo ? "예: 20000000" : "e.g. 20000000"}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">
              {isKo ? "문의 내용" : "Message"}
            </label>
            <textarea
              name="message"
              required
              rows={5}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none ring-offset-zinc-950 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
              placeholder={
                isKo
                  ? "캠페인 목적, 기간, 타깃, 참고하실 추가 정보를 자유롭게 적어주세요."
                  : "Share your campaign goals, timelines, target, and any additional context."
              }
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-zinc-500">
              {isKo
                ? "아직 실제 메일 발송은 되지 않고, 관리자 콘솔에서만 확인할 수 있는 테스트용 문의입니다."
                : "This is a test inquiry stored only in the admin console; no real emails are sent."}
            </p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
            >
              {isKo ? "문의 보내기" : "Send inquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

