import type { Metadata } from "next";
import { gateAdminDashboard } from "@/lib/auth/dashboard-gate";
import { MediaWizard } from "@/components/admin/medias/MediaWizard";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "New Media | Admin | XtheX",
  robots: { index: false, follow: false },
};

export default async function AdminNewMediaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await gateAdminDashboard();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <MediaWizard locale={locale} />
    </div>
  );
}
