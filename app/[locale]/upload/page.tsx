import { redirect } from "next/navigation";

export const runtime = "nodejs";

/** 매체사 PDF 업로드 — AI 업로드 화면으로 연결 */
export default async function UploadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale === "ko") {
    redirect("/admin/ai-upload");
  }
  redirect(`/${locale}/admin/ai-upload`);
}
