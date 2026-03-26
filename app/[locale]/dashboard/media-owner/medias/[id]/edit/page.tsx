import { notFound } from "next/navigation";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { prisma } from "@/lib/prisma";
import { landing } from "@/lib/landing-theme";
import { MediaOwnerEditForm } from "@/components/dashboard/media-owner-edit-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function strFromJson(loc: unknown, key: string): string {
  if (!loc || typeof loc !== "object") return "";
  const o = loc as Record<string, unknown>;
  const v = o[key];
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function numFromJson(exposure: unknown, key: string): string {
  if (!exposure || typeof exposure !== "object") return "";
  const o = exposure as Record<string, unknown>;
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim()) return v;
  return "";
}

function toDateInputValue(d: Date | null): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function MediaOwnerMediaEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const user = await gateMediaOwnerDashboard();
  const { id } = await params;

  const media = await prisma.media.findFirst({
    where: { id, createdById: user.id },
    select: {
      id: true,
      mediaName: true,
      description: true,
      locationJson: true,
      exposureJson: true,
      price: true,
      availabilityStart: true,
      availabilityEnd: true,
      images: true,
    },
  });
  if (!media) notFound();

  const loc = media.locationJson;
  const initial = {
    id: media.id,
    mediaName: media.mediaName,
    mediaType: strFromJson(loc, "form_type") || "BILLBOARD",
    address: strFromJson(loc, "address"),
    lat: strFromJson(loc, "lat"),
    lng: strFromJson(loc, "lng"),
    dailyImpressions: numFromJson(media.exposureJson, "daily_impressions"),
    weeklyPrice: media.price != null ? String(media.price) : "",
    description: media.description ?? "",
    availabilityStart: toDateInputValue(media.availabilityStart),
    availabilityEnd: toDateInputValue(media.availabilityEnd),
    images: media.images ?? [],
  };

  return (
    <main className={`${landing.container} py-10 lg:py-14`}>
      <MediaOwnerEditForm
        backHref="/dashboard/media-owner/medias"
        title="미디어 수정"
        subtitle="등록된 미디어 정보를 최신 상태로 유지하세요."
        initial={initial}
      />
    </main>
  );
}

