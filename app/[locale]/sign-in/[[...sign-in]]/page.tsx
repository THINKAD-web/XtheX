import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export default async function LegacySignInPage({ params }: Props) {
  const { locale } = await params;
  if (locale === routing.defaultLocale) redirect("/login");
  redirect(`/${locale}/login`);
}
