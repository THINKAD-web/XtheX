import { auth } from "@clerk/nextjs/server";
import { findUserByClerkId } from "@/lib/auth/find-user-by-clerk";
import { getTranslations } from "next-intl/server";
import { AdminAiUploadPageInner } from "@/components/admin/ai-upload/AdminAiUploadPageInner";
import { AdminAiUploadGatePage } from "@/components/admin/ai-upload/AdminAiUploadGatePage";

export default async function AdminAiUploadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ta = await getTranslations("admin.aiUpload");
  const { userId } = await auth();

  if (!userId) {
    return <AdminAiUploadGatePage message={ta("signIn")} />;
  }

  const dbUser = await findUserByClerkId(userId);
  if (!dbUser) {
    return <AdminAiUploadGatePage message={ta("userNotFound")} />;
  }

  const llmConfigured = Boolean(
    process.env.XAI_API_KEY?.trim() ||
      process.env.GROK_API_KEY?.trim() ||
      process.env.GROQ_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim(),
  );
  const forceMock = process.env.AI_EXTRACT_MOCK === "1";

  return (
    <AdminAiUploadPageInner
      locale={locale}
      llmConfigured={llmConfigured}
      forceMock={forceMock}
      messages={{
        back: ta("back"),
        mock_no_key_title: ta("mock_no_key_title"),
        mock_env_title: ta("mock_env_title"),
        mock_no_key_body: ta("mock_no_key_body"),
        card_title: ta("card_title"),
        card_desc_live: ta("card_desc_live"),
        card_desc_mock: ta("card_desc_mock"),
      }}
    />
  );
}
