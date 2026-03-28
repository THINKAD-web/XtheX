"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Bell, Home, Inbox, Map, Menu, Shield, Upload, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSidebarRole } from "./DashboardSidebar";

type Props = {
  role: DashboardSidebarRole;
  onOpenFullMenu: () => void;
};

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (pathname.endsWith(href)) return true;
  if (href !== "/" && pathname.includes(`${href}/`)) return true;
  return false;
}

export function MobileDashboardBottomNav({ role, onOpenFullMenu }: Props) {
  const t = useTranslations("dashboard.mobile");
  const pathname = usePathname() ?? "";

  const items: Array<{
    key: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
  }> =
    role === "MEDIA_OWNER"
      ? [
          { key: "home", href: "/dashboard/media-owner", icon: Home, label: t("nav_home") },
          { key: "upload", href: "/dashboard/media-owner/upload", icon: Upload, label: t("nav_upload") },
          { key: "inbox", href: "/dashboard/media-owner/inquiries", icon: Inbox, label: t("nav_inquiries") },
          { key: "bell", href: "/dashboard/notifications", icon: Bell, label: t("nav_notifications") },
          { key: "menu", icon: Menu, label: t("nav_menu"), onClick: onOpenFullMenu },
        ]
      : role === "ADMIN"
        ? [
            { key: "home", href: "/admin", icon: Shield, label: t("nav_admin_home") },
            { key: "medias", href: "/admin/medias", icon: Images, label: t("nav_admin_medias") },
            { key: "inbox", href: "/admin/inquiries", icon: Inbox, label: t("nav_admin_inquiries") },
            { key: "menu", icon: Menu, label: t("nav_menu"), onClick: onOpenFullMenu },
          ]
        : [
            { key: "home", href: "/dashboard/advertiser", icon: Home, label: t("nav_home") },
            { key: "explore", href: "/dashboard/advertiser/explore", icon: Map, label: t("nav_explore") },
            { key: "inbox", href: "/dashboard/advertiser/inquiries", icon: Inbox, label: t("nav_inquiries") },
            { key: "bell", href: "/dashboard/notifications", icon: Bell, label: t("nav_notifications") },
            { key: "menu", icon: Menu, label: t("nav_menu"), onClick: onOpenFullMenu },
          ];

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[55] border-t border-zinc-200/90 bg-background/95 backdrop-blur-md dark:border-zinc-800/90",
        "lg:hidden",
      )}
      style={{
        paddingBottom: "max(10px, env(safe-area-inset-bottom))",
        paddingTop: 8,
      }}
      aria-label={t("nav_bar_aria")}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-0 px-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.href ? isActive(pathname, it.href) : false;
          const body = (
            <span
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-0.5 text-[10px] font-medium leading-tight sm:text-xs",
                active
                  ? "text-primary"
                  : "text-zinc-600 dark:text-zinc-400",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
              <span className="line-clamp-2 text-center">{it.label}</span>
            </span>
          );

          if (it.onClick) {
            return (
              <li key={it.key} className="flex min-w-0 flex-1 justify-center">
                <button
                  type="button"
                  onClick={it.onClick}
                  className="flex w-full max-w-[4.5rem] flex-col items-center justify-center rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {body}
                </button>
              </li>
            );
          }

          return (
            <li key={it.key} className="flex min-w-0 flex-1 justify-center">
              <Link
                href={it.href!}
                className="flex w-full max-w-[4.5rem] flex-col items-center justify-center rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                {body}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
