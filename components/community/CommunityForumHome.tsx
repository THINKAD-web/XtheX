"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Search, Plus, MessageSquare, Eye, Flag } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { landing } from "@/lib/landing-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReportContentDialog } from "@/components/community/ReportContentDialog";

export type ForumListItem = {
  id: string;
  category: "STRATEGY" | "REGIONAL_INFO";
  title: string;
  body: string;
  viewCount: number;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
  _count: { comments: number };
};

function excerpt(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

export function CommunityForumHome() {
  const t = useTranslations("community");
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "ko";

  const [items, setItems] = React.useState<ForumListItem[]>([]);
  const [popular, setPopular] = React.useState<ForumListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [category, setCategory] = React.useState<"ALL" | "STRATEGY" | "REGIONAL_INFO">("ALL");
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newBody, setNewBody] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<"STRATEGY" | "REGIONAL_INFO">("STRATEGY");
  const [submitting, setSubmitting] = React.useState(false);
  const [reportPostId, setReportPostId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tmr = setTimeout(() => setDebouncedQ(q), 320);
    return () => clearTimeout(tmr);
  }, [q]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (debouncedQ) sp.set("q", debouncedQ);
      if (category !== "ALL") sp.set("category", category);
      const res = await fetch(`/api/community/posts?${sp.toString()}`);
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/community")}`);
        return;
      }
      const json = (await res.json()) as { ok?: boolean; items?: ForumListItem[]; popular?: ForumListItem[] };
      if (!res.ok || !json.ok) {
        setItems([]);
        setPopular([]);
        return;
      }
      setItems(json.items ?? []);
      setPopular(json.popular ?? []);
    } catch {
      setItems([]);
      setPopular([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, category, pathname, router]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function submitPost() {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error(t("validation_required"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          body: newBody.trim(),
          category: newCategory,
        }),
      });
      if (res.status === 401) {
        toast.error(t("login_required"));
        return;
      }
      const json = (await res.json()) as { ok?: boolean; post?: ForumListItem };
      if (!res.ok || !json.ok || !json.post) {
        toast.error(t("error_generic"));
        return;
      }
      toast.success(t("post_created"));
      setComposeOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewCategory("STRATEGY");
      setItems((prev) => [json.post!, ...prev]);
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSubmitting(false);
    }
  }

  function categoryLabel(c: ForumListItem["category"]) {
    return c === "STRATEGY" ? t("cat_strategy") : t("cat_regional");
  }

  return (
    <>
      <div className={`${landing.container} py-8 lg:py-10`}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{t("lead")}</p>
          </div>
          <Button
            type="button"
            className="shrink-0 gap-2 bg-blue-600 hover:bg-blue-600/90"
            onClick={() => setComposeOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("new_post")}
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search_placeholder")}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "STRATEGY", "REGIONAL_INFO"] as const).map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={category === c ? "default" : "outline"}
                    className={cn(category === c && "bg-violet-600 hover:bg-violet-600/90")}
                    onClick={() => setCategory(c)}
                  >
                    {c === "ALL" ? t("filter_all") : categoryLabel(c)}
                  </Button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 py-12 text-center text-sm text-muted-foreground dark:border-zinc-700">
                {t("empty")}
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((post) => (
                  <li
                    key={post.id}
                    className="rounded-xl border border-zinc-200 bg-card p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link href={`/community/${post.id}`} className="group min-w-0 flex-1">
                        <Badge variant="outline" className="mb-1 text-[10px]">
                          {categoryLabel(post.category)}
                        </Badge>
                        <h2 className="text-base font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-50 dark:group-hover:text-blue-400">
                          {post.title}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                          {excerpt(post.body, 160)}
                        </p>
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-amber-600"
                        aria-label={t("report_aria")}
                        onClick={() => setReportPostId(post.id)}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{post.author.name ?? post.author.email}</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post._count.comments}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.viewCount}
                      </span>
                      <time dateTime={post.createdAt}>
                        {new Date(post.createdAt).toLocaleString(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("popular_title")}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t("popular_sub")}</p>
              <ol className="mt-4 space-y-3">
                {popular.map((p, idx) => (
                  <li key={p.id} className="flex gap-2 text-sm">
                    <span className="font-mono text-xs text-violet-600 dark:text-violet-400">{idx + 1}</span>
                    <Link
                      href={`/community/${p.id}`}
                      className="line-clamp-2 font-medium text-zinc-800 hover:text-blue-600 dark:text-zinc-200 dark:hover:text-blue-400"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
                {!loading && popular.length === 0 ? (
                  <li className="text-xs text-muted-foreground">{t("popular_empty")}</li>
                ) : null}
              </ol>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="z-[200] max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("compose_title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("field_category")}</Label>
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as "STRATEGY" | "REGIONAL_INFO")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[250]">
                  <SelectItem value="STRATEGY">{t("cat_strategy")}</SelectItem>
                  <SelectItem value="REGIONAL_INFO">{t("cat_regional")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-title">{t("field_title")}</Label>
              <Input
                id="post-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-body">{t("field_body")}</Label>
              <Textarea
                id="post-body"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={8}
                className="resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void submitPost()}>
              {submitting ? t("submitting") : t("submit_post")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReportContentDialog
        open={Boolean(reportPostId)}
        onOpenChange={(o) => !o && setReportPostId(null)}
        targetType="POST"
        postId={reportPostId}
        onSubmitted={() => {
          setReportPostId(null);
          toast.success(t("report_thanks"));
        }}
      />
    </>
  );
}
