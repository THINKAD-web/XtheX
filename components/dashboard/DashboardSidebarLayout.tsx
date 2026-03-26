"use client";

import * as React from "react";
import { DashboardSidebar, type DashboardSidebarRole } from "./DashboardSidebar";
import { cn } from "@/lib/utils";

type Props = {
  role: DashboardSidebarRole;
  className?: string;
  children: React.ReactNode;
};

/**
 * Client shell that coordinates:
 * - desktop collapsible sidebar width
 * - mobile drawer open/close
 * - main content offset
 */
export function DashboardSidebarLayout({ role, className, children }: Props) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Persist collapsed state per-role.
  React.useEffect(() => {
    try {
      const k = `xthex.sidebar.collapsed.${role}`;
      const v = window.localStorage.getItem(k);
      if (v === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, [role]);

  React.useEffect(() => {
    try {
      const k = `xthex.sidebar.collapsed.${role}`;
      window.localStorage.setItem(k, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed, role]);

  const sidebarW = collapsed ? 84 : 280;

  return (
    <div
      className={cn("min-h-[calc(100vh-56px)]", className)}
      style={{ ["--xthex-sidebar-w" as any]: `${sidebarW}px` }}
    >
      <DashboardSidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <div className="pt-0">
        <div
          className={cn(
            "mx-auto w-full px-4 sm:px-6 lg:px-8",
            "lg:pl-[calc(var(--xthex-sidebar-w)+24px)]",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

