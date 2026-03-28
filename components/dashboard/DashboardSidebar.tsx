"use client";

import * as React from "react";
import { usePathname, Link } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Sparkles,
  Map,
  Inbox,
  BriefcaseBusiness,
  Activity,
  Upload,
  Images,
  Shield,
  Users,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Star,
  Flag,
  Lock,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardSidebarRole = "ADVERTISER" | "MEDIA_OWNER" | "ADMIN";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
};

function roleLabel(role: DashboardSidebarRole): { text: string; tone: string } {
  if (role === "ADMIN") return { text: "관리자", tone: "bg-zinc-900 text-white" };
  if (role === "MEDIA_OWNER")
    return { text: "매체사", tone: "bg-emerald-600 text-white" };
  return { text: "광고주", tone: "bg-blue-600 text-white" };
}

function getMenu(role: DashboardSidebarRole): NavItem[] {
  if (role === "ADMIN") {
    return [
      { label: "관리자 홈", href: "/admin", icon: Shield },
      { label: "미디어 관리", href: "/admin/medias", icon: Images },
      { label: "고객 리뷰", href: "/admin/reviews", icon: Star },
      { label: "리뷰 신고 검토", href: "/admin/review-reports", icon: Flag },
      { label: "문의 관리", href: "/admin/inquiries", icon: Inbox },
      { label: "사용자 관리", comingSoon: true, icon: Users },
      { label: "전체 통계", comingSoon: true, icon: BarChart3 },
    ];
  }
  if (role === "MEDIA_OWNER") {
    return [
      { label: "홈", href: "/dashboard/media-owner", icon: LayoutDashboard },
      { label: "성과 보기", href: "/dashboard/performance", icon: Activity },
      { label: "새 미디어 등록", href: "/dashboard/media-owner/upload", icon: Upload },
      { label: "내 미디어 관리", href: "/dashboard/media-owner/medias", icon: Images },
      { label: "받은 문의함", href: "/dashboard/media-owner/inquiries", icon: Inbox },
      { label: "알림 기록", href: "/dashboard/notifications", icon: Bell },
      { label: "문의 E2E 암호화", href: "/dashboard/media-owner/inquiry-encryption", icon: Lock },
      { label: "설정 · 알림", href: "/dashboard/media-owner/settings", icon: Settings },
      { label: "수익 현황", comingSoon: true, icon: BarChart3 },
    ];
  }
  return [
    { label: "홈", href: "/dashboard/advertiser", icon: LayoutDashboard },
    { label: "성과 보기", href: "/dashboard/performance", icon: Activity },
    {
      label: "AI 추천 받기",
      href: "/dashboard/advertiser/recommendations",
      icon: Sparkles,
    },
    { label: "미디어 탐색", href: "/dashboard/advertiser/explore", icon: Map },
    { label: "내 문의함", href: "/dashboard/advertiser/inquiries", icon: Inbox },
    { label: "알림 기록", href: "/dashboard/notifications", icon: Bell },
    { label: "내 캠페인", comingSoon: true, icon: BriefcaseBusiness },
    { label: "설정", href: "/dashboard/advertiser/settings", icon: Settings },
    { label: "보안", href: "/dashboard/advertiser/settings/security", icon: Shield },
  ];
}

function isActivePath(pathname: string, href: string): boolean {
  if (!href) return false;
  if (pathname === href) return true;
  // next-intl pathnames are often `/${locale}${href}`.
  if (pathname.endsWith(href)) return true;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  if (href !== "/" && pathname.includes(href + "/")) return true;
  return false;
}

function comingSoonProps() {
  return {
    title: "준비중입니다",
    "aria-disabled": true,
  } as const;
}

type Props = {
  role: DashboardSidebarRole;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  /** true면 모바일 좌상단 햄버거 대신 하단 내비「메뉴」만 사용 */
  suppressFloatingMobileMenuButton?: boolean;
};

export function DashboardSidebar({
  role,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onMobileOpenChange,
  suppressFloatingMobileMenuButton = false,
}: Props) {
  const pathname = usePathname() ?? "";
  const { text: roleText, tone } = roleLabel(role);
  const items = React.useMemo(() => getMenu(role), [role]);

  const SidebarBody = (
    <div
      className={cn(
        "flex h-full flex-col",
        "bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:bg-zinc-950/70",
        "border-r border-zinc-200 dark:border-zinc-800",
      )}
    >
      <div className={cn("flex items-center justify-between gap-2 px-3 py-3")}>
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
            {roleText}
          </span>
          {!collapsed ? (
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              XtheX
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            "hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-md",
            "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2 pb-3">
        {items.map((it) => {
          const active = it.href ? isActivePath(pathname, it.href) : false;
          const Icon = it.icon;
          const content = (
            <div
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                  : it.comingSoon
                    ? "text-zinc-400 dark:text-zinc-600"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900",
                collapsed && "justify-center",
              )}
              title={
                it.comingSoon ? "준비중입니다" : collapsed ? it.label : undefined
              }
              {...(it.comingSoon ? { "aria-disabled": true } : {})}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-current")} />
              {!collapsed ? (
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
              ) : null}
              {!collapsed && it.comingSoon ? (
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  Soon
                </span>
              ) : null}
            </div>
          );

          if (!it.href || it.comingSoon) return <div key={it.label}>{content}</div>;
          return (
            <Link key={it.href} href={it.href} onClick={() => onMobileOpenChange(false)}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 px-2 py-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
            "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger — 하단 내비 사용 시 숨김 */}
      {!suppressFloatingMobileMenuButton ? (
        <button
          type="button"
          onClick={() => onMobileOpenChange(true)}
          className={cn(
            "lg:hidden fixed left-3 top-[68px] z-[60] inline-flex h-10 w-10 items-center justify-center rounded-xl",
            "border border-zinc-200 bg-white/95 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90",
          )}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
        </button>
      ) : null}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-14 z-[40] h-[calc(100vh-56px)]",
          collapsed ? "w-[84px]" : "w-[280px]",
        )}
      >
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="lg:hidden fixed left-0 right-0 top-14 bottom-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => onMobileOpenChange(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-[300px]">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
                  {roleText}
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  XtheX
                </span>
              </div>
              <button
                type="button"
                onClick={() => onMobileOpenChange(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Mobile always expanded */}
            <div className="h-[calc(100%-56px)]">{SidebarBody}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

