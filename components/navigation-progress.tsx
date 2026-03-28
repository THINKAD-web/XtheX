"use client";

import * as React from "react";
import NProgress from "nprogress";
import { usePathname, useSearchParams } from "next/navigation";

NProgress.configure({ showSpinner: false, speed: 300, minimum: 0.2 });

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !anchor.hasAttribute("download") &&
        anchor.target !== "_blank"
      ) {
        NProgress.start();
      }
    };
    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}

export function NavigationProgress() {
  return (
    <React.Suspense fallback={null}>
      <NavigationProgressInner />
    </React.Suspense>
  );
}
