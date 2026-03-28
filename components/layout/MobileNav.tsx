"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type AppNavItem = { href: string; label: string; dataTour?: string };

export function MobileNav({ items }: { items: AppNavItem[] }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label="Toggle menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-14 z-40 bg-black/20 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <nav className="animate-mobile-menu-in absolute left-0 right-0 top-14 z-50 border-b bg-background/95 px-4 py-4 shadow-lg backdrop-blur-md flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                {...(item.dataTour ? { "data-tour": item.dataTour } : {})}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
