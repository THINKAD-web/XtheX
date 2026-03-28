import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { CommunityPostDetail } from "@/components/community/CommunityPostDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; postId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "community" });
  return {
    title: `${t("meta_post_suffix")} | XtheX`,
    description: t("meta_description"),
  };
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return (
    <AppSiteChrome mainClassName="pb-16">
      <CommunityPostDetail postId={postId} />
    </AppSiteChrome>
  );
}
