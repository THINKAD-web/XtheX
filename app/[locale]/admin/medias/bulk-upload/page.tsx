import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { gateAdminDashboard } from "@/lib/auth/dashboard-gate";
import { BulkUploadClient } from "@/components/admin/BulkUploadClient";

export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Bulk Upload Media Photos | XtheX Admin",
  robots: { index: false, follow: false },
};

export default async function BulkUploadPage() {
  await gateAdminDashboard();

  const medias = await prisma.media.findMany({
    orderBy: { mediaName: "asc" },
    select: { id: true, mediaName: true },
  });

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8">
      <BulkUploadClient medias={medias} />
    </div>
  );
}
