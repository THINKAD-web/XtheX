"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function SonnerToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      richColors
      closeButton
      style={{ zIndex: 100000 }}
      toastOptions={{
        classNames: {
          toast:
            "border border-cyan-500/20 bg-white shadow-lg dark:border-cyan-500/30 dark:bg-zinc-950",
          title: "text-zinc-900 dark:text-zinc-50",
          description: "text-zinc-600 dark:text-zinc-400",
        },
      }}
    />
  );
}
