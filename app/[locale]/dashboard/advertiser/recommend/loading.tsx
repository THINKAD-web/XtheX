export default function AdvertiserRecommendLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-background to-emerald-50/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-emerald-950/25">
      <div className="fixed left-0 right-0 top-0 z-50 h-14 animate-pulse border-b border-border bg-muted/60 backdrop-blur-sm" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="h-40 animate-pulse rounded-3xl border border-sky-200/40 bg-white/50 dark:border-zinc-700 dark:bg-zinc-900/50" />
        <div className="h-80 animate-pulse rounded-2xl border border-border bg-card dark:bg-zinc-900/60" />
      </div>
    </div>
  );
}
