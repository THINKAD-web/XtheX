"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  mediaId: string;
  size?: "sm" | "md";
  className?: string;
}

export function WishlistButton({
  mediaId,
  size = "md",
  className,
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/wishlist/check?mediaId=${mediaId}`)
      .then((r) => r.json())
      .then((d) => setWishlisted(!!d.wishlisted))
      .catch(() => {});
  }, [mediaId, session?.user?.id]);

  const toggle = useCallback(async () => {
    if (!session?.user?.id) {
      window.location.href = "/login";
      return;
    }
    if (loading) return;
    setLoading(true);

    const next = !wishlisted;
    setWishlisted(next);
    if (next) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 400);
    }

    try {
      if (next) {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId }),
        });
      } else {
        await fetch(`/api/wishlist?mediaId=${mediaId}`, {
          method: "DELETE",
        });
      }
    } catch {
      setWishlisted(!next);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, wishlisted, loading, mediaId]);

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={wishlisted ? "위시리스트에서 제거" : "위시리스트에 추가"}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full transition-all duration-200",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        wishlisted
          ? "text-rose-500 hover:text-rose-400"
          : "text-zinc-400 hover:text-rose-400",
        animating && "scale-125",
        className,
      )}
    >
      <Heart
        className={cn(iconSize, "transition-all", wishlisted && "fill-current")}
      />
    </button>
  );
}
