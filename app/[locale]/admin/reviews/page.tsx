import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ensureAdminUserFromSession } from "@/lib/auth/ensure-admin-from-session";
import { AdminReviewsClient, type AdminReviewRow } from "@/components/admin/AdminReviewsClient";

export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Admin Reviews | XtheX",
  description: "Manage customer reviews and ratings.",
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage() {
  await ensureAdminUserFromSession();

  const reviews = await prisma.mediaReview.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      media: { select: { id: true, mediaName: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const rows: AdminReviewRow[] = reviews.map((r) => ({
    id: r.id,
    mediaName: r.media.mediaName,
    mediaId: r.mediaId,
    userName: r.user.name ?? r.user.email,
    userId: r.userId,
    rating: r.rating,
    content: r.content,
    visible: r.visible,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-100">Review Management</h1>
      <p className="mt-1 text-sm text-zinc-500">
        View, toggle visibility, and delete customer reviews.
      </p>
      <div className="mt-6">
        <AdminReviewsClient rows={rows} />
      </div>
    </div>
  );
}
