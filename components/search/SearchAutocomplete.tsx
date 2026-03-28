"use client";

import * as React from "react";
import { Search, MapPin, Tag } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

type AutocompleteResult = {
  id: string;
  title: string;
  category: string;
  address: string | null;
  tags: string[];
};

export function SearchAutocomplete({ className }: { className?: string }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "ko";
  const isKo = locale === "ko";

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AutocompleteResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/autocomplete?q=${encodeURIComponent(value.trim())}`,
        );
        if (!res.ok) throw new Error();
        const json = (await res.json()) as { results: AutocompleteResult[] };
        setResults(json.results);
        setOpen(json.results.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function navigate(item: AutocompleteResult) {
    setOpen(false);
    setQuery("");
    router.push(`/${locale}/medias/${item.id}`);
  }

  function handleSubmit() {
    if (activeIndex >= 0 && activeIndex < results.length) {
      navigate(results[activeIndex]);
      return;
    }
    if (query.trim()) {
      setOpen(false);
      router.push(
        `/${locale}/explore?q=${encodeURIComponent(query.trim())}`,
      );
      setQuery("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter") handleSubmit();
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        handleSubmit();
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={isKo ? "매체 검색..." : "Search media..."}
          className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-48 lg:w-56"
          aria-label={isKo ? "매체 검색" : "Search media"}
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-[200] mt-1 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
        >
          {results.map((item, idx) => (
            <li
              key={item.id}
              role="option"
              aria-selected={idx === activeIndex}
              className={cn(
                "flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm transition-colors",
                idx === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-popover-foreground hover:bg-accent/50",
              )}
              onClick={() => navigate(item)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {item.category}
                  </span>
                  {item.address && (
                    <span className="inline-flex items-center gap-0.5 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {item.address}
                    </span>
                  )}
                </div>
                {item.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
