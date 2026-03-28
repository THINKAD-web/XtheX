import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MediaReviewForm } from "@/components/admin/review/media-review-form";

export default async function AdminReviewPage({
  params,
}: {
  params: Promise<{ locale: string; mediaId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-black p-6">
        <p className="text-zinc-400">로그인이 필요합니다.</p>
      </div>
    );
  }

  if (user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-black p-6">
        <p className="text-zinc-400">관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  const { locale, mediaId } = await params;
  const media = await prisma.media
    .findUnique({
      where: { id: mediaId },
      include: { createdBy: { select: { id: true, email: true, name: true } } },
    })
    .catch((e) => {
      console.error("review 페이지 로드 중 Prisma 오류:", e);
      return null;
    });

  if (!media) {
    console.error(
      "review 페이지 로드 - Media를 찾을 수 없습니다. mediaId:",
      mediaId,
    );
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link
            href={`/${locale}/admin/ai-upload`}
            className="text-sm text-zinc-400 hover:text-orange-400"
          >
            ← AI 업로드
          </Link>
          <Link
            href={`/${locale}/admin/medias`}
            className="text-sm text-zinc-400 hover:text-orange-400"
          >
            미디어 목록
          </Link>
          <Link
            href={`/${locale}/admin`}
            className="text-sm text-zinc-400 hover:text-orange-400"
          >
            Admin
          </Link>
        </div>

        <Card className="mb-6 border-zinc-800 bg-zinc-950 shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-white">
                미디어 검토 · {media.mediaName}
              </CardTitle>
              <p className="mt-1 text-sm text-zinc-400">
                ID: {media.id}
                {media.createdBy && (
                  <> · 등록: {media.createdBy.name ?? media.createdBy.email}</>
                )}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                media.status === "DRAFT"
                  ? "border-amber-500/50 text-amber-400"
                  : media.status === "PUBLISHED"
                    ? "border-emerald-500/50 text-emerald-400"
                    : "border-zinc-600 text-zinc-400"
              }
            >
              {media.status}
            </Badge>
          </CardHeader>
        </Card>

        <MediaReviewForm media={media} locale={locale} mode="admin_review" />
      </div>
    </div>
  );
}
