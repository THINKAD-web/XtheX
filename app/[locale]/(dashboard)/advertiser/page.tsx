import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

/** Legacy path → canonical role-based dashboard URL. */
export default async function LegacyAdvertiserRedirect({ params }: Props) {
  const { locale } = await params;
  const prefix =
    locale === routing.defaultLocale ? "" : `/${locale}`;
  redirect(`${prefix}/dashboard/advertiser`);
}
