import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export default async function LegacySignUpPage({ params }: Props) {
  const { locale } = await params;
  if (locale === routing.defaultLocale) redirect("/signup");
  redirect(`/${locale}/signup`);
}
