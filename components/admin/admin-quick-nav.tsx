import type { ReactNode } from "react";
import Link from "next/link";
import { landing } from "@/lib/landing-theme";

const outline = `${landing.btnSecondary} !min-w-0 shrink-0 px-4 sm:px-5`;
const primary = `${landing.btnPrimary} !min-w-0 shrink-0 px-4 sm:px-5`;

type TAdminHome = (key: string) => string;

export function AdminQuickNav({
  locale,
  t,
}: {
  locale: string;
  t: TAdminHome;
}) {
  const p = `/${locale}`;

  return (
    <div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {t("nav_quick_title")}
      </p>

      <div className="mt-6 flex flex-col gap-6 lg:gap-8">
        <NavGroup label={t("nav_group_admin")}>
          <Link href={`${p}/admin/medias`} className={outline}>
            {t("nav_medias")}
          </Link>
          <Link href={`${p}/admin/ai-upload`} className={primary}>
            {t("nav_aiUpload")}
          </Link>
          <Link href={`${p}/admin/inquiries`} className={outline}>
            {t("nav_inquiries")}
          </Link>
          <Link href={`${p}/admin/reports`} className={outline}>
            {t("nav_reports")}
          </Link>
        </NavGroup>

        <NavGroup label={t("nav_group_platform")}>
          <Link href={`${p}/explore`} className={outline}>
            {t("nav_explore")}
          </Link>
          <Link href={`${p}/compare`} className={outline}>
            {t("nav_compare")}
          </Link>
          <Link href={p} className={outline}>
            {t("nav_landing")}
          </Link>
        </NavGroup>

        <NavGroup label={t("nav_group_dashboard")}>
          <Link href={`${p}/dashboard/partner`} className={outline}>
            {t("nav_partner")}
          </Link>
          <Link href={`${p}/dashboard/performance`} className={outline}>
            {t("nav_performance")}
          </Link>
          <Link href={`${p}/sign-up`} className={outline}>
            {t("nav_signup")}
          </Link>
        </NavGroup>

        <NavGroup label={t("nav_group_site")}>
          <Link href={`${p}/about`} className={outline}>
            {t("nav_about")}
          </Link>
          <Link href={`${p}/contact`} className={outline}>
            {t("nav_contact")}
          </Link>
          <Link href={`${p}/terms`} className={outline}>
            {t("nav_terms")}
          </Link>
          <Link href={`${p}/sign-in`} className={outline}>
            {t("nav_signin")}
          </Link>
        </NavGroup>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-3 lg:gap-4">{children}</div>
    </div>
  );
}
