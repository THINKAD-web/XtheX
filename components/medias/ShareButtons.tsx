"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.112 4.508 6.459-.144.522-.928 3.37-.962 3.574 0 0-.02.163.086.225.106.063.23.03.23.03.303-.042 3.516-2.296 4.07-2.684.67.097 1.365.148 2.068.148 5.523 0 10-3.463 10-7.752C22 6.463 17.523 3 12 3" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const btnBase =
  "flex h-8 w-8 items-center justify-center rounded-md border transition-colors";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
    }
  }, [title, url]);

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://story.kakao.com/share?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(btnBase, "border-border text-[#FEE500] hover:bg-[#FEE500]/10")}
        aria-label="카카오톡 공유"
      >
        <KakaoIcon className="h-3.5 w-3.5" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(btnBase, "border-border text-[#1877F2] hover:bg-[#1877F2]/10")}
        aria-label="Facebook 공유"
      >
        <FacebookIcon className="h-3.5 w-3.5" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(btnBase, "border-border text-muted-foreground hover:text-foreground")}
        aria-label="X (Twitter) 공유"
      >
        <XIcon className="h-3.5 w-3.5" />
      </a>
      <button
        onClick={copy}
        className={cn(
          btnBase,
          copied
            ? "border-green-500 text-green-600"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
        aria-label="링크 복사"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          onClick={nativeShare}
          className={cn(btnBase, "border-border text-muted-foreground hover:text-foreground")}
          aria-label="공유"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
