"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Flag, MessageSquare, Send } from "lucide-react";
import { landing } from "@/lib/landing-theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReportContentDialog } from "@/components/community/ReportContentDialog";

type Author = { id: string; name: string | null; email: string };

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
};

type PostDetail = {
  id: string;
  category: "STRATEGY" | "REGIONAL_INFO";
  title: string;
  body: string;
  viewCount: number;
  createdAt: string;
  author: Author;
  comments: Comment[];
  _count: { comments: number };
};

export function CommunityPostDetail({ postId }: { postId: string }) {
  const t = useTranslations("community");
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (params?.locale as string) ?? "ko";

  const [post, setPost] = React.useState<PostDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [commentBody, setCommentBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [reportPost, setReportPost] = React.useState(false);
  const [reportCommentId, setReportCommentId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}`);
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname || `/community/${postId}`)}`);
        return;
      }
      const json = (await res.json()) as { ok?: boolean; post?: PostDetail };
      if (!res.ok || !json.ok || !json.post) {
        setPost(null);
        return;
      }
      setPost(json.post);
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [postId, pathname, router]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function categoryLabel(c: PostDetail["category"]) {
    return c === "STRATEGY" ? t("cat_strategy") : t("cat_regional");
  }

  async function submitComment() {
    if (!commentBody.trim() || !post) return;
    setSending(true);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      if (!res.ok) {
        toast.error(t("error_generic"));
        return;
      }
      const json = (await res.json()) as { ok?: boolean; comment?: Comment };
      if (json.ok && json.comment) {
        setPost((p) =>
          p
            ? {
                ...p,
                comments: [...p.comments, json.comment!],
                _count: { comments: p._count.comments + 1 },
              }
            : p,
        );
        setCommentBody("");
        toast.success(t("comment_added"));
      }
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className={`${landing.container} py-8 lg:py-10`}>
        <Link
          href="/community"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back_list")}
        </Link>

        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        ) : !post ? (
          <p className="text-center text-muted-foreground">{t("not_found")}</p>
        ) : (
          <article className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Badge variant="outline">{categoryLabel(post.category)}</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-amber-700 dark:text-amber-400"
                onClick={() => setReportPost(true)}
              >
                <Flag className="h-3.5 w-3.5" />
                {t("report_post")}
              </Button>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {post.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{post.author.name ?? post.author.email}</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post._count.comments}
              </span>
              <time dateTime={post.createdAt}>
                {new Date(post.createdAt).toLocaleString(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </div>
            <div className="mt-6 max-w-none whitespace-pre-wrap text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
              {post.body}
            </div>

            <section className="mt-10 border-t border-border pt-8">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t("comments_title")} ({post.comments.length})
              </h2>
              <ul className="mt-4 space-y-4">
                {post.comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {c.author.name ?? c.author.email}
                        <time className="ml-2 font-normal" dateTime={c.createdAt}>
                          {new Date(c.createdAt).toLocaleString(locale, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </time>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
                        aria-label={t("report_comment_aria")}
                        onClick={() => setReportCommentId(c.id)}
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                      {c.body}
                    </p>
                  </li>
                ))}
              </ul>

              <div className={cn("mt-6 space-y-2")}>
                <Textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder={t("comment_placeholder")}
                  rows={4}
                  className="resize-y"
                />
                <Button
                  type="button"
                  className="gap-2"
                  disabled={!commentBody.trim() || sending}
                  onClick={() => void submitComment()}
                >
                  <Send className="h-4 w-4" />
                  {sending ? t("submitting") : t("comment_submit")}
                </Button>
              </div>
            </section>
          </article>
        )}
      </div>

      <ReportContentDialog
        open={reportPost}
        onOpenChange={setReportPost}
        targetType="POST"
        postId={post?.id ?? null}
        onSubmitted={() => {
          setReportPost(false);
          toast.success(t("report_thanks"));
        }}
      />
      <ReportContentDialog
        open={Boolean(reportCommentId)}
        onOpenChange={(o) => !o && setReportCommentId(null)}
        targetType="COMMENT"
        postId={null}
        commentId={reportCommentId}
        onSubmitted={() => {
          setReportCommentId(null);
          toast.success(t("report_thanks"));
        }}
      />
    </>
  );
}
