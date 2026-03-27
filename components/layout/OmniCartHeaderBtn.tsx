"use client";

import { ShoppingBag } from "lucide-react";
import { useOmniCart } from "@/hooks/useOmniCart";

export function OmniCartHeaderBtn() {
  const { items } = useOmniCart();
  const count = items.length;
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("xthex-omni-cart-open"))
      }
      className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      aria-label="옴니채널 카트"
    >
      <ShoppingBag className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
