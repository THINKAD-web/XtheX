"use client";
import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "xthex_notification_dismissed";

type Props = {
  message: string;
  type?: "info" | "success" | "warning";
};

export function DashboardNotificationBanner({ message, type = "info" }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`${STORAGE_KEY}_${message}`);
    if (!dismissed) setVisible(true);
  }, [message]);

  const dismiss = () => {
    localStorage.setItem(`${STORAGE_KEY}_${message}`, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={cn(
      "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 mb-4",
      type === "info" && "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-200",
      type === "success" && "border-green-200 bg-green-50 text-green-800",
      type === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
    )}>
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button onClick={dismiss} className="shrink-0 text-current opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
