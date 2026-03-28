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
      duration={3000}
      style={{ zIndex: 100000 }}
      toastOptions={{
        classNames: {
          toast:
            "border shadow-lg !rounded-xl",
          title: "font-medium",
          description: "text-sm",
          closeButton: "!rounded-full",
        },
      }}
    />
  );
}
